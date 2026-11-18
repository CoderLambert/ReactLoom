# B20 非作者独立六项复核

复核者 `/root/quality_e05`；UTC **2026-11-10T14:33:34.675629+00:00**，实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。对象为原作者最终STABLE后的B20。只读实现/实际安装源码/官方证据/有效日志；唯一写入本独立报告，不改产品/测试/正式状态/公共文件，不跑旧套件或共享构建。B15继续冻结。

**结论：未发现阻断P1/P2，静态复核通过；三目标真实浏览器仍NOT_RUN。** 有限终态、实例路由、撤销/任务所有权和清理均与实现/讲解一致；没有将Worker store测试写成Toaster DOM、定时或取消运行PASS。

## 六项独立结论

| 维度 | 独立状态/层级 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（匹配安装类型/JS、静态） | sonner2.0.8/MIT、React/DOM peer覆盖18/19，当前19.3。实际merge、duration优先级、Toaster过滤、无createPortal、入口自动CSS与hotkey空数组均核；终态有限时间仍待真实客户端。 |
| 解释清楚 | PASS（静态） | 通知/业务结果分离→最新保存一次撤销→同id本地任务/取消，输入、处理、可见结果与源码对应。区分toasterId和toast id、取消与dismiss/undo、finite duration与hover暂停、SDK与本例guard/timer。 |
| Demo有用 | NOT_RUN（真实浏览器） | 三目标真实API、持续status、真实id观察与完整3case提案齐；实际皮肤/action/焦点/计时/取消/窄屏/卸载留root匹配候选。 |
| 源码可迁移 | PASS（静态/已有类型） | 4必要sourceFiles完整、正常排版、无Lab alias/外部资产/网络；实例useId、明确3500/900、两个guard及owned id/timer集合清理。SDK CSS文档级且不删除共享style，不冒称隔离。 |
| 官方来源可靠 | PASS（固定原文/差异保留/HTTP） | tag2.0.8 manifest匹配，npm gitHead manifest2.0.7差异明确、README/state.ts同字节证据保留；README867B/hash重算一致，完整tree两候选无中文。官网200全头无XFO/CSP→unknown，未推定allowed。 |
| 结果可复核 | NOT_RUN（整体客户端运行）；局部日志可靠 | Worker真实SDK2与pure guard6分开，原始cwd/argv/time/exit齐；Worker在finally终止自有资源而非强退测试进程。首次Biome失败/局部解释修复保留。formal三项NOT_RUN，16关键输入sha绑定如下。 |

## 同id loading到有限终态

`example.tsx:98–133`先创建真实toast.loading，duration Infinity，返回id写runningToast与owned。900ms到期先删除自有timer登记、核最新token，再在成功与失败两个分支都传入**同一个id、同一个toasterId、显式duration3500**。没有新建另一个终态而遗留loading。

实际安装`dist/index.mjs`的store create分支先展开旧toast再展开data；省略duration保留旧Infinity。Toast组件duration来自toast.duration优先于Toaster duration，加载/Infinity分支不启倒计时；duration变化effect重新写remainingTime。因此只给Toaster默认3500不够，两个终态显式覆盖是必要的真实修正。现源码两个分支均正确。

任务shouldFail在启动时捕获，后续checkbox变化不影响这次输入；最新token先取得再清旧pending。已经完成的有限通知可以继续剩余时长，文案没有错误承诺全局永远只一条通知。900ms是本地fixture，不假称HTTP/Promise/AbortController。

## 归属、取消、撤销和清理

- `useId`生成每实例toasterId，所有四类调用都携带它；Toaster id相同。安装Toaster用toast.toasterId===id过滤，有id实例不接收默认无id通知。真实返回的toast id由全局SDK管理，组件只登记自己得到的id，更新/关闭精确指定id，不共享固定容器名。
- clearPending仅clearTimeout当前集合，dismiss自己runningToast并从owned移除；不会取消已完成通知。clearOwn先invalidate任务和保存两个guard，再清pending，最后逐个owned dismiss(id)并清集合。无无参dismiss、全局store/reset或删除共享style。
- business新保存先start新token，再关闭旧savedToast。action只有current token可更改saved，成功消费后立即invalidate，旧退场action也无权撤销新保存。关闭/自然超时不触发该业务回滚；savedToast是最近保存通知引用，不是持久事务记录。
- 取消只在advanced有入口，失效代际+清timer使迟到任务不能写成功。cleanup在卸载或public level变更触发，level effect重置saved/failure/result/id。没有在cleanup写React状态或销毁别的实例。
- owned是历史清理登记，不是活跃数量；自然关闭后保留的id仍只属于本实例。业务status/result与最近toast id持续读数明确区分，不能从Toaster消失推断业务撤销或用户已确认。

## Toaster实际DOM与样式

独立读取当前安装ESM未发现createPortal。Toaster返回组件树内的section/ol，官方CSS将[data-sonner-toaster] fixed到角落；源码对样式的DOM位置说明准确。实际入口`__insertCSS`在document存在时向head追加官方style，另有公开styles.css导出。本例不依赖Lab补CSS、不重复复制或在卸载时删除共享style。

真实customAriaLabel中文区域、closeButtonAriaLabel中文关闭按钮均为2.0.8支持属性。实际hotkey handler有hotkey.length>0再every，所以hotkey=[]不会使空every匹配所有键，也不抢默认Alt+T。visibleToasts3仅可见堆栈限制，不等于store删除或业务队列。

onAutoClose与onDismiss没有被用作保存/撤销的事务入口；指南承认程序dismiss/滑动等也可能触发onDismiss，不能当严格用户确认。hover/交互/document hidden会暂停实际倒计时，提案等待真实DOM移除而非假精确墙钟。

## SDK测试与来源的独立核对

实际package.json、index.d.ts、ESM、CJS、官方CSS五个文件sha本次已重算，全部匹配sdk-source-audit记录；没有用审计文本替代实际安装源码。

SDK2在自己创建的Node Worker导入真实Sonner store，获得真实返回id和getToasts。第1项证实省略duration确实继承Infinity；第2项证实显式3500、同id唯一记录、其他toasterId记录未改。该隔离Worker在finally清timeout并terminate，仅终止自己创建的Worker内存；没有fake document/RAF或process.exit/--test-force-exit强退测试进程。它不调用/证明客户端dismiss、Toaster过滤DOM或自动计时。pure guard6仅代际/一次撤销所有权，不是Sonner测试。

原README867B，重算SHA-256 **0809d104ce28f9c14b3b1e73257d93096f96134d2a5f2f225e5abf38b1aa4549**，与library/证据一致。官方v2.0.8 tag commit **6739aca5f668a33a4fd1d2fd9f758dff95c57466**的manifest为2.0.8；npm gitHead **ecce1841c55e4a72dfe139a8992b56498660125e**仍是manifest2.0.7，不能伪造一致。证据保留两个commit README和src/state.ts原文相同/摘要；展示选择匹配版本tag，讲解不声称所有源文件或构建二进制因此完全相同。

完整未截断tree只有README.md/test/README.md，无中文候选。repo/path/ref/version/en/date/hash、10个实际匿名GET完整响应、两个manifest及源码比对均在source-evidence；官网sonner.emilkowal.ski最终200全头无XFO/CSP，Lab-origin iframe NOT_RUN→unknown合理。没有用raw/GitHub响应头冒充官网。

## 验收与剩余

复用sdk2/policy6、入口类型、metadata、最终格式与提案类型/格式原始日志，不重跑。首次Biome12文件exit1的level依赖意图及受影响文件check0有记录，没有unsafe删依赖或隐藏失败；原运行实现与SDK测试在有效检查后未改。

提案3case对应全部目标：basic真实fixed皮肤、中文live区域、键盘关闭/有限时长与业务结果保留；business原生action的一次撤销/最新保存、关闭不回滚；advanced真实同loading DOM/id变success/error并有限退出、shouldFail快照、替换pending/取消、390px几何和任务未完时SPA Back卸载/重跑。无mock、假时钟/RAF、合成DOM动作、force-click退场旧action或假getter。过期闭包由纯规则证明，其边界已明说。

仍NOT_RUN：全部真实浏览器交互/自动关闭/焦点/action/取消/卸载；实际多Toaster并存DOM隔离、触摸/读屏/OS差异、SSR hydration/Shadow DOM、完整监听/时钟普查；真实后端取消与补偿未实现。静态无新增阻断公共需求，不将本报告升级正式verification。

## 绑定的16项复核输入

- `library.json`：`3c534a0372091e562408b1e98cf97089d10376e036074206c9e2e37566aefda0`
- `guide.md`：`b63e434cb934fa33a2073fa56414cc81d5086a209651e7837fcb0c9981a52e23`
- `agent.md`：`a4f9226ee99d477a21900387d599a62c04e3e260f5cccf5a95357d80fbd70a9d`
- `verification.json`：`94b4dc3effb9281d304cc3912d739dbaef5309e49a8ddfe2b13f01025d0d4950`
- `local-validation.md`：`6d1e0470cf20b5e4e0e21bb4885c9a7263b1a58eb7fc5ba4ad227f618af349c3`
- `examples/example.tsx`：`e3f364fd59c25fdd01b49c10b16effcb069a50ca35c7f9eef3935af913eab912`
- `examples/demo.tsx`：`f2284fc30009ceaaf34ecc200ff988948d95eba2717c8cf3ec70a978a2dc4038`
- `examples/latest-run.ts`：`1500a2442c9b918473d5516013117f3876e34de7fd30e1b1fd9c67d087732e0d`
- `examples/sonner-demo.css`：`bec0fb29d7826217e41b498e60608adee44195959ec91f3c89b458186b07ab36`
- `tests/sdk.test.mjs`：`6541e1f64791918e167e655a399c232124fa3a7fe04d2cd5b1edd00257463637`
- `tests/latest-run.test.mts`：`749d1e489d83692f61ebbc7b57ddf3fd9f45d0d8532b1a44cf9a4c5705ac9d38`
- `tests/undo-ownership.test.mts`：`64bf3470f98359aade98af4e3448a44cec8ed84defd5336bc4b93e2c27bc7085`
- `official/readme.md`：`0809d104ce28f9c14b3b1e73257d93096f96134d2a5f2f225e5abf38b1aa4549`
- `official/source-evidence.json`：`a973d5b99e36014c4fb39cad64ffb64344aaaad0cd42e6a11786a89d4cd716e5`
- `validation/browser-proposal.txt`：`0b7e8f6880f6a8a2ac5e9cd16aff71e10a41a8d696e0359bf21dc19ae379e469`
- `validation/sdk-source-audit.json`：`a50638b6fa30ce69a215c880269ff974799be7fd448d662e05def3532b58e8a7`
