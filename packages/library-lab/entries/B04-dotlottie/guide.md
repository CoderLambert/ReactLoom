# 用 dotLottie 播放设计动画，并让业务状态独立成立

假设订阅按钮需要一段成功动效。设计师交付的是 Lottie JSON，前端要控制播放、速度、失败和卸载，而不是重新用 DOM 画出每个图形。`@lottiefiles/dotlottie-react` 正是这层 React 播放器：把动画交给 Canvas/WASM，引出实例供业务控制。若需求只是按钮位移或列表进出，Motion/GSAP 更直接；需要设计器状态机驱动的交互角色时再比较 Rive。

本例固定 React 包 **0.20.0**，其依赖的普通 Web 播放器为 **0.81.0**。安装包的 React peer 是 `^17 || ^18 || ^19`，Lab 使用 React 19.3.0。运行时代码 MIT；动画资产许可单独判断。这里的 `examples/pulse.json` 是仓库原创的 60 帧、30fps 脉冲动画，没有外部图片或字体。

## 先建立播放器模型

```text
原创 JSON → data 字符串 → DotLottieReact → Canvas/WASM 画面
                             ↓ 实例回调
                          DotLottie
                  load / loadError / renderError
                  play / pause / stop / setFrame / setSpeed
```

`ready` 表示引擎可用，`load` 才表示当前动画载入完成。实例可能在 effect 订阅之前就已加载，所以源码同时检查 `player.isLoaded`。播放操作只在已加载且策略允许时执行；损坏数据通过真实播放器事件进入错误态，React ErrorBoundary 不能替代这些事件。

本地动画文件不代表完全离线。普通播放器初次启动会从 `cdn.jsdelivr.net` 获取 **0.81.0** 的 `dotlottie-player.wasm`，SDK 还定义了同版本 unpkg 回退。网络或 CSP 拒绝这些来源时，必须处理错误。需要离线部署时，在自己的应用复制匹配且许可允许的 WASM，并在首个播放器创建之前调用包导出的 `setWasmUrl`；本条目沿用 SDK 官方固定版本来源，没有复制引擎文件。生产 CSP 也需允许相应 WASM 加载和执行。

## 最小接入与迁移边界

```tsx
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import pulse from './pulse.json';

<DotLottieReact
  data={JSON.stringify(pulse)}
  autoplay={false}
  loop
  aria-hidden="true"
  tabIndex={-1}
  style={{ width: 185, height: 155 }}
/>
```

这个片段只建立画面；完整控制、监听和清理在实际 `examples/example.tsx`。复制时保留 `demo.tsx`、`example.tsx`、`playback-policy.ts`、`pulse.json`，安装匹配 React 包。布局是本地内联样式，原生按钮不依赖 Lab CSS 才能操作。

**完整 workshop 仅在浏览器挂载**：状态初始化直接读取 `window.matchMedia` 和 `document.hidden`，DPR 也在渲染时读取。服务端应用应延迟挂载整个组件或使用客户端动态加载；仅加 `'use client'` 仍可能有服务端预渲染，不能解决这一前提。这里没有测试 SSR/hydration。

## 实验一：区别播放意图和引擎状态

1. 打开基础实验，等“矢量动画资源已加载”。画面默认静止，不抢焦点。
2. 点“播放”，脉冲大小连续变化；点“读取播放器状态”，观察 SDK 的 `frame`、`totalFrames`、`duration`、`playing`。再读一次，帧数应前进。
3. 点“暂停”再连续读取，帧数保持；点“停止并回到首帧”，读数应为首帧且 `stopped: true`。

按钮改变 `intent`，effect 再调用真实 `play/pause/stop`。`stop` 与 `pause` 分开，避免停止后又被通用 pause effect 覆盖。上方“播放策略”说明应用的门禁和意图；读数是点击时的真实 getter 快照，不是每帧 React 状态，也不是伪造的计时器进度。`isFrozen` 表示渲染冻结，与暂停不同。

## 实验二：让成功文案拥有业务结果

打开业务实验，点“模拟本地订阅确认”。文字先变“本地处理中”，动画暂停；**650ms 本地定时器**完成后才显示“操作成功”并请求播放。重复点击会清除旧定时器，离开实验会取消任务。这里没有 HTTP 或服务端提交。

开启系统“减少动态”后再执行，成功文字仍会出现，动画保持首帧。业务成功来自本地任务回调，绝不从动画 `complete` 事件推导。迁到生产时，把该回调替换为服务端确认或 mutation 状态；即使播放器加载失败，用户仍需要可读的成功或失败信息。

## 实验三：定位帧、覆盖偏好与恢复坏数据

1. 高级实验暂停后拖动“定位帧”，例如到 30，再读取实际状态。`clampFrame` 根据解码后的 `totalFrames` 把输入夹在 `[0, ceil(totalFrames)-1]`，源码调用 `pause()` 再 `setFrame()`。这是手动定位，不是时间轴编辑器。
2. 选 0.5× 或 1.5×，播放并读出实际 `speed`。系统减少动态时默认禁播并返回首帧，只有本实验的明确勾选才允许覆盖。
3. 切到另一个真实浏览器标签页，播放器应暂停；回来后仅原先请求播放的实验恢复。隐藏页面不能被减少动态覆盖开关放行，手动暂停也不会因回前台自动播放。
4. 点“加载损坏的演示数据”：真实 SDK 解析无效字符串并报告错误，旧 Canvas 不冒充本次成功。点“恢复本地动画”重新挂载原始 JSON，等 load 后可再次播放。损坏的是演示 fixture，不涉及上传或外部资源。

减少动态、可见性和加载条件集中在 `playback-policy.ts`。策略单测只证明这些规则与帧夹取，不证明 WASM、Canvas 像素或真实标签页行为。

## 生命周期为什么这样分工

React 包装器拥有实例销毁。应用 effect 成对移除 `load/loadError/renderError`，暂停实例；可见性和媒体查询监听各自清理，业务 timeout 由创建它的组件取消。应用不重复调用包装器的 `destroy()`。

另一个极小的 `destroy` 观察器在 SDK 真正发出事件时标记旧 Canvas 的 `data-player-destroyed`，供生命周期检查；SDK 销毁后清除自己的事件集合。StrictMode 若复用同一实例，应用先替换旧观察器，避免重复订阅。这个标记不触发销毁，也不代替实际事件。页面共享的 WASM 模块缓存不由每个实验清空。

`renderConfig` 把 DPR 限制在 2 并自动调整 Canvas 大小，这是示例的资源预算选择，不能推导某设备的性能评分。大量列表项应优先静态图，只挂载激活项。Canvas 用于装饰，按钮与结果文字承担键盘和辅助技术操作。

## 官方来源和验证入口

官方原文保存于 `official/readme.md`，来自 LottieFiles/dotlottie-web 固定提交 `e34f2cf2dc609ebae482615f64be4dee4218a4eb` 的 `packages/react/README.md`。对应包版本 0.20.0；实际列出的根与包目录只有英文 README，因此使用未经翻译改写的英文原文。完整请求头、候选文件、时间、版本与摘要在 `official/source-audit.json` 和 `library.json`。

该包声明的官网实际 GET 200，但有 `X-Frame-Options: DENY`，因此官网面板提供禁止嵌入说明和官方直达。不能把请求成功当成 iframe 可用。

本地运行记录、命令和边界见 `local-validation.md`。正式 sdk/build/browser 收据以 `verification.json` 与匹配的 recorder 产物为准；局部策略测试不能替代播放器运行。

- [匹配 API 文档](https://docs.lottiefiles.com/en/runtimes/distributions/react/v0.x/api-reference)
- [固定 React 包源码](https://github.com/LottieFiles/dotlottie-web/tree/e34f2cf2dc609ebae482615f64be4dee4218a4eb/packages/react)
