# Leaflet：让地点、图层和相机各自更新

一个来源面板有三个教学地点：Seattle、San Francisco、New York。地图需要把坐标投影为可点击的点，筛掉暂停来源后保留其他点，移动地点时更新覆盖物。Leaflet 提供地图视口、投影、图层及 DOM 弹窗；它不提供来源数据、地理编码、瓦片授权或服务端权限。

这类少量点与 HTML/SVG 覆盖物适合 Leaflet。矢量瓦片和数据驱动样式可看 MapLibre，GPU 大规模点层可看 deck.gl；三个点不能证明海量地图性能。本例固定 `leaflet@1.9.4`，类型包 `@types/leaflet@1.9.22`，二者版本号不同。Leaflet 是 BSD-2-Clause，地图素材另看提供者许可。

## 不请求底图也有真实地图

背景是本例用 polyline 画的经纬网格，不是行政地图。没有 tileLayer、地理编码或定位服务，城市坐标是原创确定性 fixture，不代表真实机构位置。地图代码仍真实运行 Map、LayerGroup、CircleMarker、投影、键盘和弹窗；无瓦片不等于用静态图片替代地图。首次加载应用本身仍需要本地站点提供 JS/CSS，不承诺离线缓存或冷启动离线可用。

React 保存地点数组、过滤条件和选中 id；`map-controller.ts` 独占创建的 Map 容器及其图层。它以业务 id 保存 CircleMarker，数据更新时复用仍可见的对象。表格是同源数据的等价操作入口，SVG 点不是唯一获取精确坐标的方法。

```text
本地地点数组 → 可见集合 → id到CircleMarker → Leaflet投影/弹窗
                 ↑              ↓
             过滤/选中       React selected
相机是另一份状态：初始适配，或用户明确定位/平移/缩放
```

## 最小接入：坐标有顺序，半径有单位

在挂载后的 HTML 容器上创建地图，并引入 Leaflet CSS。容器必须有实际高度；无瓦片时也要设定视图，否则不能投影图层。

```ts
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const map = L.map(container, {
  scrollWheelZoom: false,
  attributionControl: false, // 仅因本例没有第三方图层
}).setView([39.5, -98], 4, { animate: false });
const sources = L.layerGroup().addTo(map);
const point = L.circleMarker([47.6062, -122.3321], { radius: 8 })
  .addTo(sources);
// 页面卸载：清自己的监听/观察器，然后 map.remove()
```

Leaflet 的数组是 `[纬度, 经度]`，GeoJSON Point 是 `[经度, 纬度]`。两库之间不能原样传数组。CircleMarker 的 radius 以像素为单位；Circle 的地理半径才以米计。缩放改变点的屏幕位置，不自动把 8px 变成地理覆盖半径。

上面只说明接入顺序；本页完整源码还管理稳定身份、事件、ResizeObserver、rAF 与卸载。复制片段时不能省掉对应所有权。

## 目标一：坐标经过投影，进入真实视口

打开「经纬度、覆盖物与真实视口」。初始适配三个点，绿色表示启用，棕色表示暂停。点击 San Francisco 点，应看到“产品更新”弹窗；点选只调整半径/样式，弹窗继续存在。展开「查看真实地图与图层结果」，比较实际 getter 返回的 `latlng`、`geojsonCoordinates`、`containerPoint`、`radius`、`center/zoom/size`。

`latlng` 来自 CircleMarker.getLatLng，GeoJSON 坐标来自实际 toGeoJSON；`containerPoint` 来自 map.latLngToContainerPoint，是相对地图容器的像素，不能直接当页面 client 坐标。缩放按钮或聚焦地图后按 `+`/方向键，预期视口改变而点的经纬度保持不变。滚轮缩放关闭，保留正常页面滚动。

用 Tab/Enter 操作“定位 行业资讯”，应选中 New York、用非动画 panTo 定位并打开弹窗。选中点半径12，其余8，是本例业务高亮，不是 Leaflet 内建选中状态。弹窗使用 createElement/textContent，地点字符串不拼成 HTML。

## 目标二：筛选不重建整张地图

打开「过滤、稳定图层与安全弹窗」。先定位暂停的行业资讯，再勾“仅显示已启用来源”：图和表从3项变2项，选中回落为仍可见的技术 RSS。相机留在用户刚才的位置，不因过滤强制 fitBounds。需要重新查看全体时，点“定位全部可见点”；“重置视角”恢复本例固定美国区域中心和zoom4。

观察两个仍可见点的 `layerId`，它们在筛选前后保持一致；这来自 LayerGroup.getLayerId。退出点解绑本例click、关闭弹窗、unbindPopup、removeLayer；重新显示该退出点会新建图层，不承诺它保留旧身份。关闭要先于unbind，否则1.9.4会先解除remove监听而留下已打开的弹窗。选择和坐标更新没有整组 clearLayers，因此点选不会销毁刚打开的弹窗。

```ts
// 本例以 Map<业务id, MarkerRecord> 保存对象
marker.setLatLng(nextCoordinate);       // 位置变化，复用原覆盖物
marker.setRadius(selected ? 12 : 8);     // 像素半径
marker.setStyle({ fillColor: '#5db47b' });
// 对退出项才执行：off本例click、unbindPopup、group.removeLayer(marker)
```

这套 id 映射是应用同步逻辑，不是 Leaflet 自带数据仓库。输入应保证唯一 id、有限坐标、合法状态。表格/高亮/地图来自同一可见集合；过滤后选中项不存在时按原策略落到第一可见项，空集则无选择。没有远程查询、服务器修订或真实“在线”探测。

## 目标三：有界增删、尺寸变化与释放

打开「有界更新、尺寸与地图所有权」。“模拟更新Seattle坐标”将两个坐标各加0.25，实际 setLatLng 更新已有点，layerId保持。纬度夹取±85、经度±180是本例策略，不是 Leaflet 自动校验；非有限增量或目标坐标不参与计算。

“新增模拟来源”在 Chicago 附近生成 site-N，最多同时40个额外点，初始3个普通点不占额外名额。删除恢复容量，再新增使用新序号而不复用已删除业务id。40是本地应用上限，不是性能测量。可仅显示启用来源后删除两初始启用点，观察空态、无选择和禁用定位全部；取消过滤可恢复仍存在的暂停点。

勾“使用窄容器”，预期地图内容宽度随最多320CSS px容器变化。ResizeObserver 合并到rAF后调用 `invalidateSize({ pan:false, animate:false })`，实际 size/resizeEvents随之更新；它不会自动缩放到全体点。需要时再显式定位全部。无有效尺寸时等待，不把逻辑坐标冒充浏览器像素。

“重新创建地图”保留当前地点数组，销毁旧实例并在新的专属容器创建 Map。实际 remove 会发 unload、解绑地图内部处理器并清空图层/面板；本例还精确 off 自己的地图/点事件、unbindPopup、disconnect观察器、取消rAF。旧容器只在 remove返回后写自建 `data-map-removed`，同时记录实际 unload事件，随后分离DOM。它不是SDK公开 removed属性，也不单独证明每个原生监听计数。

关闭zoom动画、tile淡入、marker缩放动画和惯性；定位API显式非动画。Leaflet原生键盘平移仍可能有短暂pan过渡，不宣称所有用户操作零动画或已经通过减少动态验收。remove负责停止SDK中的当前运动，没有自建持续timer或GPS监听。

## 迁移与边界

复制七个sourceFiles：demo.tsx、example.tsx、location-data.ts、map-controller.ts、location-policy.ts、station-factory.ts、workshop.css。demo只重导出实际组件；其余无Lab alias或运行器依赖。需要React浏览器、Leaflet运行包和相应类型、DOM/SVG/ResizeObserver；引入依赖自带 leaflet/dist/leaflet.css，由正常打包器解析其包内图片路径，本例不复制地图素材或默认Marker图标。不支持Node/SSR直接顶层导入，SSR需客户端动态加载边界。

地图容器与React控件必须保持唯一写者，不再用react-leaflet同时拥有同一节点。Map/图层有独立生命周期；不要每次数据修改都 L.map，也不要对别人的容器 remove。新接第三方瓦片时必须核对授权、使用政策和署名，不能沿用本例 attributionControl:false；当前不主动访问任何瓦片服务。

跨日期变更线时也不要照搬错误的bbox假设：Leaflet 1.9.4 getBounds使用未环绕的经度，边界可超出±180，并非必然 west>east；LatLngBounds扩展取经度min/max。若服务端要求标准范围，应明确归一化及拆分环绕区间。本例没有视域请求或日期变更线实验，不编造其运行结果。

## 官方原文与验证范围

匹配版本的 [1.9.4官方API](https://leafletjs.com/reference-1.9.4.html) 与安装源码/类型共同核对。[固定README](https://github.com/Leaflet/Leaflet/blob/d15112c9e8ac339f0f74f563959d0423d291308d/README.md) 是官方英文原文，v1.9.4完整树仅这一候选，无官方中文README；本地原文与本页教学分开。版本/提交/语言/同步日期/sha及官网实际失败证据见official元数据。

Node真实导入Leaflet会因window未定义退出；没有构造伪DOM来宣称SDK地图PASS。7项纯策略检查只证明选中回落、有限坐标和额外容量。真实 SVG 投影、弹窗和图层、键盘、resize、卸载及网络边界的 Chromium 证据见本地记录。官网两种HTTP客户端都在TLS握手阶段失败，没有响应头可供嵌入判断，状态unknown；不能由此宣称blocked或allowed。实际命令、日志与六项见local-validation，正式verification仍NOT_RUN。
