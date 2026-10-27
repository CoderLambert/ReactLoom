# A17 deck.gl — Agent 工程迁移指南

**适用任务**：无底图的GPU地理点图层，交互拾取、数据增量更新与Deck.finalize。

**选型边界和目标版本**：@deck.gl/core@9.4.0、@deck.gl/layers@9.4.0。适合大量空间点、轨迹、热点图层；不适合少数简单三维模型或需要自定义场景图材质的3D产品。代码采用 `@deck.gl/core` + `@deck.gl/layers` 9.4.0 同版本；不同版本子包不能混装。

**可迁移核心**：单个Deck实例、parent局部容器、ScatterplotLayer数据和id、setProps更新、getTooltip拾取、ResizeObserver测量、deck.finalize释放。不要直接new全局Deck也不要将地理点包误说成地图底图。静态数据坐标是经纬度顺序[longitude,latitude]。

**安全与许可**：本例没有瓦片URL或第三方地理API；若加入底图必须另审Token隐私、速率、License及归属。WebGL2失败显示HTML可访问表；1200点样本不是性能标杆。

**验收**：执行真实包导入，筛选后点数变化，Canvas仅一个，切换Tab资源销毁，WebGL2禁用可降级，点Tooltip与键盘表选择产生一致业务状态。

**唯一源码入口**：`packages/library-lab/entries/A17-deckgl/examples/example.tsx`，`examples/demo.tsx` 是 Library Lab 的动态加载适配出口。先读 library.json 与 verification.json；不可将三种演示选择误算成三个独立产物。

**迁移时保留的工程合同**：明确资源所有者、异常/空环境回退、卸载清理、异步任务失效与无障碍替代。仅复制目标项目需要的最小实现，不能照搬 Lab 的假业务字段和本地 fixture。

**资源探测注意**：`getContext('webgl2')` 会实际分配一个 GPU 上下文，探测成功后通过 `WEBGL_lose_context` 释放独立探测画布，避免与 Deck 本体叠加占用；异步渲染错误在 finalize 后不得再更新组件状态。

**必须验证**：真实目标SDK import、React19类型检查、生产构建、浏览器设备适配、快速反复挂载/切Tab无事件/GPU资源泄漏；特殊设备能力缺失时使用数据表退化展示。PASS需当前源码指纹、命令及日志证据，否则为NOT_RUN。

**官方参考**：[deck.gl standalone入门](https://deck.gl/docs/get-started/using-standalone) · [Deck parent与finalize API](https://deck.gl/docs/api-reference/core/deck) · [ScatterplotLayer属性](https://deck.gl/docs/api-reference/layers/scatterplot-layer)。

## wave14 边界策略

`examples/deck-size.ts` 是新迁移依赖：ResizeObserver 只将有效、改变后的可见容器尺寸送入 `Deck.setProps`；过滤/交互用 `Location.id`，不要以名称做不稳定身份键。仍须实际 GPU/Chromium 验证隐显切换、resize 去重、picked 过滤、finalize 后 RAF 不更新和硬件资源回收。尺寸规则单测不是官方 SDK PASS。
