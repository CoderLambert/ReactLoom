# Frappe Gantt：任务依赖与可回滚计划

## 使用场景
适合交付计划、开发任务依赖、进度和日期可视化，不是简单事件日历，也不替代后端项目管理系统。其图表基于 SVG；键盘和屏幕阅读器的交互不能依赖拖拽 SVG，本示例提供表格形式的等效编辑。

## 依赖与真实入口
目标 frappe-gantt 1.2.2：

    pnpm add frappe-gantt@1.2.2

示例通过动态 import('frappe-gantt') 在组件挂载后实际创建 Gantt 实例，Chart 读取复制的业务任务数据。包的 exports 仅公开主入口，因此不能在 Vite 里随意 import 未声明的 dist CSS 子路径；本教学使用 examples/gantt.css 的独立隔离样式，之后 PLATFORM 可评估独立构建别名。

## 入门：最小三任务
固定 ID、开始/结束日、进度和依赖字符串；Gantt 使用 view_mode=Day/Week/Month 切换。业务状态存于 React，不能依赖被 SDK 修改的任务对象。在 new Gantt 前逐任务浅复制，避免将库内部的 mutable 数据暴露给业务。

## 业务：双通道编辑
图表只读，键盘可编辑的日期表格负责更新；validatePlan 检查 ISO 日历日期、开始/结束顺序、进度范围、依赖目标是否存在、自依赖、多节点闭环、重复依赖 ID 与非有限数值进度。改动成功后生成新列表触发图表重建。筛选只影响表格，不删掉图表依赖节点。

## 进阶：边界与回滚
输入结束早于开始被拒绝；联调回归任务模拟 revision 冲突但不改权威数据。生产应使用 If-Match/版本、可取消异步 PATCH、409 后刷新并回滚，不能把前端模拟当作服务端测试。依赖环检测已在本地策略实现；跨任务级联日期和真实服务端 revision 契约仍待实现。

## 三个反例
1. 直接把 React state 的数组交给 Gantt，库内部对任务对象进行修改，破坏不可变状态。
2. 过滤图表任务列表却保留指向隐藏节点的依赖，产生错误路径和断箭头。
3. 完全依赖 SVG 拖拽而无键盘操作，不能满足真实可访问性。
4. 仅在 DOM 上删除 SVG 就假定所有监听/计时器清理完毕；需在对应官方版本真实浏览器确认其资源生命周期。

## 安全、性能与资产
popup 设置为 false，不插入未经净化的服务端 HTML。大量任务应按项目范围分页并审计箭头复杂度；滚动与尺寸变化须 Chromium 实测。任务日期按本地日历日保存，不要简单将一个 ISO calendar day 等同固定24小时的 UTC 时长。当前 demo 未采用不受支持的 import 子路径。

## 官方来源
https://github.com/frappe/gantt
https://frappe.io/gantt

## 本批新增：拓扑依赖和非法数字门禁
示例现在实际导入 `examples/plan-policy.mjs`。在交给 Frappe Gantt 前，先严格校验日期区间、重复任务/依赖 ID、目标不存在、自依赖与整张依赖图的环（Kahn 拓扑遍历）；同时拒绝 `NaN`、`Infinity` 和超出 0–100 的进度。进阶层「模拟依赖闭环」只预览拒绝原因，不改变当前计划。原本只检查直接自依赖，无法拒绝 A→B→C→A。纯 Node 测试见 `tests/plan-policy.test.mjs`，实际 Gantt 浏览器挂载和监听器清理仍未运行。
