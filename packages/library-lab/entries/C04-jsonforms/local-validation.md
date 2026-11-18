# C04 JSON Forms 本地质量验收

最终作者稳定检查点：`2026-11-10T15:42:05.612188+00:00`；owner `quality_e11`。实际 cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。本条目原 11 文件无初始 diff，原始 SHA 见 [baseline.json](validation/baseline.json)。仅修改本条目；保留他人改动，未修改公共源/测试/依赖锁/队列/results，未提交、推送、安装或运行全目录生成/构建。现在 **FINAL STABLE，停止全部条目写入**，供 root 独立复核与共享候选验收；不等同 content_done。

## 六项结论

| 维度 | 本地结论 | 证据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（静态、类型与定向 SDK） | 核对实装 core/react/vanilla 3.8.0、Ajv 8.20.0；真实 SDK 3/3、策略 4/4、最终入口和提案严格类型 exit 0。SSR 不证明浏览器生命周期。 |
| 解释清楚 | PASS（作者核对） | 中文 guide/agent 按三目标对应实际控件，明确 Schema、UI Schema、Vanilla、已通知草稿、additionalErrors 与本地模拟提交的边界。 |
| Demo 有用 | 待真实浏览器，NOT_RUN | 三个独立目标及可观察输入/状态/结果已经实现；完整三项 Playwright 提案覆盖图示目标，但作者未运行真实浏览器。 |
| 源码可迁移 | PASS（静态与类型） | 正常排版的五份必要源码、声明和局部 CSS 齐全，无宿主路径别名、凭据或私有服务；运行验收另待 root。 |
| 官方来源可靠 | PASS（来源核验） | 固定官方 v3.8.0 tag/commit 与匹配 manifest，原 README 字节/SHA、中文候选与完整官网响应头均保存；官网 blocked。 |
| 结果可复核 | PASS（本地记录）；运行 NOT_RUN | 命令、实际 cwd/argv/UTC/exit、失败历史与日志、SDK 审计、提案及最终输入 hash 齐全。正式 verification 仍全部 NOT_RUN。 |

## 目标、源码与实际边界

保留三个有效目标：basic“Schema 驱动控件与校验”；business“HIDE 与提交白名单”；advanced“字段错误、提交快照与取消”。五个生产 sourceFiles 为 `examples/example.tsx`、`submission-policy.mjs`、`submission-policy.d.mts`、`forms.css`、`demo.tsx`。原业务规则保留并正常排版；Schema/UI 定义共享给实际 SDK 测试，避免另造测试 Schema。

真实 JsonForms 使用 Vanilla renderers/cells。实装 3.8.0 的 `onChange` 有 10ms debounce，只输出 core.errors，不包含 additionalErrors；页面展示 SDK 通知次数而非把初始化误算为提交。HIDE 实际保留 hidden wrapper/input 与原数据，不是删除 DOM 或清空 URL；manual payload 显式省略 URL。`https://` 长度为 8，可能通过前缀 Schema、随后被 URL 业务规则拒绝；原先错误的“https://a 太短”示例已修正。源码审计见 [sdk-source-audit.json](validation/sdk-source-audit.json)。

保存前同步复验最后一次 SDK 已通知的草稿，开始前复制规范 payload，回包只使用该快照。自有 AbortController、generation、alive 与 formEpoch 拒绝编辑/取消/重置/卸载后的旧任务；reset 仅重挂本示例 provider，并清自己的 composition 状态。公共 level 对应独立 Session。SDK 已安排的 debounce 通知可能晚到，应用以 alive/epoch 忽略；不声称取消了 SDK 全局任务。手动 URL 不触发请求；409/422、160/500ms 延迟、请求计数都是应用本地 fixture，界面明确“非 HTTP”。没有真实后端或模型服务。

UI 可观察标记包括 `c04-workshop`、`c04-status`、`c04-server-errors`、`c04-schema-errors`、`c04-notifications`、`c04-payload`、`c04-submitted`、`c04-request-count`。真实按钮为“保存内存草稿”“取消进行中的操作”“重置”；字段为工作区名称/启用，或订阅名称/订阅类型/RSS 地址/启用订阅。

## 官方原文与官网证据

官方仓库 `eclipsesource/jsonforms`，tag `v3.8.0`，精确 commit `6075bcee93205c8fbe1f88eec19ed9058ad0f965`，原文路径 `packages/react/README.md`。原始英文 README **4592 bytes**，SHA-256 `618f7fb0bccfab2827effb645a0759a38a0d27b545194ae9a73cb8ab9e32aa0b`。固定提交的未截断树实际检查了中文候选，未发现目标/根目录的中文 README，选择对应 React 包英文原文，中文说明留在 guide。三个 npm 3.8.0 响应都省略 gitHead，记录为 null；不伪造“npm gitHead 与 tag 相同”。commit 内 React manifest 的版本确为 3.8.0。抓取时间、URL、语言、响应头、原文 SHA 见 [source-evidence.json](official/source-evidence.json) 与 library.json。

官网 `https://jsonforms.io/` 实际 GET 200 的完整响应头包含 `X-Frame-Options: SAMEORIGIN` 和强制 `Content-Security-Policy: ... frame-ancestors 'self'; ...`，故 homepage.status 为 **blocked**。未在 iframe 实际运行，不标 allowed。官网正文先前读取发生 IncompleteRead；后续只补一次真实 GET 的完整 headers，正文明确 NOT_READ、字节/hash null，未把未读正文冒充快照。

## 验证与失败历史

全部真实执行的 cwd 都是上述 Lab 目录。下列日志保存完整 argv、输出、UTC 与退出码；SDK/策略有效检查按影响复用，没有因为文档/提案收尾重复。完整收据见 [local-runs.json](validation/local-runs.json)。

| 实际命令 | exit | 日志 |
| --- | --- | --- |
| `python3 entries/C04-jsonforms/validation/fetch-official.py` | 1 | [official-fetch.txt](validation/official-fetch.txt) |
| `python3 entries/C04-jsonforms/validation/fetch-official.py` | 1 | [official-fetch-fixed.txt](validation/official-fetch-fixed.txt) |
| `python3 entries/C04-jsonforms/validation/fetch-homepage.py` | 0 | [homepage-capture.txt](validation/homepage-capture.txt) |
| `pnpm exec biome check --write entries/C04-jsonforms/examples entries/C04-jsonforms/tests entries/C04-jsonforms/library.json entries/C04-jsonforms/verification.json entries/C04-jsonforms/official/source-evidence.json` | 1 | [biome.txt](validation/biome.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C04-jsonforms/examples/demo.tsx` | 0 | [typecheck.txt](validation/typecheck.txt) |
| `pnpm exec biome check entries/C04-jsonforms/examples/submission-policy.mjs` | 0 | [format-fixed.txt](validation/format-fixed.txt) |
| `node --test entries/C04-jsonforms/tests/sdk.test.mjs` | 0 | [sdk.txt](validation/sdk.txt) |
| `node --test entries/C04-jsonforms/tests/submission-policy.test.mjs` | 0 | [policy.txt](validation/policy.txt) |
| `pnpm exec biome check --write entries/C04-jsonforms/validation/metadata-check.mjs` | 0 | [metadata-format.txt](validation/metadata-format.txt) |
| `node entries/C04-jsonforms/validation/metadata-check.mjs` | 0 | [metadata.txt](validation/metadata.txt) |
| `git diff --check -- entries/C04-jsonforms` | 0 | [diff-check.txt](validation/diff-check.txt) |
| `pnpm exec biome check --write entries/C04-jsonforms/examples/example.tsx entries/C04-jsonforms/validation/sdk-source-audit.json entries/C04-jsonforms/validation/browser-proposal.check.ts（临时副本，核对后删除；相同代码保留为 browser-proposal.txt）` | 0 | [final-format.txt](validation/final-format.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C04-jsonforms/examples/demo.tsx entries/C04-jsonforms/validation/browser-proposal.check.ts（临时副本，核对后删除；相同代码保留为 browser-proposal.txt）` | 0 | [proposal-entry-typecheck.txt](validation/proposal-entry-typecheck.txt) |
| `python3 -c 'import ast,pathlib; paths=[pathlib.Path('"'"'entries/C04-jsonforms/validation/fetch-official.py'"'"'),pathlib.Path('"'"'entries/C04-jsonforms/validation/fetch-homepage.py'"'"')]; [ast.parse(p.read_text(), filename=str(p)) for p in paths]; print('"'"'2 evidence scripts parse; no HTTP or SDK execution'"'"')'` | 0 | [evidence-script-syntax.txt](validation/evidence-script-syntax.txt) |
| `node entries/C04-jsonforms/validation/metadata-check.mjs` | 0 | [metadata-final.txt](validation/metadata-final.txt) |
| `git diff --check -- entries/C04-jsonforms` | 0 | [diff-final.txt](validation/diff-final.txt) |

首次来源抓取 exit 1 因误假定 npm 含 gitHead、请求 None commit 404；初次真实 registry 响应保存为 source-initial-githead-null.json。改用官方真实 v3.8.0 tag 后，registry/tag/tree/manifest/README 均获取成功，官网正文 IncompleteRead 导致第二次 exit 1；仅补官网 headers 后 exit 0。两个失败日志保留，未重取有效原文。证据脚本最后只修正 blocked 结果输出，AST 语法检查 exit 0；未因此重发 HTTP。

初次 Biome exit 1 仅 JSON Schema 的 `then` 被识别为 thenable 属性；增加精确 lint 说明它是 Schema 关键词，单文件检查 exit 0，没有全局放松规则。入口最后仅补 reset 清 composition 状态和准确重置文案，最终入口+完整提案 strict 类型与定向格式均 exit 0；原 SDK/策略不受影响。

真实 SDK **3/3** 使用正常 `node --test`：Vanilla SSR 的真实标签/cell 与 manual hidden wrapper、生产共享 Schema 的真实 createAjv、NoValidation 下真实 additionalErrors。策略 **4/4** 只验证 pure 业务规则；都不是浏览器事件、原生 IME、动画或服务验收。SDK 审计为安装文件路径/hash/源码片段核对，不另冒充测试 PASS。

## 浏览器交付与未测项

[完整 browser-proposal.txt](validation/browser-proposal.txt) 已保存可直接接入的三项真实 Playwright 测试，并对入口和临时提案副本一起严格类型检查、格式检查 exit 0。没有 SDK mock、page.route 伪造服务或假控件：basic 检查真实标签/错误/checkbox 与同源数据；business 检查 HIDE 原 DOM/值保留、manual 白名单与恢复 RSS；advanced 检查真实字段错误、409/422、本地任务快照、编辑/取消/重置/离开拒绝旧结果、窄屏与无 URL 请求。提案中 compositionstart/end 仅验证应用协议守卫，不等于操作系统输入法验收。

**NOT_RUN**：真实浏览器三目标、SDK onChange/隐藏恢复/生命周期与卸载交互、真实操作系统 IME、共享 build/catalog/typecheck/浏览器和官网 iframe 运行。由 root 在冻结候选统一执行；本条目没有伪造 formal verification PASS。三个正式 verification 场景与 sdk/build/browser 保持 NOT_RUN。

## 变动与稳定交付

改动包含 guide.md、agent.md、library.json、verification.json、五个 examples 源文件、两个 tests、official/readme.md 与 source-evidence.json，以及本地 validation 脚本/源码审计/命令日志/浏览器提案/输入 hash。完整文件清单和 SHA 见 [input-hashes.json](validation/input-hashes.json)。此前可编译中间报告与 hash 保留为 intermediate-validation.md、intermediate-input-hashes.json，仅作历史边界。

现在停止所有 C04 文件写入。没有对 C05 预先实施；不等待 browser 结果自称 content_done。

## 主控最终本地闭环

候选15实际三个JSONForms目标+官网blocked共4PASS，lint/type/build/catalog0、输入稳定。非作者核心六项与抓取工具delta复核关闭；source-tool-smoke-red真实NameError、8请求受控传输GREEN、失败刷新保留旧成功原文/evidence GREEN及可迁移fixture均有实际日志，不当新官方HTTP或SDK。组件和固定原文未变，不重复browser。适用六项PASS；正式三收据仍NOT_RUN。最终状态/逐库证据见路线图results/C04.md。
