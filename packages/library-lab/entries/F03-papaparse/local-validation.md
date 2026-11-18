# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK9/策略4与非作者新Orion CSV consumer/五文件strict迁入通过。浏览器3项含来源：实际引号和跨行单元格、业务去重/URL凭据拒绝、字段数/重复表头/未闭引号、跨行公式导出前置撇号；真实本地文件、超预算读前拒绝/非法UTF8、持有读取后手动parse/换层/卸载不覆盖结果。候选34及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F03.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F03 作者整改证据（2026-11-18，STABLE）

只本entry目录，未改共享/依赖锁/e2e/队列结果，未generate/build/全局typecheck/commit。真实DOM浏览器由主控运行；正式verification sdk/build/browser/security保持NOT_RUN，不拿本地有限试验替代receipt。

| 六门槛 | 本地状态 | 证据与待验 |
| --- | --- | --- |
| 技术准确 | PASS | 实装Papa5.7.0/MIT，真实NodeSDK9/9；parse/unparse与report共源，renamedHeaders/未闭引号/动态类型/跨行公式前缀核对实际源码 |
| 解释清楚 | PASS | 选型、parse→政策→unparse、记录索引与物理行不同、预算单位与CSV/XLS边界明确 |
| Demo有用 | NOT_RUN DOM | 三目标源码：引号跨行、业务HTTPS/去重/文件、错误与安全导出；真实UI待主控 |
| 源码可迁入 | PASS | 五运行原件+新consumer和浏览器提案strict compile exit0；现有依赖非fresh-install |
| 官方来源 | PASS | 固定tag5.7.0 commit555c1c1…原始README/LICENSE；tree唯一README.md无中文，en；官网实际GET200但未宿主iframe确认unknown |
| 结果可复核 | NOT_RUN DOM；本地PASS | validation原始argv/cwd/exit/log；NodeSDK9与纯policy4分计；browser提案未执行，不称文件控件/迟到UI PASS |

## 实际定向命令

cwd全部 `/home/lambert/githubRepos/lambert/ReactLoom`。完整argv/cwd/exit保存validation/*-command.json，stdout/stderr保存同名.log。

- sdk：`node --test packages/library-lab/entries/F03-papaparse/tests/node-scenarios.test.mjs` exit0，9tests/9pass/0fail。实际parse引号/逗号/跨行、unparse公式、字段数、同源report重复表头/整批未闭引号/文本值/多行公式/UTF8文本预算。重复表头三条真实SDK警告保留，不伪造无warning。
- policy：`node --test packages/library-lab/entries/F03-papaparse/tests/policy.test.mjs` exit0，4tests/4pass/0fail。表头/URL/字段控制与预算先拒不读/非法UTF8/合法中文；不import Papa，不计SDK。
- biome：entry examples/tests/library.json/verification.json/validation browser与fetch方案定向check；最终exit0。初次--write exit1控制正则/style/iterable回调问题原日志保留；控制检查改明确码点判断，等义模板与回调修正。
- migration：`pnpm exec tsc -p /tmp/f03-portable-…/tsconfig.json` exit0，无诊断。五运行文件+新consumer+browser提案，strict/ES2022DOM/ESNext/Bundler/react-jsx/types react/react-dom/node；配置原字节见migration-fixture.txt，仅清理ownedtmp。
- official：Node官方协议validator+SHA+实际installed package字段exit0，errors[]，README SHA6dd80e525001b8530fa986a648d5c9b5ad8b970553d96ac74074bfa760cd2c31，5.7.0/MIT。
- fetch-official：固定README/LICENSE重新HTTPS读取与保存原字节比较（实际命令/log独立保存）；不改来源为版本主分支，不把下载成功当SDK运行。

## 实质修改与源码边界

外层keyed PapaSession，切换level重新取fixture且cleanup失效旧generation。选择/编辑/parse/reset/下一文件/unmount都抑制迟到成功与失败。文件读取从宽松File.text改为先≤256,000原始字节，再Blob.arrayBuffer+fatalUTF8；不宣称物理abort。手工textarea15,000是UTF16码元，文件程序设值可以更长；report统一按UTF8bytes预算，避免中文被当单字节。

实际SDK5.7默认escapeFormulae:true使用`/^[=+\-@\t\r].*$/`，跨行单元格可不匹配；report使用SDK支持的前缀正则`/^[=+\-@\t\r]/`，真实回归验证多行note前加撇号。只对accepted导出，不构造下载或HTML执行；不是完整Excel/宏/所有表格软件安全认证。

严格表头包含自动renamedHeaders；未闭引号即使前面有好记录也全拒；字段数错误仅拒解析记录。HTTPS拒绝凭据，去fragment去重，完全不抓取URL。URL策略不宣称SSRF/ACL。

完整迁入5份example.tsx/report.mjs/report.d.mts/policy.mjs/policy.d.mts，demo可省。React/TSX/ESM/DOM前提写入guide，无Provider/CSS/env/账号/上传服务。解析为字符串同步真实Papa，无Worker/自建timer/BlobURL/外部订阅；适用清理就是读取所有权失效，不杜撰destroy。

## 浏览器交棒

validation/browser.spec.ts两条仅提案，作者未运行：真实三个level/fixture、引号与跨行/重复表头/未闭引号/公式前缀、非法UTF8/256001bytes文件alert并清旧report、HTML纯文本无外网；外层包装真实Blob.arrayBuffer拿到原始字节后hold，再编辑/reset/level/unmount/release，验证旧内容不回写。主控可加新文件/手工parse竞态。此探针观察真实读取和UI所有权，不是SDK取消API。选择器region `Papa Parse 真实 CSV 实验`，textbox `CSV 输入`，input[type=file]，`解析并校验`/`重置案例`按钮，p[role=status]，papa-records/papa-export testid。没有全局产品debug或假SDK结果。
