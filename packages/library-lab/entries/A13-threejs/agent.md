# A13 Three.js — Agent 工程迁移指南

**适用任务**：WebGL 3D场景、动画循环、尺寸管理与显存回收的原生引擎实验。

**选型边界和目标版本**：three@0.186.0。**适合** 细致控制场景图、物理材质、渲染器与外部3D引擎接入；**不适合** 简单2D统计图或没有GPU回退要求的静态插图。v0.186.0 WebGLRenderer，不把WebGPURenderer API强塞进旧渲染器。

**迁移核心**：mount时创建Renderer/Scene/Camera，在ResizeObserver更新宽高比；在animation loop直接写Mesh变换；离开页面 `setAnimationLoop(null)`，释放所有自有BufferGeometry、Material、Texture、Renderer及listener。不要把在其他组件共享的资源误dispose。

**反例**：每帧React setState、不给Canvas容器固定高度、window尺寸代替container、移除canvas即认为WebGL释放、未处理context loss。

**验证断言**：用户改变色彩和形状；暂停后不会持续新增animation frames；在React StrictMode和反复Tab切换下Canvas实例不会累积；无GPU时显示可读数据。工程中接入模型Loader需附资源许可、取消与错误回退。

**唯一源码入口**：`packages/library-lab/entries/A13-threejs/examples/example.tsx`，`examples/demo.tsx` 是 Library Lab 的动态加载适配出口。先读 library.json 与 verification.json；不可将三种演示选择误算成三个独立产物。

**迁移时保留的工程合同**：明确资源所有者、异常/空环境回退、卸载清理、异步任务失效与无障碍替代。仅复制目标项目需要的最小实现，不能照搬 Lab 的假业务字段和本地 fixture。

**必须验证**：真实目标SDK import、React19类型检查、生产构建、浏览器设备适配、快速反复挂载/切Tab无事件/GPU资源泄漏；特殊设备能力缺失时使用数据表退化展示。PASS需当前源码指纹、命令及日志证据，否则为NOT_RUN。

**官方参考**：[Three.js 官方入门](https://threejs.org/manual/pages/creating-a-scene.html) · [WebGLRenderer API](https://threejs.org/docs/pages/WebGLRenderer.html) · [Three.js releases](https://github.com/mrdoob/three.js/releases)。


## 动效策略与迁移（wave8）

迁移 `examples/example.tsx` 时必须连同 `examples/animation-policy.ts` 一起读取；默认尊重系统减少动态。`shouldAnimate` 只在可见、用户请求播放、且系统未禁止动态或用户明确允许覆盖时返回 true；`visibilitychange` 和 `MediaQueryList change` 监听必须卸载，`setAnimationLoop(null)` 必须在 renderer.dispose 之前执行。静态帧保留内容可访问性。不要把 Node 纯规则测试称为 WebGL 或官方 SDK 验收。

## wave16 必须保留

将 `shouldRunFrameLoop(state,speed)` 与 `speed` 更新时的 `syncAnimation()` 一并迁移：速度为0必须关闭持续GPU循环。色彩变更不能触发多余Geometry重建；形状变化才重新分配并释放旧实例。恢复播放重置计时基线。纯策略测试只是CPU规则证据，需真实Three SDK、GPU占用/StrictMode重复挂载与浏览器验证。
