# A15 Leaflet 1.9.4 工程入口

用于少量经纬度点、HTML弹窗与DOM/SVG覆盖物；矢量瓦片看A16，GPU点层看A17。实际包leaflet1.9.4（BSD-2-Clause）、类型@types/leaflet1.9.22；不要套官网默认2.0预览API。固定1.9.4文档/源码来源在library.json。

## 实际模型

React拥有地点/过滤/选中及表格；map-controller独占Map容器。七个sourceFiles含必要数据、纯策略、CSS和真实控制器。引入leaflet/dist/leaflet.css，正常打包器处理包内图片路径；不复制瓦片，不与react-leaflet同时占有同一容器。Leaflet顶层导入需要window，SSR改客户端动态加载。

- basic：3点，真实getLatLng/toGeoJSON/latLngToContainerPoint对照。Leaflet[lat,lng]，GeoJSON[lng,lat]；CircleMarker.radius为像素，Circle的地理半径为米。真实点点击和表格定位均选中并开安全DOM弹窗。
- business：过滤3→2，可见id映射复用CircleMarker；选择只setRadius/setStyle，移动setLatLng，不清整组。退出点off/unbindPopup/removeLayer；重新显示时新建，未承诺退出后身份不变。selectedVisibleId原回落策略保留；不因过滤fitBounds。
- advanced：坐标+.25并夹到±85/±180；拒绝非有限输入。site-N最多40个额外点，删除恢复容量，新序号不复用。空态；实际窄容器invalidateSize、显式重建及remove。

网格是原创示意，没有底图/行政边界、瓦片/GPS/地理编码服务或HTTP业务查询。online/paused是fixture状态，不是在线检测。0个TileLayer getter不替代浏览器网络验收。默认Chromium的Path使用SVG，本例未启用preferCanvas或WebGL。

## 所有权

单实例创建Map、静态网格Group、业务Group和id→marker Map；同一专属mount只归一个所有者。监听moveend/zoomend/resize/popupopen/close用于读取真实getter；ResizeObserver+rAF调用invalidateSize。过滤/选择不重置相机，初始与显式定位全部才fitBounds。

dispose先断开观察器/rAF、off本例Map事件、清每点click/Popup、Group，再map.remove，最后detach mount；实际unload计数与remove后自建marker仅供观察，不能当全量原生资源验收。清理幂等，异常不伪造成功。关闭惯性/zoom动画，程序定位非动画；原生键盘pan仍可能短暂过渡。

getBounds经度可超±180；1.9.4的LatLngBounds按min/max扩展，不要声称地图跨线必然west>east。服务查询需另行归一化/拆分；本例未实现。

## 验收与来源

控件/testid/真实getter字段和三目标见guide及validation/browser-proposal.txt。重点实际点点击弹窗保留、稳定layerId/退出、选中回落且相机不乱跳、真实setLatLng、容量边界、RO尺寸与旧Map unload/remove/DOM清空。没有SDK mock、伪DOM或SKIP占位。

Node真实import因window undefined退出1；policy7PASS只证明本地策略，不记SDK地图PASS。局部类型/格式/metadata和所有实际日志见local-validation；真实浏览器及正式verification仍NOT_RUN。原README英文3952B，固定commitd15112c9e8ac339f0f74f563959d0423d291308d、版本1.9.4，完整tree无中文候选。官网urllib/curl TLS失败，没有HTTP头，不得写“无XFO/CSP所以允许”；状态unknown，保留直达和真实失败证据。
