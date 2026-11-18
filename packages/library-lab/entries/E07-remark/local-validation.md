# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK5+策略4及非作者新Markdown/迁入编译通过；浏览器3项含来源，覆盖三个目标的实际AST/GFM与文本输出、危险输入无执行/跟踪请求、24003字节错误清旧结果和恢复。候选30及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E07.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E07 remark 本地质量复核（2026-11-18）

独占E07，真实remark15.0.1/remark-gfm4.0.1。先落NOT_RUN再整改；未改shared/依赖锁/e2e/队列/生成，未执行共享build/fulltypecheck/browser，未commit。仅本条定向SDK/policy、Biome、隔离迁入编译和官方合同检查；正式sdk/build/browser/security维持NOT_RUN。

|六项|状态/证据层级|结果与限制|
|---|---|---|
|技术准确|PASS：真实同源SDK/源码|SDK5/5导入UI实际workshop.mjs，真实remark/gfm parse→audit→同树stringify；GFMtable/tasks/delete、unsafe definition/rawHTML、精确24000UTF8边界、parse/stringify不run transformer对照均执行。|
|解释清楚|PASS：静态正文/源码对照|用途/选型、同树所有权、语法扩展初始化与run区分、三目标、审计非净化/安全信号非可信域、UTF8/UTF16单位及发布边界清楚。|
|Demo有用|NOT_RUN：实际DOM待主控|三个独立目标结构、GFM、审计；browser提案覆盖全目标、真实输出、恶意输入只文本无网络、超字节错误清旧结果及恢复，未执行。|
|源码可迁移|PASS：复制源码严格编译|example.tsx、workshop.mjs/.d.mts、audit-policy.mjs/.d.mts齐全；demo仅转发。React/TSX/ESM宿主、纯Node路径、两包安装、无CSS/Provider/env/账号均说明。隔离编译exit0。|
|官方来源可靠|PASS：固定原文字节/实际响应头|remark15.0.1固定commit5017a27db024db6feec85a3e1e19f8d78a485680，实际包packages/remark/readme.md；tree无官方中文对应README。原文摘要及共享合同通过；安装两包MIT/版本双核+固定license；主页GET200但无Lab嵌入确认unknown。|
|结果可复核|NOT_RUN：DOM/正式收据未执行|本地SDK5/5、policy4/4、Biome11files、隔离编译和官方合同日志/argv/cwd/exit保存。Node执行不推成DOM安全/无网络、正式build或逐库收据PASS。|

## 实际命令与原始证据

cwd `/home/lambert/githubRepos/lambert/ReactLoom`。validation/*-command.json记录精确argv/cwd/exitCode/UTC时间，*.log是实际合并stdout/stderr，非verify:record收据。

- `node --test packages/library-lab/entries/E07-remark/tests/node-scenarios.test.mjs`：exit0，5tests/5pass/0skip，sdk-final.log。UI和SDK调用同一个transformMarkdown，不复制另一套处理逻辑；直接remark processor的runSync对照也真实执行。
- `node --test packages/library-lab/entries/E07-remark/examples/audit-policy.test.mjs`：exit0，4/4，policy-final.log。纯策略单列：URL语法、标题/链接顺序、4096预算、循环/共享对象图拒绝。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/E07-remark/examples entries/E07-remark/tests entries/E07-remark/library.json entries/E07-remark/verification.json entries/E07-remark/validation/browser.spec.ts`：exit0，11files，biome-final.log，无诊断。
- `pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e07-portable-4q9o6hk3/tsconfig.json`：exit0，无诊断，portable-typecheck.log。复制五个必需文件及browser提案，独立React consumer/ESM、ES2022/ESNext/Bundler/react-jsx/strict；依赖symlink已安装Lab包，没有新install或fullworkspace typecheck。
- `node --input-type=module -`：exit0，official-metadata.log；command.json保存stdin。真实共享validateOfficialSources返回[]，原文字节SHA256匹配metadata。

首次Biome exit1保留biome.log：控制字符正则违反noControlCharactersInRegex。改为有界逐码点检查<=32、127和反斜杠，语义没有放宽；变更后真实SDK/policy定向复跑与最终Biome全通过。没有为格式/文案重复全仓测试。

## 关键整改

- 真正共享workshop和声明，parse一次、同一ast审计与stringify。parse不执行transformer：真实SDK检查transform计数0，runSync后1；GFM是语法/序列化扩展，所以当前无需run仍支持table/task/delete。正文给未来新增transform后的正确同树位置，不虚构现有转换插件。
- 24_000明确UTF8字节，不再冒称24KiB；UI12_000明确UTF16单元。SDK实际8000中文=24000bytes通过，8001中文=24003抛错；browser提案证明该输入仍小于UI长度限制并清空旧成功结果。
- 审计加入definition URL，使reference-style危险定义不漏掉；包括未使用定义，不把links数量当实际点击数。rawHtmlNodes/nodeTypes提供实际可观察结构。HTML和危险URL仍在输出；safe仅局部语法标签，HTTPS追踪图片可以true但本页不会请求。
- 原heading nodeText无独立预算、环图可能先陷无限遍历；现在标题与主遍历都有4096/WeakSet限制，节点类型计数通过own-property处理，避免继承键算术。不把这层保护冒充任意对象schema/严格CPU上限。
- 结果只React文本pre，不渲染危险HTML或图片。按钮处理失败setResult(null)，恢复案例/换层清空，编辑输入不自动parse。没有外部资源订阅需要dispose；无timer/Worker/storage/network。

## 官方取证

- `git ls-remote https://github.com/remarkjs/remark.git 'refs/tags/*15.0.1*'` exit0：refs/tags/15.0.1→5017a27db024db6feec85a3e1e19f8d78a485680（直接commit）。
- Python urllib实际GET该commit递归tree、packages/remark/readme.md及根license，exit0；保存official/tree.json/readme.md/license.txt/source-evidence.json。monorepo有多个包README，选择对应remark包；固定树无官方中文对应README，en回退，无自编原文。
- README SHA256 `402ad63008fc82193d2409a2755c0c36eb5e15abd2032547dc0abb76247a0416`。安装remark/package.json15.0.1/MIT、remark-gfm4.0.1/MIT；固定根license为Titus Wormer MIT原文。
- `curl -fsSL -D packages/library-lab/entries/E07-remark/official/homepage-headers.txt -o /dev/null https://remark.js.org/` exit0，HTTP200，无X-Frame-Options/frame-ancestors；未从实际Lab-origin确认内容，homepage unknown，保留直达。

## 稳定交棒/独立复核重点

validation/browser.spec.ts两个用例：basic/GFM实际节点与Markdown文本（无HTMLtable）；advanced危险URL+definition/rawHTML、script标记不执行、tracking.invalid无请求；8001中文超字节错误清空audit/output，恢复案例成功。交主控复制冻结候选执行，当前NOT_RUN。未注册新宿主，无网络/HTML安全PASS或正式receipt。

独立review重点：parse/transform语义、workshop同树同源、两种单位、definition包括未使用定义、heading循环/预算、safe=true不等于信任/净化、五文件完整迁入与声明、恶意输入只文本/无网络的浏览器实际闭环。作者STABLE后停止写入。
