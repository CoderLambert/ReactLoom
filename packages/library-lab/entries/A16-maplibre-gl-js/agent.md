# A16 MapLibre GL JS — 工程手册

## 适用

`maplibre-gl@6.15.0` 用本地空样式和 GeoJSON 圆层画点。没有街道是预期。DOM 标记用 A15。不要把本示例说成已配置 Worker URL 或底图服务。

## 版本

钉 6.15.0。使用命名空间导入和 `maplibre-gl.css`。Style 为 version 8 且无 sources。`trackResize: false`。坐标 `[longitude, latitude]`。BSD-3 不包含瓦片数据。

## 迁移

默认导入改为命名空间或命名导入。加层移到 `load` 之后；换样式则在下次样式就绪时重装 source/layer。更新数据只 `setData`。从 Leaflet 迁入时交换经纬度顺序。增量 `updateData` 之前先保证要素 id。

## 不可删的清理

`disposed` 阻止迟到回调。断开 ResizeObserver、取消 rAF、摘掉 load/error/context 监听。只有加层成功才 `off` 点击。`map.remove()` 放到最后。宽或高不是正有限数时不 `resize`。上下文丢失时不要继续宣称图层可用。

## 反例

```tsx
useEffect(() => { new maplibregl.Map({ container, style }); }, [features]); // 错
map.addLayer({ id: 'stations', type: 'circle', source: 'missing' }); // 错：过早
// 对：一次构造；load 后 addSource；随后 source.setData(next)
```

`popup.setHTML`、公共瓦片预抓、`[lat,lng]`，都不要做。

## 测试断言

`resolveVisibleStation` 在选中项被滤掉时回到第一项。`canResizeMap` 在未激活或尺寸为 0 时为 false。`makeLocalStation` 只接受 1..40。SDK 收据还要看到真实 Map、`setData` 和 `remove`。没有 runs 收据则为 NOT_RUN。

## 真实限制

没有 `setWorkerUrl`、瓦片、glyph、Popup、`feature-state` 或 HTTP。basic 最终只显示两站。`easeTo` 时长为 0。40 个加站不是容量测试。空样式不能当正式地理底图宣传。

## 断言边界

`tests/selection-policy.test.mts` 与 `tests/station-factory.test.mts` 不创建 WebGL。SDK 用例要 `import * as maplibregl from 'maplibre-gl'`，空样式下 `setData` 更新同一 source，卸载 `map.remove()`。不要用假 Map 代替。缺收据时保持 NOT_RUN。坐标顺序是经度、纬度。`setWorkerUrl` 未在示例里调用，灰屏时先查 Worker 而不是改成默认导入。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A16 PASS。不要把选择策略测试或历史研究 PASS 写入 `verification.json`。

对照 `library.json` 的版本编写 import，不要升到条目未钉死的版本。
`tests/` 中的策略用例不能改写成 sdk 字段的 PASS。
浏览器与构建未留下收据时，对应字段维持 NOT_RUN。
