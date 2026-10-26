# A03 Chart.js — Agent 工程实现说明

目标库 chart.js 4.6.1，Canvas 绘图；适用于标准图表。若需要复杂地图、多个联动/大型仪表盘评估 A01 ECharts；需要 React SVG 直接声明评估 A02 Recharts。

## 必须先读取

library.json → examples/example.tsx → guide.md → verification.json。运行、展示源是同一实际文件；demo.tsx 只做出口。本版本源码 recreated，未验证真实 SDK，不得继承历史 PASS。

## 接入规则

- 从 chart.js 显式导入 Chart/对应 Controller/Element/Scale/Plugin，注册所需类型。
- useRef 保存 Canvas 与 Chart 实例；useEffect 创建，返回 cleanup chart.destroy()。
- 同一 Canvas 在旧 Chart 完成 destroy 前不得创建第二个实例。
- 更新数据使用 chart.data + chart.update；重建仅用于图形类型或真正需要重配生命周期的场景。
- 可视父节点有固定有效高度，Canvas 对应数据表必须可访问。
- 数据校验区分真实业务缺失与数值零；不要静默篡改。

## 测试断言

真实 SDK import、typecheck/build、两类 controller 注册成功；按钮更新不重复创建 Chart；类型切换与 StrictMode 双挂载不抛 Canvas already in use；离开页面销毁；响应式尺寸和等价数据表；无异常输出。未运行填 NOT_RUN。

官方：https://www.chartjs.org/docs/latest/getting-started/integration.html
