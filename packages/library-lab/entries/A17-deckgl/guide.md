# A17 deck.gl 9.4.0：独立 Deck、ScatterplotLayer 与 finalize

deck.gl 把地理点画成 GPU 图层。它不负责底图街道，也不替代 Three 的自由场景图。少量弹窗用 Leaflet。矢量底图用 MapLibre，再决定要不要叠加 deck。统计报表用 ECharts。可编辑流程用 React Flow。

Library Lab 钉 `@deck.gl/core@9.4.0` 和 `@deck.gl/layers@9.4.0`，MIT。没有 `@deck.gl/react`，也没有 `@deck.gl/maplibre`。示例是命令式 `new Deck`，不是 `<DeckGL>`。WebGPU 在这条版本线上仍是实验能力，生产路径用 WebGL2。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。尺寸在 `examples/deck-size.ts`。

已挂载：

- 先建一个探测 canvas，要 `webgl2`。没有就停在错误文案，表格仍在。探测会占用真实上下文，所以在创建 Deck 之前调用 `WEBGL_lose_context.loseContext()` 把它释放掉。
- `new Deck({ parent, width, height, initialViewState, controller: true, layers, getTooltip, onClick, onError })`。视点经度 116.1、纬度 39、缩放 6，俯仰和方位为 0。容器高 330，`position: relative`。
- 图层 id 固定为 `library-sites`。`getPosition` 返回 `position`，fixture 写成 `[longitude, latitude]`。半径单位是 **像素**：`radiusUnits: 'pixels'`，并夹在 4..28。颜色按 `healthy` 分支。`updateTriggers.getRadius` 依赖半径倍数。`pickable: true`。
- 数据变化和半径变化只 `deck.setProps({ layers })`，不新建 Deck。
- basic 两个城市。business 四个：北京、天津、石家庄、太原。advanced 可再拼 1200 个确定性局部点，经度纬度落在华北附近的公式范围内，没有放到南北极。
- `ResizeObserver` 加 rAF。`measuredDeckSize` 拒绝非正尺寸，并把宽高封顶 4096，避免要一块巨大的帧缓冲。尺寸没变不 `setProps`。
- 卸载 `deck.finalize()`，不是仅仅把 canvas 隐藏。观察者和 rAF 一起收。
- 提示用 `getTooltip` 返回名称字符串，不写 HTML。表格只渲染 `visible.slice(0, 12)`，标题写明这是选定子集。1200 点打开时，其余点没有逐行按钮。

没有挂上：MapLibre 底图、`MapLibreOverlay`、ArcLayer、十六进制聚合、按选中 id 改变填充色的 `updateTriggers`、服务端分页。研究稿里「高密度 HTML 每页 100 条、可翻页」也没有做。当前表是前 12 行的窗口，不能称为已分页的全量明细。

## 从数据到 GPU

1. React 拥有 id、`[lng, lat]`、健康和 volume。先拒绝 NaN、Infinity、越界和重复 id，再交给图层。
2. `ScatterplotLayer` 是描述符，不是 DOM。相同 `id` 可以复用 GPU 状态。每次随机换 id 等于删掉旧层再分配。
3. `data` 引用变了会重算属性。只改选中 id、accessor 闭包变了，就要 `updateTriggers: { getFillColor: [selectedId] }`。触发器不是深比较，也不能代替换新数组。Lab 的半径倍数走 `getRadius` 的触发器；选中高亮没有画进颜色，选中只存在于 React 文案和 `aria-pressed`。
4. `pickable` 会多一次拾取绘制。点很多时先用表格或聚合，不要对全部要素开富 tooltip。Lab 在 1200 点时仍然 pickable，这是教学缺口，不是推荐的生产阈值。
5. 独立 Deck 自己管相机，因为 `controller: true`。一旦改成 MapLibre 叠加，相机只能有一个主人。

```js
new ScatterplotLayer({
  id: 'library-sites',
  data: rows,
  pickable: true,
  radiusUnits: 'pixels',
  getPosition: (row) => row.position, // [longitude, latitude]
  getRadius: (row) => Math.max(5, Math.sqrt(row.volume) * size),
  updateTriggers: { getRadius: size },
});
```

研究稿曾用米制半径（数千米）。那和像素半径不是同一套尺度。迁回地理底图时要改 `radiusUnits` 并重新看缩放级别，不能假设现在的 4..28 像素仍然合适。

## 三层

### 01 拾取

两个点。点击图层把 id 写入 `picked`，表格按钮做同样的事。tooltip 是名称。没有底图时仍能看到色点，因为 Deck 自己清屏。

### 02 健康过滤

四个站。勾选后只把健康点放进新的 `data` 数组。不要原地改对象又复用同一数组引用，否则图层可能认为没有变化。

### 03 一千二百个点

勾选追加本地样本，重置会关掉密度、过滤和半径。`finalize` 在离开时释放。状态行报告可见数量；表仍只有 12 行。生产要补客户端或服务端分页，并在总数变化时用 `role="status"` 播报，而不是只靠颜色。

顶点字节估算（每行若干 float32）只说明属性缓冲的量级，不含索引、纹理、CPU 副本和驱动额外占用。不要把它写成显存峰值。本文件没有帧时间。

## 与 MapLibre 叠加时的所有权

这部分 **没有** 出现在 `example.tsx`，但是 9.4 与 MapLibre 6 组合时最容易出错的合约：

- 地图由 MapLibre 创建。`map.once('load')` 之后 `addControl(new MapLibreOverlay({ interleaved: false, layers }))`。
- 之后只 `overlay.setProps({ layers })`。不要把 `controller` 或 `initialViewState` 再交给 overlay，否则和地图相机打架。
- `interleaved` 在构造时决定，不能当成运行时 `setProps` 开关。交错需要 WebGL2。要切换模式就移除控件再创建。
- 卸载顺序是 `removeControl` 再 `map.remove()`。加载回调里用存活标志，避免卸载后仍 `addControl`。
- 两个独立 canvas 叠在一起不是共享 GPU 上下文。视域、拾取和 resize 都要明确谁处理。

底图若仍是空样式，看不到路是正常的。接上真实 style 后，署名和服务条款一起接上。不要预抓公共 OSM 瓦片。

南北极附近的 Web Mercator 不能当普通平面点来投影。生成或导入数据时要拒绝无法投影的纬度，而不是把点改到别的城市冒充成功。Lab 的样本公式停在中纬度，没有做极地用例。

## 请求竞态

只在「下一次请求开始」时 abort，盖不住另一种情况：用户已经切换过滤条件，但新的请求还没发出，旧请求仍成功返回并写进当前筛选。加载器需要能 `cancel()`：递增序号、中止信号、并且即使 fetcher 忽略信号也不调用成功回调。`cancel` 与永久 `dispose` 不同，取消后还可以再请求。Lab 没有网络层，过滤是同步的。

## 反例

```tsx
useEffect(() => {
  const deck = new Deck({ parent: node, layers: [new ScatterplotLayer({ id: Math.random().toString(), data })] });
  return () => { node.hidden = true; }; // 错：没 finalize，id 还在变
}, [data]);
```

| 错误 | 正确 |
|---|---|
| 每次 render `new Deck` | 一次构造，`setProps`，卸载 `finalize`。React 包装用 `<DeckGL>` 时不要再手写一份 |
| 随机 layer id | 稳定 id。Lab 用 `library-sites` |
| 原地改 data 且引用不变 | 新数组。需要时再用专门的 diff API |
| 选中色变了但没有 trigger | `updateTriggers`。Lab 没把选中画进颜色，所以不依赖这条 |
| `[lat, lng]` | `[lng, lat]`，并用已知城市做断言 |
| NaN 进属性 | 边界拒绝，UI 可见 |
| 两万点全开 picking 和复杂 tooltip | 按设备关 picking 或改聚合。Lab 的 1200 仍开启，是缺口 |
| Overlay 再设 controller | 只传 layers 和 interleaved |
| `load` 之前或多次 addControl | `once` + 存活标志 + 对称移除 |
| 把交错模式当 setProps | 重建控件 |
| 截图像数据导出 | 导出权威数组；底图另审版权 |
| 假设 WebGPU 已可上线 | 9.4 生产用 WebGL2 |
| 高密度仍只画 12 行就当可访问 | 分页或服务端窗口，播报总数 |

## 故障排查

空白：容器高度、WebGL2、视点是否在数据附近、半径是否小到看不见、`onError` 文本。跳帧：layer id 是否在变、每次按键是否重造上万行、picking 是否多余、旧 Deck 是否还在。tooltip 出现 HTML：改回纯字符串。过滤后旧点闪回：缺请求序号。极地点飞走：投影范围，不要改写原始坐标来“修好”。

## 安全与无障碍

图层 accessor 不是授权。名称用文本节点。地理坐标可能敏感，采集要最小化。大文件要有字节和要素预算。

键盘路径是表内按钮和 `aria-pressed`。错误用 `role="alert"`，数量用 `role="status"`。不要只靠绿和橙区分健康。12 行窗口必须在文案里说清楚，否则读屏用户会以为只有这些点。移动端、输入法和减少动态都还要浏览器复测。Deck 的相机拖拽会和页面滚动冲突，容器需要明确的手势边界。

## 组合

**deck.gl + MapLibre。** 见上一节所有权。Lab 未实现，不能标成已集成。

**deck.gl + TanStack Query + Zod。** 缓存键包含区域和时间，`signal` 取消，Zod 收坐标。不要改 Query 缓存里的对象。未安装。

**deck.gl + D3 + ExcelJS。** D3 做色标，Excel 从同一数组生成，不从帧缓冲反读。色标变化写入 `updateTriggers`。未安装。

## 选型

| 任务 | 优先 |
|---|---|
| 几个点和弹窗 | Leaflet |
| 矢量底图和地名 | MapLibre |
| 报表 | ECharts |
| 流程编辑 | React Flow |
| 自定义 SVG | D3 |
| 大量地理点、弧线、密度 | deck.gl |
| 任意三维材质 | Three / R3F |

## 生产清单

1. WebGL2 探测失败时保留表格，并释放探测上下文。
2. Deck 只构造一次，`finalize` 成对。
3. layer id 稳定，数据用新引用。
4. 坐标经度在前，半径单位写明。
5. 尺寸非正不 resize，尺寸有上界。
6. tooltip 为纯文本。
7. 高密度列表要分页；当前 12 行不是全量。
8. picking 成本随规模重新评估。
9. 与 MapLibre 组合时相机只有一个所有者。
10. 不把估算字节或仓库级 CI 当成显存和 FPS。

## 升级与练习

加三个已知城市，再故意传入纬经反序，测试应失败在适配层而不是画到错误大洲。选中色若要上 GPU，补 `updateTriggers` 并看属性是否重算。

Mock 增加 422 和分页游标，失败保留旧数据，连续改过滤只有最后一次能写回。2000、20000 记录帧时间和卸载后的上下文数量；超过预算的 100000 应拒绝。数字来自这次运行的机器，不从本指南抄。

接底图时核对 attribution。用小数据对比 overlaid 与 interleaved 的层顺序和卸载。极地样本应显示「不可投影」，而不是被改成 0 纬度。

## 官方链接

- [独立使用](https://deck.gl/docs/get-started/using-standalone)
- [Deck 与 finalize](https://deck.gl/docs/api-reference/core/deck)
- [ScatterplotLayer](https://deck.gl/docs/api-reference/layers/scatterplot-layer)
- [与 React 一起用](https://deck.gl/docs/get-started/using-with-react)
- [MapLibre 叠加](https://deck.gl/docs/api-reference/maplibre/overview)
- [图层生命周期](https://deck.gl/docs/developer-guide/custom-layers/layer-lifecycle)
- [性能](https://deck.gl/docs/developer-guide/performance)
- [拾取](https://deck.gl/docs/developer-guide/interactivity)
- [仓库](https://github.com/visgl/deck.gl)

## 尺寸与探测上下文

`measuredDeckSize` 对非有限或非正的宽高返回 null。合法值向上取整并限制在 1..4096。`needsDeckResize` 在下一尺寸为 null 或与当前宽高都相同的时候返回 false，类型谓词让调用处知道 `nextSize` 已收窄。隐藏的懒加载容器经常先报 0，这时不能 `setProps`，否则会申请一块无意义的帧缓冲。

探测 canvas 的上下文必须先丢掉。Deck 再要一个 WebGL2 上下文时，浏览器对上下文数量有限，留下探测上下文会导致正式 Deck 初始化失败，而错误被误写成「此机没有 WebGL」。`loseContext` 只作用于那块临时 canvas。

1200 个样本的坐标来自固定模运算，范围在华北附近，便于和四个城市放在同一视点里。它不是全国抽样，也没有覆盖纬度接近 ±90 的点。表格 `slice(0, 12)` 是阅读窗口。状态行里的「可见点」才是图层数据长度，两者故意不相等，文档和 UI 都要保持这个差别。

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`measuredDeckSize` 与 `needsDeckResize` 只证明尺寸夹取。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A17 的 PASS，不要写入 `verification.json`。研究稿里的 HTTP 用例和后续修订同样不是本仓库的 SDK 验收。
