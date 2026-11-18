# Chart.js：业务数据归React，Canvas实例归图表

七天阅读量要同时显示成图和精确表格，更新数据后还要继续点选、缩放布局。Chart.js负责Canvas绘制、坐标轴、命中检测与响应式尺寸；React负责业务数字和选中哪一天。本例直接使用 `chart.js@4.6.1`（MIT），没有react-chartjs-2包装器、新闻接口或远程请求。

适合常见柱线统计且愿意明确管理一个Canvas实例。需要React声明式SVG可比较Recharts；复杂联动、地图等另看ECharts。Canvas没有逐点DOM文本，精确数字、键盘路径和读屏内容必须另外提供；这里的HTML表和图使用同一份数据，不从像素反算数字。

## 先认识四种组件和一个实例

[chart-model.ts](examples/chart-model.ts) 按需导入并注册：

| 类型 | 本例注册 | 用途 |
| --- | --- | --- |
| controller | BarController / LineController | 将dataset组织为柱/线图 |
| element | BarElement / LineElement / PointElement | 绘制实际柱、线与点 |
| scale | CategoryScale / LinearScale | 周一到周日的类别轴、阅读量数值轴 |
| plugin | Legend / Tooltip | 图例与提示 |

这份共同模块支持两类图，因此basic也会加载本例注册的Bar/Line组件；没有把basic另拆成只含Bar的包，也没有测量包体收益。`chart.js/auto`会替你注册所有类型，本例明确列出实际使用项，方便理解模块边界。

数据是7个有限整数，`chartCounts(revision)` 的初值为110、127、144、161、178、195、212，总量1127。每次本地revision增加，七天分别增加3至9，总量增加42。它代表可控fixture，按钮不是接口请求。

```text
React revision → chartCounts → counts ─┬→ HTML表和总量
                                      └→ chart.data → update('none') → Canvas
Canvas命中index / 表格按钮 → selectedDay → setActiveElements → 同一选择反馈
```

labels与data保持同序，这里下标才对应星期；改变排序或过滤时必须同步映射，不把index当永久业务ID。Chart持有用于绘制的副本，不是缓存或业务数据库。

## 最小接入与React所有权

```tsx
useEffect(() => {
  const canvas = canvasRef.current
  const context = canvas?.getContext('2d')
  if (!context) return
  const chart = new Chart(context, createReadingConfig(kind, initialCounts))
  chartRef.current = chart
  return () => {
    chartRef.current = null
    chart.destroy()
  }
}, [kind])
```

上面解释构造/销毁的形状；完整可运行接线见 [example.tsx](examples/example.tsx)。构造只在effect。数据变化复用实例，修改dataset后 `update('none')` 跳过更新动画；类型变化先销毁旧实例再创建。创建时取当前counts，不短暂画回revision0。选中态另行写入新实例，类型切换后继续指向同一天。

SDK注册信息属于模块；实例、Canvas事件、内部尺寸观察属于该Chart；React拥有显式400ms采样和页面/媒体监听。cleanup释放自己持有的Chart和监听，不清其他图表的全局registry。StrictMode可能在开发时多做一次挂载清理，因此观察相对计数和当前chartId，不把“永远只创建一次”当契约。

## 实验一：绘制、Canvas输入和等价表格

打开“注册组件、绘制与选择”，看7根柱和精确数字表。点击第一根柱，状态应变为“周一：110次阅读”；表格周一按钮的aria-pressed与同一选中态一致。用Tab聚焦某天的表格按钮并按Enter，选中反馈和SDK活动元素应指向该天。

展开“查看真实实例和绘制结果”：chartId/type/data/active、尺寸和centers来自真实实例与公开元素方法。centers是Canvas逻辑坐标，不能直接当页面坐标；未来浏览器点击会结合真实DOMRect和尺寸换算。没有用静态坐标或提示文字替代SDK命中检测。

本例自有观察plugin在afterInit/afterUpdate/afterDestroy累计created/destroyed/updates；这些是应用记录的实际SDK回调，不是SDK公开资源计数，也不证明全部原生监听都已释放。图表文字的可读性仍需真实浏览器检查。

## 实验二：更新数字，保留实例

打开“复用实例更新统计”。先记录chartId和data，点击“模拟新增阅读”：周一从110到113，总量从1127到1169，表格与SDK dataset同步。chartId应保持不变，created/destroyed不因这次数字更新改变，updates增加。

真实更新代码是：

```ts
chart.data.datasets[0].data = [...counts]
chart.update('none')
```

只换数组不会自动重新绘制，update才会重新处理尺度和图形。若每次数字更新都new Chart，会增加资源工作并争用同一Canvas；如果忘记先destroy，重建时会报Canvas已被占用。本例没有第二条series、服务端错误或请求重试，不用这些未挂载功能扩张实验。

## 实验三：类型、尺寸和动态采样

打开“类型、尺寸与实例所有权”，先选中某天，再从柱形切成折线：新chartId、真实type=line，旧destroyed与新created各增加，选中index和当前数据保留。

点击“缩窄图表容器”，容器真实宽度变为70%，SDK响应式更新Canvas与坐标，chartId仍相同；“恢复容器宽度”反向变化。“重新测量尺寸”调用当前实例resize，可用于布局恢复后的显式测量。这里只改变容器，不手写Canvas DPR或叠加自己的ResizeObserver。

Chart.js以专用父容器的实际尺寸为依据；[workshop.css](examples/workshop.css) 给它position:relative和310px高度，Canvas独占这个容器。responsive=true、maintainAspectRatio=false。Canvas位图像素受DPR影响，不必与DOMRect逐像素相等；SDK width/height用于逻辑坐标。

自动采样默认关闭。勾选后每400ms增加revision，后台页签、离开advanced或达到10000上界时停止interval。动画始终关闭；系统要求减少动态效果时，先暂停自动变化，用户另勾“允许自动变化”才开始。matchMedia变化监听和visibilitychange随卸载移除；重新打开是新实例。上界限制的是本地revision，始终只有7个数据点，不是长时流数据窗口或性能基准。

## 迁移必要文件和取舍

安装 `chart.js@4.6.1`，复制example.tsx、chart-model.ts、chart-stream-policy.ts、workshop.css，保留相对路径；demo.tsx只是Lab重导出。需要React浏览器环境和2D Canvas。SSR应只在客户端effect创建，不让服务端触碰window/document；不额外引入包装器与同一Canvas争抢所有权。

真实数据接入时先校验有限数，明确缺失值与0；再把同一领域数据映射到表格和dataset。这里没有HTTP、CSV、PNG下载、decimation、跨图联动或大数据承诺。多个图表应各有独立Canvas/实例；同一Chart不能同时归手写effect和包装器管理。图例、tooltip和插件扩展分别按需要注册，不因主包MIT外推素材许可。

## 官方原文与实际证据

`v4.6.1` 是直接指向commit `76d8cf895a7485dc838c90ef37e2bc9d9e388fcb` 的官方tag，该处package.json声明4.6.1。完整tree仅根README.md，无官方中文候选；保留英语 [原文快照](official/readme.md) 与 [固定出处](https://github.com/chartjs/Chart.js/blob/76d8cf895a7485dc838c90ef37e2bc9d9e388fcb/README.md)。原文2605字节，SHA-256 `30418232ad2cc5a51fa0938e12dc97e31cfd1fb3b0bc352132f281c0c10da348`，日期和完整来源见 [source-evidence](official/source-evidence.json)。

[集成/注册](https://www.chartjs.org/docs/latest/getting-started/integration.html)、[响应式](https://www.chartjs.org/docs/latest/configuration/responsive.html)、[实例API](https://www.chartjs.org/docs/latest/developers/api.html)与本地4.6.1类型/实现共同核对。官网GET200完整头无XFO/CSP，未从Lab origin实际嵌入，保持unknown和直达；不把README raw响应的deny头混成官网策略。

本轮Node SDK使用已锁定、已安装的原生Canvas生成了初始柱图、更新柱图和重建折线PNG，真实验证update/active/hit/resize/destroy；Node没有DOM事件或CSS响应式。原生fixture没有中文字体fallback，图中文字方框不证明浏览器文字可用。策略测试只核对fixture和采样门闩。真实浏览器每目标提案、命令/退出码/日志/实际PNG摘要和六项状态见 [local-validation](local-validation.md)，formal verification保持NOT_RUN。
