# A03 Chart.js：Canvas 图表与 React 实例所有权

## 适用场景与边界

Chart.js 使用 Canvas 绘制常见图表；适合业务数据趋势、图形种类有限的仪表盘。与 Recharts 的 SVG React 声明不同，Chart.js 构建可变的 Chart 对象，必须明确谁创建、更新和销毁它。复杂联动和地图应评估 ECharts。

## 安装与选择性注册

    pnpm add chart.js@4.6.1

    import {Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend} from 'chart.js';
    Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

Chart.js v4 采用按需组件注册；如果要同时支持折线，需要额外注册 LineController、LineElement、PointElement。引用 chart.js/auto 虽然方便，但会将不使用的图表能力一起引入。源码 examples/example.tsx 使用真实模块注册，demo.tsx 只负责导出。

## 三层运行演示

**basic**：真实 Chart 构造器绘制柱形图，父容器固定高度，设置 maintainAspectRatio=false。Canvas 下方有等价数据表。

**business**：按钮更新数据；调用 chart.data.datasets[0].data 和 chart.update('none') 复用实例，避免每次数据变化重新初始化。

**advanced**：柱/线类型切换；effect 清理旧 Chart 后创建新实例，反复重挂载仍遵守“一 Canvas 一活实例”。safeCount 演示本地 fixture 的数值保护，但真实 API 缺失值不得未经业务确认自动填 0。

## 生产约束

1. Chart.register 依图形类型注册 Controller、Element、Scale 和 Plugin；错误提示“not a registered controller”说明注册不足。
2. new Chart 时持有引用，useEffect cleanup 中 chart.destroy()；否则 React StrictMode 和 Tab 切换后 Canvas 被占用或监听残留。
3. data 更新优先复用实例和 update，而不是每个渲染周期 new Chart。
4. 自适应需要有真实宽高的容器，建议父级 position:relative、明确高度；resize 由库管理，勿叠加无界自定义 ResizeObserver。
5. 大量点应做抽样或按需使用 Decimation；具体容量和时延须在真实浏览器测量。
6. reduce-motion 偏好：默认关闭本例动画，生产如果打开动画需参考系统偏好。
7. Canvas 不具有像 HTML table 一样的语义，提供等价数据表和正确标题。
8. Tooltip 与回调必须避免不可信 HTML 插入，值来自已验证数据结构。

## 五组误用

- 未 register Controller 就 new Chart：补齐类型对应控制器。
- 用空高度容器配 maintainAspectRatio=false：设置真实高度。
- useEffect 无 destroy：卸载和 React StrictMode 后重复占用 Canvas。
- render 中每次 new Chart：数据变化时复用实例并 update。
- 把 Canvas 唯一当成信息来源：提供可访问数据表并避免颜色独占语义。

## 实战组合

Chart.js + TanStack Query：查询与缓存由 Query 管理，Chart 更新只消费有效数据。Chart.js + Zod：先验证 API DTO 再构造数据系列，保持缺失与零值区分。

与 A02 Recharts 的区别：SVG 更接近 DOM，易与 React 组件组合；Canvas 不逐点增加 DOM 元素，但开发者必须明确销毁实例。与 A01 ECharts 比较应记录图形种类、需求和真实性能，而非“所有 Canvas 都更快”的武断结论。

## 练习与验收

练习：加入两个指标与单位轴；模拟包含 NaN/缺项数据的 API，定义真实缺失策略；快速切换柱/线并离开路由，确认不报 Canvas already in use。

本轮SDK/typecheck/build/Chromium均 NOT_RUN；平台统一依赖解析后检查 tree-shaking、卸载/StrictMode 与 canvas 尺寸。官方：
- https://www.chartjs.org/docs/latest/getting-started/integration.html
- https://www.chartjs.org/docs/latest/configuration/responsive.html

许可证 MIT。
