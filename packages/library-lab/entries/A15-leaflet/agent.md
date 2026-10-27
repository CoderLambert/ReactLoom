# A15 Leaflet — Agent 使用和迁移手册

**用来解决**：轻量地图定位、来源地点与覆盖物；不承担数据库空间索引、离线矢量地图下载或卫星底图授权。需要数据驱动矢量瓦片优先比较A16；大量GPU图层比较A17。

**安装约束**：leaflet@1.9.4（BSD-2-Clause）；TypeScript另需@types/leaflet@1.9.22（MIT）。版本与React19同包构建仍需实际验证，勿引用旧总结中的PASS。

**复用文件**：`examples/example.tsx`是真实L.Map/LayerGroup/Marker状态同步与卸载，`examples/demo.tsx`仅导出。必须带上CSS。业务层在React保存稳定id与[纬度,经度]；GeoJSON输入是[经度,纬度]，接口适配时转换。

**保留能力**：Map挂载一次；ResizeObserver+invalidateSize和取消RAF；仅更新当前地图图层；卸载map.remove；外部数据弹窗以textContent或安全节点渲染，不把HTML字符串拼入bindPopup；地图外有键盘可操作列表。

**许可证与安全**：此Demo没有加载任何瓦片服务。生产底图不能将OSM公网瓦片视为无限免费CDN；需自行获得合法tile服务和署名/调用政策。不要把精确用户位置发到第三方。

**失败模式**：重复初始化同一container；缺CSS；lat/lon颠倒；大量点clearLayers重绘导致卡顿；无可读的文本替代；离开Tab不remove；Map resize不invalidateSize。

**必要测试**：catalog:check、typecheck、build、真实SDK地图创建/图层筛选/键盘定位、重复挂载和卸载无残余实例、浏览器Network无瓦片请求。当前sdk/build/browser均NOT_RUN。

**官方**：https://leafletjs.com/reference.html。


**连续点击与唯一身份（wave8）**：必须一并迁移 `examples/station-factory.ts`；事件处理时把 `const station=makeLocalLocation(++nextId.current)` 固定下来，再传进 `setItems`。严禁在 updater 内读取可变 `nextId.current`。一次批次上限40，保留稳定ID作为 React key、选择状态和地图 marker 关联。纯规则的Node PASS不是 Leaflet SDK/浏览器 PASS。
