# 2026-11-18 主控闭环补充

六项本地质量PASS。真实Node SDK4/策略6/三CLI exit0；basic6786B、business6858B、advanced6939B自产XLSX往返，样式冻结/公式范围缓存115可查。非作者新两行consumer6825B、SUM C2:C3/cache10，刻意缓存777后读回仍777，直接证明不求值。浏览器4项仅三条CLI命令及来源展示，不称浏览器执行ExcelJS或Office视觉验收。候选34及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F04.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F04 ExcelJS 本地质量证据（2026-11-18）

STABLE：仅F04目录，未改shared/pkg/lock/e2e/queue/results/生成，无build/fulltypecheck/browser/commit。固定ExcelJS4.4.0；Node-only，不加前端SDK宿主；formal sdk/build/browser均NOT_RUN。

|六门槛|状态与证据层级|依据|
|---|---|---|
|技术准确|PASS：真实Node SDK/CLI+policy|shared core生成/自产bytes load；SDK4覆盖冻结/样式、formula+cached result、String公式样文本与实际普通String语义、15位预算；checkRows先newWorkbook|
|解释清楚|PASS：静态自检，独立待主控|guide从需求/选型→工作簿数据流→完整迁入/CLI→三不同目标→精度/文本/ZIP边界；纠正库不计算公式、普通String不会自动成formula及15位预算非Excel最大数|
|Demo有用|PASS：实际Node CLI|basic样式冻结与summarynull；businessSUM缓存；advanced显式第四行公式样String+NaN拒绝；三CLI真实exit0，不用网页命令展示替代执行|
|源码可迁移|PASS：真实CLI+静态|core.mjs/row-policy.mjs+所需入口，完整三入口及可选verify共六文件；每demo声明实际所需源；精确pnpm/NodeESM/cwd/参数规则，无React/env/CSS/服务；只内存无临时文件|
|官方来源可靠|PASS：固定中文原字节/实际许可HTTP|v4.4.0→commitac96f9a61e9799c7776bd940f05c4a51d7200209，完整tree有README_zh.md优先保存zh-CN原字节/SHA；安装与fixedpackage4.4.0/MIT，LICENSE保留；GitHub官网deny/frame-ancestors none blocked|
|结果可复核|Node层PASS，网页展示/formal NOT_RUN|SDK4/policy6分列raw；三CLI精确argv/cwd/exit/log齐全，未写xlsx到用户磁盘；浏览器仅命令/源码/来源提案，不宣称网页执行或桌面视觉/重算PASS|

## 实际检查与命令

SDK/policy/格式cwd `/home/lambert/githubRepos/lambert/ReactLoom`：

- `node --test packages/library-lab/entries/F04-exceljs/tests/sdk.test.mjs` exit0，4actual SDK tests，validation/sdk.log。直接用UI工坊shared core及真实ExcelJS，还用本次自产bytes验证普通'=2+3'cell仍String，不是公式。
- `node --test packages/library-lab/entries/F04-exceljs/tests/row-policy.test.mjs` exit0，6纯policy，validation/policy.log；不import ExcelJS，不计SDK。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/F04-exceljs/examples entries/F04-exceljs/tests entries/F04-exceljs/validation/browser.spec.ts entries/F04-exceljs/library.json entries/F04-exceljs/official/source-evidence.json` exit0，11files，初次unused import warning/template建议保留biome.log。定向--write --unsafe仅移除未用FIXTURE导入/等价模板字符串，最终exit0，biome-final.log；不重复未变语义测试。metadata/verification补充后单独exit0，metadata-biome.log。
- `git diff --check -- packages/library-lab/entries/F04-exceljs` exit0。

实际3CLI cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`：

|argv|exit|本次真实输出|
|---|---|---|
|`node entries/F04-exceljs/examples/basic.mjs basic`|0|6786bytes；totals115/17；rowCount4、summarynull、frozen true、headerBold true、fill FF275B49|
|`node entries/F04-exceljs/examples/business.mjs business`|0|6858bytes；rowCount5；SUM(C2:C4)缓存115，D缓存17|
|`node entries/F04-exceljs/examples/advanced.mjs advanced`|0|6939bytes；SUM(C2:C5)缓存115；B5带撇号HYPERLINK String，NaN拒绝断言通过|

validation/{basic,business,advanced}-cli.log保留rawstdout/stderr；*-command.json为真实argv/cwd/exit/UTC。字节长度为本次运行观察，不是稳定字节/网络传输量承诺。原verify.mjs作为可选重复检查脚本保留，本轮未额外重跑，SDK4+3CLI已覆盖必要行为。

## 实质准确性与限制

原guide称ExcelJS把普通公式样String执行成公式不准确：实际SDK String类型不会自动变Formula，只有受控formula对象才创建公式。现撇号策略明确为额外保守合同，会改变字面值，不保证所有CSV/表格再导入软件通用安全；真实公式缓存来自JS加总，不是库重算。

ID现NFC/trim、明确≤64Unicode码点稳定字符表、en-US小写去重；禁公式前缀/引号身份，避免不同原id经文本前缀变相同输出。source trim≤160UTF16单元、C0/DEL拒绝、前缀加撇号。整数单项/累加≤999999999999999为应用保守15位预算，不是Excel数值最大值；Number安全整数范围更宽，不混用。

checkRows在newWorkbook之前。只writeBuffer/load本次自产字节；inspectWorkbook不是外来ZIP/XLSX安全验证器。本例没有外部输入文件、压缩展开预算/ZIPbomb保护、宏/CSV解析、streaming writer、浏览器下载、桌面字体/打印版式或公式重算验收。没有文件/连接/监听/子进程需清理，引用限本次内存。

## 官方材料与浏览器交棒

真实GitHub tag→annotated tag objectd911329c2c3ca7a4d5e979f2539a3cd868fc09d4→commitac96f9a61e9799c7776bd940f05c4a51d7200209；tree发现README_zh.md，Python实际下载原字节保存official/readme.md，path/language/SHA与library.json一致。原LICENSE与安装/fixedpackageMIT字段已核对。官方homepage curl完整响应头保留official/homepage-headers.txt，明确deny/frame-ancestors none，blocked不是unknown。没有执行README代码。

validation/browser.spec.ts只给主控验证三条命令/源码/固定中文来源展示，不运行ExcelJS、不创建新浏览器工作簿宿主；actual Node SDK/CLI结果全部来自上列命令。真实Excel/LibreOffice打开与再计算不在本轮，不从load结构推视觉或计算一致性。

独立review重点：shared core的先policy后构造；本次自产bytes往返/样式/冻结/formula缓存；公式样文本String与撇号语义；NFC/ID去重及15位单项/合计；六迁入文件与cwd参数；官方中文原文字节与blocked官网；SDK/policy/browser三层和formalNOT_RUN。
