# MapLibre GL JS — 真正的 WebGL GeoJSON 运行模式（A16）

## 适用任务与选型

MapLibre GL JS 用于矢量瓦片地图、WebGL 大量要素与数据驱动样式。本示例故意不接任何公共瓦片或付费服务：用 **真实 MapLibre Map** 加载内联样式，通过 GeoJSON Source 和 Circle Layer 绘制新闻来源点。这样可以脱离密钥演示引擎与生命周期，但不提供地理底图、地名或者行政边界。

适合站点分布、运维事件、真实地点可视化；如果只是几十个地点标点，优先 A15 Leaflet；上万对象与多图层叠加另评估 A17 deck.gl。

## 安装、引入、版本

```bash
pnpm add maplibre-gl@6.15.0
```

```tsx
import * as maplibregl from 'maplibre-gl';
import type {GeoJSONSource} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
const map = new maplibregl.Map({
  container, style: {version: 8, sources: {}, layers: []},
  center: [116.4, 39.9], zoom: 7,
});
```

完整可复制代码在 [examples/example.tsx](examples/example.tsx)；[examples/demo.tsx](examples/demo.tsx) 只是 Lab 适配导出，代码查看器展示同一份源码。MapLibre v6 为 ESM-only、无 default export，WebGL2 初始化失败需捕获异常并提供键盘可用的表格退化，不要照抄 v5 的 default import。\n\n**生产依赖须由 PLATFORM 确认并更新真实锁文件**，这里只是版本请求。

## 三层实战

- **basic**：仅两处站点，空白内联 style、GeoJSON source、circle layer，通过真实 WebGL 渲染。
- **business**：站点健康状态通过 `get` 属性的 MapLibre style expression 着色；勾选过滤时 `GeoJSONSource.setData`，避免每次重建 Map。
- **advanced**：动态添加点位、改变业务状态、重置和地图镜头；屏幕阅读器可操作 DOM 表格。无 WebGL 时保留完整表格，不伪造地图成功。

## 生命周期与工作流

地图在 `useEffect([])` 中创建；`load` 事件之后 `addSource` 和 `addLayer`。更新状态仅调用 `GeoJSONSource.setData`。ResizeObserver 使用 rAF 合并尺寸变化，必须检查实例身份；卸载断开 observer、rAF、所有地图事件并 `map.remove()`，不能留下已失效的 WebGL context。

MapLibre 的 GeoJSON 点是 **[longitude, latitude]**，与 Leaflet 的 **[latitude, longitude]** 正好不同。在 React 表单和 API 之间必须有清晰契约。

## 反例与修复

1. **每次 state 更新都 new Map**：WebGL/context 泄漏、事件重复；把 Map 生命周期与数据更新分离。
2. **load 之前 addLayer**：style 尚未加载会失败；监听 `load` 并确认尚未卸载。
3. **将公共 Tile URL 写死到演示**：存在流量、署名、许可、隐私问题；此例不发出网络地图请求，接入真实服务前确认授权与 attribution。
4. **MapLibre API 直接渲染任意外部 HTML**：不得使用不可信 HTML 当 Popup；用文本节点或可信净化。
5. **混淆 WebGL 报错与 API 失败**：区分硬件环境、Context 丢失、Style 错误及网络错误。
6. **只有视觉地图交互**：保留等价数据表、键盘定位和明确状态，重要任务不能只靠指针点击。
7. **过早引入 3D/海量图层**：先用简洁 Style/Source/Layer 验证渲染路径，再测吞吐和显存。

## 生产考量

定时数据推送要有取消策略、节流和版本序列，图层设置按业务依赖优化；不把几千点的每次重建作为默认方案。场景绑定专业瓦片源时必须遵循条款，不禁用生产署名。CSP/Worker 与资源路径需在部署域名真实验证；本页的空白样式不是“有底图”。切换 Tab、StrictMode 多次挂载、窗口尺寸改变必须重新检查实例正确释放。

## 验收计划（不是已执行结论）

运行 SDK import、完整 tsc、Vite 生产构建、Chromium WebGL 烟测、离线 network 记录、过滤和卸载事件；实际结果在 verification.json。当前仅提交真实 SDK 调用源码：`sdk/build/browser: NOT_RUN`，不使用 Mock MapLibre 伪报通过。

## 官方来源

- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [GeoJSON addSource/addLayer 示例](https://maplibre.org/maplibre-gl-js/docs/examples/geojson-line/)
- [maplibre-gl npm 包](https://www.npmjs.com/package/maplibre-gl)

许可证 **BSD-3-Clause**；本示例点位为本地生成数据，无第三方地图素材。


## 高频动态增量与唯一 ID（AB wave8 加固）

演示创建新站点时，事件处理函数必须先通过 `makeLocalStation(++nextId.current)` 固定 ID、标签和地理坐标，再将不可变数据交给 React updater。如果 updater 内读取可变 ref，快速点击可能导致旧条目拿到新坐标。这里限制最多增加40个本地站点，重置恢复初始数量时也重置序列。此限制是演示规模约束，不等于 MapLibre SDK 的容量上限。Node 规则检查只能证实 fixture 身份与坐标，不证明真实 WebGL2/GeoJSON 渲染。
