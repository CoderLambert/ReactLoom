# B21 迁移条目本地整改与验收边界

初次实现历史记录：2026-11-10，quality_e11独占B21；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，共享HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。candidate14释放后实施。原9文件无初始条目diff，原SHA/问题/目标见[baseline.json](validation/baseline.json)。保留他人工作，只写B21；另按授权写B19非作者报告并追加B12 Escape复核，未改它们产品。公共源码/e2e/依赖锁/索引/队列/results未动，不提交推送。

## 原问题与实际改动

原metadata错误声称示例使用真实react-motion接口，实际依赖/源码一直是现代motion/react。现明确三目标是旧Motion+spring/TransitionMotion思路迁到现代14.6.0；旧0.5.2仅固定官方资料，未安装/导入/运行，现代SDK局部通过不冒充旧SDK通过。

保留原reducer、单步undo、选择快照、单调nextId、24上限及必要提交后回焦。运行源码正常排版，拆presence-items/reduced-motion与必要CSS。原退出li的按钮仍能交互，现真实useIsPresent=false时inert/aria-hidden/disabled，Row和父级已提交成员ref再拒绝旧回调；未知/退出身份不会遗留错误回焦意图。popLayout自定义子项forwardRef到真实motion.li，ul明确relative，未重写SDK动画。

旧useReducedMotion在实装14.6中只有挂载快照，无法承诺系统运行中变化。现自有media change监听+cleanup，经React上下文让退出子树也读实时策略；MotionConfig never禁SDK静态判定，全部y/scale/layout/duration显式跟随OS。保留真实AnimatePresence，不用setTimeout伪造删除。basic单独折叠、business列表、advanced事务/减动三个独立目标，不再堆叠重复卡片。

## 当前作者复核（2026-11-11，待本次非作者delta）

candidate15中的B21三个交互目标及官方原文/官网unknown展示共4项本地Chromium PASS；混合命令整体29项26PASS/3FAIL、exit1，三个失败均为B22。原始argv、cwd、时间与退出码在仓库 `docs/library-lab/evidence/quality-upgrade/candidate-15/browser.json`，四项原始PASS在同目录 `browser.txt:28/29/31/34`。本条目6个运行源、2个测试源和5份官方材料与candidate15输入摘要一致，既有SDK2/policy4及这4项浏览器结果REUSED，未重跑。

本次只同步guide、agent和本文的事实及历史阶段标记，修正依据见 `validation/copy-fix-evidence.json`。本表是作者当前自核，本次文案修正仍需非作者delta，不以此自行更新队列。正式 `verification.json` 的sdk/build/browser三项保持NOT_RUN：没有干净获授权提交对应的recorder收据。

| 维度 | 当前状态/层级 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（实装源码/局部现代SDK/本地Chromium） | 实装motion/framer-motion14.6.0与React19.3；真实SSR2核对initial=false/public presence/popLayout forwardRef形状。useReducedMotion实际无setter源码留存；现代三目标交互已实际通过，旧SDK始终NOT_RUN。 |
| 解释清楚 | PASS（既有内容复核REUSED、本次作者自核待delta） | 旧spring描述与现代数字animate分开，旧/新/未实现跟随区分；数组先提交、presence暂留、撤销/焦点与视觉各有主人。本文当前摘要与历史检查点分开，guide/agent同步实际本地结果。 |
| Demo有用 | PASS（本地Chromium3个交互目标REUSED） | 折叠/打断、退出不可交互/存活DOM身份、原子undo/单调ID/24容量、实时OS策略、窄屏与卸载重挂载均有candidate15实际断言；不以SSR替代。 |
| 源码可迁移 | PASS（静态/条目strict类型） | 六生产sourceFiles含必要CSS/媒体策略/presence组件/reducer；无Lab alias/旧库依赖/外部资产。只清自身media监听/ref/焦点意图，SDK拥有动画/布局；未做全局stop。 |
| 官方来源可靠 | PASS（固定双原文/HTTP/本地官方展示REUSED） | 当前现代主原文是packages/motion/README.md，英文8259B/hash与metadata及原字节一致；历史0.5.2原README15446B，双tree无中文。原9请求及后续package原文更正响应各自保留；目标官网GET200无XFO/CSP仍unknown，本地展示case不证明iframe成功。 |
| 结果可复核 | PASS（本地SDK2/policy4/浏览器4项REUSED） | 原始cwd/argv/time/exit/stdout可读；candidate15本条4PASS与混合命令exit1、B22三FAIL明确区分。提案首次类型错误与修复日志保留。正式sdk/build/browser均NOT_RUN；本次文案检查另记。 |

## 版本与运行边界

实际声明/导入仅motion14.6.0（内部framer-motion精确14.6.0），MIT，React/DOM peer ^18||^19，Lab19.3.0。旧react-motion0.5.2 registry peer ^0.14.9||^15.3.0||^16.0.0，不支持当前peer；这只是版本事实，不声称执行旧SDK后失败，更不强制安装绕过peer。

[sdk-source-audit.json](validation/sdk-source-audit.json)保存现代实际安装位置/manifest/React入口/useReducedMotion/PopChild/public usePresence六文件摘要，含匹配源码。在线或源码注释说会实时更新，但14.6实现useState只取值、没有setter并保留TODO；本文以实装为准，自建标准media监听而非伪称SDKhook动态响应。never必须与本例完整目标门闩同时迁移，不能单独抄走忽略系统设置。

应用 owns reducer/open、实时media、提交后回焦和按钮map；SDK owns presence/布局/帧。退出组件的旧props可能冻结，实时策略通过context、操作依据committedItems；业务事务不由动画完成回调决定。整体卸载不等内部exit，对自己的监听remove，不能取消全局动画。源码清理核对不是内存/RAF普查通过。

## 作者初交实际命令、cwd、exit和日志（历史检查点）

下列实际cwd均为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；经 `python3 entries/B21-react-motion-migration/validation/run-local.py <label> ...` 执行真实argv并捕获输出。这里省略外层包装器，完整结构化记录见[local-runs.json](validation/local-runs.json)。作者初交时未运行全目录generate/typecheck/build或浏览器；后续candidate15公共检查及本条4项本地浏览器已执行，见当前摘要，不将此历史检查点当作当前待办。

| 实际命令 | exit | 原始日志 |
| --- | --- | --- |
| `python3 entries/B21-react-motion-migration/validation/fetch-official.py` | 0 | [official-fetch.txt](validation/official-fetch.txt) |
| `pnpm exec biome check --write entries/B21-react-motion-migration/examples entries/B21-react-motion-migration/tests entries/B21-react-motion-migration/library.json entries/B21-react-motion-migration/verification.json entries/B21-react-motion-migration/official/source-evidence.json entries/B21-react-motion-migration/validation/metadata-check.mjs entries/B21-react-motion-migration/validation/sdk-source-audit.json` | 0 | [biome.txt](validation/biome.txt) |
| `node --test entries/B21-react-motion-migration/tests/sdk.test.mjs` | 0 | [sdk.txt](validation/sdk.txt) |
| `node --test entries/B21-react-motion-migration/tests/task-history.test.mts` | 0 | [policy.txt](validation/policy.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B21-react-motion-migration/examples/demo.tsx` | 0 | [typecheck.txt](validation/typecheck.txt) |
| `node entries/B21-react-motion-migration/validation/metadata-check.mjs` | 0 | [metadata.txt](validation/metadata.txt) |
| `pnpm exec biome check --write entries/B21-react-motion-migration/validation/browser-proposal.check.ts` | 0 | [proposal-format.txt](validation/proposal-format.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node entries/B21-react-motion-migration/validation/browser-proposal.check.ts` | 1 | [proposal-typecheck.txt](validation/proposal-typecheck.txt) |
| `pnpm exec biome check --write entries/B21-react-motion-migration/validation/browser-proposal.check.ts` | 0 | [proposal-format-fixed.txt](validation/proposal-format-fixed.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node entries/B21-react-motion-migration/validation/browser-proposal.check.ts` | 0 | [proposal-typecheck-fixed.txt](validation/proposal-typecheck-fixed.txt) |

现代SDK为普通node --test，自然exit0，2/2、0skip，没有force-exit/process.exit、DOM/RAF/SDK mock。第1项真实ReactDOMServer+MotionConfig/AnimatePresence/motion.div，证明initial=false后的数字目标静态标记；第2项真实popLayout/forwardRef子项和useIsPresent的初始SSR，**不执行客户端测量/退出/焦点/媒体/帧**。它也没有导入或证明旧SDK。

原4个pure reducer测试只正常排版后运行一次，覆盖快速add/单调ID/原子撤销、删除选择恢复、未知ID不覆盖快照、容量与undo后ID；不证明Motion动画。

提案.txt复制成同目录browser-proposal.check.ts，Biome与strict tsc后同步回.txt、删除临时.ts。首次提案类型exit1为三处Playwright HTMLElement|SVGElement的inert读取未收窄，原日志保留；只加真实instanceof HTMLElement guard，受影响格式/类型复查exit0，产品源码未因提案改动，未重跑SDK/规则。最终无临时执行Demo、未新增宿主依赖。

## 官方原文与官网

当前主[现代README](official/readme.md)：`motiondivision/motion@c624ce8e907d5668280b8c832f2ab93ba3462ab5/packages/motion/README.md`，npm gitHead与manifest14.6.0，英文8259B，SHA-256 `3d53967ddaef8a5c37b6623ee07376aac9f9f1d2c52c894af3e521ba864fca3f`，与当前metadata及guide一致。固定package路径实际GET200及原字节摘要见[更正响应](official/package-readme-correction.json)。次[历史README](official/legacy-readme.md)：`chenglou/react-motion@8bd4f7223a8d79535586220f7173f078d4604e07/README.md`，registry0.5.2、manifest实际0.5.2，英文15446B，SHA-256 `affc2475f70368ce3f2c1bf02bd788f6967f1e73c1a7162806e3d04824b38b30`，仅做旧API对照。

更正前初交取过同一现代提交的仓库根README，英文7475B、SHA-256 `08915bb5254a4bc1fd47e8d7ea8fff0dcb470461f6fd6b59fb6d2f0bef0400df`；其未经改写的字节现保留在[仓库根README历史快照](official/repository-root-readme.md)，不是当前主原文。原9个请求的source-evidence保留该阶段事实，package原文的后续更正响应独立保存，未改写原始记录。

两个recursive tree均未截断，无官方中文README候选；未把本地中文讲解覆盖原文。仓库/commit/path/version/language/UTC、完整9个匿名HTTP请求/最终URL/headers/body字节/sha及旧runtime NOT_RUN在[source-evidence.json](official/source-evidence.json)。不继承旧仓库测试、旧Actions或其它库浏览器结论。

目标官网https://motion.dev/实际GET200，完整响应头无XFO/CSP，字段明确null；Lab-origin iframe未实际确认，因此unknown。历史GitHub不是现代目标官网，raw/GitHub头不冒充官网，也未改宿主frame-src。

## 作者初交浏览器提案（历史检查点）

初交时完整三case [browser-proposal.txt](validation/browser-proposal.txt)尚未执行；其后与实际三目标套件一致的断言已在candidate15本地Chromium通过。以下保留当时交接的操作目标。无SDK/RAF/clock mock、page.route、假DOM事件/尺寸或截图代替结果：

- basic：真实现代Motion initial/exit，业务open先false，旧div真实presence=false/inert/aria-hidden后移除，焦点留在toggle；迅速展开打断退出并恢复同DOM。
- business：真实选中/键盘删除后数组与数量先提交，旧li实际popLayout absolute且inert/disabled，回焦存活邻居，其他DOM不重建；空态可继续添加。
- advanced：选中项删除/立即undo恢复同key与selected，一次消费；add/undo/add不复用ID，真实运行中OS偏好改变后新动作无transform/时长0；390px几何、24上限、停止卸载后新挂载恢复初始状态。

精确region“react-motion 现代迁移示例”；b21-workshop/data-level/data-reduced/data-order；basic按钮“折叠卡片/展开卡片”、b21-details/open；任务data-task-id/data-present；添加“添加任务（最多24）”、删除“删除 <任务名>”、advanced“撤销上一步”。b21-state读取真实reducer事务，b21-tasks-status业务数量/选中，b21-exits真SDK视觉计数不承担事务。

**当前仍未测**：真实OS读屏/触摸、SSR hydration、全局监听/RAF内存普查及多实例；旧SDK运行/新旧轨迹等价、StaggeredMotion跟随、网络取消/保存、持久化/大列表性能。以上现代三目标中的进行中退出/打断、焦点/布局、实时媒体、窄屏/卸载已在candidate15通过，不能继续列为当前NOT_RUN。官网iframe仍unknown，正式三项收据仍NOT_RUN。

## 初次实现变动文件（历史记录）

修改library/guide/agent/verification、examples/example.tsx；原task-history/demo和policy测试仅正常排版，事务算法未改。新增presence-items.tsx/reduced-motion.ts/migration.css、现代SDK测试、双官方原文/来源、validation基线/源码审计/fetch/metadata/执行包装/日志/三case提案。AGENTS保留，最终输入SHA见validation/input-hashes.json；最终STABLE后停止包括文档/日志的一切写入。

最终补充：`git diff --check -- entries/B21-react-motion-migration`，同Lab cwd，exit0，[diff-check.txt](validation/diff-check.txt)。运行源码在SDK/类型有效检查后未再改，提案只做HTMLElement guard收窄。FINAL STABLE：`2026-11-10T14:55:39.500791+00:00`，交root独立复核与真实browser；停止全部输入、文档和日志写入。

## candidate15 主控本地质量闭环（历史记录）

该阶段主控已完成当时适用的内容复核与本地验证。candidate15输入f76964af6e3bfa520b3e9e1d78c67a00b09713e1987c8adcce994b46c3e53857，公共/e2e lint/type/build/catalog0且changed=[]；固定dist真实browser29项26PASS/3FAIL，三个失败只属于当时尚未完成的B22。B21本条三目标及官方展示4项PASS，实际通过范围和独立处置见路线图results/B21.md；旧作者摘要为各自阶段历史，新主控输入摘要见validation/controller-input-hashes.json。正式三收据仍NOT_RUN；本次正文事实同步完成后仍需非作者delta。

## 2026-11-11 限缩文案同步

独立重新复审指出guide/agent/本文把已通过的本地浏览器目标留作待验，以及本文未同步现代package README更正。本次只改三份文档；运行源、测试、官方字节、原始执行日志与verification正式状态保留。`validation/copy-fix-baseline.json`记录本次修改前42文件摘要；`validation/copy-fix-evidence.json`保存文档前后摘要、candidate15保护输入和原命令/退出码、当前README8259B与历史根README7475B核对。既有SDK2/policy4/本地浏览器4项REUSED，不重复执行。

本次静态核对命令为 `python entries/B21-react-motion-migration/validation/copy-fix-check.py`，cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；原始输出在 `validation/copy-fix-check.txt`。其内部只调用限定 `git diff --check -- entries/B21-react-motion-migration`，退出码及原始输出另存 `validation/copy-fix-diff.txt`；JSON、文案事实、Markdown本地链接和摘要检查的实际结论见该日志与evidence，不把这些检查当SDK或浏览器新执行。
