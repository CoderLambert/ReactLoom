# B04 dotLottie React：设计资产播放器

`@lottiefiles/dotlottie-react` 播放设计师导出的 Lottie JSON 或 `.lottie` 容器。它是带时间轴的 Canvas/WASM 播放器，不是 React 布局动画系统。Library Lab 固定 `@lottiefiles/dotlottie-react@0.20.0`（0.x，不是 1.0）。运行时代码 MIT。动画资产的权利不继承代码许可证。Lab 只用仓库内原创 `examples/pulse.json`，不下载第三方 Lottie。宿主 React 19.3.0。官方播放器文档要求 React ≥ 16.8。不要安装已归档的 `@lottiefiles/react-lottie-player`。

底层由 React 包装 `@lottiefiles/dotlottie-web`。本条目不手动再钉一份底层版本，避免两套 WASM 并存。`.json` 是单段动画；`.lottie` 是压缩容器，可以含多动画、主题和状态机。不能把任意 ZIP 改名成 `.lottie`。默认渲染到 Canvas，不是每个矢量节点都能聚焦。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。资源是 `import pulse from './pulse.json'`，再 `JSON.stringify` 交给 `DotLottieReact` 的 `data`，不是远程 `src`，也不是原研究稿的 `public/animations/pulse.json` 与 `success.json`。

已挂载：

- `autoplay={false}`，`loop`，`aria-hidden`，`tabIndex={-1}`。`renderConfig` 把 `devicePixelRatio` 限制在 2，并 `autoResize`。
- `dotLottieRefCallback` 把实例放进 state。`useEffect` 订阅 `load`、`loadError`、`renderError`，cleanup 里对称 `removeEventListener` 并 `pause()`。若回调时 `player.isLoaded` 已为真，立刻走 `onLoad`。
- `mayPlay`（`examples/playback-policy.ts`）：必须已加载、页面可见，并且没有减少动画，或者用户在 advanced 勾选了明确覆盖。隐藏标签页不能被覆盖开关打开。
- 减少动画且未覆盖时 `setFrame(0)`。速度只在 advanced 提供 0.5 / 1 / 1.5。
- `visibilitychange` 在 cleanup 移除。切换 `level` 时清掉业务 `setTimeout`，并把播放、覆盖、速度、结果打回初始，避免上一层的成功回调写到下一层。
- business / advanced 的「模拟本地订阅确认」是 650ms 的本地定时器：先 `pending` 并暂停，到点才 `success` 并请求播放。播放与否不决定业务成功。失败文案走 `role="alert"`，状态走 `role="status"`。

未挂载：`DotLottieWorkerReact`、`/webgl` 与 `/webgpu`、`setWasmUrl` / `setWorkerUrl`、IntersectionObserver 延迟挂载、`animationId` / `themeId`、第二份 success 动画、AbortController 审核请求、503 分支。那些仍是生产教学，不要说当前画布已经覆盖。

## 什么时候使用

适合成功、等待、空状态和品牌插画，前端只管理播放策略和生命周期。不适合：DOM 布局补间、手势物理、可排序列表、逐字进场、数据可视化。那些用 B01、B03 或 GSAP。复杂状态机插画同时评估 B05 Rive。只有一个加载环时，CSS 加 `role="status"` 往往更省。

## 模型

```text
本地 pulse.json
  → data={JSON.stringify(pulse)}
  → <DotLottieReact autoplay={false} />
       ├─ dotLottieRefCallback → play / pause / stop / setFrame / setSpeed
       ├─ load 才表示资产完成；ready 只表示渲染器就绪（Lab 监听的是 load）
       ├─ loadError / renderError → role=alert，业务文字仍在
       └─ 卸载或换 level → 移除监听、pause、清 timeout
```

`play()` 返回前要先满足 `mayPlay`。Worker 模式的控制函数返回 Promise，不能当成同步的普通实例；Lab 没有用 Worker。GPU 后端要做特性探测，WebGPU 的 `GPUDevice` 自己销毁。不要默认 GPU 更快。`stateMachineConfig` 的 URL 白名单也不能代替对不可信 JSON 的体积和格式校验。本例不接收上传。

## 三层渐进

### Demo ① 本地脉冲（已挂载）

首帧静止。播放按钮在未加载、或策略不允许时 disabled。停止调用 `player.stop()` 并清除播放意图。Canvas 不拿焦点，操作在原生按钮上。减少动画时按钮不能启动，除非进入 advanced 并勾选覆盖。

### Demo ② 订阅反馈（已挂载的本地定时器）

点「模拟本地订阅确认」。业务先进入 pending，动画暂停；650ms 后文案变成成功，才允许播放。重复点击会清掉上一个 timeout。这不是 HTTP，也没有 503。生产里业务成功必须来自服务端确认，`complete` 事件不能当成保存成功。

未挂载的生产教学：TanStack Query mutation 的 `isPending` / `isError`，取消用 `AbortSignal`，错误用 `role="alert"`。无动画时按钮和文字仍然完整。

### Demo ③ 速度、覆盖和隐藏页（已挂载的策略；视口卸载未挂载）

速度下拉只改 `setSpeed`。覆盖复选框只放开减少动画，不放开隐藏页。离开页面会暂停。卸载 effect 清监听和超时。

未挂载：滚出视口就卸载播放器、拖动 range 选帧、`clampFrame` 到 `[0, totalFrames-1]`、CSP 下自托管 WASM。`setFrame` 必须在 `load` 之后，并且夹在合法帧范围。Lab 只在减少动画时把帧设为 0。

## 反例

```tsx
// 错：每个列表项一个远程 autoplay 循环，几十个 WASM 常驻
{rows.map(row => (
  <DotLottieReact key={row.id} src={row.remote} autoplay loop />
))}

// 对：列表用静态首帧；只有激活项挂播放器，并设上限
{activeId === row.id ? <Player /> : <StaticFrame />}
```

```tsx
// 错：只靠 playOnHover。触屏没有 hover，键盘也不会碰到
<DotLottieReact playOnHover src="/a.json" />

// 对：另给原生 button。Lab 的播放/暂停就是这样
<button type="button" onClick={() => setPlaying(value => !value)}>播放</button>
```

```tsx
// 错：无视 prefers-reduced-motion
<DotLottieReact autoplay loop data={json} />

// 对：默认 autoplay={false}，策略函数决定 play 还是 pause
if (mayPlay(policy) && requested) player.play();
else player.pause();
```

```tsx
// 错：在 ref 回调里反复 addEventListener，没有 cleanup
dotLottieRefCallback={instance => {
  instance?.addEventListener('load', onLoad);
}}

// 对：useEffect 按实例订阅，return 里移除并 pause。StrictMode 双调用也要能清掉
```

```tsx
// 错：onComplete 把业务标成成功，服务端其实 503
player.addEventListener('complete', () => saveOrder());

// 对：Promise 或 Query 拥有结果；动画只点缀。Lab 的 success 来自定时器回调，不来自 complete
```

```tsx
// 错：还没 load 就 setFrame(999999)，或用 onFrame 每帧 setState
player.setFrame(999999);
player.addEventListener('frame', () => setFrame(player.currentFrame));

// 对：等 load；夹帧；进度要展示时再降采样
```

```tsx
// 错：Worker 被 CSP 拒绝后空白，还把异步控制当同步
player.play(); // Worker 版实际是 Promise

// 对：监听 loadError 与 renderError，显示静态文案；CSP 允许 wasm 与 worker，或 setWorkerUrl 指向自托管文件
```

React ErrorBoundary 接不住 `loadError`，那是播放器事件。离开页面时 React 包装器销毁它拥有的实例；业务不要再 `destroy()` 一次。自己的 fetch、观察器和定时器仍要自己清。Lab 清的是 timeout 和事件。

## 组合

**Query + React Aria**：mutation 状态决定 pending/success/error。Dialog 和按钮的键盘归 React Aria。Canvas 不加 tabIndex。错误不靠动画颜色单独表达。

**Motion + IntersectionObserver**：Motion 做卡片进出，dotLottie 做插画。共享减少动画决定，避免一边停、一边无限循环。两个引擎不要改同一个 DOM 的 transform。同屏预算不够时不要再叠 react-spring。

| 需求 | 首选 |
| --- | --- |
| 已有 `.lottie` / Lottie JSON | 本播放器 |
| DOM 进出和 layout | B01 |
| 弹簧手感 | B03 |
| 交互状态机资产 | B05，并单独核对 `.riv` 授权 |
| 一个加载提示 | CSS + `role="status"` |

## 生产清单

- 只加载可信资产。外部 JSON 里的图片、字体和状态机 URL 另审许可与体积。
- 同屏实例数、循环、隐藏页、DPR、未清监听都是电量和内存来源。Lab 把 DPR 限制在 2，这是保守配置，不是测出来的阈值。
- SSR 只输出骨架。Server Component 顶层不访问 `window`。播放器放客户端边界。
- 中文输入法：不要在 `compositionstart/end` 前后改受控输入。Lab 没有自由文本框。
- 触摸点不到画布是预期。操作放在大按钮上，避免 canvas 抢走 `pointer-events`。

## 升级

0.20.0 仍是 0.x。升级前对照官方 props：`data` 与 `src`、`dotLottieRefCallback`、事件名 `load` / `loadError` / `renderError`。不要回到 `react-lottie-player`。换 `.lottie` 多动画时核对 manifest 的 `animationId`，Lab 的单段 JSON 没有这个字段。

## 验收

basic：未加载时播放不可用；加载后可暂停并回到停止。business：确认过程中 status 为处理中，成功文案不依赖 Canvas 是否画出。advanced：减少动画默认停在首帧；隐藏页即使用户勾选覆盖也不播放；离开层级不会把上一次 success 写进来。

sdk、build、browser 为 NOT_RUN。`docs/library-lab/evidence/runs/` 无匹配 receipt 时，不能把 policy 测试写成播放器 PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B04 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B04-dotlottie/tests/playback-policy.test.mts
```

断言：已加载且可见时可播；未加载或隐藏页即使 override 也不可播；减少动画必须显式覆盖；文案区分等待、后台、系统偏好、播放和暂停。不证明 WASM 解码或 Canvas 像素。

## 官方资料

- https://github.com/LottieFiles/dotlottie-web
- https://docs.lottiefiles.com/en/runtimes/distributions/react
- https://docs.lottiefiles.com/en/runtimes/distributions/react/v0.x
- https://docs.lottiefiles.com/en/runtimes/distributions/react/v0.x/props-reference
- https://docs.lottiefiles.com/en/runtimes/distributions/react/v0.x/api-reference
- https://docs.lottiefiles.com/en/runtimes/distributions/react/v0.x/examples
- https://docs.lottiefiles.com/en/runtimes/distributions/react/v0.x/gpu-rendering
- https://www.npmjs.com/package/@lottiefiles/dotlottie-react
- https://github.com/LottieFiles/lottie-react/blob/master/README.md
