# A16 MapLibre GL JS 6.15.0：空样式、GeoJSON source 与 setData

MapLibre 用 WebGL2 画样式和图层。Source 决定画什么，Layer 决定怎么画。当前示例没有瓦片、sprite 或 glyph，因此没有街道和地名，这是设计，不是故障。少量 DOM 点用 A15。极大的 GPU 叠加再考虑 A17，并单独处理相机同步。

Library Lab 钉 `maplibre-gl@6.15.0`，BSD-3-Clause。库许可证不覆盖第三方矢量瓦片、字体和影像。生产底图必须能展示对方要求的署名。本示例 `attributionControl: false`，因为样式是本地空文档。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。选中回落在 `examples/selection-policy.ts`，加站在 `examples/station-factory.ts`。CSS 为 `maplibre-gl/dist/maplibre-gl.css`。

已挂载：

- 命名空间导入 `import * as maplibregl from 'maplibre-gl'`。v6 是 ESM，默认导入不可用。不要写成 `import maplibregl from 'maplibre-gl'`。
- `new maplibregl.Map` 使用内联 style：`version: 8`，`sources` 和 `layers` 都是空的。中心 `[116.1, 39.1]`，缩放 6。`cooperativeGestures: true` 让滚轮不独占页面。`trackResize: false`，改由 `ResizeObserver` 在宽高都大于 0 时 `map.resize()`。
- 构造失败写入 `role="alert"`。`error`、`webglcontextlost`、`webglcontextrestored` 都有处理。丢失上下文时 `ready` 变假，提示改用表格。恢复且仍是当前 map、样式已加载时再标就绪。
- 在 map 的 `load` 回调里 `addSource('stations')` 和 `addLayer` 圆层。颜色表达式按 `healthy` 分支。然后才 `map.on('click', 'stations', ...)`。cleanup 只在加层成功后 `off` 这个点击。
- 初始 source 数据是三个基站点。随后 effect 用 `GeoJSONSource.setData` 换成当前可见集合。basic 只取前两个；其它层级可「只看在线」。选中 id 若不在可见集，`resolveVisibleStation` 落到第一个。
- 坐标是 `[longitude, latitude]`。北京约 116.4, 39.9。表格列顺序也是经度、纬度。定位用 `easeTo({ center, duration: 0 })`，没有飞行动画。
- advanced 最多再加 40 个 `local-N`，经度从 115 递增，纬度 38.4，并可以切换健康布尔值。恢复按钮把序号和列表打回基线。
- 卸载：作废标志、断开观察者、取消 rAF、摘掉 load/error/context 监听、摘掉图层点击、`map.remove()`。

没有挂上：`setWorkerUrl`、矢量瓦片、`style.load` 与 `load` 的分别等待、`setStyle` 后重建 source、`feature-state`、`updateData` 增量、Popup。Vite 生产构建常常要 `?worker&url` 再 `setWorkerUrl`，否则 Worker 404 或被 CSP 拦住。Lab 源码没调用它；若运行时灰屏，先查控制台，不要在文档里假装已经配置好。

官方建议在样式可用后加层。示例用的是 `load`，并在 try 里捕获失败。`load`、`style.load` 和 `idle` 不是同义词。`idle` 表示暂时没有待绘制任务，适合截图前等待，不适合拿去批量下载公共瓦片。[GeoJSONSource](https://maplibre.org/maplibre-gl-js/docs/API/classes/GeoJSONSource/)。

## 五层

1. **要素。** `FeatureCollection`，Point 的 coordinates 是 `[lng, lat]`，属性里放 id、标签和健康布尔。标题永远当文本，不进 HTML。
2. **Style。** 空的 version 8 文档。真实底图是另一份许可。
3. **Source。** `type: 'geojson'`。更新走 `setData`，不要为每个点 `new Map`。v6 的 `setData` 返回 Promise。`updateData` 要求要素 id 稳定，Lab 没有用增量 API。
4. **Layer。** `type: 'circle'` 引用 source id。小的颜色变化可用 `setPaintProperty`，不要为此 `setStyle`。`setStyle` 会丢掉运行时加的 source 和 layer，必须在下一次样式就绪时重装。
5. **Map。** 相机、WebGL 和事件。卸载 `map.remove()`。

## 三层

### 01 两点

北京和天津。石家庄在数据里但是 basic 的 `slice(0, 2)` 不会放进后续 `setData`。第一次 `addSource` 仍先放了三座，紧接着的 effect 会改成两座。若 `ready` 尚未变真，短暂不一致可能存在，以 effect 为准。

### 02 健康过滤

布尔驱动 `circle-color`。取消在线过滤会把暂停点加回同一 source，而不是新建地图。

### 03 动态 GeoJSON

加站、切换健康、恢复，都是 `setData`。40 的上限由序号和按钮禁用共同表达；`makeLocalStation` 拒绝越界序号。这不是 1 万点基准。大数据应聚合、分片或改矢量瓦片，并避免每帧复制巨大的 React state。[large data](https://maplibre.org/maplibre-gl-js/docs/guides/large-data/)。

## 反例

```tsx
useEffect(() => {
  const map = new maplibregl.Map({ container: node, style: EMPTY_STYLE });
  map.addLayer({ id: 'stations', type: 'circle', source: 'stations' }); // 错：样式未就绪，source 也不存在
}, [stations]); // 错：数据一变就再造 Map

// 对：挂载时 new Map 一次；load 之后 addSource/addLayer；stations 变化只 setData
```

| 错误 | 正确 |
|---|---|
| v5 默认导入 | 命名或命名空间导入。Lab 用命名空间 |
| 不等加载就 addLayer | `load` 或 `style.load` 之后，并捕获错误 |
| `[lat, lng]` | `[lng, lat]` 加范围检查 |
| 每个点一个 DOM Marker | circle/symbol 层 |
| 鼠标移动就 setData 全量 | `feature-state` 或节流。Lab 只在可见列表变化时 setData |
| `updateData` 却没有稳定 id | 先保证 id。Lab 未调用 updateData |
| `popup.setHTML(title)` | `setText` 或 textContent |
| 热更新不 remove | StrictMode 下必须 `map.remove` |
| 小改颜色就 setStyle | `setPaintProperty`；换主题才 setStyle 并重装层 |
| 未等绘制就 `toDataURL` | 授权资源、idle、评估 `preserveDrawingBuffer` 的成本 |
| 无 WebGL2 只留灰屏 | 表格仍可操作。Lab 有 alert 和表 |
| 公共 OSM 瓦片预抓整城 | 空样式或自建/付费且合规的服务 |

## 并发与安全

过滤或搜索若走网络，Abort 不够：用户改了条件却还没发出下一次请求时，旧响应仍可能写回。要用序号使旧请求失效。Lab 没有 fetch。

Style URL 和 `transformRequest` 是网络边界。不要把用户输入拼进瓦片地址，服务端代理要防 SSRF。密钥不进前端包。

Canvas 不是点列表。表格可 Tab，定位按钮和健康切换在 DOM。`cooperativeGestures` 减轻滚动冲突，触控仍要真机看。中文搜索要等 `compositionend`。减少动态时不要 `flyTo`；Lab 的 `easeTo` 时长为 0。

截图含第三方底图时，版权和署名仍然有效。空样式截图也不能冒充官方地图。

## 组合

**MapLibre + TanStack Query。** Query 持有要素缓存，Map 只持有 GPU 图层。选择器里去重 id。Lab 的 `stations` state 就是唯一列表。

**MapLibre + deck.gl。** 底图和相机归 MapLibre，大数据层归 deck。两个 canvas 叠在一起不等于共享上下文。交错模式要核对 WebGL2 与当前 MapLibre 6 / deck 9 的组合。本示例没有 overlay。

## 生产清单

1. ESM 导入，CSS 引入，容器高度 300。
2. 空样式不发瓦片请求。
3. Map 只构造一次，`remove` 成对。
4. 加层发生在加载回调里，失败可见。
5. 更新用 `setData`，保持 layer id。
6. 坐标经度在前，并与表格一致。
7. 宽度或高度为 0 不 `resize`。
8. 上下文丢失有文案，表格仍在。
9. 点击监听与加层成功与否一致地摘除。
10. Worker URL 在真实 Vite 构建里单独核对，不把源码里的省略说成已配置。

## 升级与练习

从 `mapbox-gl` 1.x 迁到 MapLibre 6：ESM、WebGL2、Worker、样式图片缺失事件、嵌套属性，逐项在浏览器里看。专有资源的令牌和样式不要原样拷贝。

从 Leaflet Marker 迁来时改坐标顺序，并接受 DOM 键盘焦点换成表格。练习把 `setData` 换成带唯一 id 的 `updateData`，用 1k 与 10k 记录差异，不要只改函数名。

## 故障排查

灰屏且 GPU 初始化失败：驱动或浏览器关了 WebGL2，用表。Worker 404：补 `setWorkerUrl` 和 CSP。有底色无点：加载回调、source 名、坐标顺序、尺寸。改主题后点消失：setStyle 清掉了运行时层。旧数据闪回：请求序号。点太多：不要每帧 setData。

## 官方链接

- [文档](https://maplibre.org/maplibre-gl-js/docs/)
- [GeoJSON 示例](https://maplibre.org/maplibre-gl-js/docs/examples/geojson-line/)
- [GeoJSONSource](https://maplibre.org/maplibre-gl-js/docs/API/classes/GeoJSONSource/)
- [大数据](https://maplibre.org/maplibre-gl-js/docs/guides/large-data/)
- [npm maplibre-gl](https://www.npmjs.com/package/maplibre-gl)

## setData 与尺寸

`asGeoJson` 把站点收成 `FeatureCollection`。属性只放 id、label、healthy，几何是 Point，坐标数组字面量是 `[longitude, latitude]`。`setData` 在 `ready` 之后从 `map.getSource('stations')` 取出 `GeoJSONSource`。地图还没完成 `load` 时 effect 返回，避免对空 source 写入。

basic 的可见集是 `stations.slice(0, 2)`，过滤条件不参与。business 和 advanced 才看 `onlyHealthy`。选中项被滤掉时 `resolveVisibleStation` 改到仍可见的第一项，并有 effect 写回 state，表格和后续定位用的是纠正后的 id。

`canResizeMap` 要求实例仍是当前 map，且宽高都是正有限数。隐藏页签或尚未布局时 `clientWidth` 为 0，此时调用 `resize` 会把 WebGL 画布收成空缓冲。观察者回调里先看 `disposed`。`trackResize: false` 是为了把这条判断留在应用侧，而不是让库在 0 尺寸上自己 resize。

点击读取 `event.features[0].properties.id`，类型不是字符串就忽略。健康切换只改 React 数组里的布尔值，下一次 `setData` 让 `circle-color` 的 case 表达式重算，不调用 `setPaintProperty`，也不 `setStyle`。

Worker：库在创建 Map 时可能再开一个 Worker 做 GeoJSON 索引。Vite 若把 worker 文件拆出去，需要在 `new Map` 之前 `maplibregl.setWorkerUrl`。本文件没有这条调用。灰屏时先看网络面板里 worker 脚本是否 404，再看 WebGL2。不要为了绕过 CSP 去放宽 `worker-src *`。

`cooperativeGestures` 要求用户配合页面滚动，不能代替移动端验收。`easeTo` 的 `duration: 0` 是为了不在减少动态时飞过去。若改成动画，要先读 `prefers-reduced-motion`。点击只认字符串 id。属性里不要放 HTML。恢复初始状态时把 `nextId` 归零，否则序号耗尽后按钮会一直禁用，即使列表已经回到三座城市。

`addSource` 的第一份数据是三座基站点。basic 的 effect 随后 `setData` 成两座。测试若在 `load` 回调里立刻读 source，可能仍看到三座，要以 `ready` 之后的 effect 为准。过滤「只看在线」时不要 `map.remove()` 再重建，否则相机和 WebGL 上下文都会丢。

空样式没有 `glyphs` 和 `sprite`。圆层不需要字体。若以后加 `symbol` 层显示中文，必须自备允许再分发的字形文件，并写进 style，不要临时指向公共演示字体。上下文丢失时表格仍是操作入口，恢复事件里只有 `isStyleLoaded()` 为真才把 `ready` 设回真。

`circle-radius` 当前是常数 11，不随缩放改变米制大小。这和 deck.gl 的像素半径是两种库的各自单位，不要混用同一套魔法数字。健康色用表达式读取布尔属性，色盲用户仍依赖表格里的「在线 / 暂停」文字。不要只靠绿色和橙色传达状态。

更新数据时调用 `GeoJSONSource.setData`。
卸载时调用 `map.remove()`。
零尺寸容器不调用 `resize`。

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`resolveVisibleStation` 和 `canResizeMap` 不证明 WebGL 或 Worker。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A16 的 PASS，不要写入 `verification.json`。
