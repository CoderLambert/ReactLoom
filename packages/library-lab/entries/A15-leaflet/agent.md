# A15 Leaflet — 工程手册

## 适用

`leaflet@1.9.4` 做少量 `[latitude, longitude]` 点和 circleMarker。不要加载未授权瓦片。矢量样式用 A16，GPU 点层用 A17。示意经纬线不是行政底图。

## 版本

钉 1.9.4，并引入 `leaflet/dist/leaflet.css`。`attributionControl: false` 只因为没有第三方图层。`scrollWheelZoom` 关闭，避免抢走页面滚动。坐标进 Leaflet 前从 GeoJSON 的 `[lng, lat]` 转换。

## 迁移

DOM id 初始化改成 ref + effect + `map.remove`。默认 Marker 图标改成 circleMarker，或显式 `L.icon`。弹窗从 HTML 字符串改成 `textContent`。视域查询把跨日期变更线当成 `west > east` 的并集，而不是非法框。声明式 `react-leaflet` 与手写 Map 二选一。

## 不可删的清理

`ResizeObserver` 断开，rAF 取消，`group.clearLayers()`，`map.remove()`。尺寸变化调用 `invalidateSize({ pan: false })`。筛选改变选中时用 `selectedVisibleId` 回落到仍可见的点。额外站点不超过 40 个。纬度夹在 ±85，经度夹在 ±180。

## 反例

```tsx
if (ref.current) L.map(ref.current); // 错：render 中重复初始化
marker.bindPopup('<b>' + name + '</b>'); // 错：HTML 注入
```

把 `[lng,lat]` 直接交给 `L.circleMarker`、筛选时 `fitBounds`、只 `abort` 不挡旧响应，都不要做。

## 测试断言

`shiftLocation` 拒绝非有限增量并夹取世界范围。`canAddLocalLocation` 只数 `site-N`。`makeLocalLocation` 拒绝非正整数序号。SDK 收据还要看到真实 `L.map`、无网络瓦片、卸载后容器可再次初始化。没有 runs 收据则为 NOT_RUN。

## 真实限制

没有瓦片、moveend、HTTP 或输入法。图层在数据变化时整组重建。定位动画关闭。40 与城市 fixture 不是测量结果。`preferCanvas` 未开启，也不应被写成性能开关。

## 断言边界

`tests/location-policy.test.mts` 与 `tests/station-factory.test.mts` 不创建地图。SDK 用例要 `import * as L from 'leaflet'`，确认没有 `tileLayer` 请求，`map.remove()` 之后同一节点可以再初始化。弹窗内容来自 `textContent`。缺收据时保持 NOT_RUN。弹窗使用 DOM `textContent`。没有瓦片图层，因此不要发明 OSM 署名，也不要发起瓦片请求。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A15 PASS。不要把坐标测试或历史研究 PASS 写入 `verification.json`。

对照 `library.json` 的版本编写 import，不要升到条目未钉死的版本。
`tests/` 中的策略用例不能改写成 sdk 字段的 PASS。
浏览器与构建未留下收据时，对应字段维持 NOT_RUN。
