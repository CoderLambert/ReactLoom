# E11 Streamdown 本地质量整改记录

本文件保留原作者交接与后续修复的历史状态；下文原交接表中的 NOT_RUN 不代表当前本地浏览器结果。当前证据汇总见末尾“本地浏览器结果同步”。正式 recorder 收据与本地运行分开，`verification.json` 三项仍为 NOT_RUN。

时间：2026-11-10。工作者：`/root/quality_e11`。实际 `pwd` 为 `/home/lambert/githubRepos/lambert/ReactLoom`；本次开始时该条目 7 个既有文件无 diff。规划输入摘要为 `aaec72d2f1661b2c974d63982d58babf5d5b987d4bbe0a16f42462b000d7f7c6`，当前 Git HEAD 为 `1218066e706a90ba03fac8dff8c9b843dd2429c4`。Node `v26.13.0`，pnpm `10.33.3`，已安装 streamdown `2.6.0`。

仅修改本条目，保留其他活跃写入者成果。没有运行全目录生成、整包类型检查、共享构建或隐式 build 浏览器；没有提交、推送或发布。本记录是本地证据，**不是 verify:record 的正式收据**，verification.json 的 sdk/build/browser 均保持 NOT_RUN。

## 改动与目标

既有源码密集排版、转义换行、三场景重复计时追加且“暂停或结束”不分。现在合并为两个独立目标，示例源码直接供 Demo 和源码查看器使用：

| 场景 | 工程问题 | 操作与预期观察 |
| --- | --- | --- |
| basic | delta 怎样成为累计正文；未闭合语法只修复显示 | 手动收第 2 段，切换修复，累计源文不变、格式变化；第 6 段代码可见；第 7 段完成 |
| business | GFM 研究摘要与产品输出策略 | 收完 11 段，显示表格/任务列表、官方链接；未知链接/协议不生成 href，图片占位，原始 HTML 忽略 |

共同控制开始、暂停、继续、手动下一段、提前结束和重置；按状态显示 ready/playing/paused/completed/ended。定时器只在 playing 存活，每 700ms 追加一段，暂停/结束/重置及卸载清除同一 interval。Node 状态测试验证累计与迟到 tick 的忽略；真正浏览器生命周期由主控独立验证。

## 六项复核

| 维度 | 状态 | 证据层级与依据 |
| --- | --- | --- |
| 技术准确 | PASS | 真实 Streamdown 2.6.0 Node SSR，3 项断言通过；已安装 dist/index.d.ts 与固定提交源码核对 mode、parseIncompleteMarkdown、isAnimating、components、skipHtml、urlTransform。库默认强调用 span[data-streamdown=strong]，已按实际节点断言。 |
| 解释清楚 | PASS | 静态内容复核：guide 的问题/核心机制/两个实验/迁移/生命周期明确区分 delta、累计全文、SDK、fixture 和应用白名单。 |
| Demo 有用 | NOT_RUN | 两个目标和可操作源码齐全；真实 SDK 静态渲染已执行，但浏览器内控件、布局和计时器尚未由本工作者验收。 |
| 源码可迁移 | PASS | 源码静态及定向类型复核；全部必要实现、声明和样式已列 sourceFiles，只有相对导入；Tailwind @source 与迁移调整位置已说明。生命周期的真实运行仍待浏览器。 |
| 官方来源可靠 | PASS | 原文 package README 固定 2.6.0 tag/提交，英语回退有完整文件清单依据，sha256 校验通过；官网响应证据记录 unknown，没有将缺少限制头冒称 allowed。 |
| 结果可复核 | NOT_RUN | 下列 SDK/状态/类型/元数据原始日志可读且退出码明确；浏览器和共享构建尚未运行，不能据此标 content_done。 |

## 官方来源与 API 依据

- 仓库 `vercel/streamdown`，目标包 `packages/streamdown`。`git ls-remote --tags https://github.com/vercel/streamdown.git 'streamdown@2.6.0*' 'v2.6.0*'` exit 0，tag 对应 `8a2ac221a878a0fc5839f2035c1e16575cfa3440`。固定提交 package.json 的 version 是 2.6.0，匹配已安装依赖。
- [包 README 原文](https://github.com/vercel/streamdown/blob/8a2ac221a878a0fc5839f2035c1e16575cfa3440/packages/streamdown/README.md) 保存于 `official/readme.md`，未改写上游字节；sha256 `e64c6eb295a58af2a0f3a2eaf6d8edefab5b2b39ea320250072596bd5b0943f8`。对应提交 tree API 的 README 候选没有中文版本，完整清单在 `official/source-audit.json`。
- `official/source-audit.json` 保存同步时间 `2026-11-10T09:18:15.803374+00:00` 与官网 GET 最终 URL `https://streamdown.ai`、HTTP 200、Content-Type。未见 X-Frame-Options 或 CSP frame-ancestors；没有 Lab origin 浏览器确认，所以 unknown。
- [固定提交 index.tsx](https://github.com/vercel/streamdown/blob/8a2ac221a878a0fc5839f2035c1e16575cfa3440/packages/streamdown/index.tsx)：默认插件位于 283–305 行，mode/isAnimating 默认值位于 478–490 行，560–561 行按 streaming 与修复开关调用 remend。`lib/markdown.ts` 的 handleRawNode 处理 skipHtml。已安装 `dist/index.d.ts` 526–594 行声明了本例全部核心 props。
- 当前[官方配置](https://streamdown.ai/docs/configuration)、[安全文档](https://streamdown.ai/docs/security)与 Context7 官方仓库索引辅助核对；版本结论以匹配版本源码/类型为准。默认安全管道允许更多资源，本例链接/图片策略是应用主动限制。
- `provenance.originalRecovery=SUMMARY_ONLY`、`contentState=recreated` 保留；没有将本次独立重建写成研究原件恢复。

## 实际命令与原始日志

下表命令的实际 cwd 均为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。日志记录实际 cwd、命令、子进程 exit 和原始输出。

| 命令 | exit | 结果与日志 |
| --- | --- | --- |
| `pnpm exec biome check --write entries/E11-streamdown/examples entries/E11-streamdown/tests entries/E11-streamdown/library.json entries/E11-streamdown/verification.json entries/E11-streamdown/official/source-audit.json` | 0 | 14 文件，格式修正；`validation/biome.txt` |
| `pnpm exec biome check --write entries/E11-streamdown/validation/check-entry.mjs` | 0 | 格式化单条元数据核对器；`validation/biome-helper.txt` |
| `pnpm exec biome check entries/E11-streamdown/examples entries/E11-streamdown/tests entries/E11-streamdown/library.json entries/E11-streamdown/verification.json entries/E11-streamdown/official/source-audit.json entries/E11-streamdown/validation/check-entry.mjs` | 0 | 最终 15 文件格式/静态 lint 检查；`validation/biome-final.txt` |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --allowSyntheticDefaultImports --esModuleInterop --types node,react,react-dom,vite/client entries/E11-streamdown/examples/example.tsx entries/E11-streamdown/examples/demo.tsx` | 0 | 只检查本例两个 TSX 及直接类型依赖，无诊断；`validation/typecheck.txt` |
| `node --test entries/E11-streamdown/tests/sdk.test.mjs` | 0 | 真 import Streamdown/react-dom/server，3/3：未闭合强调开关、未闭合代码、GFM/共享输出策略；`validation/sdk.txt` |
| `node --test entries/E11-streamdown/tests/stream-session.test.mjs` | 0 | 2/2：逐段累计/自然完成、暂停/结束/重置及迟到 tick；仅应用策略，不算 SDK 验收；`validation/session.txt` |
| `node entries/E11-streamdown/validation/check-entry.mjs` | 0 | 调用现有 validateEntry / entryCompletenessIssues，只读取 E11；两个场景、11 份来源文件、README sha256 和来源属性通过；`validation/metadata.txt` |
| `git diff --check -- entries/E11-streamdown` | 0 | 无空白错误；`validation/diff-check.txt` |

保留首次失败：`validation/sdk-initial-failure.txt` exit 1 原因是测试错误假定默认强调输出 `<strong>`，实际库使用 span 标记；已修正断言，未改变库实现。`validation/typecheck-initial-failure.txt` exit 1 原因是定向命令漏带现有 Vite 样式声明 `vite/client`；补齐命令后通过，未增补公共声明。相同有效输入的其余通过项没有全量重跑。

## 浏览器交接断言（本工作者 NOT_RUN）

稳定选择器是 `e11-workshop`、`e11-status`、`e11-progress`、`e11-next-delta`、`e11-markdown-source`、`e11-rendered` 的 data-testid；容器 `data-state` 为 ready/playing/paused/completed/ended。

1. basic 连点两次“追加下一段”：源文含标题和 `**流式`；修复开关开启时 `e11-rendered [data-streamdown=strong]` 文本“流式”。关闭开关，节点消失且源文不变。继续到第 6 段看 pre，到第 7 段看 completed、7/7。
2. 开始自动追加，超过 700ms 观察段数；暂停后超过一周期不变，继续后增加。提前结束保留源文，后续不增加且继续按钮禁用；重置返回 ready/0。
3. 播放中离开 Demo 页签或切换场景：对本例 delay=700 的 interval 记录活动数回到 0；再进 Demo 显示 ready/0。仅 UI 回到空白不能独立证明 cleanup。
4. business 手动收完 11 段：实际渲染有表格两数据行、两个 disabled checkbox（第一项 checked）；官方说明 href 为 `https://streamdown.ai/docs` 且新页打开。未知外站与危险协议没有 anchor；渲染区无 img/script；无 example.com 请求或全局 `__e11Unsafe` 赋值。累计源文保留被阻止的原始输入。
5. 从实际 Lab origin 验证 README/官网页签的展示与跳转；官网未实测前继续 unknown。桌面/窄屏检查控件换行、累计源文滚动和代码块溢出；验收键盘按钮和修复 checkbox。

## 文件与剩余事项

修改 7 个既有文件：AGENTS.md、agent.md、guide.md、library.json、verification.json、examples/example.tsx、examples/demo.tsx。新增 examples/{fixtures,markdown-policy,stream-session}.mjs 及对应 .d.mts、examples/workshop.css、tests/sdk.test.mjs、tests/stream-session.test.mjs、official/readme.md、official/source-audit.json、本记录及 validation/ 日志与单条核对器。

原作者交接时的剩余事项（历史）：独立内容复核、稳定输入后的统一生成/类型/构建与真实 E11 浏览器交互，当时交付 review_pending 候选。后续本地浏览器结果见末尾；在将来获准提交且输入干净时才运行 verify:record。没有新增依赖或公共 API 请求。


## 独立复核后的归档修正

2026-11-10：复核发现根 gitignore 的 `*.log` 会忽略本地原始证据，现将 validation 中全部日志原样改名为 `.txt` 并同步引用，未改动证据字节、未重跑已有 PASS。`official/source-audit.json` 对当次观察未出现的 `X-Frame-Options` 与 `Content-Security-Policy` 显式记录 null；这是原 GET 的缺失头记录，没有补造完整响应头或浏览器证据，官网仍为 unknown。


## 真实浏览器复核发现的修复开关问题

主控首批真实浏览器 13 项中 12 项通过，E11 basic 第2段取消勾选修复后仍保留强调节点；本工作者此前三项 Node SSR 每次都新建实例，未覆盖同一 React 实例的 prop 更新，不能据其关闭浏览器缺口。原失败日志和 trace 由主控保存。本问题不影响已通过的其他业务/生命周期路径。

已核对固定 2.6.0 `packages/streamdown/index.tsx` 972–989 行：顶层 `memo` 自定义 comparator 未比较 `parseIncompleteMarkdown`；580–587 行的 processedChildren useMemo 则已包含该选项。因此同一正文只切开关时，更新在顶层即被跳过。最小修复是在真正 Streamdown 上加入随修复开关变化的 React key，只重建 renderer，不重建累计会话/控制器；正文和进度不丢失。guide/agent 已解释适用版本与 Node SSR 的证据边界。

修复完成时，作者只运行 `pnpm exec biome check entries/E11-streamdown/examples/example.tsx` 和与上表相同的 E11 定向 tsc 命令，cwd 都是 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，均 exit 0；原始输出在 `validation/review-fix-biome.txt` / `validation/review-fix-typecheck.txt`。当时未重跑不受影响的状态策略/原文摘要，也未运行共享生成、构建或浏览器，故修复后路径暂记 NOT_RUN。此历史状态由以下定向浏览器结果取代；首批失败与正式 verification 的 NOT_RUN 均保留。

## 本地浏览器结果同步

2026-11-11 仅修正文案，依据[独立复审报告](../../../../docs/library-lab/evidence/quality-upgrade/reviews/E11-reopen-review.md)恢复既有结果链，未重跑 SDK、UI、HTTP 或构建：

| 阶段 | 本地真实结果与边界 | 原始证据 |
| --- | --- | --- |
| candidate02，有服务后的首次交互 | E11 自动追加/暂停/结束/重挂、GFM 与应用资源策略、实际 interval 卸载清理、窄屏布局、固定 README 展示五项 PASS；basic 累计正文/修复开关一项 FAIL。整批13项为12 PASS/1 FAIL、exit1，不能据整批通过数称 E11 当时全部通过。 | [browser-retry.txt](../../../../docs/library-lab/evidence/quality-upgrade/candidate-02/browser-retry.txt)、[命令/cwd/退出码](../../../../docs/library-lab/evidence/quality-upgrade/candidate-02/browser-retry.json) |
| candidate03，修复后的定向重跑 | 同一原失败目标 `@E11 cumulative deltas render incomplete syntax and finish with real Markdown` PASS；验证关闭修复后强调节点消失且累计源文保留。整批16项 PASS、exit0；其中只有这一项属于本次 E11 回归，另五项复用上述有效结果。 | [browser-initial.txt](../../../../docs/library-lab/evidence/quality-upgrade/candidate-03/browser-initial.txt)、[命令/cwd/退出码](../../../../docs/library-lab/evidence/quality-upgrade/candidate-03/browser-initial.json) |

两次命令的 cwd 均为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，均禁用隐式 build。candidate02：`pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts quality-remediation.spec.ts p0-risk-lifecycle.spec.ts --grep '@E05|@E11|@F05'`，2026-11-10 09:39:39–09:39:54 UTC、exit1。candidate03：`pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts quality-remediation-next.spec.ts a06-approval.spec.ts p0-risk-lifecycle.spec.ts quality-remediation.spec.ts --grep '@A01|@A06|@B09|cumulative deltas'`，2026-11-10 09:51:10–09:51:31 UTC、exit0。

因此当前可复用 E11 六个本地浏览器 case 的 PASS：五项未受修复影响的结果，加一项修复后真实回归。11份声明源码与已接受的 candidate03 摘要一致；后续共享差分及适用范围由上述复审报告说明。README 展示通过不证明官网可嵌入，官网仍为 unknown；真实模型网络/取消、跨浏览器、读屏/触摸和性能仍未验收。正式 sdk/build/browser receipts 均为 NOT_RUN。

本次仅改 guide 与本记录，纠正过期交接措辞并保存失败→修复→通过链；定向文案、链接及保护输入摘要检查见 `validation/editorial-fix-check.txt` 和 `validation/editorial-fix-evidence.json`。独立 delta 复核待主控安排。
