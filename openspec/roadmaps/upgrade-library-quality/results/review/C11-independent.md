复核UTC：2026-11-10T17:06:51.915145+00:00

# C11 react-arborist 独立六项复核

审查者quality_f05，非作者；只写本报告。C15已先保存无生产源改动的中间检查点并暂停。复核实际7源、guide/agent/library/verification、两测试、原始定向日志、官方原文/响应证据、完整提案与直接相关安装源码。未运行SDK、policy、浏览器或任何公共套件，未修改条目运行源/官方资料/共享文件。

## 结论

**未发现需修改运行源的P1/P2。六项作者内容及局部证据静态可接受，真实客户端闭环仍NOT_RUN，待root匹配候选执行。** 不将SDK工具函数/应用模型5项或纯policy5项换算成Tree构造、真实HTML5拖放、焦点、IME、虚拟DOM或完整清理PASS。正式sdk/build/browser三项NOT_RUN正确保留。

| 项 | 独立结论 | 依据/限制 |
| --- | --- | --- |
| 技术准确 | 静态及已有模型证据可接受 | 实装3.16.0/MIT，实际Tree/NodeApi/TreeApi、导出的adjustMoveIndex与共享moveTree合同一致；SDK选择和应用镜像分开。 |
| 解释清楚 | 可接受 | 从data/交互归属讲到三目标、索引语义、name搜索、IME、迁移和成本；当前固定版与main4.x区别清楚。 |
| Demo有用 | 三目标设计完整，客户端NOT_RUN | basic真实选择/导航/恢复，business原生拖放与独立按钮fallback/改名删除，advanced1807模型与小DOM/搜索/滚动。提案覆盖各目标且不mock SDK。 |
| 源码可迁移 | 静态可接受，独立迁入NOT_RUN | sourceFiles包含全部7源，保留CSS和.ts扩展配置说明；未另建DnDProvider或依赖Lab alias/远程资源。 |
| 官方来源可靠 | 当前成功证据可接受 | 固定gitHead与目标manifest3.16.0；无目标包README/中文候选→根英文原文24954B，安装字节相同；官网unknown依据准确。 |
| 结果可复核 | 局部证据可接受，运行闭环NOT_RUN | 作者17内容输入和8安装审计文件本次独立SHA均0差异；SDK5/policy5/strict/格式/metadata原日志真实，原失败保留。 |

## 移动语义与边界

examples/move-tree.ts先读取删除前目标兄弟IDs，调用真实SDK导出的adjustMoveIndex，再withoutIds摘取、insert插回；无picked或目标在摘取后丢失则返原nodes。安装src/data/adjust-move-index.ts:1–44明确onMove.index是删除前槽位，clamp后按slot前dragIds计shift；跨父不在目标siblings内不偏移。src/index.ts:12确实导出该工具，SDK自己的SimpleTree是先插后删，不应二次套相同调整。

原[React,Vite]把React移到Vite后输入index2，经SDK工具成为1。withoutIds在父命中时直接摘整子树、不再下探，因此父子同选只搬一次；移动技术父到其后代时后代随父摘走、insert失败，原树原子保留。缺失目标同样不改变输入。这些是本地合法SDK输入的更新策略，未宣称任意恶意数据、ACL、revision或并发事务校验。

SDK src/interfaces/tree-api.ts:564的canDrop首先拒筛选，拒父拖入后代；onMove仍回传原槽位。应用example.tsx:91–102另外在search非空时拒移动、按钮同步禁用。真实SDK回调来源记sdk，fallback按钮来源记button；后者使用共享更新函数和真实键盘点击按钮，但不冒充SDK键盘拖拽。last-move只证明应用收到的请求类型，不是底层事件计数或服务端成功。

## 选择、恢复与模型观察

实际TreeApi.deselectAll调用setSelection({ids:[],anchor:null,mostRecent:null})，其真实实现会触发onSelect；不是只清应用selected state。example.tsx:81–90恢复按当前level重新initialTree，调用真实deselectAll并清镜像/search/lastMove。advanced恢复仍7+1800=1807，不意外回落7。删除通过公开tree.delete进入onDelete→stripTree→deselectAll；只有activeElement在自有tree host内才安排首节点回焦，按钮删除不抢按钮焦点。焦点实际结果仍需浏览器。

useLayoutEffect通过稳定ref读取SDK可变visibleNodes/filteredCount/selectedIds，nodes/search/selected/epoch为明确失效输入；onToggle增加epoch。局部Biome忽略有解释，不是删除依赖或从静态数组伪造SDK模型。visibleNodes为整份展开/筛选模型，不等于挂载的treeitem数；filteredCount只数真name匹配，祖先不计真匹配。1807是确定性数据规模，不是性能成绩。

## 默认Row与自建IME编辑器

默认SDK DefaultRow保留attrs、innerRef、click和treeitem。自定义TreeNode仅提供style、dragHandle及内容，未替换Row或手工构造树ARIA；children数组与叶子身份保持。安装默认Edit收到Enter直接submit，应用Editor有必要的组合保护。

examples/tree-node.tsx:33–53停止编辑输入键向树快捷键冒泡；组合ref/native isComposing/229阻止submit，候选确认路径不preventDefault；Enter确认保持到keyup释放，普通非Enter清held，compositionend只结束composing而不无条件吞下下一次Enter。普通Enter调用真实node.submit，Escape/blur调用真实node.reset，空名trim→未命名为应用策略。src/interfaces/tree-api.ts:349–367显示SDK提交/取消及临时setTimeout回焦归SDK所有。应用focus/select仅挂载执行，无自建后台timer/全局监听。当前协议不能证明所有OS IME事件顺序，也没有宣称全局资源清理通过。

搜索组合期间只更改draft，compositionend提交search；searchMatch只比name，ID词bulk-1799不是名称。因此“官方”两真匹配加技术祖先，与搜索末尾技术源1匹配的预期合理。

## 复用的检查与官方证据

作者SDK日志exit0/5PASS/0SKIP：前2项实际adjustMoveIndex工具函数，后3项页面共享moveTree经过该真实工具验证同级下移、父子同选及被摘目标失败保留。pure tree-policy日志exit0/5PASS/0SKIP：规模/恢复、改名剪枝及3组共享IME guard；不把这些policy算SDK或OS输入法。没有fakeSDK、替代constructor或预置拖放成功输出。

本次只读标准库独立重算validation/input-hashes.json的17内容项，全部0差异；sdk-source-audit.json的8实际安装文件SHA全部0差异，实装传递依赖react-dnd14.0.5/html5-backend14.1.0/react-window1.8.11与文案一致。没有重跑任何已有有效套件。首轮Biome依赖诊断和最终本地链接自查失败均保留，其定向修正与有效结果边界在local-validation可追溯。

官方jameskerr/react-arborist固定提交 **d74c4ec696ba98c1a4e981075f6d60cdff3e290b**。npm3.16.0 gitHead与同commit modules/react-arborist/package.json匹配；递归树未截断，5候选没有目标包README和中文，回退根README.md合理。原文24954B，SHA256 **0c3ba42abd227ddce29578749b9765b5513797d446cb2d3d2b96281a429fa80a**，本次读取与安装README逐字节一致，没有翻译/格式化覆盖。repo/path/version/language/date/sha绑定齐。

5次真实GET均200，最终URL/日期/已读bodybytes/sha与响应字段保留；官网https://react-arborist.netlify.app由同README指向，最终头无XFO或CSP，Lab-origin实际嵌入未测，所以unknown不升级allowed，也不误记blocked。当前头以字段映射保存，未保留重复同名字段次序，不能倒推补造；该限制不推翻已记录unknown。抓取脚本确实完整获取后双暂存replace、异常独立failed，未有finally毁旧成功对；作者未运行传输fixture且如实说明，本审查不额外请求上游或虚构fixture结果。

## 浏览器提案和剩余

三条完整提案对应真实SDK/DOM：basic默认Row ARIA/方向键/Space、折叠与真实选择清空；business实际HTML5 dragTo进入react-dnd与sdk来源、独立按钮source、同组index2校正、真实Editor键盘/组合协议/取消、SDK Backspace删除与焦点；advanced真实wheel/deep scroll、1807模型/少量treeitem、name-only空态与祖先、筛选禁移动、组合提交、恢复规模、390px及停止/新挂载。不存在mock Tree、直调onMove伪造拖放、替换observer/时钟/DOM或扩大宿主权限。

提案只做静态核对与复用已有strict结果，不保证初始geometry/原生事件在真实浏览器必然通过；root仍需匹配候选执行。节点isConnected=false只证明自有节点卸载，不能当全部SDK DnD/window/键盘timer泄漏普查。真实OS IME、辅助技术/触屏、多树manager、SSR hydration、完整资源/性能、独立迁入仍NOT_RUN。

本报告之外没有条目写入；无遗留P1/P2，待实际browser发现后由原作者定向修。**FINAL INDEPENDENT REVIEW STABLE，停止全部C11报告写入，恢复C15。**

## 独立delta：发布链接、历史头保证与candidate18（2026-11-10T17:48:02.809923+00:00）

root限定交回作者的RECORD/DOC FINAL 17:45:58后，审查者只读复核guide/agent/library/local-validation/verification.notes、实际metadata-check publisher路径、browser-record日志及shared-browser-evidence。**本次限定文档/记录问题已收口，无残留P1/P2；六项本地内容与对应实际运行闭环可接受，正式三个status仍NOT_RUN。** 原报告不删改，后续事实由本delta更新。

**发布链接：** guide中的local-validation/source-evidence私有链接已改纯维护说明，README使用固定提交HTTPS；没有扩大公共私有文件策略。metadata-check实际导入共享resolveDocumentUrl，对guide/agent解析的10个链接断言均可发布；既有browser-record-metadata-final.txt真实exit0/publishedDocumentLinks10，复读实现与日志相符。本次未运行新metadata/SDK/浏览器。磁盘存在不能证明前端可点，后续这类链接以实际publisher为准。

**历史响应头：** guide/agent/library.reason和当前维护记录已把“完整原始响应头”收窄为历史headers字典。dict不能保同名重复项次序/数量，未从字典回填伪造rawHeaders；未来fetch仍只捕获字典的局限明确，未宣称该工具已改为raw列表或已有维护fixture通过。历史官方成功README/5HTTP证据字节不变，保守unknown不推allowed；实际官网展示PASS也不证明iframe内容可嵌入。该处事实边界与已有证据相符。

**保护输入/真实运行：** 审查者标准库只读重算当前17内容输入全0差异；按before-browser-record摘要独立核7运行源+2测试+README+历史source-evidence共11保护项0差异，与作者browser-record-protected-inputs一致。shared-browser-evidence的root日志SHA与实际candidate18/browser.txt匹配，entry完整提案与公共spec逐字节相同。原始整轮8/8中只有C11三目标+固定原文/unknown展示4项计入本条目，C14另4项不混入。固定dist/implicitBuild=false/exit0；真实默认Row ARIA/选择回焦、HTML5拖放与独立button来源、IME协议/改名删除、1807虚拟窗口/name搜索/滚动/390px/卸载重挂均通过。未重跑有效SDK5/policy5/HTTP或真实4case。

六项增量：技术/迁移保持已核源码；讲解和官方入口的发布范围纠正可接受；三个真实目标与官方展示已本地4PASS；可复核性由未变保护输入、实际publisher检查和root日志绑定支持。OS IME、触屏/读屏、多树manager、SSR/独立迁入、全局泄漏/性能与官网真实iframe仍NOT_RUN，不能由节点断开或unknown展示外推。

本次**只追加本报告**，不改作者guide/metadata/源码、其他条目或共享文件。**C11独立delta FINAL STABLE：停止全部报告写入，无后台任务；C17/C15也保持停写供candidate19。**
