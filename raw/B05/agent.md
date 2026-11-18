# B05 Rive React 工程入口

先读library/guide、实际examples与verification。React包装器4.37.0→WebGL2 runtime2.45.0，React19.3.0满足peer。运行时MIT不覆盖设计资产。既有官方文档vehicles.riv+bumpy只远程引用，禁止下载再分发/伪造.riv；离线需另行授权文件与版本化契约。

三目标：basic真实加载/状态机契约/播放/Layout；business本地可取消审核只请求播放，业务与渲染错误分开；advanced原生IO/减动/文档可见性、实例卸载。没有approved/failed/health属性绑定，也没有View Model、文本输入、GPU Canvas或inkbleed。

六必要文件example/player/runtime-policy/asset/styles和demo适配器。固定尺寸，autoplay=false，单数stateMachine，useOffscreenRenderer=true；useRive拥有实例，不重复cleanup。WASM保留SDK固定2.45.0 unpkg主/jsDelivr备网络路线，未扩公共依赖或复制资源。

以hook选中的已加载rive对象为权威；核stateMachineNames确有bumpy才请求播放。读取实际artboard/机器/播放布尔/playingMachines/bounds/Layout与Canvas尺寸。instance是应用挂载身份，objectIdentity是WeakMap标记真实SDK引用，不是SDK公开ID；observedAdvanceEvents仅说明真实推进，非绘制/GPU计数，首次订阅前推进可能不计。WebGL2 2.45.0有Draw枚举却无派发，不能订阅它验证绘制；真实Canvas连续帧差与暂停稳定另测。

应用Rive监听在layout cleanup先摘，再由包装器处理SDK实例；probe身份/当前实例与alive隔离最终卸载后的回写。全局WASM/共享离屏WebGL context不保证随单组件卸载销毁，旧Canvas断开/清零不是全GPU回收证明。不要清全站资源。

保留AbortSignal+generation、本地450ms任务输入快照、切场景/卸载取消。业务message和runtimeError互不覆盖。runtime-policy的mount/play只是意图，不能凭true宣称画面成功。系统减动/手动暂停停播，文档隐藏与advanced离屏卸载。

观测：b05-workshop data-phase/runtime-mount/requested-play/reduced/in-view；b05-viewport/player/canvas/status/runtime-error/sdk-state。展开“查看真实Rive对象与推进事件”，点“读取真实播放器”。原审核/取消/下次503控件保留，画面适配Contain/Cover应复用真实对象引用。

Node SDK2真实读取安装MIT WASM并执行布局内核（finally delete自有矩阵/点），不读.riv、不建Canvas；原policy5只断言纯门闩。实际文件/渲染/播放/IO/清理由主控运行validation/browser-proposal.txt，不能mock SDK后PASS。正式三项NOT_RUN，离线授权资产BLOCKED，完整六项/命令/日志见local-validation。

官方v4.37.0 commit ed0614c0050923db382df43196de80ecb38f9abd，英语原文4388B/无中文候选，sha/date/path与完整响应在official。官网XFO DENY且CSP frame-ancestors不含Lab，blocked+直达。样本GET仅头200，未读正文/哈希，不能推断CORS或再分发许可。
