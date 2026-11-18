# uPlot：用有界列式数据更新一张真实时序图

延迟指标每分钟来一次，错误计数每三分钟来一次。页面要显示趋势，也要在持续采样时丢掉旧点、缩窄面板后重新布局、暂停后停止工作。这里要分别决定：哪些数据保留、怎样对齐、何时更新，以及谁销毁图表。

`uplot@1.6.32`（MIT）是Canvas 2D时序图。适合形态相对简单、可对齐到共同X的数值曲线；复杂图种可比较ECharts，常见图表生态可比较Chart.js。它没有采样服务、数据校验/聚合、动画系统或完整仪表盘。大量数据是否流畅仍要在目标设备测，原文的机器基准不是本例结果。

本例没有HTTP遥测；数据是原创、确定性的本地公式。应用保留每列最多100点，650ms的定时器只模拟推进一个“分钟采样”。**点数上限不等于整个页面的内存上限**：Canvas尺寸、DPR、临时数组和SDK缓存也占内存。

## 从时间到Canvas

| 层 | 本例输入/输出 | 关键调用与责任 |
| --- | --- | --- |
| 时间与数值 | X是Unix秒、严格递增；延迟是ms，错误是次数 | 应用生成数据；Date展示时乘1000 |
| 对齐列 | `[x[], latency[], errors[]]`，各列等长，缺测为null | business用真实`uPlot.join`合并时间轴，应用将对齐产生的undefined转为null |
| series/scales/axes | 第0项对应X；后续series对应Y列；错误数单独scale和右轴 | `createPlotOptions`，不是把次数与ms共用一个单位 |
| 图表实例 | DOM存在后创建Canvas，观察SDK当前data与宽高 | `new uPlot(options, data, host)` |
| 数据、大小、可见性变化 | 更新同一实例 | `setData`、`setSize`、`setSeries` |
| 销毁 | 解绑应用资源并销毁SDK | disconnect、cancelAnimationFrame、clearInterval、destroy |

完整接线见[example.tsx](examples/example.tsx)，配置见[chart-options.ts](examples/chart-options.ts)，数据见[series-data.ts](examples/series-data.ts)。`series[0]`与`data[0]`是X；后面的列不能错位。缺测null不是测得0，TypedArray只存数值，不能直接表达这里的null。

```ts
const data: uPlot.AlignedData = [
  [1792972800, 1792972860], // Unix秒，相差60秒
  [75, null],             // 延迟：第二个点缺测
  [0, 3],                 // 错误：第一个点测得0
]
```

`scales.x.time: true`使用默认时间轴秒单位。`Date.now()`是毫秒，不能原样塞进本例；展示UTC文本用`new Date(x * 1000)`。SDK默认时间轴标签按浏览器本地时区格式化，本例HTML表明确展示UTC，两种显示不改变同一个时间值。没有实现时区切换。

## 实验一：列式输入与同一个实例

工程问题：改变采样数量之后，更新的是原来的图，还是偷偷重建了一张？

1. basic默认28点、两列（X和延迟）。展开“查看真实SDK数据与生命周期观察”，确认`a04-series-json`是实际`plot.data`副本，`a04-plot-stats`记录28点、实际宽高和instance编号。
2. “采样数量”从28改60。图和末五行表格改变，SDK数据变为两列各60项，setData钩子次数增加；instance编号与Canvas节点保持不变。
3. 勾“使用窄面板”，面板目标宽度320px、最多父容器宽度。真实ResizeObserver经rAF合并后调用setSize；实际SDK宽度减少，instance与数据点数不变。小于280px的可用空间由图表自身滚动承接。
4. 取消窄面板后恢复；停止或切换页面将destroy。不是只清空一段提示文字。

`setData(data)`替换整批列，没有“append一点”API。第二参默认true，会重新自动计算scale；本例选择跟随新窗口。保留用户缩放要明确使用`setData(data, false)`并管理跟随状态，否则新点可能在视窗外。本例未实现跟随/缩放模式切换。

尺寸观察使用SDK`setSize`钩子的实际宽高，不把Canvas backing-store像素与CSS宽度混为一谈。图的250px配置高度包含绘图区/轴，不包含可能变化的HTML图例高度。

## 实验二：不同采样频率与两个单位

工程问题：两项指标时间不完全重合时，空位怎样表示，右侧轴对应哪条数据？

1. business的延迟每分钟一个点，错误数每三分钟一个点。真实SDK `uPlot.join([[x1, y1], [x2, y2]])`合并X，应用把未对齐槽位的undefined转成null，得到等长三列。
2. 初始第一点错误数3；第二分钟未采样，所以是null；第四个时间点实际采样为0，必须保留0。检查实际SDK数据和最近五行“缺失”，不能把所有缺失补成0。
3. 橙色错误测点用`errors` scale与右侧“错误数”轴，绿色延迟用默认y/ms轴。稀疏错误列显式显示测点、`spanGaps:false`，没有用连线假装中间时刻也被测量。
4. 取消“显示错误数”，真实`setSeries(2, {show:false})`改变曲线可见性，SDK观察中errorsVisible变false/seriesEvents增加。数据仍是三列，表格仍保留这些数值；再次勾选可恢复，没有重建实例。

join不是输入验证或无限量聚合。调用前要保证原始X数字、唯一、递增，领域层决定重复和缺失语义。本例错误时间轴是延迟时间轴子集，因此合并后仍最多100点；任意几条独立时间轴的并集可能比每条都大，要对合并后的数据重新设预算。

## 实验三：推进、保留100点、暂停和销毁

工程问题：实时更新时，保留多少旧数据？用户要求暂停、页面隐藏或离开时，还有什么在运行？

1. advanced选择100点，记下首末Unix秒、实际SDK instance与setData次数。点击“追加10个采样”，SDK仍100点，每列等长，首末都前移600秒，旧的10点已不在当前快照里，Canvas和instance不变。
2. “追加1个采样”只前移60秒。应用重新生成有界快照后交给setData；不是SDK自动采样、自动淘汰或ring buffer。延迟每17个公式索引有一个null，表示缺测断线。
3. 点击“开始模拟采样”，每650ms推进一步；运行中手动追加按钮disabled。点击“暂停模拟采样”后，数据停止变化。清空增量并重置会先暂停并令shift=0，采样数量保持当前选择。
4. 页面隐藏时即使勾了覆盖也暂停；减少动态偏好下默认暂停，明确勾选覆盖后才可运行。暂停保留用户请求意图，恢复可见且策略允许时重新启动interval。这个策略来自本例，不是uPlot内置功能。
5. 切换Lab tab或停止并卸载后，interval/visibility/media监听、ResizeObserver、待执行rAF和图表实例都清理。SDK真实destroy钩子在旧宿主留下data-uplot-destroyed=true，未来浏览器可持有那个ElementHandle核对；它是本例观察，不是uPlot公开属性。

[stream-policy.ts](examples/stream-policy.ts)只计算允许启动interval的条件。清理采用原有成对路径：observer.disconnect → cancelAnimationFrame → instance.destroy；ref仍指向该实例时才清空。series/axes结构随level改变才重建，数据只setData；旧resize回调核对实例，不能操作已销毁对象。

## 迁到自己的项目

```sh
pnpm add uplot@1.6.32
```

uPlot没有React peer，由effect适配。复制example.tsx、series-data.ts、chart-options.ts、stream-policy.ts、workshop.css，保留相对路径；demo.tsx只是Lab出口。还要保留包内`uplot/dist/uPlot.min.css`导入，否则图例/坐标层布局不完整。

真实数据接入时，应用API client负责signal/错误/预算，领域层先对齐和校验，再传入AlignedData。列等长至少2点、缺测语义、时间单位、合并后点数和业务统计都由应用决定；显示抽样列不能代替原始告警/计费数据。图表实例不充当服务端状态缓存。

这里只限制保留数据，未测FPS、堆内存、Canvas字节或十万点性能；高频场景应评估定长缓冲、按帧批量快照、抽样及目标设备。没有HTTP、PNG/CSV导出、Worker数据处理或插件。表格提供近期可读数值，Canvas不是完整无障碍结果。

## 官方原文与验证边界

固定tag1.6.32解析到官方提交`e995b061e9fc5476a6d862cd2fb2ebc7452ca012`；本地package.json和官方该ref的package.json均1.6.32。实际核对dist/uPlot.d.ts与esm中的join、setData默认reset、setSize、setSeries、destroy及hooks，不从master猜API。

官方根目录仅README.md英文候选，没有中文根README，保存原文10889字节，SHA256 `8fd11454911e4e8db65d53fe9791daec932dd4208d51f07a68c3f3721ad5947b`。版本、固定来源、语言、日期和全部响应头见library.json及official/source-evidence.json。包声明官方仓库兼作主页；GET200但XFO deny和CSP frame-ancestors none明确禁止iframe，状态blocked并保留直达。

- [固定官方原文](https://github.com/leeoniya/uPlot/blob/e995b061e9fc5476a6d862cd2fb2ebc7452ca012/README.md)
- [同版本数据格式/模型](https://github.com/leeoniya/uPlot/blob/e995b061e9fc5476a6d862cd2fb2ebc7452ca012/docs/README.md)
- [同版本类型/API](https://github.com/leeoniya/uPlot/blob/e995b061e9fc5476a6d862cd2fb2ebc7452ca012/dist/uPlot.d.ts)

Node能运行真实join对齐工具，但没有真实document/Canvas。本地SDK3项只证明对齐工具与同源fixture，绘图生命周期不在Node SDK套件中，明确NOT_RUN，没有伪DOM或假context；纯暂停策略4项另外记账。真实图、更新、resize、销毁和移动布局的浏览器覆盖范围见本地证据。局部命令和六项状态见local-validation.md，正式verification三项保持NOT_RUN。
