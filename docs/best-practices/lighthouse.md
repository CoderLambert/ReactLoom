# Lighthouse

SPA 和 SSR 用 `@lhci/cli` 0.15.1 做实验室审计。这个版本依赖 Lighthouse 12.6.1。Expo 没有浏览器页面可测，不装这个包，工作流里也没有对应作业。下面的字段就是仓库里的 `lighthouserc.cjs`。

## 配置

`pnpm lighthouse` 先 `pnpm build`，再 `lhci autorun`。`autorun` 按顺序跑三个阶段，终端会打出摘要：

| 阶段 | 我们怎么用 |
| --- | --- |
| collect | 打开页面，跑 Lighthouse，写出原始报告 |
| assert | 按阈值决定失败还是警告 |
| upload | 把报告交出去 |

collect：

| 字段 | SPA | SSR |
| --- | --- | --- |
| `url` | `http://127.0.0.1:4317/` | `http://127.0.0.1:4318/` |
| `numberOfRuns` | 1 | 1 |
| `startServerCommand` | `pnpm exec vite preview --host 127.0.0.1 --port 4317` | `pnpm exec next start --hostname 127.0.0.1 --port 4318` |
| `startServerReadyPattern` | `Local:` | `Ready` |
| `startServerReadyTimeout` | 120000 | 120000 |

`numberOfRuns` 设成 1，是为了让 CI 作业保持短。官方默认多次运行是为了压低实验室噪声。阈值里性能是警告，所以一次运行就够用；可访问性仍是错误。

`settings.preset` 是 `desktop`。`chromeFlags` 是 `--no-sandbox --headless=new`。CI 若设置了 `CHROME_PATH`，就用那只浏览器（Playwright 的 Chromium），不再另下一份 Chrome。

assert 里的 `minScore` 是 0 到 1。报告界面把同一分数显示成 0 到 100，所以 `0.9` 就是界面上的 90。

| 断言 | 级别 | 阈值 |
| --- | --- | --- |
| `categories:performance` | warn | 0.7 |
| `categories:accessibility` | error | 0.9 |
| `categories:best-practices` | warn | 0.9 |
| `categories:seo` | warn | 0.8 |
| `resource-summary:script:size` | error | 1500000 字节（传输体积，不是 gzip） |

脚本体积这条是宽松上限，用来抓住突然变大的包。页面自己的 gzip 预算仍由 `scripts/check-bundle-budget.mjs` 执行，两边的数字不是同一种单位。

upload：`CI=true` 时 `target` 是 `temporary-public-storage`（日志里有一个临时链接）。本地是 `filesystem`，目录 `.lighthouseci`，已 gitignore。

`LIGHTHOUSE_ATTACH=1` 时配置不再带 `startServerCommand`。本地开关用这个模式，去审计已经起来的那台服务器，避免再起一台。

## 两个开关

它们互不影响。

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `LIGHTHOUSE_LOCAL` | 关（只有值为 `true` 才开） | `pnpm dev` 和 `pnpm preview` 在服务器可访问之后再跑一轮 collect 和 assert |
| `LIGHTHOUSE_CI` | 开 | 仓库变量 `vars.LIGHTHOUSE_CI`。设成 `false` 就跳过 CI 作业。没设置这个变量时作业照跑 |

随时可以手动跑，不必开本地开关。这条命令会先构建，再审计生产预览：

```bash
pnpm lighthouse
```

附带一轮生产预览审计：

```bash
LIGHTHOUSE_LOCAL=true pnpm preview
```

开发服务器上的分数不能和 CI 比。下面这条仍会审计那台 dev 服务器，并在终端写明这一点：

```bash
LIGHTHOUSE_LOCAL=true pnpm dev
```

要对齐 CI，用 `pnpm preview` 或 `pnpm lighthouse`。SPA 的 `preview` 是 `vite preview`。SSR 的 `preview` 是 `next start`，端口 4318。两者都打生产构建。只跑 `pnpm preview` 之前需要已经有构建产物；`pnpm lighthouse` 会先自己构建。

CI 还有 `workflow_dispatch` 输入 `lighthouse`，类型是 boolean，默认 true。在 Actions 里手动跑 CI 时可以取消勾选。推送和 pull request 不读这个输入，也不读 `LIGHTHOUSE_LOCAL`。手动运行时，输入为 false，或仓库变量是 `false`，作业都不跑。

把仓库变量设成字符串 `false` 会在所有事件上关掉作业：

```text
LIGHTHOUSE_CI=false
```

本地默认关掉，是因为每次保存都跑 Lighthouse 又慢又吵。CI 默认打开，用来挡住可访问性回退和脚本体积突然变大。

## 网络限速

Lighthouse 的分数很大程度取决于限速，不是只取决于代码。`@lhci/cli` 0.15.1 带的是 Lighthouse 12.6.1。默认预设是模拟移动网络；我们的 `lighthouserc.cjs` 改成了 `preset: 'desktop'`。

| 方式 | 设置 | 数字 | 对指标 |
| --- | --- | --- | --- |
| 模拟移动（工具默认） | 删掉 `preset`。`throttlingMethod` 保持 `simulate` | Slow 4G：RTT 150ms，下行 1.6 Mbps，上行 750 Kbps，CPU 4 倍。页面先在不限速的网络上加载，再用模型估算 | FCP、LCP、TBT、Speed Index 都会变差。CLS 主要看布局，限速对它影响小 |
| 桌面（我们现在用这个） | `settings.preset: 'desktop'` | 约 RTT 40ms，下行 10 Mbps，CPU 1 倍，桌面视口。仍是模拟，不是本机直跑 | 实验室分数更高，也更接近桌面用户。FCP、LCP、SI 少受窄带宽拖累；TBT 接近这台机器的主线程 |
| DevTools 限速（这套带宽以前叫 Fast 3G） | 去掉 `preset`，`throttlingMethod: 'devtools'` | 同一套 Slow 4G 带宽，但是真的限速。请求延迟按 3.75 倍计算，约 562.5ms；下行约 1.6 Mbps × 0.9；CPU 4 倍 | FCP、LCP、SI 比模拟更慢、也更吵。TBT 被真实的 CPU 降速拉长。CLS 仍然主要看布局 |
| 不限速 | `throttlingMethod: 'provided'`，并把 `throttling` 的 RTT、吞吐设为 0，`cpuSlowdownMultiplier` 设为 1 | 本机网络和本机 CPU | FCP、LCP、TBT、SI 接近本机。CI 机器快慢会直接进分数。CLS 仍看布局 |

四种方式里，CLS 都几乎不跟带宽和 CPU 走。只有迟到的资源赶在追踪窗口里造成另一次跳动时，它才会变。

FCP 看第一次画出内容。慢带宽推迟首屏资源；CPU 降速推迟要靠脚本才能画出来的内容。LCP 再加一块最大内容：图片或依赖脚本的节点会在 Slow 4G 和 4 倍 CPU 下明显变晚。TBT 主要跟 CPU 倍数走，4 倍会把长任务放大，所以模拟移动的 TBT 远高于桌面。Speed Index 看可见区域填满的过程，带宽和 CPU 都会把它拉长。

示例写进 `settings`。要换策略就拿掉 `preset: 'desktop'`，避免和预设里的视口、限速叠在一起。

模拟移动（工具默认，我们没有用）：

```js
settings: {
  formFactor: 'mobile',
  throttlingMethod: 'simulate',
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4,
  },
}
```

DevTools 限速（以前的 Fast 3G 带宽，真正降速）：

```js
settings: {
  formFactor: 'mobile',
  throttlingMethod: 'devtools',
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    requestLatencyMs: 562.5,
    downloadThroughputKbps: 1474.56,
    uploadThroughputKbps: 675,
    cpuSlowdownMultiplier: 4,
  },
}
```

不限速：

```js
settings: {
  formFactor: 'desktop',
  throttlingMethod: 'provided',
  throttling: {
    rttMs: 0,
    throughputKbps: 0,
    cpuSlowdownMultiplier: 1,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0,
  },
}
```

CI 建议继续用 `desktop`。这两个应用的主要界面是桌面宽度的登录和任务页。`numberOfRuns` 只有 1，DevTools 真限速的方差不适合当闸门。用模拟 Slow 4G 当闸门，失败多半来自限速模型，不是这次改动。完全不限速又会把 runner 的 CPU 差异写进分数。

## 读报告

分数颜色：0–49 红，50–89 橙，90–100 绿。类别分数在 JSON 里是 0–1，报告里显示成 0–100。我们的可访问性错误线是 0.9，也就是绿色那一档的下沿。性能警告线是 0.7，落在橙色里。

Lighthouse 12.6.1 的性能类别权重：

| 指标 | 权重 |
| --- | --- |
| TBT | 30% |
| LCP | 25% |
| CLS | 25% |
| FCP | 10% |
| Speed Index | 10% |

原始毫秒数先按对数分布折成 0–100 的单项分，再按上表加权。权重表里没有 TTI，也没有 INP。

实验室指标：

| 名字 | 含义 |
| --- | --- |
| FCP | First Contentful Paint。第一次有内容画出来 |
| LCP | Largest Contentful Paint。最大的那块内容画出来 |
| TBT | Total Blocking Time。主线程被长任务堵住的时间，实验室里用来近似可交互 |
| CLS | Cumulative Layout Shift。布局跳动。限速对它影响小 |
| SI | Speed Index。可见区域填满的速度 |
| TTFB | Time to First Byte。主文档的第一字节。预览在本机时这个值很小，说明不了生产主机。它不进 12.6.1 的性能加权，出现在服务端响应诊断里 |
| INP | Interaction to Next Paint。从交互到下一帧。这是现场数据：一次只有导航、没有真实点击的实验室运行测不到它。Lighthouse 12 用 TBT 充当实验室里的可交互指标。不要在 `lighthouserc.cjs` 里给 INP 设阈值，指望 `lhci autorun` 测出它 |

从机会和诊断回到代码：

1. 打开 `.lighthouseci` 里的 HTML，或 CI 日志里 `temporary-public-storage` 的临时链接。
2. Opportunities 列出估计能省下的时间，例如未使用的 JavaScript、阻塞渲染的资源、过大的图片。Diagnostics 给出元素或 URL。
3. 组件对不上文件时，用生产预览打开同一地址，再用 click-to-source。SPA 和 SSR 是按住 Option+Shift（macOS）或 Alt+Shift 再点击。SSR 的 Next 开发浮层也可以用 Open in editor。打开文件的程序是 `scripts/open-in-editor.mjs`。
4. 脚本把包撑大时跑 `pnpm analyze`。SPA 写出 `dist/stats.html`。SSR 写出 `.next/diagnostics/analyze`。这和 `scripts/check-bundle-budget.mjs` 的 gzip 闸门是两条线。
5. Expo 的闪电按钮是另一套检查器。这个模板没有 Lighthouse 报告。

实验室数据是这次运行、这台机器、这份限速。现场数据（CrUX 里的 LCP、CLS、INP）才是用户的分布。CI 只守实验室阈值。实验室是绿色，现场的 INP 仍可能差。
