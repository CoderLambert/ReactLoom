# A16 MapLibre GL JS 工程入口

目标maplibre-gl6.15.0，BSD-3-Clause。真实WebGL2点层，本地空样式/原创GeoJSON，无底图、sprite、glyph、凭据或在线服务。recreated与历史来源保留，不继承PASS。

三个目标：basic匹配Worker+两站真实点/投影/表格定位；business同源健康过滤与选中回落；advanced加站/健康变更/恢复/响应式/卸载。最多额外40站是教学预算，不是容量测试。

必要文件example.tsx、selection-policy.ts、station-factory.ts、styles.css；demo.tsx仅适配。官方CSS与320px容器高度必需。Vite ?url导入匹配standalone maplibre-gl-worker.mjs，在Map构造前setWorkerUrl；6.15.0默认相邻URL不能在打包后假定存在。配置是页面同版本SDK全局设置，不在卸载改回，也不全局清Worker池。

Map一次创建，load后加source/layer，取最新visible ref避免basic先3后2。源feature.id/property.id稳定，经度在前。React visible供表格与setData；选择不在可见集则回第一站。更新只复用source，不setStyle/newMap。

setData的Promise只是UpdateQueue.flush完成，SDK失败通过error事件，不等于成功或绘制。保留真实error信息；实际观察调用getData/map.project/queryRenderedFeatures/isSourceLoaded，source输入与render结果分开。renderedIds是当前视口去重结果，不是全部文档站点。诊断面板为本例自建SDK读取，不是官方性能面板。

disposed/Map身份/观察序号与effect active阻止迟到回写。cleanup断RO、cancel rAF、摘本例监听，最后map.remove；真实remove事件+Canvas数量形成清理标记。上下文lost显示回退并暂停更新，restored只以源/层是否存在恢复流程，实际渲染另验。不操作他人Map或预热池。

观察根a16-workshop data-ready/selected/visible；a16-map、a16-status/error、a16-sdk-state（展开“查看真实源、渲染要素与投影”）；a16-table tr data-station-id/selected。原控件“只看在线来源”“新增本地站点（最多40条）”“恢复初始状态”保留；每行“定位”“切换健康状态”需行内定位。snapshot含width/height/sourceLoaded/renderedIds/renderedHealth/points/center/workerUrl，均实际SDK读取。

官方README固定v6.15.0提交638b3f9ecab4b743fd4d086d3bfd19bce7b7b032，完整20候选无中文，原文hash/path/version/lang/time在source-audit.json。官网文档200无XFO/CSP，未iframe实测，unknown且直达。

真实Node SDK2仅坐标与Evented；政策6仅选择/尺寸/加站，无Map/WebGL。validation/browser-proposal.txt由主控接共享e2e执行，不能mock Map/Worker后标PASS。正式sdk/build/browser保持NOT_RUN；触控/读屏、真实上下文丢失恢复、海量点性能、离线资源缓存和生产地图服务未测，见local-validation。


## 6.15.0全局Worker边界（candidate09增量核实）

Style触发懒初始化的RTL插件单例，经getGlobalDispatcher以global-dispatcher持有共享WorkerPool；Map.remove只release当前mapId，全局owner仍在会保留Worker。主控实际page.workers/CDP确认停止后同1个活DedicatedWorker，重进复用不新增。保留Map.remove/本例清理，不碰globalDispatcher.remove或clearPrewarmedResources。validation/browser-proposal.txt中的close=0是原历史提案的过强断言；验收应为真实Map移除/Canvas0及重进Worker集合不增长。正式verification仍NOT_RUN，详见local-validation增量记录。
