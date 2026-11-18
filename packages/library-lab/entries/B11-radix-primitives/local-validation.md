# B11 Radix DropdownMenu 本地质量整改

当前检查点：**STABLE，停止本条目所有写入，交主控独立review与真实浏览器**。正式verification的sdk/build/browser均NOT_RUN，没有正式收据。

## 基线、范围和文件

- 实际仓库 `/home/lambert/githubRepos/lambert/ReactLoom`，定向检查cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。
- 全工作区已有其它工作者dirty成果；本条目开始无已有diff，原10文件相对路径排序/path NUL/bytes NUL摘要`baf702f5d4ca80284e42674dad4213fcb12f80c1f5ff67d31fa7280f781e8cc3`（validation/baseline.json）。保留其它所有改动，仅写entries/B11-radix-primitives，不动公共src/scripts/e2e/deps/锁/索引/队列/results，无提交推送。
- 已读根/包/条目AGENTS、library/guide/agent/examples/tests/verification、COORDINATION/IMPLEMENTATION/REPAIR、质量roadmap与quality skill references；保留recreated/ORIGINAL_RECOVERED、原3目标和有效真实Radix/排序/锁定守卫。两次主控冻结期间只读研究，明确release后才写。
- 修改example/guide/agent/library/verification、dropdown.css；原demo与feed-policy/tests正常排版并增加可见选择helper/断言。新增SDK suite、official原文/来源/完整头、validation baseline/脚本/日志/完整提案和本记录；AGENTS不改。没有全目录generate/typecheck/build、隐式build或作者浏览器运行。

## 六项结论

| 维度 | 状态/层级 | 依据和边界 |
| --- | --- | --- |
| 技术准确 | PASS（匹配类型/源码与局部真实SSR） | 实际DropdownMenu/Menu均2.1.25，Root/asChild/受控item/Sub/Portal对应；SSR2只静态语义，客户端行为待browser。 |
| 解释清楚 | PASS（静态） | 三目标明确触发与回焦、复选单选与列表、子菜单与可见身份；关闭默认/显式preventDefault、SDK/fixture/权限界限讲清，无未实现Dialog堆砌。 |
| Demo有用 | NOT_RUN（真实浏览器） | 3目标、真实API与状态控件齐，源码严格类型0；Portal/键盘/typeahead/focus/窄屏/卸载仍待主控。 |
| 源码可迁移 | PASS（静态/类型） | 4实际sourceFiles齐含CSS，Portal命名空间样式、稳定id/原生button、无自制document监听/宿主alias。 |
| 官方来源可靠 | PASS（公开映射/固定原文/HTTP） | npm公开provenance映射commit并实际核目标package2.1.25；原文106B/hash一致、完整树无中文；官网200全头unknown；没有加密签名验证假声明。 |
| 结果可复核 | NOT_RUN（整体客户端运行） | 精确命令/cwd/exit与原始txt齐；SDK2/policy6分开；完整Playwright提案仅静态通过，正式状态不伪造。 |

## 已确认问题和实现

- 原guide声称Radio选择不关闭，但原RadioItem没有preventDefault。现Checkbox与两个RadioItem均显式onSelect.preventDefault；实际Menu内部composeEventHandlers(checkForDefaultPrevented=false)仍调用onCheckedChange/onValueChange，阻止的是默认关闭。
- 原删除从未过滤feeds挑下一行，可能在unread/saved视图选择隐藏记录。新增chooseVisibleFeedId：保留仍在实际visible集合的当前ID，否则按同一过滤/排序/pins取首项，空集合为''；删除与scope变化使用它。正文/操作/新policy覆盖“只剩隐藏design却应无选择”。
- 基础详情不再假说打开窗口：把实际当前title/unread/saved写HTML；重命名只改标题、不改业务id。textValue=details/rename由真实SDK提供D/R typeahead别名，不注册全局快捷键。
- advanced本地lock保留SDK disabled+removeCurrent/deleteFeed守卫，不当服务端授权。空集合禁用详情/重命名/置顶/删除，仍可清scope或恢复三条fixture；恢复清pins/sort/scope/选择，lock保留。
- Root受控open、asChild单button、两层Portal、稳定feed.id与原过滤排序保留。菜单使用SDK aria-labelledby关联，主menu名“更多操作”、子menu“更多筛选”；移除会被该关联优先覆盖的多余aria-label。CSS保留公开data属性/命名空间，加可用高度滚动和窄屏边界，不复制Lab公共样式。
- 触发器持续存在，所以关闭回焦由Radix处理。无手写timer/全局键盘/焦点陷阱/网络或异步确认；SDK管理自己的浮层/Portal/交互范围，卸载自己子树而非全站清理。

## 匹配版本与官方原文

实际@radix-ui/react-dropdown-menu与委托@radix-ui/react-menu均2.1.25，MIT；React/ReactDOM peer支持^16.8/^17/^18/^19及19rc，当前19.3.0满足，不把peer声明当跨版本已测。安装类型/编译JS核对Root/Trigger/Content/Sub、onSelect关闭分支、Checkbox/Radio回调与公共CSS变量。在线官网可能用统一radix-ui包，当前不额外引入它。

未发现精确scoped2.1.25 tag，npm版本JSON gitHead为空。公开npm attestations的SLSA provenance记录该发布workflow stable引用，resolved dependency gitCommit=**8f50071238d5d58bacf11910bf04a51c517c6299**；又实际读取该commit的packages/react/dropdown-menu/package.json核version2.1.25。只是公开JSON映射核对，**cryptographic signature verification NOT_RUN**，没有宣称供应链签名已验证。registry/provenance/workflow/invocation URL保存在official/source-audit.json。

完整recursive tree truncated=false，实际65个README候选无官方中文。选择目标`packages/react/dropdown-menu/README.md`原文，106B，SHA-256 `7d715ed849386dad4615d5624cc5c694564155174c315de736c142a3f1c59317`；其本来是官方文档短指针，未用AI讲解替换、拼接或翻译原文。repo/ref/path/lang/version/time在source-audit与library.json，同步`2026-11-10T13:38:02.796922+00:00`。

官网`https://www.radix-ui.com/primitives/docs/components/dropdown-menu`于`2026-11-10T13:38:02.796937+00:00`实际GET200，完整最终响应头在official/homepage-response.json，该次XFO/CSP均null；未读body、未从Lab origin跑iframe，unknown与直达，不能从200推定allowed。只读阶段返回内容缓存工具内存，candidate11 release后才写快照。

## 实际定向检查

cwd均为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，日志含精确命令/退出码/原始输出。不运行全目录generate/typecheck/build或公共E2E。

| 命令 | exit/结果 | 原始日志 |
| --- | --- | --- |
| `node --test entries/B11-radix-primitives/tests/sdk.test.mjs` | 0，2/2真实SSR | validation/sdk.txt |
| `node --test entries/B11-radix-primitives/tests/feed-policy.test.mts` | 0，6/6纯policy | validation/policy.txt |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B11-radix-primitives/examples/demo.tsx` | 0，最终入口 | validation/typecheck.txt |
| `pnpm exec biome check --write entries/B11-radix-primitives/examples entries/B11-radix-primitives/tests entries/B11-radix-primitives/validation/check-entry.mjs entries/B11-radix-primitives/library.json entries/B11-radix-primitives/verification.json entries/B11-radix-primitives/official/source-audit.json entries/B11-radix-primitives/official/homepage-response.json` | 0，11文件；原2处important警告随后单独消除 | validation/biome.txt（同原biome-initial.txt） |
| `pnpm exec biome check entries/B11-radix-primitives/examples/dropdown.css` | 0，无警告/修复 | validation/css-format-final.txt |
| `node entries/B11-radix-primitives/validation/check-entry.mjs` | 0，3目标4source/metadata/原文hash | validation/metadata.txt |
| `pnpm exec biome format --stdin-file-path=entries/B11-radix-primitives/validation/browser-proposal.ts < entries/B11-radix-primitives/validation/browser-proposal.txt` | 0 | validation/proposal-format.txt |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node entries/B11-radix-primitives/validation/.browser-proposal-check.ts` | 0，临时同内容.ts已删除 | validation/proposal-typecheck.txt |
| `git diff --check -- entries/B11-radix-primitives` | 0 | validation/diff-check.txt |

SDK2真实导入组件与React SSR：closed Root/Portal不在SSR渲染，asChild只一个原生button与ARIA；另一个用公开forceMount且不放Portal的inline Content仅检查静态checkbox/radio/disabled语义，**不是生产Demo Portal路径**。无fake SDK/DOM、force-exit或跳过占位。policy6仅数组/过滤/排序/锁定/可见回落，不证明键盘。原CSS两处important优先级无需保留，单改CSS后只重查该文件，不重跑无关SDK/policy/type。

只读研究曾用require.resolve(package.json)触发exports限制，改为解析实际入口目录读取package信息后成功；这是资料读取，不当作SDK运行结果。没有隐藏测试失败或把库可import写成动画/交互PASS。

## 浏览器交接与未测

validation/browser-proposal.txt为3项完整@B11真实Playwright源码，格式/类型通过但未执行。无SDK mock、page.route、自制菜单或假Getter：

1. 原生asChild button、ArrowDown首项、Esc回焦、R typeahead定位重命名/Enter执行、稳定ID与原行DOM、实际详情HTML。
2. Checkbox/Radio真实aria-checked、显式菜单保持、pins/两排序实际order、原行DOM复用，Esc回焦。
3. 原生锁定disabled+End跳过、Right/Left子菜单双Portal、unread删除回落/隐藏行不选/空态/清scope恢复、窄视口真实geometry；打开子菜单时browser Back经同文档SPA history回Agent，观察Portal移除/body pointerEvents还原，再重进和停止。

定位b11-workshop的data-open/scope/sort/selected/count/visible/order；b11-trigger/feeds/selected/status；频道button[data-feed-id]。菜单name由SDK触发器关联为更多操作/更多筛选。控件名与guide/agent/提案一致。触发器不会被删除，不演示不存在的丢失触发器回焦。

未测：真实Portal/键盘/typeahead/焦点、窄屏/资源清理、原生读屏/触摸/IME、SSR hydration、真实后端权限/异步确认、完整资源计数和官网iframe。无额外公共接线/依赖需求，正式三项保持NOT_RUN。主控匹配候选独立review/browser后另行记录，STABLE不等于content_done。

## 主控candidate12真实闭环

真实Radix三个目标+官方展示4项PASS：asChild按钮无嵌套、原生Arrow/typeahead与本地动作/关闭回焦；Checkbox/Radio真实controlled状态更新并保持菜单；真实嵌套Portal、disabled键盘跳过、过滤删除fallback只在可见集合、窄屏及SPA Back卸载Portal/真实焦点。SDK SSR2仅markup与policy6另记。

非作者六项无P1/P2。原三个测试都误按菜单裸名精确查找，实际SDK aria-labelledby在隐藏背景上下文给出“更多操作 ▾”；按真实可读触发器名及可选装饰字符观察后3项全部PASS，没有改生产源码或弱化交互断言。官方provenance定位固定2.1.25源码，但未冒称签名验证。

候选2298输入SHA611cb29d104643bf85ae397fdac06a64146259d4b28b5d85278e6264738d3063，lint/type/build/catalog全部0、stability=[]，browser固定dist无隐式build，实际argv/cwd/exit/产物在docs/library-lab/evidence/quality-upgrade/candidate-12。初次16项10PASS6FAIL、观察修正retry5项5PASS，各条目实际范围单独计；不隐瞒他库失败也不重跑本条已通过项。非作者六项与本地运行闭环，正式sdk/build/browser仍NOT_RUN，等待授权干净提交及recorder，不擅自提交以解锁。
