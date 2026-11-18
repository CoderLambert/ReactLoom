# A10 tldraw 工程入口

用于需要可编程形状、白板编辑及文档快照的 React 页面。当前目标版本 `tldraw@5.5.2`，状态 `recreated`，历史档案来源保留在 library.json；先读实际 `examples/example.tsx` 和 verification.json，不把目录收录或本地策略测试当浏览器 PASS。

## 真实接线与三个目标

- basic：真实 `<Tldraw>` 工具栏绘制，数量/ID来自 SDK 当前页。SDK测试标识 `tools.draw`、`canvas` 来自5.5.2实际源码；真实指针轨迹由浏览器验收。
- business：初始化4个RSS geo节点。保存内存document副本→追加到8或清空到0→恢复4，恢复后原ID/文字/位置保留。下载是当前文档而非内存副本。
- advanced：每次最多36、当前页程序化总数80；切只读后创建/清空/恢复禁用，SDK画布只读；保存/下载仍可用。停止或离开销毁当前内存副本。

必要文件：example.tsx、snapshot-policy.ts、styles.css、demo.tsx；保留官方CSS和父容器高度。用 `Tldraw/createShapeId/toRichText/getSnapshot/loadSnapshot`，不导入旧包、不改依赖版本。业务节点是教学fixture，不是已执行的RSS管道或模型结果。

## 所有权与数据

SDK Store是文档事实；React只保存当前页ID派生值、只读、状态及显式保存副本。监听scope为all，以处理当前页的session切换；比较ID签名后才更新宿主，拖动/相机不镜像完整形状。onMount返回函数退订自有listener并丢弃active Editor引用，Editor和内部资源由Tldraw释放。按钮校验实例仍active，WeakSet避免同实例重复种骨架。

保存：`getSnapshot(store).document`→`serializeSnapshot`检查3MB UTF-8→structuredClone。失败保留旧副本。恢复：`loadSnapshot(store,{document: structuredClone(saved.document)})`，只接受自身同版本内存副本；不是外部导入器。SDK协调当前session，不恢复保存时相机/选择，不承诺无效选区不变。恢复不是撤销；`Editor.run`是批处理，不承诺一次按钮一个独立撤销步。

没有persistenceKey、网络保存、@tldraw/sync、媒体离线打包。document包含所有页及资源记录/URL，3MB不是画布性能上限。Blob URL在1500ms后撤销；卸载清自己全部URL和timer，不清全站存储。80只限制程序化当前页新增，原生工具不受限。

只读即时调用 `updateInstanceState({isReadonly})`；写入口检查 `getIsReadonly()`。服务端API仍需独立鉴权，不从按钮disabled推导安全授权。

## 许可与来源

自定义tldraw License。固定版本默认Development Purposes覆盖内部开发/测试/预发，不覆盖终端用户生产用途；需相应正式许可。本例本机回环进入正常开发路径；远端无key不挂载，配置值存在仅是准入，不是许可校验成功。SDK负责真实有效性判定。禁止读/借用户.env、填假key、改NODE_ENV/SDK生产判断、去水印或忽略许可错误。

official/readme.md是固定commit `be4d5b30cbf896c92436d634e59843a920705cef` 的包README原文，5.5.2/en；271个实际候选无中文，精确path/time/hash在source-audit.json。official/LICENSE.md也保留原文。官网GET200无XFO/CSP，但未测Lab iframe，unknown；完整头见homepage-response.json。

## 验证与精确观察点

`a10-workshop`：data-level、data-ready、data-readonly。`a10-shape-count`、`a10-shape-ids`：当前页SDK身份；`a10-saved-document`、`a10-saved-shape-ids`：显式保存副本；`a10-status`：操作结果。展开“查看当前页与保存时的形状身份”后读取output。画布容器a10-canvas。非本机无配置显示a10-license-gate。

按钮名：追加4个流程节点、有界批量创建形状、保存文档到内存、恢复已保存文档、切换只读/退出只读、清空当前形状、下载文档 JSON、缩放适合画布。readOnly下恢复禁用；下载当前document无session。

本地SDK两项通过只验证真实Store/schema/文档恢复及document/session分离，没有挂载Editor。Node SDK导入留下进程资源，当前SDK检查将真实断言放入自建Worker，主测试普通node --test接收结果并在finally终止自己的Worker；不能当浏览器Editor卸载验收。旧force-exit执行方式仅保留在local-validation历史日志。三项纯策略仅JSON/字节。入口类型/格式/metadata结果见local-validation.md；正式验收仍NOT_RUN。validation/browser-proposal.txt是准备好的真实Playwright提案，由主控接公共测试并运行，未在此entry直接执行。保持生产许可、真实输入法/焦点/读屏等未测边界。
