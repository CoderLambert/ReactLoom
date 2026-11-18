# C04 可编译中间检查点（尚非完整整改交付）

时间 `2026-11-10T15:25:35.044534+00:00`，owner quality_e11；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，HEAD1218066e706a90ba03fac8dff8c9b843dd2429c4。原11文件无初始diff，见validation/baseline.json。root要求候选15先收可type/build检查点，因此现在停止全部C04写入，等待明确release；**未宣称最终STABLE/content_done**。公共README独立报告及B18增量已按授权另行完成，本轮不修改公共源/测试/依赖锁/队列/results。

## 已完成与剩余

保留原3目标和真实JsonForms3.8/Vanilla、HIDE/payload规则、generation/AbortSignal本地任务；正常排版、共享Schema/UI定义、必要forms.css；保存前复验已通知draft，规范payload在开始前冻结，不在回包时读取后续草稿。onChange在实装3.8中10ms debounce，回调只接收core.errors，不含additionalErrors；alive与formEpoch拒绝卸载/重置旧provider通知，重置用key重挂当前provider，公共level用独立Session。开始/取消/重置/编辑/卸载按实际所属任务失效，界面明确说明没有HTTP；状态明确本地fixture。

现代实际SDK3/3：真实Vanilla SSR标签关联及manual的hidden wrapper（HIDE不是从DOM删除或清data）、同Schema真实createAjv校验、NoValidation仍显示additionalErrors。原4pure规则正常排版后4/4；不冒称浏览器onChange/IME/取消已通过。条目strict类型、源格式/metadata/差异检查均已通过，产品源码之后仅JSONSchema then关键词的精确lint说明。

**剩余必须在release后完成**：重写仍旧版的guide/agent（包括错误URL长度例子、HIDE实际hidden DOM、提交快照与已通知草稿/10ms边界、provider epoch/生命周期），保存实际SDK审计与完整browser-proposal.txt，提案类型/格式、最终六项与输入SHA收尾。尚无本条目新浏览器提案或真实browser结果。验证脚本需补将当前官网blocked状态作为可复现输出（当前实际headers和metadata已一致）。

## 六项当前状态

| 维度 | 状态 | 边界 |
| --- | --- | --- |
| 技术准确 | 局部PASS/整体未完成 | 实装3.8.0三包/Ajv8.20、真实SSR3与strict类型；guide仍需同步，不是整库PASS。 |
| 解释清楚 | IN_PROGRESS | 旧长guide/agent尚未重写，不标内容完成。 |
| Demo有用 | NOT_RUN | 真实控件源码已有，浏览器/提案未交付。 |
| 源码可迁移 | 局部PASS | 5生产sourceFiles自洽、CSS/类型齐；实际客户端验证未跑。 |
| 官方来源可靠 | PASS（实际来源） | 固定v3.8.0 tag6075bcee93205c8fbe1f88eec19ed9058ad0f965/manifest3.8，npm三个gitHead均null事实保留；原README4592B与SHA。官网完整GET200头XFO SAMEORIGIN及CSP frame-ancestors self→blocked，正文NOT_READ。 |
| 结果可复核 | NOT_RUN（整体） | 局部命令/失败和修正日志齐；正式sdk/build/browser全NOT_RUN。 |

## 实际命令与日志

下列真实cwd均为Lab；通过validation/run-local.py执行并保存完整输出/UTC/退出码。完整argv见validation/local-runs.json。未运行全目录generate/typecheck/build或浏览器。

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

初次official-fetch exit1是错误假定npm含gitHead后请求None commit的404；三包实际省略该字段，改固定官方v3.8.0真tag，未伪造npm SHA。修正后的来源抓取已取全registry/tag/tree/manifest/原README，但官网正文末尾IncompleteRead导致exit1；仅补一个真实GET完整headers、正文NOT_READ，保留两个失败日志/初次证据，不重取有效原文。最终官网明确blocked，不能写unknown或allowed。

第一次Biome10文件exit1仅JSONSchema的then关键词告警；精确说明这是非函数Schema关键字而非thenable，受影响1文件check exit0；未改字段名或全局降规则。SDK3/policy4/strict类型随后有效。源/metadata可供候选15构建，guide/提案/整库质量仍待release后继续。
