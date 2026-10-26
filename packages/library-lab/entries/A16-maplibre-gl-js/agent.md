# A16 MapLibre GL JS — Agent 迁移与实现准则

**用途**：矢量地图、GPU 数据驱动渲染，研究基线 `maplibre-gl@6.15.0`。地图 SDK 的可验证运行结果目前为 NOT_RUN，不能把代码提交等同于通过生产验证。

## 执行前

读取 `library.json`（版本、关系、能力），`verification.json`（证据范围），然后 `examples/example.tsx`。真正可迁移的模块只有 Map 的 create/cleanup、load 后 source/layer 注册、source.setData 数据流。Lab 的按钮、fixture 和描述不应整体复制。React 用 state 保持业务数据，但不要让每次 render 都构造 Map。

## 必须保留

- MapLibre v6 是 ESM-only、没有 default export，WebGL2 初始化失败应捕获异常并显示 DOM 替代。\n- 构建与 CSS：`import * as maplibregl from 'maplibre-gl'` 以及 `maplibre-gl/dist/maplibre-gl.css`。
- 实例仅创建一次，卸载 map.remove()、observer.disconnect()、cancelAnimationFrame()、off listener。
- GeoJSON `coordinates: [lng, lat]`；与 Leaflet 相反。
- Data source 初始化放在 Map load 之后，数据更新走 `GeoJSONSource.setData`。
- 没有 WebGL 时显示具备等价操作的 DOM 表格；明确页面没有地理底图。
- 引入正式瓦片源前确认配额、归属和生产署名；不传出个人精确位置。

## 不能照抄

原型中的 EMPTY_STYLE 不会显示街道、行政区或城市标签；“offline”仅指这里不请求瓦片，不代表真实地图资源已离线打包。不能在主应用强制启用自定义 CSP/COOP/COEP 只为 Demo 服务。

## 验收断言

实际 Map 初始化成功且图层存在；过滤后 source 特征数量变化；卸载后无旧 ResizeObserver / rAF 访问；WebGL 不支持时有表格与说明；Network 未发起瓦片请求；键盘按钮可以改变地图中心；React 严格模式重复挂载后没有多 Map 实例。

## 关联选型

A15 Leaflet：少量点位或 SVG 覆盖物。A17 deck.gl：极高密度 GPU 可视化。地图服务权利审查与 UI 展示分离，不能替换目标库为假的 Canvas 后记验收 PASS。

官方文档 https://maplibre.org/maplibre-gl-js/docs/ ；许可 BSD-3-Clause。
