# Lighthouse

SPA 和 SSR 用 `@lhci/cli` 0.15.1 做实验室审计。Expo 没有浏览器页面可测，不装这个包，工作流里也没有对应作业。下面的字段就是仓库里的 `lighthouserc.cjs`。

## 配置

`pnpm lighthouse` 先 `pnpm build`，再 `lhci autorun`。三个阶段：

| 阶段 | 我们怎么用 |
| --- | --- |
| collect | 打开页面，跑 Lighthouse |
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

assert：

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

随时可以手动跑，不必开本地开关：

```bash
pnpm lighthouse
```

开发服务器上的分数不能和 CI 比。`LIGHTHOUSE_LOCAL=true pnpm dev` 仍会审计那台 dev 服务器，并在终端写明这一点。要对齐 CI，用 `pnpm preview` 或 `pnpm lighthouse`。SPA 的 `preview` 是 `vite preview`。SSR 的 `preview` 是 `next start`，端口 4318。两者都打生产构建。`pnpm lighthouse` 会先自己构建。

CI 还有 `workflow_dispatch` 输入 `lighthouse`，默认 true。推送和 pull request 不读 `LIGHTHOUSE_LOCAL`。手动运行时，输入为 false，或仓库变量是 `false`，作业都不跑。

本地默认关掉，是因为每次保存都跑 Lighthouse 又慢又吵。CI 默认打开，用来挡住可访问性回退和脚本体积突然变大。

## 网络限速

Lighthouse 的分数很大程度取决于限速，不是只取决于代码。

| 方式 | 设置 | 对指标 |
| --- | --- | --- |
| 模拟移动（工具默认） | 不写 `preset`，`throttlingMethod: simulate` | Slow 4G 和 CPU 降速。FCP、LCP、TBT、Speed Index 都会变差。CLS 主要看布局，限速对它影响小 |
| 桌面 | `settings.preset: 'desktop'`（我们现在用这个） | 桌面视口和较轻的桌面限速。实验室分数更高，也更接近桌面用户 |
| DevTools Fast 3G | `throttlingMethod: devtools` 再配 Fast 3G 的吞吐和 RTT | 比模拟 Slow 4G 松。数字仍是实验室值 |
| 不限速 | `throttlingMethod: provided` 并且不提供慢速配置，或 `throttling: { rttMs: 0, throughputKbps: 0, cpuSlowdownMultiplier: 1 }` 按你要的方式写 | FCP、LCP、TBT、SI 接近本机。CI 机器快慢会直接进分数 |

示例（写进 `settings`，不要和 `preset: 'desktop'` 打架；要改策略就换掉 preset）：

```js
settings: {
  formFactor: 'mobile',
  screenEmulation: { mobile: true },
  throttlingMethod: 'simulate',
}
```

CI 建议继续用 `desktop`。这两个应用的主要界面是桌面宽度的登录和任务页。用模拟 Slow 4G 当闸门，失败多半来自限速模型，不是这次改动。

## 读报告

分数颜色：0–49 红，50–89 橙，90–100 绿。类别分数是加权后的 0–1，报告里显示成 0–100。

实验室指标：

| 名字 | 含义 |
| --- | --- |
| FCP | 第一次有内容画出来 |
| LCP | 最大的那块内容画出来 |
| TBT | 主线程被长任务堵住的时间，实验室里用来近似可交互 |
| CLS | 布局跳动。限速对它影响小 |
| SI | Speed Index，可见区域填满的速度 |
| TTFB | 第一字节。预览在本机时这个值很小 |
| INP | 交互到下一帧。这是现场数据，实验室报告里不要把它当成已测量的闸门 |

性能类别的权重以 Lighthouse 当前版本为准，通常 LCP 和 TBT 占大头。机会（opportunities）和诊断（diagnostics）指出哪个脚本或哪次布局。对照代码时：点进元素用各模板的 click-to-source；看谁把包撑大用 `pnpm analyze`（SPA 的 `dist/stats.html`，SSR 的 `.next/diagnostics/analyze`）。

实验室数据是这次运行、这台机器、这份限速。现场数据才是用户的分布。CI 只守实验室阈值，不代替真实用户的 CrUX。
