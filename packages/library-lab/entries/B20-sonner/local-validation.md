# B20 本地质量整改与验证边界

2026-11-10，quality_e11独占B20，实际cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。candidate13构建释放后实施。原10文件无初始条目diff，原SHA/问题/目标见[baseline.json](validation/baseline.json)。共享dirty仓库保留他人工作；本轮只写B20，另按授权只追加B12独立review，不改公共src/scripts/e2e、依赖锁、索引、队列/results，不提交推送。

## 基线问题与实际改动

保留原三目标、真实Sonner调用、两个LatestRunGuard、timer集合和owned id清理。真实2.0.8源码的同id更新合并旧props，原loading duration Infinity在success/error时未覆盖，导致终态也不会自动关闭；现两条终态显式duration3500。固定Toaster id原本会使多实例共用路由，现useId生成实例id，所有本实例toast携带同toasterId。公共level变更主动重置本地工作坊并清上轮资源。

源码正常排版并补必要局部CSS；可见业务status与真实SDK返回id历史读数分离。Toaster中文区域名/关闭按钮、hotkey空数组不抢全局Alt+T。SDK真实JS会注入官方CSS，旧“依赖宿主引CSS”和Portal能力声明已纠正；该版Toaster在组件树内渲染，不用createPortal。visibleToasts只是可见堆栈、onDismiss不等于严格用户确认等说明同步修正。

同id/有限终态是实际产品问题；本轮Node SDK store断言支持其合并行为，但修正后DOM自动关闭仍待root真实浏览器，不能提前写成运行闭环。

## 六项状态

| 维度 | 当前状态/层级 | 证据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（静态匹配2.0.8/真实局部SDK） | Toaster过滤、自动CSS注入、无createPortal、同id配置merge和Infinity优先级均核对实际类型/JS；Worker内真实SDK2/2。此结果不证明Toaster客户端渲染/计时/焦点。 |
| 解释清楚 | PASS（作者静态） | 通知与业务、一次撤销、异步输入快照/同id/取消三个独立目标有明确中文操作结果；本地900ms fixture不是HTTP，关闭不是取消或业务补偿。独立review待root。 |
| Demo有用 | NOT_RUN（真实浏览器） | 三目标保留并完善真实控件/持久反馈；3条完整Playwright提案就绪。实际皮肤、action/键盘、有限时长、取消、窄屏和卸载由root统一执行。 |
| 源码可迁移 | PASS（静态/条目strict类型） | 四生产sourceFiles含入口/实现/守卫/必要CSS，移除误列的纯规则测试；无Lab alias/外部资产/网络。只清owned id与本地timer，保留独立撤销和任务代际，SDK共享style/store不全清。 |
| 官方来源可靠 | PASS（固定原文/实际HTTP） | 官方v2.0.8 tag6739aca… manifest2.0.8；英文README867B/hash与完整tree无中文有据。npm gitHead ecce184… manifest2.0.7差异明确保留，两个commit README/state.ts字节一致。官网完整头无XFO/CSP仍unknown，不冒称allowed。 |
| 结果可复核 | NOT_RUN（整体客户端运行）；局部日志PASS | SDK2/规则6/类型/metadata/提案检查实际exit0，首次Biome失败与最小修正保留，cwd/argv/time/exit/stdout日志齐；formal sdk/build/browser全NOT_RUN，未冒充正式收据。 |

## 匹配SDK与资源所有权

实装sonner2.0.8、MIT，React/DOM peer18/19系列，Lab19.3.0。[sdk-source-audit.json](validation/sdk-source-audit.json)保留实际安装位置、package/类型/ESM/CJS/官方CSS五摘要和关键源码摘录。更新逻辑展开旧toast再展开data，故省略duration保留Infinity；Toaster duration只在toast没有duration时兜底。toast testId是公开SDK选项，节点data-type/真实DOM身份用于提案，不伪造SDK输出。

应用拥有React saved/result、最后创建id历史读数、两个guard、自有900ms timers及创建过的id登记。重复任务先新token再clearPending；shouldFail启动时捕获；undo先检查当前token再消费。取消/cleanup invalidate两个guard、clearTimeout、逐id dismiss，不使用无参数toast.dismiss()。自然退场后的历史id登记不被误当活跃账本，卸载也只在本实例范围关闭；不删其他模块通知、SDK全局store或CSS。

Node没有浏览器RAF，本轮不填fake RAF来测试dismiss。真实SDK测试在自己创建的Node Worker中调用实际安装包，回传真实getToasts记录，错误/5秒超时失败，finally清自有timeout并终止worker。没有process.exit、force-exit、SDK mock或浏览器替身；正常node --test自行exit0。2项分别证明旧Infinity合并保留、显式有限终态同id更新且其他container的独立记录不变。它不证明Toaster路由渲染、dismiss或自动关闭。

既有6项纯规则只验证LatestRunGuard、一次撤销和实例独立；没有重写/伪造Sonner。格式化后执行一次6/6，不把它们叫SDK运行。

## 实际命令与日志

所有下面命令实际cwd均为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；通过validation/run-local.py或等价subprocess捕获真实输出。完整记录见[local-runs.json](validation/local-runs.json)，这里列被执行argv，非推测命令。

| 实际命令 | exit | 原始日志 |
| --- | --- | --- |
| `python3 entries/B20-sonner/validation/fetch-official.py` | 0 | [official-fetch.txt](validation/official-fetch.txt) |
| `pnpm exec biome check --write entries/B20-sonner/examples entries/B20-sonner/tests entries/B20-sonner/library.json entries/B20-sonner/verification.json entries/B20-sonner/official/source-evidence.json entries/B20-sonner/validation/metadata-check.mjs entries/B20-sonner/validation/sdk-source-audit.json` | 1 | [biome.txt](validation/biome.txt) |
| `pnpm exec biome check entries/B20-sonner/examples/example.tsx` | 0 | [format-fixed.txt](validation/format-fixed.txt) |
| `node --test entries/B20-sonner/tests/sdk.test.mjs` | 0 | [sdk.txt](validation/sdk.txt) |
| `node --test entries/B20-sonner/tests/latest-run.test.mts entries/B20-sonner/tests/undo-ownership.test.mts` | 0 | [policy.txt](validation/policy.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B20-sonner/examples/demo.tsx` | 0 | [typecheck.txt](validation/typecheck.txt) |
| `node entries/B20-sonner/validation/metadata-check.mjs` | 0 | [metadata.txt](validation/metadata.txt) |
| `pnpm exec biome check --write entries/B20-sonner/validation/browser-proposal.check.ts` | 0 | [proposal-format.txt](validation/proposal-format.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node entries/B20-sonner/validation/browser-proposal.check.ts` | 0 | [proposal-typecheck.txt](validation/proposal-typecheck.txt) |

首次Biome12文件exit1且已经格式化10文件，唯一错误是level重置effect“多余依赖”。删除该依赖会破坏迁出Lab后public level变更的重置契约；现在精确注明这一意图，针对受影响1文件check exit0，其他已检查项未再改。没有unsafe删除依赖，也没有隐藏首次失败。严格类型和SDK/规则随后运行，结果有效；不为文档收尾重复套件。

提案.txt原样复制为同目录browser-proposal.check.ts，Biome整理后同步回.txt、strict tsc通过，随后删除临时.ts。没有第二套运行Demo或全目录generate/typecheck/build；没有修改宿主/环境。

## 官方原文与官网

原[README](official/readme.md)固定 `emilkowalski/sonner@6739aca5f668a33a4fd1d2fd9f758dff95c57466/README.md`（v2.0.8），英文867B，SHA-256 `0809d104ce28f9c14b3b1e73257d93096f96134d2a5f2f225e5abf38b1aa4549`。原文不交格式器；tree未截断，仅根README与test/README，无中文候选。

npm2.0.8 gitHead为ecce1841c55e4a72dfe139a8992b56498660125e，其manifest仍2.0.7；tag commit manifest2.0.8。两个commit的README和src/state.ts原文字节一致，不能捏造gitHead/tag完全相同或删除不利版本证据；展示以匹配version的官方tag为固定锚。10个匿名GET的完整headers/最终URL/status/bytes/hash、源码比对与同步UTC在[source-evidence.json](official/source-evidence.json)。

官网 `https://sonner.emilkowal.ski/` GET200、完整头无X-Frame-Options和Content-Security-Policy，两字段明确null；Lab-origin实际iframe未运行，所以unknown。没有把GitHub/raw头冒充官网，也没有改宿主frame-src。

## 浏览器提案、控件与剩余

完整[三case Playwright源码](validation/browser-proposal.txt)，没有SDK/RAF/clock mock、page.route、假DOM事件或截图代替结果。root对稳定候选统一接公共e2e：

- basic实际toast/中文live区域/真实fixed皮肤，键盘关闭和真实自动关闭；业务反馈及历史id仍在。
- business真实action键盘撤销、连续保存只保留最新action、一次消费；关闭通知不改已保存。过期闭包强行调用属于已有纯guard测试范围，不force-click隐藏旧action冒充用户行为。
- advanced真实900ms输入快照、同一个真实loading节点/同id更新success与error并在有限时长后移除，390px实际geometry；再次运行/取消后超过原timer不回写，待处理任务下SPA Back卸载并不复活、重进默认状态。

区域“Sonner 通知真实示例”，b20-workshop/data-level。真实Toaster区域“本演示通知”，关闭按钮“关闭通知”，action“撤销”；业务按钮“触发订阅成功提示”“保存新闻并显示撤销”“运行异步反馈”“取消并清理本演示”，复选框“模拟业务失败”。b20-result/b20-saved业务状态，b20-toast-id是SDK返回的历史id；真实[data-sonner-toast]的data-type与节点身份验证更新。

**未测**：本轮所有真实浏览器路径（包括皮肤、客户端倒计时、focus/action/dismiss、窄屏、待处理卸载）、读屏公告、真实触屏滑动、OS可访问性、SSR hydration/Shadow DOM、多容器并存实际DOM、真实HTTP取消/错误/后端补偿。SDK store与pure guard、共享build都不能替代这些。正式三项仍NOT_RUN；无新增公共依赖/接线需求。

## 变动文件

修改library/guide/agent/verification、examples/example.tsx；demo/latest-run和原两policy测试仅正常排版，guard算法未改。新增sonner-demo.css、真实SDK测试、official原文/完整证据、validation基线/源码审计/fetch/metadata/执行包装/日志/三提案。AGENTS保留，最终声明输入摘要在validation/input-hashes.json。最终STABLE后停止所有写入。

最终补充：`git diff --check -- entries/B20-sonner`，同Lab cwd，exit0，原始[diff-check.txt](validation/diff-check.txt)。运行源码/SDK测试在上述有效检查后未再改。FINAL STABLE：`2026-11-10T14:29:43.620935+00:00`，全部材料完成，真实browser仍NOT_RUN；停止包括日志/文档在内的全部写入。

## 主控candidate14真实闭环

真实Sonner三个目标+官方展示4项PASS：真实通知CSS/关闭/自然自动关闭与持久业务反馈；最新保存拥有单步undo，关闭不撤销；真实同id同节点loading→success/error显式3500ms、输入快照/取消/新运行归属/待决卸载/窄屏。Node真实SDK Worker store2与guard/undo policy6有效局部结果复用。

非作者六项无P1/P2：安装源码确认same-id merge会保Infinity，终态显式duration实际自然关闭通过；Toaster非Portal/SDK自动CSS说明准确，useId实例路由/逐owned dismiss/timer取消正确，不全清他人通知。npm-head版本2.0.7与匹配2.0.8tag差异及README/state字节相同事实完整记录，未冒称精确commit相同。

候选2423输入SHA8202199ea4076e8df8e69be8c7156aee6698716329c1b2ac190d1d43c97a657f，type/build/catalog全部0、stability=[]；公共e2e lint有效PASS复用，B19源level定向lint0。browser.txt共15项14PASS1FAIL，本条受影响/首次用例完整通过；其他B19展示失败保留独立修复，不能代替或抵消本条证据。正式sdk/build/browser仍NOT_RUN，不为记证提交。之后公共HTML-only README安全fallback不改本条SDK/普通Markdown路径，targeted22单元通过、匹配公共浏览器另验，未扩推为逐库SDK结果。
