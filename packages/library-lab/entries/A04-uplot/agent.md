# A04 uPlot复用指南

固定uplot1.6.32（MIT），Canvas 2D、无React peer。适合可对齐的时序数值；复杂图种比较ECharts。先读guide、实际examples及verification，不把静态检查当绘图PASS。

## 实际模型

AlignedData=[x[],y1[],y2[]]各列等长；第0项是X，后续series与Y对应。默认time=true输入Unix秒，Date显示乘1000。SDK轴默认本地时区，本例文字表UTC。缺测null不同于测得0；business真实uPlot.join对齐每分钟延迟/每3分钟错误，undefined对齐空位归一成null，错误数独立scale/右轴。

basic：采样28→60实际setData、窄面板实际setSize，Canvas/实例不重建。business：稀疏对齐/两单位/显示错误数走setSeries。advanced：最多100点，追加1/10实际setData，满窗后首末前移60/600秒；650ms只模拟采样，不是网络流或SDK append API。

## 迁移与清理

带走example.tsx、series-data.ts、chart-options.ts、stream-policy.ts、workshop.css，保留包CSS import uplot/dist/uPlot.min.css；demo.tsx是Lab适配。应用拥有数据、保留上限、暂停和错误语义，SDK不自动限制整个页面内存。

结构level变才destroy/new；数据变走setData（默认resetScales=true，本例跟随窗口）。需要保留缩放必须自己设计跟随状态，不可一面false保留一面指望自动出现新点。ResizeObserver+rAF合并，宽度变才setSize；cleanup disconnect/cancelAnimationFrame/destroy并核实例身份。interval、visibilitychange、media change成对清理，后台永远暂停，减少动态仅显式覆盖；保留用户采样请求意图。

actual SDK setData/setSize/setSeries/ready hooks读取plot.data和宽高计数；自建instance编号和data-uplot-destroyed只是观察，不能冒充SDK公开指标或内存基准。每列100点不是总堆内存上限；独立时间轴join并集也可能增长，生产必须管合并后预算。

## 证据与浏览器

真实Node SDK仅join工具3 PASS；真实Canvas构造/setData/setSize/destroy不在Node SDK套件中，Node无document时保持NOT_RUN，禁止伪DOM/canvas。纯stream-policy4项独立，不是SDK证据。完整3目标Playwright提案在validation/browser-proposal.txt，主控接入实际候选。

browser核basic实际数据/同Canvas/resize，business null与0/右轴/setSeries不删数据，advanced100点淘汰/暂停/减少动态/旧宿主destroy钩子。隐藏页面/原生资源逐项解绑仍要实际证据，不能从Canvas消失或纯策略推出。

官方tag1.6.32→commite995b061e9fc5476a6d862cd2fb2ebc7452ca012，根README英文原文10889B/sha8fd11454911e4e8db65d53fe9791daec932dd4208d51f07a68c3f3721ad5947b；根目录无中文候选。官方仓库GET200但XFO deny/CSP frame-ancestors none，blocked而非allowed。完整来源/日期/头及局部命令见official和local-validation；正式sdk/build/browser均NOT_RUN。
