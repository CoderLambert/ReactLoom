# A02 Recharts 工程入口

React声明式SVG业务报表，目标`recharts@3.10.1`、`react-is@19.3.0`与React19.3.0匹配，MIT。当前contentState=recreated，保留研究来源但不继承验收。读取实际examples和verification再迁移。

## 三个真实目标

- basic：sampleRows(7, revision)同时供BarChart、合计和table。初始7柱/7行，首行140、合计1613；点“增加阅读数据”后首行142、合计1648，轮次1。
- business：ComposedChart两柱一线，次数轴count、百分比轴percentage域0–100。Line unit="%"也用于Tooltip；图例只有解释，没有点击筛选。
- advanced：“窗口天数”3–14，14个稳定唯一标签；“显示收藏率”只控制线/右轴/图例，表中保留原始比率。刷新上限1000。重置/停止重进/离开销毁状态。

业务数据是本地确定性fixture，不连接NewsHub/API/模型。没有null、Brush、同步多图、请求或实时流，不能把文档扩展建议当已实现能力。

## 必要迁移和不可删边界

复制example.tsx、chart-policy.ts、styles.css；demo.tsx仅重导出。父容器320px高度、min-width:0，ResponsiveContainer百分比宽高与debounce60保留。该版本使用ResizeObserver并disconnect；debounce实现为尾沿throttle。不改SDK内部SVG，不自行全局清理observer。

rows是图/表/合计的唯一来源；showRate只管视觉系列。标签是稳定身份，数据更新不更换图表key。count/windowDraft分开保留编辑中输入，合法整数立即收敛，blur恢复合法值；revision有限且1000封顶。没有外部请求需清理。

图容器aria-hidden=true，两个Chart均accessibilityLayer=false，防止默认键盘层让隐藏SVG被Tab聚焦。数据通过语义表格/原生控件读取；Tooltip为指针交互，不承诺SDK键盘图表导航或全面读屏验收。Bar/Line isAnimationActive="auto"保留3.10.1的SSR/reduced-motion门禁；不要改成true强开。

## 精确观察点与验证

根a02-workshop有data-level/revision/window/show-rate。a02-status/a02-total、a02-chart、a02-table。实际SDK系列class：a02-reads/a02-saved/a02-rate，右轴a02-percentage-axis；表tbody tr的data-day来自rows.day。控件名保留“增加阅读数据”“窗口天数”“显示收藏率”。

validation/browser-proposal.txt为准备好的真实Playwright源码，由主控接公共e2e执行。它观察真实SVG柱/线/轴、Tooltip、数据表、响应式和卸载；不能用SDK mock、手写伪图或SSR容器代替。4项chart-policy测试仅领域策略。3.10.1真实SSR只输出wrapper，无SVG，相关探查仅记录SDK边界，不当图通过。

## 官方证据与剩余

官方根README固定v3.10.1提交ffb918798051ef040bb7f9922d3850c9c189f39f，原文en，完整8候选无中文；精确path/version/time/hash见official/source-audit.json。官方中文网站GET200无XFO/CSP，未测Lab iframe，unknown；完整头与直达保留。官方README要求react-is匹配已安装React版本。

没有当前正式收据，sdk/build/browser继续NOT_RUN。Node执行/入口类型/格式/metadata日志和六项见local-validation；生产点数性能、触控、屏幕阅读器、IME与SSR hydration未测。公共文件由主控所有，禁止为条目另造宿主或改依赖。
