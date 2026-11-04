# B04 dotLottie React

## 适用

播放可信的 Lottie JSON 或 `.lottie`。DOM 布局动画、拖放、表单焦点不要交给 Canvas 播放器。简单加载环优先 CSS。资产许可与运行时 MIT 分开。

## 版本

`@lottiefiles/dotlottie-react@0.20.0`，React 19.3.0。许可证 MIT。不要再装归档的 `@lottiefiles/react-lottie-player`，也不要另钉一份可能冲突的 `dotlottie-web`。0.x 升级要回归 props 和事件名。

## 迁移

旧播放器的 `lottie-react` 事件名和 ref 形状不能照搬。`src` URL 与 `data` 字符串是两条加载路径；Lab 用本地 JSON 的 `data`。Worker / GPU 子路径是另一套生命周期，当前示例没有挂。

## 不可删的清理

`autoplay={false}`。`load` / `loadError` / `renderError` 成对解除，cleanup 时 `pause()`。`visibilitychange` 与业务 timeout 在卸载和切换 level 时清掉。减少动画默认 `setFrame(0)`。隐藏页不能被「允许动画」覆盖。Canvas `aria-hidden` 且 `tabIndex={-1}`。

## 反例

列表里每个远程 URL 都 autoplay。只提供 hover 播放。把 `complete` 当成保存成功。ref 回调里订阅不清理。`onFrame` 每帧 setState。未 `load` 就 `setFrame`。ErrorBoundary 代替 `loadError`。业务 effect 再 `destroy()` 一次包装器拥有的实例。

复用时保留这些不变的约定：

- `data` 来自仓库内 `pulse.json`，不要换成远程 URL。
- `autoplay={false}`，播放意图和 `mayPlay` 分开。
- 监听器与 650ms 定时器在换 level 时清掉。
- Canvas 不进入 Tab 顺序；失败用 `role="alert"`。
- Worker、GPU 和 IntersectionObserver 未挂载。

## 测试断言

`tests/playback-policy.test.mts` 断言 `mayPlay` 与 `playbackLabel`：可见且已加载可播；未加载、隐藏页在 override 下仍拒绝；减少动画需要显式覆盖。不证明 WASM、Canvas 或 650ms 定时器。

## 真实限制

已挂载：本地 `pulse.json`、播放/停止、速度、减少动画覆盖、隐藏页暂停、本地订阅定时器与失败文案。未挂载：Worker、WebGL/WebGPU、IntersectionObserver 卸载、多动画 `animationId`、真实 HTTP。不要把远程资产写回仓库冒充离线样例。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://docs.lottiefiles.com/en/runtimes/distributions/react
