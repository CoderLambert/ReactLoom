# C06 IMask 独立六项复核

复核者 `/root/quality_e11`，非作者；UTC `2026-11-10T16:00:31.554287+00:00`。实际 cwd `/home/lambert/githubRepos/lambert/ReactLoom`。root 明确授权仅写本报告；未修改产品、文档或官方原文，未重跑有效 SDK/policy/类型/格式/metadata，也未运行浏览器。复核范围覆盖 library/AGENTS/guide/agent、全部5源码、两测试、verification、本地日志/原文/SDK审计、完整三项浏览器提案及作者P2文案增量。

作者新稳定点：39文件/21输入，作者报告目录SHA `d2f5ab312677186395bfe0625caced1fce944a7bd28eb756458597a460939208`。本报告在作者稳定后单独新增，不回写其输入摘要。独立只读SHA核对：最终 input-hashes.json **21/21匹配**；SDK审计实际安装文件 **8/8匹配**；双原文与安装README独立逐字节相同。

**最终无未关闭 P1/P2。** 初读确认一项 P2（SDK destroy 清理能力被夸大），原作者按root限定release修正四份文档/审计，已增量复读关闭；运行源码和既有SDK/策略输入未变。下面的静态结论不替代真实React/浏览器验收，formal与浏览器仍NOT_RUN。

## 六项结论

| 维度 | 独立结论 | 具体证据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（静态源码/类型+有效模型证据） | imask/react-imask7.6.1与MIT正确；onAccept第一参与maskRef读取、Pattern/Number、complete与业务日历分界匹配实际源码。P2修正后不夸大destroy。模型SDK4不证明React视图。 |
| 解释清楚 | PASS（静态教学核对） | guide从输入问题→模型/视图→显示/去格式/typed三值→三独立目标→迁移/清理，明确无value反写、typed number非精确账本，Node与浏览器分开。 |
| Demo有用 | NOT_RUN（真实浏览器）；静态目标对应 | 编号中间编辑、金额Number归一化、日期Pattern完成与真实公历分别有操作和实际事件快照；完整3case提案具真实输入/选区/blur/节点与DOM监听观察。作者没有把预期写成运行PASS。 |
| 源码可迁移 | PASS（静态与有效入口类型） | 5必要源码含CSS/.d.mts，无Lab别名/外站资源；masked DOM/选区归SDK，应用存值快照，普通备注才React受控。不同场景/显式reset重挂，逐键不换节点。独立迁入/hydration未测。 |
| 官方来源可靠 | PASS（固定原文与实际HTTP证据） | 7.6.1 tag解引用commit与双npm gitHead/双manifest一致；完整树8README无中文，React/核心分别2371B/901B，独立SHA与安装原文一致。官网完整GET200无XFO/CSP，未真实Lab iframe故unknown。 |
| 结果可复核 | PASS（局部记录）；整体运行NOT_RUN | 原始日志cwd/argv/UTC/exit齐全，SDK4/policy3/类型/格式/metadata/final0各自限界；21输入与8安装文件SHA复核一致。正式sdk/build/browser全部NOT_RUN，root统一真实browser。 |

## 关键契约核对

`examples/example.tsx:19` 的四值直接读取回调的真实mask实例，没有固定成功串；`:45` 的accept把第一参存为业务文本，complete另存实际isComplete。三个IMaskInput没有value属性，因此不是React每键反写DOM。basic/Number unmask=true取unmaskedValue，advanced false取显示日期；typedValue仍单独从实例读，不以字符串冒充number。实装react-imask `esm/mixin.js:129–145` 的maskValue/getters与onAccept/onComplete吻合；`:67–75` 仅在传value时反写，当前示例未传。

`example.tsx:26–27` 外层key=level隔离场景状态，`:54–61` reset清raw/快照/accept/complete/普通备注/合成观察并递增input generation；普通accept不递增generation。输入均text加numeric/decimal提示，label、说明id与advanced错误状态关联真实元素；备注是普通受控input，不套mask，不加提交快捷键。

`calendar-policy.mjs:2–17` 先检查ASCII四位年月日和范围，拒0000；Date(0)后setUTCFullYear并UTC回读，避免0–99年重映射。测试含0096闰日、0099、0100/1900非闰、2000闰、越界月日和非字符串；真实SDK第四项同时证明2026-02-30的Pattern填满与helper失败。该规则只定义公历日，不暗示时区/时间或Date模型。

金额Number scale2/分隔符与归一化默认相符；模型测试包含padFractionalZeros对照，但产品没有该切换，guide已明确。原3模型+新增日期模型SDK4为真实createMask执行，无DOM/光标资源；policy3是自建公历helper，不能混成SDK或React通过。

## 已关闭 P2：destroy 所有权说明超出实际源码

初读位置：guide.md:60、agent.md清理段、local-validation.md:30、sdk-source-audit.conclusion曾声称destroy清所有内部订阅/cursor延迟任务。匹配安装 `imask/esm/controls/input.js:342–346` 实际仅 `_unbindEvents(); this._listeners.length=0; delete this.el`；`:22`的_listeners是对象，length赋0不删除accept/complete键，destroy也未调用`:239`的_abortUpdateCursor。`:225–228`已排10ms任务以`if(!this.el)return`守卫失效元素。

这不推导为已确认长期泄漏：本例只存普通值快照，不长期持有maskRef；React wrapper destroyMask后删除自己的maskRef，八个直接view DOM事件确实成对remove。正确边界是**解绑自己的八DOM监听/移除el，已排短任务可能暂存并由el guard跳过**，不能承诺所有内部资源在卸载瞬间清空。

原作者UTC `2026-11-10T15:58:50.642324+00:00`按root限定授权改guide/agent/local-validation/审计结论并更新摘要。本人复读这四处及新21输入SHA，全部准确，**P2 CLOSED（静态）**。运行源码/README/SDK/policy未改，复用有效结果，没有SDK补丁、全局清理或重复套件。

## 来源、日志与浏览器边界

原文精确仓库 `uNmAnNeR/imaskjs`，commit `a02a14b642f70b335e24789e8a187857473a21a5`，React路径 `packages/react-imask/README.md`：2371B，SHA `6d2a1d25943c4b0f0831d55a7cb566604db9d188a76767aba5efda5c9ba5460c`；核心路径 `packages/imask/README.md`：901B，SHA `c3bd23f1220ce2d6ea8c82c8e16748d0afc2d3a7f4b2c34218ffc49022d931ae`。双快照与对应安装README字节相同；repository/tag/gitHeads/manifest/时间/8候选/10响应完整头与NOT_READ官网正文记录一致。没有新增抓取或把未知官网记allowed。

已读原始sdk.txt的4PASS/0SKIP、policy.txt的3PASS/0SKIP、有效入口strict0/提案最终strict0/Biome13文件0/metadata0/final0/diff0，未重跑。只读Python标准库独立核对哈希与源证据，exit0；不导入SDK、不执行生产函数。实际命令cwd为上述仓库根，读取作者hash清单逐项`hashlib.sha256(read_bytes())`比较，另核对8安装文件与双README；输出21匹配/8匹配/双字节相同，没有把该静态核对写成SDK PASS。

提案通过真实键盘与选区、实际Number Tab/blur、date错误/备注、旧节点断开/重进观察三个目标。EventTarget仪表只记录八事件的同target/type/callback/capture原生add/remove，仍调用原函数，不替换SDK回调/结果；WeakMap不额外长期持有DOM。其范围为直接view监听，不能外推所有内部订阅/timer普查。composition dispatch只验证应用协议，不是OS IME；原生粘贴/自动填充/undo-redo/移动键盘/SSR hydration明确NOT_RUN。本人未浏览器运行，root仍须绑定候选真实收口。

## 本次复核输入摘要

| 文件 | SHA-256 |
| --- | --- |
| `library.json` | `b11fcfd79cb78c44ff67ca0938304e30fba361f25aa5d6cd0f28ca4781168577` |
| `guide.md` | `d2ec241b13452f9e3987eec5743570c4616ba44c8434d65afe799acef875b6c2` |
| `agent.md` | `8bf055a2bc9d9f4727ca05a6b56994386d3783bcc5f6129b28f00adeb872567b` |
| `examples/example.tsx` | `6b822ac4e253e8490cd549035ea6fc2585f94a856fbc73e236456dfa9b5262a1` |
| `examples/calendar-policy.mjs` | `d9a6b9f89204b3c733a267e5aa1e9d43318502a31a50407c586d1b1fb9300682` |
| `examples/calendar-policy.d.mts` | `8c854201ed8a821443b973f4fdb0f13596086a67863a78747d75f90bbb016bde` |
| `examples/styles.css` | `9b4ae3a0ce2a154d2d4236e5f39d332c95bdaf9186900801a76697158e3d8c0b` |
| `examples/demo.tsx` | `f2284fc30009ceaaf34ecc200ff988948d95eba2717c8cf3ec70a978a2dc4038` |
| `tests/sdk.test.mjs` | `50edd32debfad44ec0a7ce675c9ef5facf13e0e83a7394d6ec8d59177b3e4d44` |
| `tests/calendar-policy.test.mjs` | `2f28563a1ebbd43cda41d91a12579c72edb67bcc6417455b97a33d521c972ad5` |
| `verification.json` | `036046ca84344cd4e2faf30c13a54e1ec632c6bb1a386bc46c1c9b482429c2b7` |
| `local-validation.md` | `918a5bac78706d4cd541bfaf5cac412a91c8b6f61d8e0efab43b96ab0c757788` |
| `official/readme.md` | `6d2a1d25943c4b0f0831d55a7cb566604db9d188a76767aba5efda5c9ba5460c` |
| `official/core-readme.md` | `c3bd23f1220ce2d6ea8c82c8e16748d0afc2d3a7f4b2c34218ffc49022d931ae` |
| `official/source-evidence.json` | `5cc3fc71ec91f67b8a8016325e7f215def80d87c344f4b8b4421cab73cf1f782` |
| `validation/sdk-source-audit.json` | `9b2a01d3e25d4e2e09e1a7e9581bb4ccae8c41f86cdc67963fe057fd26ac8e87` |
| `validation/browser-proposal.txt` | `87d62ab1a0c94b22cd12deb0f01186ab65a1afb6728963440ef9345cdfc568cf` |
| `validation/input-hashes.json` | `6805c56bd68bb7290d70d6276a95778fcaebbdf71d53dfa097197a429a547514` |

本报告是唯一写入；现已停止C06全部写入，等待主控下一任务。


## candidate16 390px 溢出修复独立增量复核

quality_e11非作者，只读复核f05新稳定CSS、mobile-overflow-probe.mjs、red/css-green原始日志与local-validation。仅追加本报告，没有改产品或重跑SDK/policy/浏览器。

**该P2静态修复CLOSED，无新增P1/P2。** styles.css:1–4仅在所属根增加overflow-wrap:anywhere，让普通p中的连续API名通过继承正常断行，没有overflow:hidden/裁切或放宽断言。原固定dist真实red为390px视口、app308/scroll324，唯一越界为value/unmaskedValue/typedValue/isComplete说明p；输入/label未越界。新实际entry CSS叠加相同固定dist的单变量探针，仍用scrollWidth<=clientWidth+1，实得308/308、overflow[]、computed anywhere。探针实际读新styles.css并调用addStyleTag，未替换SDK/输入或伪造尺寸。

scope必须保留：这是candidate16旧dist+实际新CSS的因果验证exit0，不是新构建完整advanced PASS。root下一候选仍须用相同严格390px与原监听/日期/重进断言验收；真实OS IME等剩余不因这一修复关闭。原cleanup文案P2已闭合事实保持。所有C06报告写入现在停止。
