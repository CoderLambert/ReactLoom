# F05 SheetJS 本地质量整改与稳定检查点

日期：2026-11-10。范围仅本条目；这是工作者自检记录，供主控更新 roadmap/results 与独立复核，**不是正式收据或独立验收结论**。

## 对象与基线

- cwd：`/home/lambert/githubRepos/lambert/ReactLoom`；开始时 HEAD 为 `1218066e706a90ba03fac8dff8c9b843dd2429c4`。
- 主控给定条目基线 SHA-256：`252d00d24804e05e755faed451817cd6e27dd59df9622bee8e634502a90c05a8`，16 个原有文件；开始时 F05 无 diff。根目录已有其他 owner 的大量 dirty 工作，均未改动或恢复。
- 固定 SDK：`xlsx@0.20.3`，真实本地路径为根 `node_modules/.pnpm/xlsx@https+++cdn.sheetjs.com+xlsx-0.20.3+xlsx-0.20.3.tgz/node_modules/xlsx`。环境 Node v26.13.0 / pnpm 10.33.3。
- `contentState=recreated` 与 `originalRecovery=SUMMARY_ONLY` 保持真实含义，未声称恢复历史 GUIDE/SOURCE/DEMO 原件。
- 未改公共 src/scripts/tests/e2e、依赖/锁、根索引、队列/results；未提交、推送或发布；未运行全目录 generate/typecheck/build 或浏览器。

## 阶段3的实施细化（供主控补路线图）

### 前置条件

读取根/本包/条目AGENTS、调度合同、IMPLEMENTATION/REPAIR、质量Skill及三个references，核对实际源码、固定CDN版本、可用Node宿主。官方0.20.3包已经安装且可真实import，无新增依赖请求。正式记证需干净已提交输入与verify:record，当前不满足且没有提交授权；直接配方运行独立完成。

### 目标

沿行数据 → worksheet → workbook → XLSX字节 → 回读行，解释SDK转换能力与业务schema/分组/汇总的职责。工程师可生成可检查文件，验证类型和字段，理解多表报表为何与单表导入契约不同，触发真实无效工作簿的拒绝。

### 单库任务

3.A 完整交付F05：依据0.20.3文档/本地类型与源码重写讲解；三个独立目标分别是单表类型往返、分类汇总与多表组织、真实无效XLSX的受限导入；正常排版真实源码与可迁移helpers；补官方固定提交原文、官网证据；运行配方并核对字节/JSON产物，再做六项自检和独立复核。

### 验收标准

单表回读精确行值和数值类型；分类报告回读Summary与全部明细且总数/总量一致；公式样文本保持s单元格，真实f公式和9类无效XLSX被拒绝；CLI退出码/日志/字节产物可重现。正文与源码职责一致，保留保守ZIP边界及生产隔离限制。官方原文固定ref/路径/语言/日期/摘要可查，官网没有浏览器确认就保持unknown。六项适用自检分别记录；主控独立复核后决定工作状态，正式收据另算。

### 交付物

本条目的guide/agent/library metadata、三条CLI及可迁移helpers、真实SDK套件、保留并格式化的策略校验、官方原文与来源响应、evidence日志/manifest，以及本记录。主控负责roadmap/queue/results/索引、必要公共官方forge支持和稳定屏障后的集成检查。

## 改动价值与Demo操作

| 实验 | 操作与输入 | 实际观察 | 关键源码 |
| --- | --- | --- | --- |
| basic | 执行basic.mjs，三条原创订阅记录 | Subscriptions / A1:C4，B2为数值128，三行深度相等，8,851字节 | core.mjs、basic.mjs |
| business | 执行business.mjs，四条原创记录、三个类别 | Summary与三张Category-N；RSS=160、推荐=63、专题=27，总计250，11,071字节 | category-report.mjs、business.mjs |
| advanced | 执行advanced.mjs，四种公式前缀+9份真实无效XLSX | 前缀保守转为字符串且无f；缺列/多列/表头/重复/负数/中间空行/201行/公式/多表均有拒绝原因，8,886字节 | advanced.mjs、invalid-workbooks.mjs |

原business仅换数据重复单表往返，现增加真正的workbook多表组织。原blankrows:false会忽略中间空行，现保留并用真实XLSX反例证明拒绝。原compressed ZIP文案误称2MiB，现明确2,000,000字节；预检不构成CPU/内存隔离。分类汇总增加安全整数溢出拒绝；测试实际导入xlsx，没有把policy-only改名当作SDK测试。

## 官方依据

- 官方Node发行说明：https://docs.sheetjs.com/docs/getting-started/installation/nodejs/ ，指向0.20.3 CDN tarball；根锁已有对应integrity。未重新安装或改锁。
- 导出与数据转换：https://docs.sheetjs.com/docs/getting-started/examples/export/ 、https://docs.sheetjs.com/docs/api/utilities/array/ 。官方文档由Context7和直接网页读取交叉核对。
- 匹配版本本地 `types/index.d.ts:176` 的cellFormula、`:206` 的sheetRows、`:920` 的json_to_sheet、`:980` 的book_new/book_append_sheet，以及 `xlsx.mjs:15941` 的!fullref截断处理、`:27781` 的工作簿/工作表追加实现均只读核对。源码版本和package.json为0.20.3。
- 固定官方提交：`8a7cfd47bde8258c0d91df6a737bf0136699cdf8`，repository=`SheetJS/sheetjs`，path=`README.md`，language=`en`，version=`0.20.3`。同ref公开API根目录清单只有README.md，没有官方中文README候选；见 `official/readme-candidates.json`。
- 原文通过无需凭据的raw API与contents API各实际200取回。raw URL：`https://git.sheetjs.com/api/v1/repos/SheetJS/sheetjs/raw/README.md?ref=8a7cfd47bde8258c0d91df6a737bf0136699cdf8`。保存1494字节，SHA-256=`97161c0a7368fd50782c9c38ae25641e9880d9799e4095861580ce7b8359d91b`，与已安装包README原始字节相同，未翻译或格式化。`official/package-version-evidence.json` 另证同ref的package为xlsx 0.20.3、Apache-2.0。
- canonical网页原文入口及raw网页形式实际跳转登录页；没有绕过认证。公开API能够获取该固定ref，故使用其真实原文，登录HTML只保存在response-3.txt，未当作README。
- 官网 `https://sheetjs.com/` GET200且最终URL不变，未见X-Frame-Options/CSP frame-ancestors；未在Lab origin浏览器验证，metadata为unknown。完整响应头与原始响应见 `official/source-evidence.json` 及response-4.txt。读取静态HTML不执行其脚本。

## 六项自检

| 维度 | 状态和证据层级 | 依据及限制 |
| --- | --- | --- |
| 技术准确 | PASS — 版本源码/类型+真实SDK | guide模型与0.20.3API对应；13项真实SDK验证单表、多表、类型、拒绝和汇总溢出。CE求值能力未冒称实现 |
| 解释清楚 | PASS — 静态内容复核 | guide以运营报表问题起笔，机制表/最小接入/三个实验/迁移路径可回答选型与操作；维护来源放末尾 |
| Demo有用 | PASS — 真实Node CLI | 三个目标有独立新知识，三命令exit0、9类无效XLSX实际解析拒绝，SDK与fixture边界明确 |
| 源码可迁移 | PASS — 静态+真实Node | helpers完整、格式检查通过、依赖固定；Node文件输出适配与浏览器迁移步骤分开，未知输入隔离服务明确未实现 |
| 官方来源可靠 | PASS — 固定ref原文/API+HTTP证据 | 原文摘要与同ref版本可核；只有英文README；官网unknown，未把头检查冒称嵌入allowed。canonical网页登录限制保留 |
| 结果可复核 | PASS — 本地CLI/Node证据 | evidence/local-runs.json保存完整argv/cwd/时间/退出码/log摘要/输入摘要/产物摘要；不是正式verify:record收据或浏览器验收 |

以上是工作者自检，等主控安排独立复核后才能推进队列。浏览器与全目录集成不在这份本地Node证据的PASS范围。

## 实际命令与原始证据

所有下列命令cwd：`/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。完整命令argv、起止时间与输出SHA-256见 `evidence/local-runs.json`。

| 命令 | 退出码/结果 | 日志 |
| --- | --- | --- |
| `node entries/F05-sheetjs/examples/basic.mjs` | 0，单表往返 | evidence/basic.log |
| `node entries/F05-sheetjs/examples/business.mjs` | 0，多表汇总回读 | evidence/business.log |
| `node entries/F05-sheetjs/examples/advanced.mjs` | 0，字符串与9类无效字节拒绝 | evidence/advanced.log |
| `node entries/F05-sheetjs/examples/verify.mjs` | 0，13 PASS / 0 FAIL / 0 SKIP | evidence/sdk.log |
| `node --test entries/F05-sheetjs/examples/validation.test.mjs entries/F05-sheetjs/examples/archive-policy.test.mjs entries/F05-sheetjs/examples/zip-entry-policy.test.mjs` | 0，18 PASS / 0 FAIL / 0 SKIP；纯策略 | evidence/policy.log |
| `node --input-type=module -e <manifest中保存的完整定向校验脚本>` | 0，validateEntry/entryCompletenessIssues/所有声明源存在/README摘要/三个level | evidence/metadata.log |
| `pnpm exec -- biome check entries/F05-sheetjs/examples entries/F05-sheetjs/tests entries/F05-sheetjs/library.json entries/F05-sheetjs/verification.json entries/F05-sheetjs/official/source-evidence.json entries/F05-sheetjs/official/readme-candidates.json entries/F05-sheetjs/official/package-version-evidence.json` | 0，20文件，无更改 | evidence/biome.log |

初始格式检查发现原有控制字符regex被Biome拒绝；改成同义字符码检查，策略与SDK最终定向检查均通过。未为本次文案再跑全目录。

### 实际产物

三个 `.xlsx` 及同名 `.json` 在 `.artifacts/`，受条目.gitignore忽略，不污染公共产物目录。日志与manifest是非忽略的交付证据。文件尺寸和摘要如下（均为实际执行，不是预造）：

- `.artifacts/basic.xlsx`：8851字节，SHA-256 `f238dfd5a6bc88402719cb7fe5f4086d4a2e6d56750c100feaf7a0d3de3f50ed`；回读JSON同目录。
- `.artifacts/business.xlsx`：11071字节，SHA-256 `276300f5bab6306e6b3cca83d6caa88de31725e3cf9c9249c5c4400f80cbd4b4`；回读JSON同目录。
- `.artifacts/advanced.xlsx`：8886字节，SHA-256 `e4bc55966c6b749d16413a6b947f25644404bb2025d1ee6c3880bfd5a40f445a`；回读JSON同目录。

## 剩余项与正式状态

- `verification.json` 的sdk/build/browser全部NOT_RUN：真实本地SDK已跑，尚未生成绑定干净提交的verify:record收据；无提交授权。保留两个状态体系，不能把本地PASS直接写入正式PASS。
- 公共 `scripts/cli-runner.mjs` 未注册F05，三场景可用复制命令直接执行。主控决定本阶段不为正式收据扩大CLI registry；新增真实tests/sdk.test.mjs已满足既有SDK发现规则，后续有干净提交可走相应SDK记录器。
- 主控需要支持官方SheetJS forge的固定commit URL校验/相对链接；主控已反馈完成受限支持，本条目定向validateEntry通过，工作者没有修改公共源码。
- Lab generate/typecheck/build和页面README/website/源码面板的实际浏览器展示：本工作者NOT_RUN，由主控收齐稳定检查点后安排，不能使用这份Node日志冒称通过。
- Excel/LibreOffice人工打开、浏览器端下载、大文件资源隔离：NOT_RUN/未实现，guide说明边界；当前3个目标的验收是离线Node原创fixture。

## 文件列表

以下为交付时本目录非忽略文件清单；其中AGENTS.md未修改。生成的.xlsx/.json不在此清单：

- `.gitignore`
- `AGENTS.md`
- `agent.md`
- `evidence/advanced.log`
- `evidence/basic.log`
- `evidence/biome.log`
- `evidence/business.log`
- `evidence/local-runs.json`
- `evidence/metadata.log`
- `evidence/policy.log`
- `evidence/sdk.log`
- `examples/advanced.mjs`
- `examples/archive-policy.mjs`
- `examples/archive-policy.test.mjs`
- `examples/artifacts.mjs`
- `examples/basic.mjs`
- `examples/business.mjs`
- `examples/category-report.mjs`
- `examples/core.mjs`
- `examples/invalid-workbooks.mjs`
- `examples/validation.mjs`
- `examples/validation.test.mjs`
- `examples/verify.mjs`
- `examples/zip-entry-policy.mjs`
- `examples/zip-entry-policy.test.mjs`
- `guide.md`
- `library.json`
- `official/package-version-evidence.json`
- `official/readme-candidates.json`
- `official/readme.md`
- `official/response-1.txt`
- `official/response-2.txt`
- `official/response-3.txt`
- `official/response-4.txt`
- `official/source-evidence.json`
- `tests/sdk.test.mjs`
- `verification.json`
- `local-validation.md`（本记录）

## 独立复核P2修复：转义后长度域一致

复核发现输入 `"=" + "a".repeat(119)` 共120字符，旧normalize先检查120上限再加单引号，导出变121字符；回读和分类报告的再次normalize会拒绝。先补两项定向失败断言，真实运行得到exit1 / 2 FAIL（见evidence/review-length-red.log），再将长度判断移到转义后的最终字符串。

新断言覆盖channel/kind两个字段、`= + - @`四个前缀：普通120字符保留；前缀原文119字符转义为120后，真实XLSX单表往返和分类报告二次normalize均通过；原文120字符将因转义后121在导出前被一致拒绝。对应修改只涉及validation.mjs、validation.test.mjs、tests/sdk.test.mjs和说明。

| 定向命令（cwd仍为packages/library-lab） | 结果 | 原始日志 |
| --- | --- | --- |
| `node --test --test-name-pattern='120-character|maximum normalized' entries/F05-sheetjs/examples/validation.test.mjs entries/F05-sheetjs/tests/sdk.test.mjs` | 修复前exit1 / 2 FAIL，修复后exit0 / 2 PASS | evidence/review-length-red.log、evidence/review-length-green.log |
| `node --test entries/F05-sheetjs/examples/validation.test.mjs entries/F05-sheetjs/tests/sdk.test.mjs` | exit0 / 22 PASS（8策略+14真实SDK），0 FAIL/SKIP | evidence/review-affected-suites.log |
| `pnpm exec -- biome check entries/F05-sheetjs/examples/validation.mjs entries/F05-sheetjs/examples/validation.test.mjs entries/F05-sheetjs/tests/sdk.test.mjs` | exit0 / 3文件，无更改 | evidence/review-length-biome.log |

三条CLI已有短文本fixture不触及长度边界，原产物内容/摘要不变；新增真实SDK测试覆盖了受影响的单表与分类报告，不重复运行其余已通过的ZIP策略/metadata/CLI。原13 SDK和18策略是首检查点历史结果；当前直接受影响套件是14 SDK和8策略。完整argv和起止时间已追加到evidence/local-runs.json的reviewFixRuns。verification正式状态仍NOT_RUN。
