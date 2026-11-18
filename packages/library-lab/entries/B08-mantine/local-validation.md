# B08 Mantine 本地质量整改记录

当前检查点：**最终STABLE；停止条目所有写入，交主控独立review与真实browser**。正式verification三项sdk/build/browser仍为NOT_RUN，本记录不是正式收据。

## 对象、范围与基线

- 实际仓库 `/home/lambert/githubRepos/lambert/ReactLoom`；所有定向检查cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。
- 原9文件开始无本条目diff；相对路径排序、path NUL / bytes NUL摘要`032361bbcfbad5410447f8b13e90d7bb385e1bb5be381cbf2c6f7c253e4564a6`，见validation/baseline.json。
- 独占B08并保留他人修改；保留recreated/ORIGINAL_RECOVERED与原有效history策略。无公共src/e2e/deps/锁/索引/queue/results写入，无提交/推送/发布，无全目录generate/typecheck/build或隐式browser build。按主控短暂停写一次，明确release后才继续。
- 读取适用AGENTS、library/guide/agent、实际所有examples/tests/verification，以及COORDINATION/IMPLEMENTATION/REPAIR、质量roadmap与quality skill三份references。历史研究材料不当指令或PASS。
- 修改example/guide/agent/library/verification；demo/feed-history/原history测试仅正常排版。新增local-color-scheme.ts、styles.css、SDK suite/manager policy、official三份原文与来源/官网头、validation脚本/日志/完整提案和本记录。未改AGENTS。

## 六项结论

| 项目 | 状态与层级 | 依据和边界 |
| --- | --- | --- |
| 技术准确 | PASS（匹配源码/类型、局部SSR） | core/hooks9.7.3，React^19.2 peer；真实Provider/NumberInput/useDebouncedValue类型与源码核对，SDK2只SSR/初值，客户端仍待browser。 |
| 解释清楚 | PASS（静态） | 三目标按输入/操作/API/结果讲述，草稿与提交整数、局部主题/官方CSS全局基础层、Portal/资源归属明确；无未挂载form/网络教学堆砌。 |
| Demo有用 | NOT_RUN（真实浏览器） | 三独立目标与观察控件齐、入口strict类型0；计时/NumberInput/Portal/focus尚待主控。 |
| 源码可迁移 | PASS（静态/类型） | 五必要sourceFiles齐、独立CSS、公开内存manager、实例主题选择器和真实Portal目标；不依赖宿主alias或env=test。 |
| 官方来源可靠 | PASS（固定原文/完整HTTP） | 9.7.3包路径优先原文343B，hooks334B/root3799B另存；完整tree无中文候选；官网200全头unknown。 |
| 结果可复核 | NOT_RUN（整体运行） | 精确cwd/命令/exit/原始txt齐；SDK2与policy4分层，完整Playwright仅静态通过；不伪造正式PASS。 |

## 三目标与修正

1. basic保留工作区受控输入、Badge/output与确认Alert，空白disabled；编辑清掉旧成功态。primaryColor=teal来自真实Mantine主题。
2. business保留三行fixture、useDebouncedValue(filter,150)、稳定id表格Switch、rows/before原子一步撤销；新增草稿/已生效值和零匹配恢复观察。不把150ms当网络或精确绘制性能。
3. advanced保留真实Modal和number|string草稿。decimalScale从0改2，使小数实际可进入后由validQuota拒绝，而非输入层吞掉小数后假称验证。clampBehavior=none、min/max1/100；空/减号/小数/越界不写历史，error关联NumberInput并有Alert摘要。合法form submit写配额；同值明确提示不变且不造历史，取消/Escape丢草稿，再开从已保存值加载。

Provider的原默认getRootElement/documentElement和:root变量会影响宿主。现以useId定位本例根，getRootElement、cssVariablesSelector收束颜色方案属性/可配置变量；公开内存colorSchemeManager只存当前实例值，不碰宿主localStorage。无外部存储事件源，subscribe/unsubscribe无需资源；不是SDK替身。withGlobalClasses=false。Modal继续真实Portal并target同一实例根，继承变量；没有env=test、禁Portal、强制焦点绕过或自制假弹层。

官方styles.layer.css原入口保留，文件含文档级基线/默认变量，**不声称完整CSS隔离或ShadowDOM**。Modal滚动锁仍可能在打开时暂改body，应由SDK子树清理；本次没有全局清存储/全局destroy。默认Modal焦点陷阱/returnFocus/data-autofocus与中文关闭标签保留。应用只拥有selected/draft/error/history；useDebouncedValue拥有timeout且新值/卸载cancel，安装源码已核，无额外手写timer。

## 实际版本与官方来源

安装core/hooks均9.7.3、MIT；core peer hooks=9.7.3且React/ReactDOM^19.2.0，hooks React^19.2.0；宿主React19.3.0。在线官网已9.8.0，关键API按安装9.7.3类型/源码和固定tag核对。未使用form/notifications/modals包，不宣称其模式已实现。

仓库mantinedev/mantine，tag9.7.3固定commit **`2d0a040f42011e791caf0bc56b9fbdd36ce55cef`**。完整递归tree truncated=false，实际36个README候选无官方中文。目标core与hooks package.json均核版本9.7.3及peer。同步时间`2026-11-10T13:15:19.335704+00:00`，repo/path/lang/version/date/hash/完整候选在official/source-audit.json和library.json。

| 原文文件 | 固定上游路径 | 字节 / SHA-256 |
| --- | --- | --- |
| official/readme.md | packages/@mantine/core/README.md | 343 / ffeb75cfc038afa93c1620b9b87fdb478c0e9239213459d2c37970ef1155cac5 |
| official/hooks-readme.md | packages/@mantine/hooks/README.md | 334 / 2d84a962bf521e3080ff3662c8c8cd99749373a5391335cd65fef9b734da9c22 |
| official/project-readme.md | README.md | 3799 / ed3f723d83c74199aca418eb2a277f2e5ad3d34442a69fb2e9690cce3572f15e |

原文分别完整保存，不翻译覆盖或拼接。官网https://mantine.dev/在`2026-11-10T13:15:48.918307+00:00`实际GET200，最终URL同请求；完整头保存在official/homepage-response.json，该次XFO/CSP为null，未读body。Lab origin iframe未测，unknown，不从缺少头推定allowed。

## 公共scope路径校验缺口的真实处理

首次metadata exit1为invalid official README metadata（原日志metadata-initial.txt），原因是公共official-sources.mjs的README path正则不允许合法@mantine目录。主控曾请求冻结，我立即停所有写入并只读给出规则位置；主控明确release并负责公共RED→GREEN修复。没有伪造无@路径或换原文规避，条目只将sourceUrl对应段严格编码为packages/%40mantine/core/README.md，path仍保留上游原样。

主控报告公共official-sources/document-utils16/16通过；这不是本工作者执行的套件。条目在规则修复后仅重查两JSON格式与metadata，均0；原文bytes/hash和生产源未变，未重跑无关SDK/policy/type。公共校验源码/测试没有本工作者写入。

## 实际定向命令与日志

cwd全部为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；原始日志包含命令/退出码/输出。没有mock SDK、fake DOM/RAF、force-exit/process.exit。

| 命令 | exit / 实际结果 | 日志 |
| --- | --- | --- |
| `node --test entries/B08-mantine/tests/sdk.test.mjs` | 0，2/2真实SSR/初值 | validation/sdk.txt |
| `node --test entries/B08-mantine/tests/feed-history.test.mts entries/B08-mantine/tests/local-color-scheme.test.mts` | 0，4/4纯policy | validation/policy.txt |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B08-mantine/examples/demo.tsx` | 0，最终生产入口 | validation/typecheck.txt |
| `pnpm exec biome check --write entries/B08-mantine/examples entries/B08-mantine/tests entries/B08-mantine/validation/check-entry.mjs entries/B08-mantine/library.json entries/B08-mantine/verification.json entries/B08-mantine/official/source-audit.json entries/B08-mantine/official/homepage-response.json` | 0，13文件 | validation/biome.txt |
| `pnpm exec biome check --write entries/B08-mantine/library.json entries/B08-mantine/official/source-audit.json` | 0，sourceUrl编码后的两文件 | validation/metadata-format.txt |
| `node entries/B08-mantine/validation/check-entry.mjs` | 0，3目标5source、metadata/三原文hash | validation/metadata.txt |
| `pnpm exec biome format --stdin-file-path=entries/B08-mantine/validation/browser-proposal.ts < entries/B08-mantine/validation/browser-proposal.txt` | 0 | validation/proposal-format.txt |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node entries/B08-mantine/validation/.browser-proposal-check.ts` | 0，临时同内容.ts已删除 | validation/proposal-typecheck.txt |
| `git diff --check -- entries/B08-mantine` | 0 | validation/diff-check.txt |

SDK2真实导入core/hooks，React SSR验证scoped Provider生成变量、静态控件与NumberInput值、hook初始debounced值；未执行当前TSX客户端交互、Modal Portal/焦点/实际timer。policy4仅原history/配额边界与独立内存manager，不证明DOM运行。格式/metadata变化按影响复查，未重复有效测试。正式verification全NOT_RUN。

## 浏览器交接与剩余

完整3条@B08在validation/browser-proposal.txt，格式/类型通过但本工作者未运行。真实SDK/native事件，不用env=test/page.route或伪样式：

1. 先从Agent页签捕获documentElement颜色方案属性，再真实切Demo；观察局部根light/实际teal CSS、工作区空白disabled/键盘确认/编辑清成功、停止后documentElement属性不变。不能据此宣称全部CSS隔离。
2. 真实Switch键盘与一次撤销、保留未过滤行DOM身份、草稿/实际debounced筛选和零匹配恢复、待处理筛选时卸载重进；不承诺恰好150ms绘制。
3. 真实Portal在自有根，实际变量继承；同值不记历史；空/减号/0/101/1.5保存保持弹层/aria-invalid/业务quota15/无快照；100键盘提交、回焦、撤销、Escape丢草稿；打开Portal时用真实browser Back经同文档SPA历史回Agent，检查React卸载，再重进默认和停止。

定位b08-workshop data-filter/selected；b08-table行data-feed-id/quota/enabled；b08-count/filter-draft/filter-applied；Portal内b08-quota-draft。控件工作区/确认工作区、筛选订阅/撤销上一次、前端实践 状态Switch、编辑 前端实践 配额、每小时请求上限/保存配额/取消编辑/关闭配额编辑。路由`/libraries/mantine?tab=demo&example=basic|business|advanced`。

未测：实际浏览器NumberInput/计时/Portal/焦点/卸载、完整body滚动锁/监听计数、原生OS IME/触摸/读屏、SSR hydration、完整CSS隔离、性能、后端、官网iframe。无额外公共接线需求；scope README公共需求已主控处理。候选构建和browser由主控统一执行，不把SSR2/policy4或共享build当逐库正式PASS。


## candidate10增量：真实CSS级联失败与事件快照修正

主控candidate10真实B08结果：basic失败，原teal断言预期rgb(18,184,134)，实际rgb(255,254,251)；business与advanced在当时候选通过。原始日志`docs/library-lab/evidence/quality-upgrade/candidate-10/browser.txt`保留失败。本工作者暂停尚未写入的B11，按主控独占授权只修B08，未变更公共CSS或测试期望。

真实Chromium读取固定dist匹配规则确认根因：主题变量--mantine-primary-color-filled仍#12b886；无层Lab button/select规则background:var(--paper)、border/padding及font覆盖@layer mantine。首轮`css-cascade-diagnosis.txt`用临时all:revert-layer探针验证层级，未作为最终代码；主控要求收窄后，实际源码仅对公开mantine-UnstyledButton-root恢复font/background/border/border-radius/padding/cursor/opacity，对mantine-Input-input恢复font。没有all重置display/尺寸/焦点，没有硬编码主题色、换无层全量CSS或改宿主。

`validation/css-property-probe.txt`记录普通node+真实Playwright启动独立Chromium（cwd Lab、exit0），加载固定候选dist，再临时注入与最终styles.css同字节候选CSS作级联诊断；**这不是新源码构建后的浏览器PASS**。实际computed：系统light/dark两偏好下本例forceLight均为teal rgb(18,184,134)，背景hover rgb(12,166,120)，disabled为rgb(233,236,239)/opacity1/cursor not-allowed，真实Tab焦点outline rgb(50,109,204) solid3px，宿主外按钮背景前后均paper不变。未配置Mantine暗色算法，不把OS dark下仍强制浅色当成暗色主题已验。

非作者e05另指出P2：我在内联Switch updater时引入了延迟读取event.currentTarget.checked，可能在返回/重放时为null。现在onChange立即捕获const enabled，再闭包传原始布尔值；history策略未改。CSS/handler影响三个场景，下个稳定构建由主控定向重跑B08三case，candidate10两项历史PASS不升级当前修正后的运行状态。

新增实际检查（cwd均Lab）：

| 命令 | exit | 日志/界限 |
| --- | --- | --- |
| `node --input-type=module -e <真实Chromium computed/style规则诊断脚本>` | 0 | validation/css-cascade-diagnosis.txt，完整argv；初始all临时探针仅历史诊断 |
| `node --input-type=module -e <最终逐属性CSS的真实Chromium探针>` | 0 | validation/css-property-probe.txt，完整argv/读数；临时注入，不冒充已build候选PASS |
| `pnpm exec biome check --write entries/B08-mantine/examples/styles.css entries/B08-mantine/examples/example.tsx` | 0 | validation/css-handler-format.txt，两文件无诊断 |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B08-mantine/examples/demo.tsx` | 0 | validation/css-handler-typecheck.txt |
| `git diff --check -- entries/B08-mantine` | 0 | validation/diff-check.txt，增量更新 |

只修example.tsx/styles.css并同步guide/agent/本记录；未改history/SDK测试/公共源码/e2e或原teal断言，不重跑有效SSR/policy。正式verification全NOT_RUN；当前修正后的真实三case尚未运行。增量完成再次STABLE停止B08全部写入，供下候选构建/非作者复核。

## 主控candidate11真实闭环

真实Mantine三个目标+官方展示4项PASS：本例变量/Portal根与内存颜色manager不写宿主storage、真实teal主题与controlled确认；150ms真实防抖、稳定行Switch/一步撤销；NumberInput真实number|string中间态/空减号小数越界拒绝、合法quota保存/Modal焦点/SPA Back清Portal。SDK SSR/初值2与policy4有效局部结果复用。

独立复核两P2均修：真实matchedRules证明无层Lab按钮覆盖SDK层，公开类局部逐属性revert-layer恢复SDK主题，无硬编码teal/all重置；Switch先捕获boolean再updater，避免event.currentTarget清空。candidate11原teal断言已PASS；basic后续output隐含status多匹配仅改显式role定位，定向1PASS。非作者静态增量关闭与实际三项browser闭环。

候选2208输入SHA362873dc5a79d4089300e5257e611b9fa3fab2a6af76e7355d792b13d3aa83cc：新e2e lint/type/build/catalog全部0且stability changed=[]，浏览器固定dist无隐式build。实际argv/cwd/exit/产物见docs/library-lab/evidence/quality-upgrade/candidate-11/browser-fixes与browser-mantine-status-retry，未受影响candidate10结果复用；单次7项6PASS1FAIL不隐瞒，失败仅定位并已定向闭环。非作者六项内容和本地运行完成，正式sdk/build/browser仍NOT_RUN，不冒充授权干净recorder收据。
