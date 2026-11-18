# B05 Rive React 非作者独立复核

结论：**未确认P1/P2，无源码阻断**。本次最初为全程只读复核，candidate10稳定构建后主控明确释放，现只保存此报告；未改被审运行源/公共文件，未重跑SDK/WASM/policy/type/build/browser。

实际cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。已读适用AGENTS、library/guide/agent、全部examples/tests、verification/local-validation、official原文/来源/资源响应、validation源码审计/运行manifest/完整browser提案，并对照实际安装编译JS与类型。

## 六项结论

| 维度 | 独立状态 | 证据与限制 |
| --- | --- | --- |
| 技术准确 | PASS（匹配源码/类型/既有局部WASM） | React包装器4.37.0→WebGL2 runtime2.45.0，React19.3.0满足peer。当前单数stateMachine是正式参数，plural已deprecated。权威实例、layout与播放均实际SDK；既有WASM2只数值布局，不证明文件或绘图。 |
| 解释清楚 | PASS（静态） | 三目标区分文件契约/播放、React本地任务、挂载/IO/共享渲染器。业务phase/意图、SDK读数、Draw观察与许可界限清楚，没有虚构approved/failed绑定。 |
| Demo有用 | NOT_RUN（实际浏览器） | 真useRive/远程资源/操作与观察齐；CDN/CORS/WASM/WebGL/实际播放/布局/IO与清理仍待主控。 |
| 源码可迁移 | PASS（静态与既有类型） | 六必要sourceFiles、真实asset常量/策略/player/样式齐；包装器拥有实例，应用只清自己probe/监听/任务；不全局销毁共享资源。 |
| 官方来源可靠 | PASS（固定原文/完整HTTP/明确权利边界） | 固定v4.37.0 commit与package匹配，4388B原文hash独立重算一致，完整tree无中文。官网DENY/CSP明确blocked；样本只请求头，运行时MIT不延伸到设计文件，离线授权仍BLOCKED。 |
| 结果可复核 | NOT_RUN（整体运行） | 既有SDK2/policy5/最终类型/metadata/提案日志边界准确，未重复执行；正式三项NOT_RUN。资源许可/在线运行与离线再分发分开，不平均抵消。 |

## 核心核对与准确位置

- `examples/player.tsx:122`实际useRive(src/stateMachine/autoplay=false,useOffscreenRenderer=true)；`134–163`以hook选中的已加载rive为权威，不把late Load回调提供的对象当当前实例。stateMachineNames实际包含bumpy才请求播放，不编造业务输入。
- `player.tsx:70–103`读取真实activeArtboard、机器名、bounds、layout、isPlaying/isPaused/isStopped和Canvas尺寸。WeakMap objectIdentity与React useId仅本例观察身份，不宣称SDK公开ID；Draw/Play/Pause由真实事件订阅计数，不等于GPU计数或业务成功。
- `player.tsx:114–120`probe cleanup按引用身份清理；`157–162`应用layout cleanup先off自己的SDK事件并清runtime ref，再由包装器passive cleanup拥有实例。应用不重复调用Rive.cleanup，不销毁全局WASM/共享离屏WebGL context。alive与父级instance检查阻止旧对象回写当前快照。
- 对照实际包装器编译JS：useRive拥有constructor/ref/unmount/final cleanup，canvas ref断开后microtask清零旧buffer。应用没有绕过包装器或用fake Canvas。真实清理警告/时序仍需browser检查，不用源码保证共享GPU全部释放。
- `examples/example.tsx:125–145`本地450ms任务在启动closure捕获simulateError，AbortSignal+generation同时防迟到结果；取消/场景清理清timer与监听，业务message和runtimeError独立。没有HTTP请求，503只是fixture标签；车辆状态机不是审核结果机。
- 真实媒体/visibility监听与advanced IO成对清理，mount/play仅策略意图。缺IO回退可见，原生document-hidden/完整资源计数没有运行证据，提案明确NOT_RUN。

## 来源与已有检查复用

实际包装器/runtime JS摘要与validation/sdk-source-audit.json独立核对一致。官方commit `ed0614c0050923db382df43196de80ecb38f9abd`、上游package4.37.0与完整tree匹配；原文4388字节，重算SHA-256 `d3db576862ff069a0889157166a11e3f3136ec74a4736cb6acbac172ab835262`。官网实际GET200最终URL为官方React docs，完整头X-Frame-Options=DENY和frame-ancestors self/Mintlify不允许Lab，blocked正确。

asset-response.json只记录vehicles.riv GET头200/声明58792B，body NOT_READ，无内容hash、无.riv入库、无CORS成功或再分发许可推断。官方当前引用可作为远程出处，不能代替离线权利。运行时MIT WASM模型测试与设计资产分开；离线BLOCKED解除需要单独获准文件/内容hash/契约/字体图片权利。

既有运行manifest：SDK2/policy5/最终types/format/metadata/source-audit/提案均0，初次format1已留历史并修复。SDK测试只加载安装MIT WASM、computeAlignment/Vec2D/Layout，finally delete自有native对象，Node自然退出；没有.riv/Canvas/实际绘图。本review只执行cat/rg/JSON与hash只读核对，没有重跑这些有效套件。

## P3与剩余

P3：`examples/runtime-policy.ts:4`原注释“page hiding releases WebGL resources”可改为“卸载当前实例；共享context/WASM不保证销毁”，避免脱离完整正文时被误读。主控已转原作者增量处理，本报告不越界修被审源码；该注释不改变当前正确的runtime-policy或正文边界，不作为P1/P2阻断。

真实browser由root统一：文件/网络、bumpy契约、播放/Draw/Layout、IO/减动、旧Canvas断开/清零/重新实例仍NOT_RUN；原生hidden、context-loss、全共享GPU/监听计数、触摸/读屏、离线内容仍未测。候选10共享build通过不是逐库运行或资产授权收据，正式verification继续NOT_RUN。

## 主控非作者增量复核：Advance与绘制分别记证

实际浏览器发现初版Draw订阅未被派发，并非晚订阅：固定SDK2.45.0实际JS摘要及无Draw/有Advance派发摘录见draw-event-source-audit.json，红探针在同对象isPlaying true且四幅Canvas各异时Draw持续0并真实exit1。主控对照之前已读player.tsx与当前源码：只把对应on/off和计数改为真实EventType.Advance，应用/SDK资源归属和业务fixture未变，文档明确推进不等于绘制。

新公共browser三项真实PASS（candidate11/browser-fixes.txt）：SDK实际Advance增长、连续Canvas截图不相同、手动暂停settle后Canvas完全相同且Advance尾帧有限、同对象Layout更新、取消/失败输入快照、减少动态/真实IntersectionObserver/旧Canvas清理。保留旧失败与原SDK bug证据，不删除断言冒绿。B05 trace关闭以免持久化远程.riv正文；仅实际Canvas图像与URL/status元数据，未复制动画资产。离线再分发资产仍BLOCKED，在线引用样本并非离线授权。六项静态+真实运行闭环，正式receipt仍NOT_RUN。
