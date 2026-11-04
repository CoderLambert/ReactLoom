# B05 Rive React Runtime — Agent 工程实施卡

## 选型

要高保真交互美术资产且设计师负责动画状态机时选 Rive。普通 DOM 布局过渡优先 B01 Motion；简单 Lottie 播放评估 B04 dotLottie。资产与 SDK 分开授权，不得假定 .riv 与 MIT runtime 同许可。

## 固定证据与入口

SDK：`@rive-app/react-webgl2@4.37.0`。
实际代码：`examples/example.tsx`；
远程资产声明：`examples/asset.ts`；
样式：`examples/styles.css`；
验证范围：`verification.json`。

只使用官方示例资产 URL，不复制未授权 .riv 二进制到代码仓库。Node/GPU验证未跑时标 NOT_RUN。

## 项目迁移必须保留

- 按路由/显式操作懒加载整个 Rive SDK；Rive WebGL2 + WASM 不放在应用入口。
- 使用单数 `stateMachine` 与经资产核对的名字。不存在的 View Model 字段不能硬凑接口。
- RiveComponent 在明确尺寸容器中渲染，先检查加载错误和 CSP/CDN。useRive 的异步加载回调须受播放器挂载生命周期约束；调用 play/pause 需要处理运行时异常。请求播放不等于CDN载入成功。
- Rive 只负责视觉；真实业务状态与失败、取消逻辑由 React/Domain 层表达。
- AbortController + generation 防止取消、重复请求与卸载后旧结果覆盖新页面。
- 监听页面可见性、用户 reduced-motion 与视口；暂停不可见实例，需要时卸载 SDK 子组件。
- 以 HTML 文字/按钮提供键盘和屏幕阅读器替代，不能只靠 Canvas 变色。

## 禁忌

重复创建 WebGL 实例而不卸载；在 reducer 中管理 WebGL API；从视觉帧推断业务成功；对官方样本假设有新的 data-binding field；把本地模拟审核称为真实后端；在没有运行时代码实测时宣称内存优化。

## 迁移后必测

真正 npm 安装/TS/Build、CDN资产加载、UI播放/暂停、隐藏页面暂停、系统 reduced-motion、卸载 GPU、请求取消/重试/503、StrictMode双挂载和移动端 WebGL。结果连源码指纹存档，不能复制历史原研究的23个Node纯逻辑 PASS。

官方：https://rive.app/docs/runtimes/react/react

### wave17 运行时约束

复制 `examples/runtime-policy.ts`；隐藏页面/高级场景离开视口时卸载RivePlayer而不是只暂停动画。业务异步模拟在level切换与unmount时Abort并增加generation；保持SDK内部实例由官方hook拥有。Node测试只能证明布尔门禁，不证明GPU释放。
