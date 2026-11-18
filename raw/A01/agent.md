# A01 ECharts：复用与验证

## 适用与核心模型

桌面业务报表需要多系列、共享坐标轴、提示和命令式更新时使用；React组件式简单SVG可比较A02，密集时序用真实数据对比A04。版本echarts6.1.0，Apache-2.0；地图、字体和第三方数据另核许可。

React values是业务数据源；reading-option.ts把同一组七日指标映射为xAxis类目、yAxis数值、series；实例保存ref，setOption更新，数据表/合计直接读values。不从getOption重建业务状态，不在每次tick重新init。模块顶层use注册实际图表/组件/唯一renderer。

## 迁移

复制examples/example.tsx、reading-option.ts、stream-policy.ts、workshop.css，保持相对导入，安装echarts@6.1.0。调用默认组件level=basic/business/advanced；demo.tsx只是Lab适配。确保容器有真实宽度和300px高度；SSR只在客户端初始化。根据应用路由动态导入，按需模块不等于已有体积/性能基准。

basic修改周一+5并验证option/图/表/合计同源；business移除/恢复previous-reads，并同步表行；advanced保留1200ms轮流+3、120次上限和尺寸/清理边界。数据和周期生成均为原创本地业务逻辑，非远程实时服务。

## 不能删的所有权

ResizeObserver断开、rAF取消、click handler以相同引用off、chart.dispose并清ref；IntersectionObserver、matchMedia和visibilitychange监听分别清理。实例不能跨DOM共享。每次数据更新仅setOption；图表实例id在更新和resize时保持不变。

live是用户意图，playbackActive由advanced/可见/视口内/未耗尽/动态偏好共同决定。隐藏或离屏停止interval，重回可见且意图仍在时恢复；allowMotion仅覆盖减少动态。复位同时清tick ref、count ref和state。dispose不取消外部网络订阅。

本例完整option以notMerge:true/lazyUpdate:true应用，删除系列不残留，但图例等内部状态会重置。不能改成默认合并后仍声称旧series自动删除；若迁到replaceMerge，需要验证自己的交互状态。未使用dataset/encode/dataZoom；SDK套件用SVG SSR，Demo用Canvas，两者边界分开。

## 断言与证据

- basic初始周一12/合计158；+5后17/163，a01-option同步，data-instance-id不变；表格按钮触发真实showTip和最近点击文本。
- business默认两系列current-reads/previous-reads，两表行；取消显示上周对照后只剩current-reads且上周表行消失；恢复后重现，不重建实例。
- advanced实际1200ms tick；减少动态、隐藏、离屏均暂停；用户允许动态不能覆盖隐藏；达到120次停止，复位清全部计数。缩小容器至65%时a01-chart-size显示getWidth变化，height仍300，实例不变。
- 离开Demo/停止时Canvas与监听/Observer/interval应释放；重新进入不累积旧实例。不能单凭DOM消失推断dispose或interval归零，应做对应浏览器观测。
- tests/sdk.test.mjs实际import echarts，消费同源reading-option并用SVG SSR验证轴/系列/更新/移除/resize/dispose；stream-policy测试不执行SDK。两层与真实浏览器分别报告。

未测Canvas、tooltip、可见性和读屏时，不从Node SSR或类型检查推出browser PASS；正式verification遵循当前收据。官方英文README固定6.1.0提交c5a48f5f97d23e5379720870b8444cd05b50ffb4，中文主README未提供；中文官网明确sameorigin/frame-ancestors self而blocked，保留直达。详见local-validation.md。
