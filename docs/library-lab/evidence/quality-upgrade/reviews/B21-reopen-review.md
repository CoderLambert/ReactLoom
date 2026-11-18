# B21 重新打开项的独立复审

2026-11-11，范围为 B21 当前讲解、维护记录与既有 candidate15 实际证据。HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。本次只读条目并新增此报告，没有执行 SDK、策略、构建或浏览器测试，没有修改条目、公共源码或队列。

结论：保持 `review_pending`。存在一项 P2 文档事实同步缺口，需作者限缩修正后由非作者 delta 关闭；已通过的现代 SDK、Demo 与官方来源材料可复用。正式 `sdk/build/browser` 的 `NOT_RUN` 继续保留。

## P2：当前说明仍把已通过的本地交互列为未运行

原始实际浏览器记录为 [candidate15/browser.txt](../candidate-15/browser.txt)：

| 原始位置 | B21 实际结果 |
| --- | --- |
| 第28行，`quality-remediation-motion-migration.spec.ts:31` | PASS：真实 initial/exit presence、inert 折叠与退出打断后重新进入 |
| 第29行，`:77` | PASS：业务数组先提交、真实退出 DOM 禁止交互、必要回焦与稳定身份 |
| 第31行，`:129` | PASS：原子撤销、单调 ID、实时 OS 减动、窄屏、24项容量、卸载与重新挂载 |
| 第34行，`quality-remediation-primitives-sources.spec.ts:19`（当时行号） | PASS：固定原 README 展示及官网 unknown 展示 |

混合命令执行信息在 [candidate15/browser.json](../candidate-15/browser.json) 第21行起：cwd 为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，2026-11-10T15:43:24.558958+00:00 至 15:44:02.846225+00:00，`implicitBuild=false`，exit 1。`browser.txt:123–129` 原样记录整体 26 PASS / 3 FAIL；三个失败均为 B22。B21 四个具体 PASS 不应被改成整批 exit 0，也不应被三个 B22 失败抹除。

当前下列文字与这些结果冲突：

- `packages/library-lab/entries/B21-react-motion-migration/guide.md:65,84`：仍称真实动画由主控候选验收，明确写真实退出/打断、按钮/焦点、布局、实时减动和卸载仍 NOT_RUN。
- `agent.md:23`：把焦点、快速打断/undo、实时减动/窄屏/卸载与未测 OS 设备合写为另验，未说明这些本地路径已经执行。
- `local-validation.md:17,19,22,34,65,73`：以“当前状态”表和未限定阶段的命令/交接段称现代客户端、三个 case、全目录构建与浏览器未运行；第81–83行又写六项及 candidate15 本地闭环已完成，当前读者无法直接分辨历史检查点和最新状态。

这是技术准确、解释清楚和结果可复核的当前文字缺口。指南应简要陈述真实已覆盖能力与仍未测的边界，把候选批次、命令、整体失败与关闭过程放在维护记录。维护记录中的作者初交表/交接可保留，但必须明确标为历史阶段，并在当前摘要列出 B21 三目标加官方展示四项本地 PASS及原混合命令 exit 1。

同一维护文档还留有旧来源阶段的歧义：`local-validation.md:21,57` 称主 README 为仓库根 `README.md`、7475B、SHA `08915b…00df`；现有 `library.json:107–111`、`guide.md:78`、`official/package-readme-correction.json` 和实际 `official/readme.md` 一致指向 `packages/motion/README.md`、8259B、SHA `3d53967d…fca3f`。旧7475B文件已正确归档为 `official/repository-root-readme.md`。应同步当前摘要，或把旧来源段明确标成更正前历史，避免将已归档根 README继续称为当前主原文。

## 可复用证据及真实边界

只读 SHA-256 比较使用 candidate15 的 `inputs.json.files`，实际 exit 0：41个当时 B21 输入仅 `local-validation.md` 和 `verification.json` 发生后续维护变化；6个运行源、2个测试源与5份官方文件，共13个保护输入全部逐字节相同。现代三目标运行套件 `e2e/quality-remediation-motion-migration.spec.ts` 也与 candidate15 SHA相同：`330f98495d9b6e64cf10c14f20a8ea4d6759d2ca4a6ca7cba59c4880efd6aeab`。共享官方来源套件后来增加了其他条目，其整文件 SHA 已变化，不能把 candidate15 记录当作当前整份共享套件的新执行结果；B21既有官方展示结论仍绑定当时稳定输入和原日志。

当前 entry 的 Git可见42文件摘要为 `a5c73222cd3950556535a48bfd78018cbfff42611f49c6b85d0c6f09679b5c82`，与队列现存 finalEntryDigest 相同。计算算法为 sorted unique `git ls-files -co --exclude-standard <entry>`，依次哈希 repo-relative path、NUL、文件字节、NUL。本次读取的官方主原文仍为8259B，与 metadata SHA一致。

以下边界准确，应保留：

- 旧 react-motion 0.5.2 未安装/导入/运行；现代 motion/react 14.6.0 的本地结果不证明旧 runtime 或新旧轨迹等价。
- 本地 SDK2 是真实现代 SDK 的局部 SSR；policy4是纯 reducer，二者不替代客户端路径。
- 官网仍为 `unknown`。实际 HTTP 200且未见XFO/CSP与官网展示按钮存在，不证明从Lab origin嵌入成功；本地官方展示 case没有加载iframe。
- 读屏/触摸、真实 OS 设备、SSR hydration、全局监听/RAF内存普查、多实例、StaggeredMotion跟随、HTTP/保存/持久化及大列表性能未验收。
- `verification.json` 三项均 `NOT_RUN`，各 note 已准确说明本地已完成而正式 recorder缺干净获授权提交输入。无需改这些状态来解决本次 P2。

## 后续最小范围

由条目作者只同步 `guide.md`、`agent.md`、`local-validation.md` 的上述事实及阶段标记，保留原始日志/失败、原文和运行源。文案不应新增未经执行的跨设备、旧SDK或性能结论。完成后核对相应事实、链接及格式，安排非作者 delta；无需重跑仍未变的 SDK2、policy4或本地浏览器四项。

本次没有新增的运行实现或学习目标缺口。报告覆盖的是重新打开的文案与证据一致性；既有实现/官方源码独立复核及实际执行证据按其原范围 REUSED。

## 2026-11-11 非作者 delta：P2 CLOSED

当前结论：作者限定文案修正已消除上述P2，可恢复 `content_done`。本次独立只读核对条目，只向本报告追加结论；没有修改条目、公共输入、队列或原始日志，也没有重跑 SDK、policy、HTTP、build或浏览器。HEAD仍为 `1218066e706a90ba03fac8dff8c9b843dd2429c4`。

- `guide.md:65,84` 已直接解释真实SSR与客户端能力边界，并写出本地三目标及官方展示实际覆盖的能力，原“待主控/真实交互NOT_RUN”已经移除；未扩大到旧SDK、真实OS设备或性能。
- `agent.md:23` 同步本地三目标+官方展示4项，仍明确真实OS读屏/触摸、SSR hydration、旧runtime/跟随弹簧、HTTP/持久化/大列表等未验收边界。
- `local-validation.md:13–26` 当前摘要与作者初交历史表分开，清楚写本条4PASS与混合批次26PASS/3个B22 FAIL/exit1；`:36–38,69–79,81–89` 以前的交接/最终作者点标为历史检查点，不冒充当前状态。
- `local-validation.md:61–65` 当前主原文已精确指向 `packages/motion/README.md`、8259B、SHA `3d53967d…fca3f`；旧仓库根7475B/SHA `08915bb5…00df` 已明确更正前阶段及历史快照位置。实际原文字节、当前metadata和guide相符。原请求记录未改写。
- 正式 `verification.json` 的sdk/build/browser仍均NOT_RUN；官网metadata仍unknown。原candidate15官方展示case没有加载iframe，文案没有将它说成嵌入成功。

独立静态比较使用Python标准库读取作者 `validation/copy-fix-baseline.json`、`copy-fix-evidence.json`，逐字节SHA-256核对文档after摘要、旧42文件、candidate15的13保护输入、实际motion e2e、主/旧README、正式状态、原浏览器JSON和相对链接，并按队列算法复算entry摘要。实际命令为 `python -`（stdin为上述静态断言），cwd `/home/lambert/githubRepos/lambert/ReactLoom`，exit **0**；本段保存该命令的原始stdout：

```text
PASS: baseline42 files: docs3 changed, other39 unchanged; document after hashes match
PASS: candidate15 protected13, runtime6 and exact motion e2e suite unchanged
PASS: primary package README8259B/current hash; archived root README7475B/old hash
PASS: local links {'guide.md': 5, 'agent.md': 0, 'local-validation.md': 20} formal sdk/build/browser NOT_RUN; homepage unknown
REUSED: browser4 PASS; mixed batch26PASS/3FAIL/exit1 JSON matches original record
entryFiles 47 entrySha256 3042b53c715461d10c985d3069c5ae1bdf0d3d6c8f4f51b588c53159eca3c552
```

作者实际静态命令 `python entries/B21-react-motion-migration/validation/copy-fix-check.py`（Lab cwd）exit0、限定 `git diff --check -- entries/B21-react-motion-migration` exit0的原始记录分别保留在entry的 `validation/copy-fix-check.txt` 和 `validation/copy-fix-diff.txt`；它们是文案/摘要检查，不是新的SDK/UI验收。delta初次schema探查命令因多余右括号发生Python `SyntaxError: unmatched ')'`、exit1；无产品执行或写入，纠正后的独立静态比较exit0。该探查错误不改写为PASS。

| 六项 | delta后状态 | 证据层级 |
| --- | --- | --- |
| 技术准确 | PASS | 本地客户端/局部SSR/旧runtime的边界已分清；运行源及既有SDK2/policy4原证据REUSED |
| 解释清楚 | PASS | guide与agent不再留过期交接待办，维护材料按阶段区分当前摘要/历史检查点 |
| Demo有用 | PASS（REUSED） | 三个交互目标及官方展示四项原PASS，6个运行源与真实套件未变 |
| 源码可迁移 | PASS（REUSED） | 既有源码/必要CSS/媒体清理及原定向类型证据未受文案修正影响 |
| 官方来源可靠 | PASS | 8259B当前package快照与7475B历史根快照已明确，固定hash/路径保持，iframe unknown未误报 |
| 结果可复核 | PASS | 原4PASS/混合exit1与失败范围、静态检查、原错误、正式NOT_RUN各自保留，未补造运行 |

本条entry最终47文件摘要 `3042b53c715461d10c985d3069c5ae1bdf0d3d6c8f4f51b588c53159eca3c552`，与作者交付一致。无剩余P1/P2；正式recorder仍待用户授权的干净提交输入。
