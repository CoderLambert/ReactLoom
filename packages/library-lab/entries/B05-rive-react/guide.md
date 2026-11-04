# B05 Rive React：WebGL2 运行时与状态机

Rive 的价值是设计器产出的同一个 `.riv`：Artboard、动画、State Machine、View Model 和事件由 React 控制，并与产品状态对齐。它不是 GIF 播放器，也不是业务状态管理器。按钮淡入先考虑 CSS 或 B01。Library Lab 固定 `@rive-app/react-webgl2@4.37.0`，宿主 React 19.3.0。运行时许可证是 MIT，没有单独的 runtime 费用。Editor 订阅和 `.riv` 导出权是另一套条款。MIT 不等于可以导出、修改或再分发任意官方素材。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。样式在 `examples/styles.css`。资产常量在 `examples/asset.ts`：

```ts
export const RIVE_SAMPLE_URL = 'https://cdn.rive.app/animations/vehicles.riv';
export const RIVE_SAMPLE_STATE_MACHINE = 'bumpy';
```

**官方 `.riv` 没有打进仓库，也不要提交。** 运行时 MIT 不覆盖这份远程样本的再分发。离线或内网打不开 `cdn.rive.app` 时，画面可以失败，HTML 状态必须还在。这是真实的离线阻断，不是文档疏忽。若要离线验收，使用**另行授权**、版本化、哈希固定的自有 `.riv`，并保持同一状态机契约。不要把下载来的官方二进制提交进 git，也不要在代码里伪造一个空的 `.riv`。

已挂载：

- `useRive({ src, stateMachine: 'bumpy', autoplay: false, onLoadError })`，第二参数 `{useOffscreenRenderer: true}`。渲染 `<RiveComponent />`，容器 `aria-hidden="true"`。
- 播放由 `riveRuntimePolicy` 决定，和挂载是两件不同的事。页面隐藏时 `mount: false`，子组件卸载，把 WebGL 实例交还给包装器，而不是只 `pause` 留在树上。
- `advanced` 用 `IntersectionObserver`（阈值 0.05）。没有该 API 时视为在视口内。滚出视口则卸载。
- 减少动画或手动暂停：仍然挂载（页面可见且在视口内时），但 `play: false`。
- `business` 只在 `phase === 'pending'` 时请求播放。审核成功/失败/空闲都不靠动画帧推断。
- 本地审核：`AbortController` + `generation`。新请求作废旧请求；取消或切换 level 会 abort，迟到结果写不回来。失败路径是本地抛出的「模拟 HTTP 503」，没有真实接口。
- `onLoadError` 若发生在播放器已经卸载之后，用 `alive` ref 丢掉，避免 setState 写到已离开的层级。播放控制包在 try/catch 里，错误进入 `role="status"` 文案。

**没有**在包装器 cleanup 里调用 `rive.cleanup()`。`useRive` 拥有实例。只有自己 `new Rive({...})` 的命令式 Web API 才在 effect cleanup 里 `cleanup()`。

未挂载：`useViewModelInstanceNumber`、`autoBind`、`onRiveReady`、自有 `health.riv`、`enableGPUCanvas`、`enableInkbleed`、React Aria Dialog 组合。`vehicles.riv` 只确认了公开示例状态机 `bumpy`，没有核实过的 `approved` / `failed` 属性。不要写不存在的字段假装业务画面会变。

## 什么时候使用

| 任务 | 是否优先 | 理由 |
| --- | --- | --- |
| 复杂插画、角色微交互、多端同一视觉状态 | 优先考虑 | 状态迁移可留在设计器；对比 B04 更偏状态机和 View Model |
| 数据驱动的引导、进度插画 | 有条件 | 必须已有合法 `.riv` 和书面 VM 契约；事实仍在 React |
| Hover、按钮变色 | 通常不用 | CSS / Motion 更轻，DOM 语义还在 |
| 表格每一行一个 WebGL 上下文 | 先测量 | WASM、解码和 context 都不是免费的 |
| 关键表单、主按钮、读屏流程 | 不能单独承担 | Canvas 不等于表单 |
| SEO 正文、纯 SSR | 不适用 | 服务端只输出 HTML 兜底 |

```text
用户操作 / 本地审核结果
  → React phase（idle | pending | success | error）
  → riveRuntimePolicy → mount / play
  → useRive 管理加载、canvas、resize
  → WASM 解析 .riv → Artboard → State Machine → Renderer
  → WebGL2 只是视觉；旁边的 button 和 status 才是业务
```

不要从状态机当前帧反推审核是否成功。

## 版本与 API 边界

| 项 | Lab |
| --- | --- |
| 包 | `@rive-app/react-webgl2@4.37.0` |
| 渲染路线 | 文档首选 WebGL2。`react-canvas` 与 `react-canvas-lite` 效果不同，本条目不混用 |
| 状态机属性 | 新代码用单数 `stateMachine`。复数 `stateMachines` 与 `useStateMachineInput` 在 2026-08 前后的运行时更新里已弃用 |
| 数据绑定 | 新设计用 View Model hooks。Lab 示例没有对应资产，所以不调用 |
| GPU Canvas | `enableGPUCanvas` 与 `useOffscreenRenderer: true` 冲突。本示例选择离屏渲染器，不打开 GPU Canvas |
| 文本输入 | 运行时开始有早期 Focus / Text Input。这不等于中文 IME、候选框和移动光标已经等同原生 `<input>` |

4.37.0 引入 `enableInkbleed`。本示例不启用用不上的特性。

## 三层渐进

### Demo ① 播放器（已挂载）

打开 basic：可见且未减少动画、未手动暂停时，策略要求播放。容器在 `styles.css` 里必须有确定宽高。高度为 0 时会白块且没有明显异常。网络失败时 status 保留「资源/渲染失败」或初始说明，按钮仍可点。

最小形态是官方 `<Rive src stateMachine autoplay />`。Lab 不用这个无钩子组件，因为播放必须随可见性和减少动画变化。用 `key` 强迫重建简单组件可以换源，但会反复申请上下文；这里用 `useRive` 的 `play()` / `pause()`。

### Demo ② 审核（已挂载的本地状态机；视觉状态机未绑定）

「启动 / 重试审核」约 450ms 后成功，或在勾选「下次模拟 503」后失败。连续点击会 abort 上一次。取消把 phase 打回 idle，并作废 generation。播放只在 pending 且允许动画时发生。成功文案写明：HTML 呈现业务，Rive 不决定任务成功。

要把 approved/failed 画进文件里，设计器必须提供 `status` 或 `progress` 的 View Model，再按下一节绑定。当前远程样本做不到这一点。

### Demo ③ 视口与生命周期（已挂载）

滚出卡片：占位文案说明组件已卸载。回到视口再加载。页面进后台同样卸载，而不是在后台继续刷帧。手动暂停和减少动画留下静态播放器（若仍挂载）。不要把「一个实例的策略测试」说成一百个实例的性能证明。

## 现代数据绑定（生产教学，当前 demo 不挂载）

新文件约定应写成契约，而不是散落的字符串：

```text
artboard: DemoArtboard
stateMachine: State Machine 1
viewModel: HealthModel
viewModelInstance: HealthModelDefault
property: health（number，0..100）
```

```tsx
import {useRive, useViewModelInstanceNumber} from '@rive-app/react-webgl2';

const {rive, RiveComponent} = useRive({
  src: '/health.riv',
  stateMachine: 'State Machine 1',
  autoBind: true,
  autoplay: false,
});
const {setValue} = useViewModelInstanceNumber('health', rive?.viewModelInstance);
```

`/health.riv` 不是本仓库文件。`autoBind` 不会猜一个不存在的 View Model 名字。hooks 往往在装载后才写入属性，第一帧可能仍是设计器默认值。隐私、金额、权限这类初值不要靠动画遮住闪烁。官方有 `onRiveReady` 可在初帧前绑定，必须对着真实 schema 测。

自有资产的发布步骤：确认当期计划允许导出；固定内容哈希和属性名；放到受控地址；CSP 与主机白名单限制来源；404 和跨域时显示非动画兜底。不要把用户输入拼进 CDN 路径。

## 反例

| 错误 | 后果 | 正确 |
| --- | --- | --- |
| `stateMachines: 'bumpy'` | 弃用警告，后续升级风险 | 单数 `stateMachine: 'bumpy'`，与 `asset.ts` 一致 |
| 新代码继续 `useStateMachineInput('progress')` | 弱类型旧接口 | 设计器建 View Model，再用对应 hook |
| 渲染期间 `new Rive()` | StrictMode 下重复创建 | `useRive`；命令式只在 effect 里 new，并在 cleanup `cleanup()` |
| 包装器里再 `rive.cleanup()` | 双重释放 | 卸载子组件即可。Lab 的 `RivePlayer` 就是这样做的 |
| 外层没有高度 | 空白且无异常 | 明确宽高，resize 交给包装器 |
| 用帧事件决定付款成功 | 资源没加载就被当成失败或成功 | reducer / 服务器结果 + 可读 status |
| 每行一个 WebGL2 context | context 上限和掉帧 | 按需挂载；多实例优先考虑 `useOffscreenRenderer: true`；列表用静态缩略图 |
| `enableGPUCanvas` 同时 `useOffscreenRenderer: true` | 官方说明不渲染 | 要 GPU Canvas 时显式关闭离屏渲染并实测 |
| 动画代替按钮和错误文案 | 键盘和读屏不知道结果 | 原生 button、`aria-live`、Canvas 仅装饰 |
| 把 MIT 理解成可提交官方 `.riv` | 运行时和素材授权混淆 | 远程 URL 保持远程；自有文件单独授权后再入库 |

系统 `prefers-reduced-motion` 时不要自动播放。后台标签页要释放或至少暂停。Lab 选择释放。加载失败必须有文字，不能只剩一块画布。

## 可访问性与输入

2026 年运行时的 Focus / Text Input 仍是早期能力。表单继续用 HTML：label、错误说明、提交按钮。拼音 `compositionstart/update/end`、移动候选框、语音输入、Tab 顺序都不要假设与原生 input 等价。装饰画布 `aria-hidden="true"`。若画布本身必须可操作，就要另做 DOM 替代，不能一边隐藏一边指望它承载唯一信息。

触摸目标放在 DOM 上。Canvas 指针只留给真正属于场景的交互。CSS 尺寸不等于绘图缓冲尺寸。横竖屏要看裁切。

## 性能、CSP 与故障

| 现象 | 处理 |
| --- | --- |
| 空白 | 看 `.riv` 是否 200、WASM、CORS/CSP、WebGL2、状态机拼写、容器高度 |
| 路由离开后仍占显存 | 包装器是否卸载；手写 `new Rive` 是否 `cleanup()`；观察器是否还在 |
| GPU Canvas 不出画 | 与离屏渲染器互斥 |
| 离线 | 不注入不受控脚本；HTML 状态仍可用。不要把官方样本下载进仓库来「修复」离线 |
| CSP | WASM 可能需要 `wasm-unsafe-eval`；`connect-src` 只放行需要的主机。不要无边界放开 `unsafe-eval` |
| SSR | 运行时放客户端边界。服务端输出标题和状态文本。本示例是 Vite 浏览器入口，没有做 Next.js 水合验收 |

WASM 解码、每帧渲染和 context 数量都要在目标设备上测。本文不写虚构的 FPS 或包体。

## 组合（未安装、未挂载）

**TanStack Query**：缓存、失效、取消归 Query。Rive 只读 `isPending` / `isError` / `data.status`。动画卸载不能让业务状态消失。不要用动画当交易凭证。示意里的 `/authorized/review.riv` 必须是你自己的契约文件。

**React Aria / Radix**：菜单和 Dialog 的焦点、键盘、Portal 归无头组件。Rive 画打开后的插画。关闭时卸载播放器，焦点回到触发器。减少动画时停播。Canvas 不要截走 Tab。

**Zustand**：可以保存审核 phase 和任务 id。不要把 WebGL 实例放进全局 store 当状态容器。跨页面共用文件必须由设计器维护兼容的 View Model。

| 方案 | 强项 | 不用的时候 |
| --- | --- | --- |
| Rive | 状态机 + 数据绑定 + 多端同素材 | 简单 CSS、真表单 |
| dotLottie | 时间轴资产 | 交互主要在 JS 里重写 |
| Motion | DOM 过渡和 layout | 高保真角色 |
| GSAP | 时间线 | 一个状态图标 |
| CSS/SVG | 低依赖 | 设计交接很重时 |

## 升级与练习

练习 A：列出旧仓库的 `stateMachines` 和 `useStateMachineInput`，在设计器建立对应属性，改成单数 `stateMachine` 和 `useViewModelInstance*`。旧接口过渡期不要假装已经删除。验收：服务端错误仍然是文字；离开路由不再抛弃用警告。

练习 B：先判断是否真的需要状态机。没有交互就继续用 B04。拿到合法导出后替换 URL，加入减少动画、HTML 兜底和延迟挂载。验收：下载失败有文字；重复进出不泄漏；小屏控件还在。不要为了练习把 `vehicles.riv` 提交进仓库。

练习 C：为「新请求覆盖旧请求」补测试，取消后的失败不能回写。Lab 的 generation 已经是这个形状，浏览器侧仍要看按钮连点。

## 更多失败模式

容器有宽高仍可能空白：`stateMachine` 拼写成复数属性、WASM 被 CSP 拦住、或 `enableGPUCanvas` 与当前的 `useOffscreenRenderer: true` 同时打开。Lab 没有打开 GPU Canvas。排查顺序是网络面板里的 `.riv` 状态码、控制台里的 `onLoadError` 文案、然后才是 WebGL2 能力。不要把空白当成「文件不存在」后去把官方样本提交进 git。

`onRiveReady` 适合在第一帧之前写入隐私或金额。那些值如果先显示成设计器默认值再跳变，用户会看到错误数字。没有自有文件时不要调用这个回调来「预热」`vehicles.riv`，因为公开样本没有对应的 View Model 属性。

命令式路径只作为对照，当前组件树不要混进去：

```tsx
useEffect(() => {
  const rive = new Rive({src: RIVE_SAMPLE_URL, canvas, autoplay: false});
  return () => rive.cleanup();
}, []);
```

这段与 `useRive` 二选一。包装器已经拥有实例时再 `cleanup()` 会双重释放。Lab 选择钩子，所以播放器卸载是唯一释放点。

多个画布默认共享离屏渲染器，是为了少申请 WebGL context。这不是「一百个实例已经测过」的结论。表格行里应放静态图，需要时再挂一个 `RivePlayer`。隐藏页策略是卸载整棵子树，后台标签不应继续 `requestAnimationFrame`。

中文输入即使运行时开始提供 Text Input，表单仍用原生 `<input>`。`compositionupdate` 期间不要把拼音写进 View Model 当作已提交文案。Lab 的审核按钮没有文本字段。

CSP 上，WASM 可能要求脚本策略允许 `wasm-unsafe-eval`，`connect-src` 只加入 `https://cdn.rive.app` 这一条，而不是任意主机。自有文件改成同源后，把 CDN 从允许列表删掉。用户输入不能拼进 `src`。

Editor 的免费档可以创作，但把 `.riv` 导出到产品里通常要当期付费计划。价格以 https://rive.app/pricing 当时页面为准，不要把某次博客里的月费写死成永久报价。运行时不收 royalty，也不因此获得官方 `vehicles.riv` 的再分发权。

TanStack Query 组合时，`query.isPending` 可以驱动 `play`，但 `query.data.status` 的文字必须渲染在 `<output>` 里。示意资源 `/authorized/review.riv` 不在仓库中。React Aria 的 Dialog 关闭时卸载 `RivePlayer`，焦点回到触发按钮，Canvas 不要留在 Tab 顺序里。

## 播放策略对照

`riveRuntimePolicy` 把「要不要挂载」和「要不要 play」拆开。对照表如下，和测试一致：

| 条件 | mount | play |
| --- | --- | --- |
| basic，页面可见，未减少动画，未手动暂停 | 是 | 是 |
| 页面隐藏 | 否 | 否 |
| advanced 且不在视口 | 否 | 否 |
| 减少动画或手动暂停 | 是（若页面可见且在视口策略内） | 否 |
| business 且 phase 不是 pending | 是 | 否 |
| business 且 pending，其余允许 | 是 | 是 |

策略返回 play 只表示调用 `rive.play()`。CDN 或 WASM 失败时画布可以是空的，status 必须解释原因。不要把 `play: true` 写成「用户已经看见车辆动画」。

业务 phase 的合法迁移只有：idle → pending → success 或 error，以及 pending → idle（取消）。success 不会因为动画停了变回 idle。切换 level 的 effect 把 phase 打回 idle 并 abort，所以从 business 切到 basic 时，不应再弹出上一次的 503 文案。

## 资源与离线阻断

`examples/asset.ts` 把 URL 和状态机名字分成两个常量，播放器只引用常量。换自有文件时改这两个常量，并保证状态机名字在新文件里真实存在。不要复制 `vehicles.riv` 到 `examples/` 或 `public/` 再改 URL 为相对路径。那样做会把官方二进制放进版本库。

离线时 `onLoadError` 走文案分支，按钮和 `role="status"` 仍在。advanced 若同时在视口外，组件根本不挂载，失败回调也不应再 `setMessage`。`alive` ref 就是为了这条竞态。本地审核的 503 与资源加载失败是两句不同的话，不要合并成一个「失败」。

发布自有文件的最小清单：导出权、内容哈希、artboard 名、状态机名、View Model 属性类型和范围、CSP 主机、404 时的 HTML 兜底。缺任何一项就不要把播放器当成业务成功的证据。

## 验收

basic：手动暂停后策略为挂载但不播放；恢复后在减少动画关闭且页面可见时请求播放。business：503 勾选只影响下一次本地任务；取消后 status 说明旧任务不得回写。advanced：视口外和后台都是未挂载。CDN 失败时三段文字都还在。

`verification.json` 的 sdk、build、browser 为 NOT_RUN。`docs/library-lab/evidence/runs/` 没有匹配 receipt 时，policy 测试不是 Rive SDK PASS，也不是 WebGL PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B05 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B05-rive-react/tests/runtime-policy.test.mts
```

断言：basic 默认可挂载并播放；隐藏页 mount 与 play 都为 false；advanced 视口外不分配；减少动画和手动暂停保持挂载但停播；business 仅 pending 播放。不证明 `useRive` 加载了远程文件。

## 官方资料

- https://rive.app/docs/runtimes/react/react
- https://rive.app/docs/runtimes/react/parameters-and-return-values
- https://rive.app/docs/runtimes/react/state-machines
- https://rive.app/docs/runtimes/react/data-binding
- https://github.com/rive-app/rive-react
- https://github.com/rive-app/rive-react/releases/tag/v4.37.0
- https://www.npmjs.com/package/@rive-app/react-webgl2
- https://rive.app/pricing
- https://rive.app/blog/rive-s-new-9-mo-plan
