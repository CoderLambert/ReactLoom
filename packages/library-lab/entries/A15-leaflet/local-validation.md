# A15 Leaflet 本地质量交付与验证

## 范围与基线

实际仓库 cwd：`/home/lambert/githubRepos/lambert/ReactLoom`。定向检查 cwd：`/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。Git HEAD：`1218066e706a90ba03fac8dff8c9b843dd2429c4`；原11个受控文件及各自摘要见 [baseline.json](validation/baseline.json)。开始研究时条目无既有diff；没有把内容摘要称为Git SHA。

只写本条目，保留其他工作者修改；未改公共源码/e2e/scripts/runners、依赖锁、索引、队列/results，未提交/推送/发布。候选08前只读研究，主控明确释放后实施；中途暂停只读诊断A07，确认其产品正常且测试观测有误，没有改A07。未跑全目录generate/typecheck/build或隐式build浏览器。

**真实地图SDK/DOM运行 NOT_RUN；Node环境不可用；纯策略、局部类型与静态来源检查分别记证。正式verification三项全部NOT_RUN。** 本记录的STABLE表示停止写入待独立复核，不等于content_done或正式PASS。

## 实现与三个独立目标

| 目标 | 真实SDK/自建分界 | 操作与验收预期 |
| --- | --- | --- |
| basic：经纬度/覆盖物/视口 | 原创地点fixture；真实Map、CircleMarker.getLatLng/toGeoJSON、投影、Popup、键盘 | 3点，Leaflet[lat,lng]与GeoJSON[lng,lat]对照；真实点击SFO或键盘定位NYC，选中半径与弹窗保持；原生方向键/缩放改变相机而不改地理坐标 |
| business：过滤与稳定图层 | 自建id→MarkerRecord同步，真实setStyle/setRadius及图层移除 | 3→2，选中暂停NYC后过滤回落sea；仍可见点layerId保留、退出点弹窗关闭，过滤不重置camera；重新显示退出点可新建 |
| advanced：有界更新/尺寸/所有权 | 保留纯40名额/唯一序号/夹取策略；真实setLatLng/invalidateSize/fitBounds/remove | Seattle两坐标+.25而layerId不变；40额外点上限、删除恢复容量且id不复用；空态/恢复；窄容器真实resize；显式重建保留数据，新旧Map分离，实际unload并remove后旧DOM清空 |

本例没有tileLayer、远程底图、地理编码、GPS、网络业务后端或持续timer。背景13条经纬线为原创示意，不是行政地图。online/paused只是fixture状态；0个TileLayer getter不能代替网络观察。无瓦片不承诺JS/CSS首次加载或冷启动离线可用。

原实现每次selected变化clearLayers导致非初始点的刚打开弹窗被移除；现在只更新仍可见对象，退出才释放。1.9.4 unbindPopup只解绑并清引用，不主动close；因此明确先closePopup，再unbindPopup/removeLayer，提案含真实退出弹窗清空断言。安全DOM文本弹窗、选中回落、无瓦片和有效清理均保留。

## 六项独立复核

| 维度 | 当前状态/证据层级 | 依据及限制 |
| --- | --- | --- |
| 技术准确 | PASS：匹配源码/类型静态复核；真实地图SDK NOT_RUN | 实际leaflet1.9.4、@types/leaflet1.9.22；Map/LayerGroup/CircleMarker/Popup/GeoJSON/坐标接口已核。纠正getBounds“跨线必然west>east”旧表述，明确未环绕经度可超±180；CircleMarker像素半径与Circle米半径分开 |
| 解释清楚 | PASS：静态内容复核 | guide工程问题→地点/图层/相机所有权→最小接入→三目标输入处理结果→迁移和限制；本地fixture、自建同步、真实SDK与未实现服务分开 |
| Demo有用 | NOT_RUN：浏览器；静态目标/代码对应已复核 | 三目标各有独立控件、真实getter和可观察预期，完整Playwright提案未执行，不能用源码/策略称地图运行PASS |
| 源码可迁移 | PASS：静态/strict类型；实际移植运行NOT_RUN | 七个运行sourceFiles齐全，含数据/配置控制器/策略/CSS；引入包内Leaflet CSS，无Lab alias或手抄第三方地图素材；生命周期按专属mount管理 |
| 官方来源可靠 | PASS：固定原文/真实失败证据；官网嵌入NOT_RUN | 官方tag解引用commit与包版本对应，完整tree无中文，原文3952B/sha一致。官网TLS失败没有HTTP响应，unknown依据是失败而非“没有限制头” |
| 结果可复核 | NOT_RUN：整体地图运行；局部静态/纯策略日志PASS | 原始cwd/ARGV/UTC/退出码保留，16个输入摘要绑定源码/教学/原文/提案。Node自然import失败如实保留，不构造假DOM、跳过占位或伪SDK通过 |

## 匹配版本与官方来源

- 本机运行包 `node_modules/.pnpm/leaflet@1.9.4/node_modules/leaflet`；类型1.9.22。安装 `src/map/Map.js` 的setView178、invalidateSize557、remove741、getBounds834、latLngToContainerPoint1060；`src/layer/vector/CircleMarker.js` 的像素半径、setLatLng/setRadius；`src/layer/Popup.js` bindPopup390/unbindPopup407/closePopup438；`src/geo/LatLngBounds.js` 的未环绕角点说明与min/max扩展，均只读核对。实际路径和版本见 [input-hashes.json](validation/input-hashes.json)，API接线由最终strict类型检查支持。
- 官方 `Leaflet/Leaflet`，tag `v1.9.4` annotated对象 `91900f7b177e6a926dfc3a75c86dc11fd4f2cf34` → commit `d15112c9e8ac339f0f74f563959d0423d291308d`；git ls-remote研究输出及实际tag API200一致。固定package.json200确认1.9.4/BSD-2-Clause。完整tree200、truncated=false、候选仅根README.md，无官方中文版本，选择英文原文。
- [官方原文](official/readme.md) 3952字节，SHA-256 `85c5270e168a1f0021605f7bceaf2ef8fd5a6d195392a242c1f25b833fe91b5f`，repo/ref/path/version/language/syncedAt都在library.json。原文逐字保存，不混入本地教学；上游现有HTML/图片/链接仍交平台原文策略展示，不为显示远程图片修改平台权限。
- [source-evidence.json](official/source-evidence.json) 保存固定tag/tree/rawREADME/package四次200完整响应头、URL/最终URL/字节/sha；官网urllib与curl两次失败原样保留。源获取脚本保存每一步，官网失败未覆盖已成功原文。
- 官网 `https://leafletjs.com/` 在urllib报TLS unexpected EOF，curl退出35、HTTP code000，没有获得HTTP头。它既不证明blocked，也不证明allowed；保持unknown/直达，真实Lab-origin尚未运行。没有伪造XFO/CSP为空或200。两次实际失败后未反复请求同一阻塞，更未请求任何瓦片。

## 实际命令、退出码与日志

以下命令均在Lab cwd，日志包含完整ARGV、UTC起止、退出码、原始stdout/stderr。没有force-exit或SDK mock。代码/类型检查与浏览器执行严格分开。

| 实际命令 | exit/结果 | 原始日志 |
| --- | --- | --- |
| `pnpm test:policy --entry=A15` | 0；2套件7PASS/0SKIP：选中/夹取/非法值3项，容量/唯一性/删除恢复4项 | [policy.txt](validation/policy.txt) |
| `pnpm exec -- node --test entries/A15-leaflet/tests/location-policy.test.mts` | 0；受影响helper最终3PASS；站点工厂4项复用上行有效结果，合计独立覆盖仍是7项，不累计成10项 | [policy-location-final.txt](validation/policy-location-final.txt) |
| `pnpm exec -- node --input-type=module -e "await import('leaflet')"` | 1；ReferenceError window is not defined，真实SDK入口在DOM前不可用。不是地图测试FAIL/PASS，不设可发现SKIP占位 | [node-sdk-environment.txt](validation/node-sdk-environment.txt) |
| 仅入口strict tsc，完整参数见下 | 0；真实导入/API/GeoJSON类型/CSS入口 | [types-final.txt](validation/types-final.txt) |
| 提案同字节临时.ts strict tsc（types=node） | 0；只检查提案，不执行Chromium | [proposal-types.txt](validation/proposal-types.txt) |
| `pnpm exec -- biome check --write` 指定本条目examples/tests/library/verification/metadata脚本/临时提案 | 0；13文件，正常排版，无warning | [format-final.txt](validation/format-final.txt) |
| 提案局部Biome及最终静态巡检 | 0；修正请求观察应在导航后比较实际origin，防止about:blank误报外站 | [proposal-format.txt](validation/proposal-format.txt)、[final-inspection.txt](validation/final-inspection.txt) |
| `node entries/A15-leaflet/validation/metadata-check.mjs` | 0；validateEntry/completeness[]、七sourceFiles、版本/原文/hash/官方unknown/正式NOT_RUN一致 | [metadata.txt](validation/metadata.txt) |
| `python3 entries/A15-leaflet/validation/fetch-official.py` | 1；四个固定官方请求200，最后官网TLS失败，部分成功逐步落证 | [source-fetch.txt](validation/source-fetch.txt) |
| curl官网GET（完整ARGV见日志） | 35；TLS EOF，无HTTP头/正文，保留真实错误 | [homepage-curl.txt](validation/homepage-curl.txt) |

入口类型完整命令：

```sh
pnpm exec -- tsc --ignoreConfig --noEmit --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --strict --skipLibCheck --esModuleInterop --allowImportingTsExtensions --jsx react-jsx --types vite/client,node entries/A15-leaflet/examples/demo.tsx
```

初次格式日志format-initial.txt的optional-chain警告已修正；最终格式无warning。类型初次与最终都0；补充真实toGeoJSON字段后只重查受影响类型。政策helper补齐非有限经度拒绝，最终等价optional-chain排版后定向重查3项，不重跑未变的工厂4项。未运行目标test:sdk，因为实际Leaflet入口需要window；禁止把纯策略改名为sdk或伪造Canvas/SVG。

提案临时browser-proposal.ts经格式化写回txt，类型检查后删除；没有改公共e2e。浏览器三测试覆盖：坐标/真实点命中/弹窗保留/键盘与无外站请求；筛选退出弹窗关闭/仍可见layerId/选择回落/相机；真实setLatLng/40上限及删除后新id/空态/窄容器resize/fitBounds/旧Map unload+remove+DOM清空/重启与移动宽度。所有这些仍是 **NOT_RUN预期**。

## 文件与剩余验收

- 修改guide.md、agent.md、library.json、verification.json（只更新真实NOT_RUN说明）；examples/example.tsx；location-policy.ts补有限经度拒绝，location-policy.test.mts补边界；demo.tsx/station-factory.ts/station-factory.test.mts仅Biome排版，原有效策略保留。
- 新增运行文件location-data.ts、map-controller.ts、workshop.css；七sourceFiles不再把测试文件混作迁移必需源码。
- 新增official原文/完整来源、validation获取/metadata脚本、原始日志、输入摘要、浏览器提案及本记录。完整清单见 [final-files.txt](validation/final-files.txt)，scoped diff/链接/当前输入摘要核对见 [final-inspection.txt](validation/final-inspection.txt)。

剩余：主控接入三提案，在匹配构建的真实Chromium运行Map/SVG投影与交互、popup生命周期、稳定图层身份、RO/原生键盘/手机尺寸、旧实例unload/remove及无瓦片请求，并保存实际截图/日志。官网TLS/实际Lab-origin预览仍未解决；不能用离线业务地图的成功替代官网嵌入结果。原生监听/内存计数、真实第三方瓦片、海量点和触摸/屏幕阅读器/减少动态专项均未宣称通过。

稳定时间在本文件末尾落盘；此后停止所有写入，等待主控独立复核。正式sdk/build/browser保持NOT_RUN。

完整交付 STABLE：`2026-11-10T12:21:15.533520+00:00`。停止所有A15写入（含日志/文档），正式verification仍NOT_RUN；等待主控独立复核和真实浏览器。


## 主控本地运行闭环

candidate-09的2028输入稳定，new-e2e lint/typecheck/build/catalog exit0，独立review处置后全部本库真实browser场景通过。首轮两次精度失败是SDK panTo/panBy投影像素round/trunc，中心-74.00390625与请求-74.006仅0.02382px；改验同一snapshot中nyc相对容器中心各轴<=1px、输入经度仍精确，过滤相机仍精确不变，定向两项PASS。不是放宽为模糊地理范围。

逐库最终结果、完整命令/候选/首次失败与定向重跑/独立报告见[结果](../../../../openspec/roadmaps/upgrade-library-quality/results/A15.md)。本地content_done不替代正式sdk/build/browser，三项仍NOT_RUN；SSR/dev重放/触控读屏/跨浏览器/性能等未由本次结果推定。
