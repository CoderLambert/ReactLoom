# B17 本地质量整改与交接

本工作者只写 `packages/library-lab/entries/B17-floating-ui/**`，没有改公共源码、e2e、依赖锁、索引、queue/results，也没有提交/推送/发布。共享候选和真实浏览器由主控统一执行，未运行全目录generate/typecheck/build或隐式build浏览器。正式verification三项保持NOT_RUN。

## 输入、范围与结果

实际仓库cwd：`/home/lambert/githubRepos/lambert/ReactLoom`；pnpm检查cwd：`/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。Git HEAD为`1218066e706a90ba03fac8dff8c9b843dd2429c4`。开始研究时本条目12个受控文件，无本条目既有diff；Git HEAD与条目输入摘要是不同概念。

保留原真实useFloating/interaction hooks/Portal/非模态FocusManager、焦点返回、IME ref守卫、Clipboard代际、文章布尔状态与提交后过滤。新增basic可控锚点/首选方向、同源middleware、真实SDK返回值检查器、真实autoUpdate建立/cleanup调用计数，以及独立CSS。advanced增加实际可滚动内容，不再仅写“独立滚动”而没有足够内容。

三目标独立：basic观察输入→flip/shift→DOM；business观察非模态键盘焦点与实际文章动作；advanced观察滚动跟随与IME安全过滤。positioning是SDK能力；锚点布局、业务状态、搜索、复制与生命周期计数是示例自建。没有VirtualElement、完整菜单/Combobox、网络或持久化实现。

## 六项复核

| 维度 | 当前结论 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（匹配类型/源码及定向SDK） | 安装React0.27.20，核对useFloating、FocusManager默认与returnFocus条件、interaction组合；SDK3项实际通过。flipAlignment=false与12px边界、offset10px来自同源配置；public custom platform仅提供几何fixture，真实computePosition算法没有替换。 |
| 解释清楚 | PASS（静态自审） | guide先工程问题，再输入/输出与责任表、三个操作及可观察结果、接入/取舍。纠正“reference也条件挂载”和“任何关闭都强抢回焦点”；明确Clipboard不能中止系统复制，只阻止迟到UI。 |
| Demo有用 | NOT_RUN（真实browser待主控） | 三目标有真实控件和结果；旧p0焦点/IME语义保留。SDK SSR/固定几何结果不能证明真实DOM碰撞、Tab、滚动与设备输入法。 |
| 源码可迁移 | PASS（局部类型/文件/格式） | 每Demo列出相同6个必要运行文件，CSS对Portal浮层独立命名；React/react-dom>=17、层级/安全上下文/数据层前提写明，完整相对导入与文件存在检查通过。 |
| 官方来源可靠 | PASS（固定原文/完整HTTP头） | React0.27.20固定tag/commit，根README原文4922B/hash一致；中文候选范围与英文选择理由明确；官网完整GET头无XFO/CSP，未知正确保留为unknown而非allowed。 |
| 结果可复核 | NOT_RUN（整体验收） | 本地SDK/策略/类型/格式/metadata均有真实命令、cwd、exit与原始日志；browser提案只为源码文本，尚未执行，正式sdk/build/browser仍NOT_RUN。 |

## 版本和官方来源

- 本地 `node_modules/@floating-ui/react/package.json`：0.27.20、MIT，React/react-dom peer>=17。实际传递安装React DOM适配器2.1.9、DOM/core1.8.0；不要把这些传递版本写成与旧tag同版本。核对React `dist/floating-ui.react.d.mts` 与 `.mjs`，尤其initialFocus0/modal默认true/returnFocus默认true但浮层失焦时忽略；本例明确modal=false。
- `git ls-remote --tags https://github.com/floating-ui/floating-ui.git '*0.27.20*'`，annotated tag object `fdeee8bf99a34f88ebe9801f56b42144ad5a9885`，peeled commit `12d94738472e922e1b3fa31b02b2b61b9ed77e6a`；固定React package.json实际GET200，version0.27.20。
- [固定官方根README](https://github.com/floating-ui/floating-ui/blob/12d94738472e922e1b3fa31b02b2b61b9ed77e6a/README.md)，repository=`floating-ui/floating-ui`，path=`README.md`，language=`en`，version=`0.27.20`，snapshot=`official/readme.md`。本次固定ref根/React包目录仅README.md与packages/react/README.md两个候选，无中文候选；React包README仅73字节简介，因此选完整根原文。
- 原文4922字节，SHA256=`b352baf175998877bad6168b0e55cf887690ede7a85acdfea344de996744d123`，同步时间`2026-11-10T10:34:16.443684+00:00`。没有改写或插入本地翻译；官方原文与中文guide分开。
- 官网[React文档](https://floating-ui.com/docs/react)实际GET200，最终URL不变。完整响应头保存在official/source-evidence.json；X-Frame-Options与Content-Security-Policy均未出现（显式null）。GET只读取完整头，没有宣称取得官网正文摘要；未实际Lab-origin iframe，所以homepage.status=unknown。
- 初次递归tree读取连接中断，首次多资源请求读取正文超时，未冒充成功；失败摘要保留于source-evidence.failedAttempts。最终成功获取根/包目录、原文、固定package.json，并独立取官网完整GET头。可复制实际来源脚本在validation/fetch-official.py，stdout/exit在source-fetch.txt。
- 官方当前[React](https://floating-ui.com/docs/react)、[autoUpdate](https://floating-ui.com/docs/autoUpdate)、[flip](https://floating-ui.com/docs/flip)、[FocusManager](https://floating-ui.com/docs/FloatingFocusManager)用于机制核对；精确版本API以本地0.27.20声明/源码为准。

## 检查命令与日志

以下命令在`/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`实际执行，subprocess实参数组绕过shell命令重写。日志保存ARGV、cwd、UTC起止、exit、stdout和stderr；metadata完整stdin也保留。原有效策略没有因交接重复执行。

| 命令 | 实际结果 | 原始日志 |
| --- | --- | --- |
| `pnpm test:sdk --entry=B17` | exit0；3 PASS（原React语义1+新增真实几何2） | [sdk.txt](validation/sdk.txt) |
| `pnpm test:policy --entry=B17` | exit0；9 PASS（原文章5+IME4，纯自建策略） | [policy.txt](validation/policy.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --allowImportingTsExtensions --types vite/client,node entries/B17-floating-ui/examples/demo.tsx` | exit0；最终role声明后仅重跑受影响条目类型 | [entry-typecheck-final.txt](validation/entry-typecheck-final.txt)，原次[entry-typecheck.txt](validation/entry-typecheck.txt) |
| `pnpm exec -- biome check --write entries/B17-floating-ui/examples entries/B17-floating-ui/tests entries/B17-floating-ui/library.json entries/B17-floating-ui/verification.json entries/B17-floating-ui/official/source-evidence.json` | exit0；12文件，补齐格式 | [format-final.txt](validation/format-final.txt) |
| 同范围 `pnpm exec -- biome check` | exit0；12文件无修复 | [biome.txt](validation/biome.txt) |
| `node --input-type=module`（完整单条目断言stdin见日志） | exit0；3Demo/6运行文件、相对导入、安装版本、原文bytes/hash、官网unknown、正式NOT_RUN一致 | [entry-metadata.txt](validation/entry-metadata.txt) |
| `python3 entries/B17-floating-ui/validation/fetch-official.py` | exit0；固定官方来源与完整头证据 | [source-fetch.txt](validation/source-fetch.txt) |

首次仅examples/tests的Biome格式命令exit1，报告从prop spread动态生成的dialog role无法静态识别aria-label，原始[format.txt](validation/format.txt)保留。补显式role=dialog，与真实useRole输出一致；随后仅重跑受影响类型/格式，不重跑已有效SDK/策略。SDK本身验证真实hooks语义和同源middleware算法，不是完整组件effects验收。

仓库根cwd的`git diff --check -- packages/library-lab/entries/B17-floating-ui`结果见validation/diff-check.txt。最终输入和日志摘要见validation/input-hashes.json；本记录不冒充平台指纹/正式收据。

## 变动文件

`guide.md`、`agent.md`、`library.json`、`verification.json`；`examples/example.tsx`、新增`positioning.ts/workshop.css`，原`demo.tsx/business-policy.ts`仅格式化，`ime-guard.ts`后续新增有限尾随保护状态；`tests/sdk.test.mjs`保留原真实SSR语义并新增2几何目标，原`business-policy.test.mts`仅格式化，`ime-guard.test.mts`新增4个最窄事件序列回归；`official/readme.md/source-evidence.json`；本记录与validation内提案、脚本、原始日志和输入摘要。AGENTS.md未改，旧公共@B17 p0未改。

## 浏览器交接与剩余

完整准备好的Playwright文本在[validation/browser-proposal.txt](validation/browser-proposal.txt)，尚未接入/执行。root可直接审阅后统一加入公共e2e；不需要新增公共协议。旧region“Floating UI 真实交互示例”、打开详情/新闻操作/编辑过滤条件、dialog“过滤条件”、筛选关键词/应用过滤均保留。

新增testid：b17-workshop、b17-boundary、b17-trigger、b17-dialog（data-positioned/data-placement）、b17-position（SDK JSON）、b17-lifecycle（实际autoUpdate的data-active/data-started/data-cleaned）、b17-outside。basic内部select“首选方向”(bottom-start/top-start)和“锚点位置”(top-left/bottom-right)；外部“浮层外的下一步”验证非模态焦点。Portal浮层不在section DOM后代，定位它需page级role/testid。

1. basic：让360px虚线框完整进入视口，再开默认左上/bottom-start；改右下后真实flip到top-start、shift.x负值，DOMRect留在边界12px内。比较请求方向、SDK结果和实际DOM，不能只检查提示字符串。
2. 键盘：Enter打开，FocusManager初始到首选方向；Escape返回trigger。重新打开依次Tab过两select/确认按钮到外部下一步，浮层关闭并尊重新目标；真实autoUpdate建立与cleanup相抵、active0。
3. advanced：旧p0继续验证Escape焦点、composition/229与确认后的真实列表；另滚动实际容器观察坐标变化。切换tab/宿主停止后Portal消失、无pageerror。关闭计数证明本例调用了实际cleanup；若要逐个native observer/listener detach数量，还需主控另加独立观察，不能把DOM移除当全部资源证明。
4. business：收藏和已读独立改变本地布尔。Clipboard真实权限/系统写入与迟到回调尚未浏览器实测；不得用替换SDK或假的writeText结果冒充真实权限成功。

真实DOM碰撞/移动端布局、输入法设备、剪贴板权限、原生资源逐个卸载观察、全目录构建与正式收据仍NOT_RUN；由主控匹配候选浏览器处理。没有本地依赖安装或公共接线阻塞。

稳定检查点：2026-11-10T10:38:46.514782+00:00；B17 STABLE，此后停止所有条目写入，交主控独立复核。


## 独立复核P2增量：业务与真实剪贴板提案

独立review指出初版提案只有basic/basic/advanced，business仅optional注释，缺少状态独立性、关闭重开和真实Clipboard权限覆盖。此P2仅补充validation/browser-proposal.txt与本记录；这一覆盖P2本身没有修改产品代码或重跑SDK；下述独立IME源码P2另外做最小修正与受影响验证。

提案现含6项，其中新增2项必验业务场景和1项过滤结果场景：收藏false/true与已读false/true独立切换，每次关闭、焦点返回和重开按钮文案一致；以及Chromium隔离context下实际grant Clipboard权限，真实点击writeText后readText核对系统剪贴板内容，再通过原生CDP Browser.setPermission拒绝写权限，确认真实写入失败时浮层保留/alert出现、历史成功状态不被改成新成功，关闭重开清掉错误。

过滤提案还验证草稿不改变列表，提交后实际4→1→0→4，并以compositionend无Enter keyup后继续普通输入/Enter触发真实handler；这不是实际操作系统候选窗/设备输入法证明。

没有替换navigator.clipboard、没有mock writeText或SDK。Clipboard只在测试隔离context更改权限，finally clearPermissions/detach。非Chromium、非安全上下文、缺少真实Clipboard/Permissions API或不支持原生权限覆盖时，提案明确test.skip并保留NOT_RUN理由；这种skip不能算业务剪贴板PASS。成功/拒绝尚未实际执行，权限支持和操作系统结果仍NOT_RUN；迟到Clipboard promise与卸载竞态仍需单独实际观察，不能从权限测试推出。

仅对完整提案执行必要TypeScript/Biome静态检查，命令/退出码和原始日志见validation/proposal-typecheck.txt与proposal-format.txt。临时同内容.ts输入位于本条目validation内，检查后删除；没有改公共e2e或运行浏览器。该覆盖提案不影响原SDK/文章策略输入；下述IME修正另更新3个受影响源码/测试输入摘要。


## 独立复核P2增量：IME尾随保护有限化

review确认旧compositionend总把suppressNextEnter设为true，只能等Enter keyup/blur，Space或鼠标确认后下一次普通Enter可能被无限吞掉。最小改为同源createImeGuard：compositionend建立80ms保守尾随窗口，Enter/Space keyup、新的非合成字符或blur清除，鼠标确认没有keyup也会到期。保留ref同步所有权、native isComposing、229及真正Enter确认安全路径；关闭reset，未删除原保护。

新增4个同源状态序列回归：真正Enter确认尾随keydown受保护且keyup释放；Space确认无Enter keyup仍可提交；鼠标确认无keyup在窗口后正常提交且229仍拒绝；新普通字符清除旧保护后Enter提交。原4项IME断言保留。仅重跑受影响IME8项、条目类型/Biome及提案类型/格式；SDK3和文章5项有效结果复用，不因纯guard修正重跑。真实设备IME与提案browser仍NOT_RUN。命令与原始退出码见validation/ime-policy-final.txt、entry-typecheck-ime.txt、biome-ime.txt。

本次增量实际退出码：`node --test entries/B17-floating-ui/tests/ime-guard.test.mts` exit0、8 PASS；同原参数的条目独立tsc exit0；`pnpm exec -- biome check`仅受影响3文件exit0；完整提案通过`pnpm exec -- biome check --write --stdin-file-path=entries/B17-floating-ui/validation/browser-proposal.ts`与临时同内容.ts的独立tsc（完整参数/时间/cwd见proposal-format.txt/proposal-typecheck.txt）。提案静态通过不等于Clipboard/IME真实浏览器PASS。

增量稳定检查点：2026-11-10T10:48:38.003907+00:00；B17两项P2修正后重新STABLE，此后停止所有写入，交主控复核。
