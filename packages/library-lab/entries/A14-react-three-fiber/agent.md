# A14 React Three Fiber — Agent 工程迁移指南

**适用任务**：React19声明式三维场景、useFrame与可见性节能的实践。

**选型边界和目标版本**：@react-three/fiber@9.8.2、three@0.186.0。**适用** 已有React组件树的产品3D、配置器、数据场景；**不适用** 没有GPU交互价值的普通业务图表。

R3F采用稳定v9.8.2（React19.3兼容），不要无审查升级到v10 alpha。真正React代码例子在 examples/example.tsx；useFrame/useThree必须位于Canvas内部；props更新由React触发对象树调和，几何体所有权交由R3F，手工external loader缓存仍自行回收。

**实践边界**：useFrame按帧仅修改mesh.current.rotation，避免setState；frameloop=demand用于暂停/降功耗；dpr有明确上限。保留html按钮和状态播报让键盘/读屏用户完成同样业务。聚焦context crash、StrictMode、reduced-motion系统偏好中途变化及重挂载释放。

**测试**：支持Canvas时模型绘制与点击切换，禁用GPU时fallback可读，快速连续重挂载不会留下canvas/RAF。

**唯一源码入口**：`packages/library-lab/entries/A14-react-three-fiber/examples/example.tsx`，`examples/demo.tsx` 是 Library Lab 的动态加载适配出口。先读 library.json 与 verification.json；不可将三种演示选择误算成三个独立产物。

**迁移时保留的工程合同**：明确资源所有者、异常/空环境回退、卸载清理、异步任务失效与无障碍替代。仅复制目标项目需要的最小实现，不能照搬 Lab 的假业务字段和本地 fixture。

**必须验证**：真实目标SDK import、React19类型检查、生产构建、浏览器设备适配、快速反复挂载/切Tab无事件/GPU资源泄漏；特殊设备能力缺失时使用数据表退化展示。PASS需当前源码指纹、命令及日志证据，否则为NOT_RUN。

**官方参考**：[R3F Canvas官方API](https://r3f.docs.pmnd.rs/api/canvas) · [R3F useFrame官方API](https://r3f.docs.pmnd.rs/api/hooks) · [React19兼容发布说明](https://github.com/pmndrs/react-three-fiber/releases/tag/v9.8.2)。

## 第13轮资源/无障碍契约

`frame-policy.ts` 必须与 `useDocumentVisibility` 一同移植；不能只在 `useFrame` 内 return 但让 Canvas 永远 `always`。暂停、减少动态、后台、速度零都需要 `demand`；恢复时依赖 React/R3F 自身调度。任何层级均保留 HTML 可操作按钮。policy 测试不是GPU或SDK验收。
