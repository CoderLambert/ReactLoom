# A15 Leaflet 1.9.4：无瓦片地图、图层和经纬度

Leaflet 适合少量点、弹窗和 DOM/SVG 覆盖物。它不是 WebGL 引擎。矢量瓦片和数据驱动样式看 A16。上万 GPU 点看 A17。没有真实地理底图时，不要把示意网格说成行政区划。

Library Lab 钉 `leaflet@1.9.4`，BSD-2-Clause。库的许可证不包含任何瓦片、影像或地名数据。当前示例不加载 `L.tileLayer`，也不请求地图服务。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。策略在 `examples/location-policy.ts` 和 `examples/station-factory.ts`。样式引入 `leaflet/dist/leaflet.css`。

已挂载：

- `L.map` 在 effect 里创建一次：`scrollWheelZoom: false`、`zoomControl: true`、`keyboard: true`、`attributionControl: false`。没有第三方署名是因为没有第三方图层。视图中心 `[39.5, -98]`，缩放 4。容器高 310，可聚焦。
- 经线纬线用 `L.polyline` 画在地图上，颜色很浅，`interactive: false`。这是教学网格，不是底图。
- 业务点放在 `L.layerGroup`。可见集合变化时 `clearLayers()` 再重建 `circleMarker` 和一条虚线。选中半径 12，其余 8。在线填充绿，暂停填充棕。
- 弹窗内容是 `document.createElement` 加 `textContent`，不是 HTML 字符串。
- 点击圆点或表格「地图定位」选中。定位用 `panTo(..., { animate: false })`，避免和减少动态偏好冲突。重置用 `setView`。
- `onlyOnline` 为真时暂停点不进图层，也不进表。`selectedVisibleId` 保证选中项仍可见，否则落到第一个可见 id。
- advanced：Seattle 每次纬度经度加 0.25，并夹在纬度 ±85、经度 ±180。新增「备用源」最多 40 个额外点（id 匹配 `site-N`），坐标在芝加哥附近按序号错开。删除当前选中。
- `ResizeObserver` 加 rAF 调用 `invalidateSize({ pan: false })`。cleanup 断开观察者、`clearLayers`、`map.remove()`。重复 `L.map` 同一节点会报容器已初始化，所以必须 remove。

没有挂上：瓦片、默认 Marker 图标、`moveend` 查询、日期变更线 bbox、HTTP 503、输入法防抖、`preferCanvas`。`circleMarker` 是 Path，可以用 SVG 或 Canvas 渲染器；普通 `L.marker` 即使用 `preferCanvas` 仍是 DOM 图标。Lab 选择 circleMarker，避免默认图标在打包器里 404，也避免把「开了 preferCanvas」误当成海量点优化。

坐标顺序是 Leaflet 的 `[latitude, longitude]`。GeoJSON 和 MapLibre 是 `[longitude, latitude]`。不要把同一数组直接传给两个库。

## 生命周期

```text
ref 就绪 -> L.map 一次
ResizeObserver -> invalidateSize
items / filter -> group.clearLayers + circleMarker
卸载 -> clearLayers + map.remove
```

`map.on` 若加上，`off` 必须是同一个函数引用。Lab 的点事件绑在 marker 上，清图层时一起走。隐藏面板再显示时要 `invalidateSize`，不能只靠 `window.resize`。

Leaflet 没有 Three 那种几何 dispose。它占 DOM、图片缓存和可选的 Canvas。`map.remove()` 是释放入口。

## 三层

### 01 三个城市

西雅图、旧金山、纽约。纽约初始为暂停，但仍显示，因为 basic 没有「仅在线」开关。表里有坐标和定位按钮。

### 02 筛选

勾选后暂停点消失，选中状态被纠正。筛选不会 `fitBounds`，避免用户平移后被弹回，也避免和 `moveend` 打成环。研究稿强调这一点；Lab 没有 moveend，但重置按钮是唯一的全图 `setView`。

### 03 更新与清理

移动 Seattle、加点和删除都只改 React 数组，再投影到图层。40 是额外点上限，不是 Leaflet 的性能基准。离开页面会拆地图。不向任何地理服务发送坐标。

生产查询若按视域过滤，`getBounds()` 在跨日期变更线时 `west > east`。判断应是 `lng >= west || lng <= east`，不能当成非法区间丢掉斐济附近的点。Lab 的点都在美国西部到东部的普通范围内，没有这条数据。

## 反例

```tsx
// 错：render 里初始化，StrictMode 第二次就炸
function Bad() {
  const ref = useRef<HTMLDivElement>(null);
  if (ref.current) L.map(ref.current);
  return <div ref={ref} />;
}

// 错：把用户名拼进 HTML
marker.bindPopup(`<strong>${name}</strong>`);

// 对：effect 一次，弹窗用 textContent
const popup = document.createElement('div');
const heading = document.createElement('strong');
heading.textContent = name;
popup.append(heading);
marker.bindPopup(popup);
```

| 错误 | 正确 |
|---|---|
| 每次筛选 `clearLayers` 又希望弹窗状态保持 | 少量点可以重建；大量点用 `Map<id, Layer>` 增量更新。Lab 选择重建，点数很小 |
| 容器没有高度 | 明确 height。Lab 310 |
| GeoJSON `[lng,lat]` 传给 `L.marker` | 适配层换成 `[lat,lng]` 并检查范围 |
| `preferCanvas` 当海量 Marker 开关 | Marker 仍是 DOM。改聚合、circleMarker 或 deck.gl |
| 只 abort 不挡迟到响应 | 序号。取消不是正确性的全部 |
| 把跨 180° 的框当成空 | 分开环绕区间 |
| 用公益 OSM 瓦片做批量预抓 | 离线网格或有授权的服务，并保留对方要求的署名 |
| 筛选就 `fitBounds` | 只在用户要求「定位全部」时移动 |
| 悬停是唯一信息 | 表格按钮。Lab 已有 |
| SSR 顶层 `L.map` | 动态导入 + effect |

## 性能与合规

服务端若只返回最多 250 条，`total` 是总数不是已画数量。这个帽是应用策略。一万个 DOM Marker 应先聚类或改 GPU，并用目标设备记录滑动和内存。Lab 不做该实验，也不编造数字。

不要把令牌放进瓦片 URL。弹窗文本不可信。UI 上的城市是教学点，不是对真实机构位置的断言。

`flyTo` 一类动画在减少动态时应改成 `setView` / `panTo` 的非动画形式。Lab 的定位已经关掉动画。

导出业务数据用 GeoJSON（`[lng,lat]`），不要把截图当成数据，也不要假设瓦片允许离线再分发。

## 组合

**Leaflet + TanStack Query + 表单。** 查询键包含关键词、分类和 bbox。`moveend` 要节流，不要在 `move` 每帧请求。地图只消费结果。Lab 未装 Query。

**Leaflet + ECharts。** 地图发出范围，图表 `setOption` / `resize` / `dispose` 自己的实例。汇总不要泄漏敏感单点。

少量点不要为了「现代」叠 deck.gl。投影和事件会变成两套。

`react-leaflet@5` 可以在 React 19 下做声明式 MapContainer。它和手写 `L.map` 不要同时拥有节点。`MapContainer` 的许多参数只在初次生效。这是迁移练习，本条目没有该依赖。

## 生产清单

1. `L.map` 一次，`map.remove` 成对。
2. CSS 和高度齐全。
3. 没有瓦片就不显示假的 OSM 署名，也不要偷偷请求瓦片。
4. 弹窗用 DOM 文本节点。
5. `[lat, lng]` 与 GeoJSON 顺序转换显式存在。
6. 筛选不强制 fitBounds。
7. 选中项必须属于可见集合。
8. 坐标夹取到有限范围。
9. 容器尺寸变化 `invalidateSize`。
10. 键盘和表格与圆点同一份数据。

## 升级与练习

从 `L.map('id')` 迁到 ref effect，确认 StrictMode 不报 already initialized。把 fixture 改成 GeoJSON 后再转 Leaflet 顺序，过滤与表格一致。

5000 点比较 DOM Marker、circleMarker 和聚合，记录浏览器和内存，不引用未跑的 FPS。接入瓦片时核对服务条款和署名，断网时仍能看到网格或空态，而不是死循环重试。

评估 react-leaflet 时单列：初始参数、点击、弹窗文本和卸载。不要两套 Map 叠在一个 div 上。

## 故障排查

只有控件没有线：高度或 CSS 没进来。容器已初始化：cleanup 没有 `remove`。默认图标 404：打包器没处理图片；本示例改用 circleMarker 避开它。弹窗不出现：图层被清掉后没有重建。平移后尺寸错：显示面板后没有 `invalidateSize`。点跑到错误半球：经纬度写反。

## 官方链接

- [API 1.9](https://leafletjs.com/reference.html)
- [快速开始](https://leafletjs.com/examples/quick-start/)
- [npm leaflet](https://www.npmjs.com/package/leaflet)

## 可见选中与坐标夹取

`selectedVisibleId` 先按 `onlyOnline` 过滤。首选 id 还在就保持，否则用可见列表的第一项，列表空则是空串。effect 发现 state 与这个结果不同就 `setSelected`，避免表格高亮一个已经不在地图上的点。删除当前点之后用同一函数在剩余数组上重算。

`shiftLocation` 只动指定 id。增量或当前纬度不是有限数时原样返回拷贝。新纬度夹在 -85..85，新经度夹在 -180..180。这是演示用的世界范围，不是测量精度，也不是把 Web Mercator 的极地空洞「修」掉。`makeLocalLocation` 要求正的安全整数，序号超出额外名额时仍生成 id，但 `canAddLocalLocation` 会拒绝已经有 40 个 `site-N` 的数组。按钮在拒绝时不 `setItems`。

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`location-policy` 和 `station-factory` 只证明选中回落、坐标夹取和 40 个额外点。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A15 的 PASS，不要写入 `verification.json`。
