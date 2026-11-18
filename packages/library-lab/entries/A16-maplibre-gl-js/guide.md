# MapLibre GL JS：从本地点位到真实 WebGL 图层

一组新闻来源有经纬度和健康状态，既要在地图上查看，也要用表格过滤、定位和修改。本例用`maplibre-gl@6.15.0`的真实Map、GeoJSONSource和circle图层，内联空样式不请求外部瓦片、sprite或glyph。没有街道和地名是预期；它是点层实验，不是已配置完整底图的产品。

数据来自本地教学fixture，不连接资讯服务、地理编码、模型或付费API。当前条目为recreated，原研究来源保留，旧PASS不继承。少量DOM标记可对照A15 Leaflet；大量GPU数据叠加可评估A17并另验相机同步。

## 先完成三个实验

### 1. 真实引擎、Worker与两站点

打开basic。表格只有北京和天津；源首次建立也只放这两站，不再先放三个再改两个。等待“源与图层已建立”，展开“查看真实源、渲染要素与投影”，对照SDK的points、sourceLoaded和renderedIds。加载状态不能只看一行“成功”：数据表是业务状态，getData是SDK源数据，queryRenderedFeatures才是当前视口查询到的图层要素。

点表格的“定位”，相机通过`easeTo({duration:0})`移到对应经纬度。点击地图真实圆点，当前选择应切到该站。SDK观察的投影x/y来自map.project，可用来核对真实指针位置，不是自行模拟的地理投影。

### 2. 同一个源上的健康过滤

business初始三站，其中石家庄为暂停。勾“只看在线来源”，表和source数据变为北京、天津；选中项若被滤掉，选择回落到仍可见的第一站。取消过滤后三站恢复，不重建Map或Layer。

颜色由真实circle-color表达式读取healthy：在线绿色，暂停橙色；表同时给出“在线/暂停”文字，不只靠颜色传递含义。SDK观察同时显示源points和渲染查询的renderedHealth，便于识别数据已更新但渲染仍在等待的阶段。

### 3. 新数据、可恢复状态与生命周期

advanced点“新增本地站点（最多40条）”，表格和现有source增加local-1，选择也切到新站。对该行点“切换健康状态”，同一站id保持，布尔改变后表达式重算。若正在只看在线，改为暂停会从可见集移除并使选择回落。

“恢复初始状态”恢复三站、清过滤、选择北京，并把新增序号归零。最多额外40站是应用预算，不是性能结论；表中的站点可能处于当前视口之外，不能要求renderedIds永远等于全部source id。

变窄视口触发ResizeObserver调用当前map.resize，点的经纬度不变。停止或离开会卸载当前Map；重进回到初始数据。WebGL2或Worker初始化失败时显示真实错误，表格仍可操作，不能用一张静态图或假Map填补失败。

## 四个对象与异步边界

```text
stations / onlyHealthy → visible → 同源表格
                            ↓
                    GeoJSONSource.setData
                            ↓ Worker解析/分块
                    circle Layer / WebGL
                            ↓
                  queryRenderedFeatures
```

| 对象 | 本例职责 |
| --- | --- |
| FeatureCollection | Point的[longitude, latitude]，稳定feature.id和properties.id |
| Style | version8、无外部资源，只有本例新增源与circle层 |
| Source | 存几何和属性；更新复用setData，不为每行创建Map |
| Layer / Map | 样式表达式、视口、命中与WebGL资源 |

6.15.0的setData返回`Promise<void>`，实际是UpdateQueue.flush等待队列清空；SDK会合并待发送数据，失败经error事件传出，**Promise完成不等于更新成功或已绘制**。本例保留map.error可见信息，不用then改写“渲染成功”；then只安排一次真实SDK观察。idle/moveend也更新观察，getData结果与render查询分别展示。最新错误保留，不用后续普通观察悄悄清掉。

源存在时getData可能已经反映最新输入，而Worker/渲染还在处理；sourceLoaded与实际renderedIds/health一起判断。queryRenderedFeatures只覆盖当前视口，也可能因瓦片边界重复，面板按站id去重。诊断是本例调用SDK API构造的观察面板，不是SDK自带性能工具。

## Worker接线是必要文件的一部分

```ts
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
maplibregl.setWorkerUrl(workerUrl)
const map = new maplibregl.Map({ container, style: EMPTY_STYLE })
```

已核实6.15.0默认URL根据import.meta.url找相邻worker文件；Vite打包入口后不能凭路径猜它仍在相邻目录。这里让Vite把匹配版本的standalone worker发成同源资产，在构造Map前设置URL。这个文件本身独立，不依赖相邻shared模块；没有新增宿主、插件或共享依赖。

这是SDK全局Worker URL配置，作用于该页面使用同版本SDK的地图；本例不在卸载时重置配置，也不清全局Worker池。Map.remove由SDK释放此地图拥有的资源；应用只清自己的回调、observer和rAF。其他构建器需采用其对应资产URL机制，不能把Vite的?url原样当跨框架协议。

6.15.0还有SDK全局RTL dispatcher所有权：Style构造调用`rtlMainThreadPluginFactory()`，其单例取得`getGlobalDispatcher()`，以`global-dispatcher`身份引用同一WorkerPool。`Map.remove()`只释放该地图的dispatcher引用；全局owner仍在时Worker不会关闭。主控candidate09原生`page.workers()`/CDP观察确认停止后同1个DedicatedWorker仍存活，重进复用且没有新增Worker。不能把“停止单地图后全页Worker为0”作为这里的清理契约，也不能调用全局dispatcher.remove或清预热池迎合测试；应用只负责当前Map及自己的监听/RO/rAF。原提案的Worker close=0断言过强，保留为历史，更新验收看真实remove/Canvas0及重进Worker集合不增长；记录见local-validation。

## 迁移与清理

复制example.tsx、selection-policy.ts、station-factory.ts、styles.css；demo.tsx仅Lab重导出。保留官方CSS、非零容器高度、命名空间导入和Worker接线。当前依赖BSD-3-Clause；底图、影像、字体和署名属于各自服务条款，不能由库许可推定。这里没有第三方地理资源。

Map只在挂载创建。load后加source/layer，初始数据取最新visible ref；数据变动只setData。disposed、当前Map身份与观察序号阻止迟到getData写入旧组件；更新effect清理也失效旧then回调。上下文丢失时清就绪与观察、显示表格回退；恢复后源/层仍存在才能继续更新，是否绘制由SDK观察确认。

卸载先标disposed、断开RO、取消rAF、移除本例load/error/context/idle/moveend及图层点击，再map.remove。清理标记记录真实remove事件和残留Canvas数量，不把“组件看不见”当完整资源证明。不调用clearPrewarmedResources清其他实例资源。

| 容易误解的做法 | 本例对应选择 |
| --- | --- |
| 经纬度按Leaflet顺序输入 | GeoJSON使用经度在前 |
| 每次过滤重建Map | 复用source.setData |
| setData完成就显示渲染PASS | 分开源数据、sourceLoaded与真实渲染查询 |
| 从map load推断所有数据已绘完 | 实际idle/queryRenderedFeatures再核对 |
| 灰屏时改成截图或放宽CSP | 保留真实错误和表格，核对Worker/WebGL条件 |

没有Popup、setStyle、updateData、实时流、网络竞态或上下文强制丢失按钮。cooperativeGestures保留页面滚动协作，duration0不产生飞行动画；触控、读屏和设备GPU仍需实测。

## 官方原文与证据

official/readme.md为6.15.0提交`638b3f9ecab4b743fd4d086d3bfd19bce7b7b032`根README原文，英文13392字节，SHA-256 `f293e4b84fcabba75a923fe54ff861b6bd4e7f2cddaf09082bcee97f57c0847b`。完整tree实际20个README候选无中文，精确路径/版本/日期和候选保存在official/source-audit.json及library.json。

官网SDK文档GET200，完整最终响应头在official/homepage-response.json，XFO/CSP均null；未从Lab origin做iframe实测，因此unknown并保留直达，不从200推定allowed。

Node两项真实SDK检查只覆盖LngLat/Mercator和Evented监听所有权；六项政策不创建Map。真实Map/Worker/WebGL只能主控在浏览器运行validation/browser-proposal.txt验证；不以Node输出或静态检查冒充图形结果。正式verification保持NOT_RUN，六项状态与实际命令见local-validation.md。
