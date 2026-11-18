# A05 D3 接入与所有权

先读library/guide、实际examples及verification。锁定d3@7.9.0（ISC）、@types/d3@7.4.3；数据为本地固定7天阅读/收藏，没有HTTP、采样服务或历史PASS继承。标准报表可比较其他图表库，D3适合自己定义数据编码和图元。

## 模型与迁移

React创建SVG容器/通用属性，管理控件、表格与selected；D3仅在传入svgRef上设置viewBox并独占内部轴/柱/path/circle。不能让JSX和D3写同一批子节点。另一个合法方案是D3只计算尺度/shape，JSX渲染；不要混成两个写者。

复制example.tsx、chart-policy.ts、chart-geometry.ts、draw-chart.ts、workshop.css；demo.tsx只重导出。fixture和原策略在chart-policy；geometry真实调用scaleBand/scaleLinear/line；draw-chart真实axis与keyed join。SVG Y反向range，nice仅改显示域。band无连续invert，命中直接用datum.day。

## 三目标

basic：7根阅读柱，D3返回尺度/坐标轴与实际DOM属性，指针/表格按钮同步选择；business：阅读/收藏两条真实路径，共用次数轴，阅读圆点命中；advanced：3/5/7天和0..115阈值，按day保留更新节点、移除退出节点，空态/恢复/真实窄容器重绘。

表格保留日期窗口内阈值隐藏项并禁用隐藏行选择；状态明确原选择已不在图中。day在当前fixture唯一，生产须永久唯一ID与有序输入。curveMonotoneX在单调X前提下保持Y单调段，不制造相邻点间新极值；插值仍不是实际采样。

## 清理和观察

更新不清空SVG：真实data(rows,key).join返回enter/update/exit，当前主图元计数来自selection，marks/paths读取绘后属性，domain/range来自真实SDK。选择/resize也会更新，joined不是累计资源指标。

pointerenter.a05命名空间更新/退出/卸载可精确移除；重绘interrupt，卸载才clearChart全子树，ResizeObserver成对disconnect。只操作自有SVG，不清全站DOM或别人的事件。无活动transition/brush/zoom/RAF/网络，不制造相应运行PASS。data-d3-cleaned只是实际clearChart结束标记，不能据此声称逐native资源都已验收。

## 验证

SDK仅真实D3尺度/line算法，不用伪DOM/假SVG；原3策略独立。真实轴、join、节点身份、事件、resize 和清理的 Chromium 覆盖见 local-validation.md。观察点a05-workshop/svg/status/summary/observation及实际.a05-bar/.a05-dot[data-day/data-selected]、.a05-line[data-series]、.a05-x/y-axis。

官方v7.9.0→commit1f8dd3b92960f58726006532c11e9457864513ec，根英语原文754B、无中文候选，精确sha/date/响应见official。官网完整GET200无XFO/CSP，未真实Lab iframe所以unknown。完整六项/日志/实际命令见local-validation；formal sdk/build/browser全NOT_RUN。
