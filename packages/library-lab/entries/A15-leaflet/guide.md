# Leaflet 1.9.4：无瓦片网络依赖的地图图层实践

## 安装与用途
`pnpm add leaflet@1.9.4`，TypeScript加`pnpm add -D @types/leaflet@1.9.22`。按需导入`import * as L from 'leaflet'`和`leaflet/dist/leaflet.css`。适合轻量地理标点、区域与覆盖物，业务必须区分经纬坐标、瓦片版权、地图容器与订阅状态。A16 MapLibre侧重矢量瓦片样式；A17 deck.gl用于GPU规模图层。

## 三层真实场景
**basic**：真实`L.Map`建立zoom/drag视图，用`L.LayerGroup`绘制地点circleMarker。**business**：RSS来源区域按启用状态筛选、弹窗显示、带DOM按钮的定位、不同状态颜色；**advanced**：本地移动点位、新增删除来源及重置视角，演示状态驱动更新和资源释放。此示例完全不调用底图瓦片API，仅画原创经纬网格。经纬网格不表示真实行政边界，用户查看位置时要解释缺底图的限制。

## 真实数据和生命周期
React维护来源列表；Leaflet负责Map、LayerGroup、circleMarker。Map只挂载一次，数组或筛选变化仅`group.clearLayers()`后重建小规模标记（大量点需聚类/增量diff，不照抄当前小场景实现）。`ResizeObserver`驱动`map.invalidateSize({pan:false})`，rAF合并宽度变化。组件卸载`observer.disconnect`、`cancelAnimationFrame`、`group.clearLayers`、`map.remove()`，不能保留旧container的私有leaflet ID。

## 坐标与安全的六个反例
1. **经纬度次序写反**：Leaflet `[lat,lng]`，GeoJSON coordinates 则是 `[longitude,latitude]`。转换必须明确。
2. **每次render创建Map**：重复容器会报already initialized；只在mount创建。
3. **隐藏Tab后地图尺寸错乱**：Tab激活/容器ResizeObserver要调用invalidateSize。
4. **未经许可热链公共OSM tile**：违反流量与署名政策；正式产品用获授权服务、限额、缓存策略及对应attribution。当前Demo完全无瓦片请求，不声称有可用真实底图。
5. **bindPopup(`<span>${userInput}</span>`)**：字符串插值有XSS风险；使用textContent/DOM节点或经过净化的模板，本示例使用DOM节点。
6. **地图只有Canvas/SVG视觉输出**：增加DOM数据表、原生button和文本状态供键盘/读屏，重要坐标和功能不能藏在地图操作里。

## 数据策略
地理位置通常涉及隐私；不要自动上报精确个人经纬度。状态差异与查询应由真实API的授权控制。点击位置设置视角不用默认连续动画，避免减少动态的体验问题。缩放范围由需求和底图供给决定，不用隐藏底图服务错误。

## 验收状态与学习
本轮仅实现源文件和指南；SDK、TS、Vite、Chromium NOT_RUN。后续检查真实地图创建/销毁、一个容器反复挂载、源切换图层数量、DOM键盘定位、无外网瓦片请求、弹窗不注入HTML、不同屏幕invalidateSize。别将地理坐标示意冒充完整地图库验收。

官方：https://leafletjs.com/reference.html · https://leafletjs.com/examples/quick-start/ 。叶库BSD-2-Clause、@types/leaflet MIT。
