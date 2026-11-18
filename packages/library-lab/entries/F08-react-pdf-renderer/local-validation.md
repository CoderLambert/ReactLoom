# 2026-11-18 主控闭环补充

六项本地质量PASS。实际 SDK2/2、策略6/6，独立37行2页。首轮Chromium F08两场景和官网均通过；真实下载文件1/1/4页，检查全部六页排版和尾行，保存在candidate-35/first-browser-artifacts与renderer-pages。候选35及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F08.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F08 本地整改证据（2026-11-18，STABLE）

只本entry；未动shared/pkg/lock/e2e/队列结果，未generate/build/fulltypecheck/commit。此前F02独立报告delta经主控单独授权完成，不涉及本条运行输入。无共享browser执行。正式sdk/build/browser仍NOT_RUN，不用有限Node结果替代正式receipt。

| 六门槛 | 本地状态 | 证据/限制 |
| --- | --- | --- |
| 技术准确 | PASS Node/API/源码 | 实装renderer4.9.0 MIT；同源实际ReportDocument编译后Node pdf().toBlob2项；明确main/browser映射不同，非浏览器SDK |
| 解释清楚 | PASS | 原语生成非HTML/已有PDF阅读，单飞/epoch/URL所有权、ASCII/Helvetica、wrap与视觉分页边界 |
| Demo有用 | NOT_RUN browser | basic1行、business3行、advanced100行+141拒绝实际源码齐；真实网页操作与文件分页待主控 |
| 源码可迁入 | PASS | 四实际必需原件+新consumer/browserproposal strict compile exit0；精确依赖/环境/低层title信任合同，无Provider/env/CSS/服务 |
| 官方来源 | PASS | 固定tag4.9.0→commit2c0b…，包目录README/LICENSE原字节重新HTTP200 sameBytes；完整tree无中文候选en；homepage200无宿主嵌入证据unknown |
| 可复核结果 | Node PASS；browser/版式 NOT_RUN | NodeSDK2与纯policy6分计/raw；文件头与Blob不证明页数/版式，主控将pdftoppm检查实际下载各页 |

## 原始命令

cwd `/home/lambert/githubRepos/lambert/ReactLoom`，validation/*-command.json精确argv/cwd/exit，*.log保存stdout/stderr：

- `node --test packages/library-lab/entries/F08-react-pdf-renderer/tests/sdk.test.mjs` exit0，真实SDK2/2。测试在ownedtmp复制report.tsx/report-policy.mjs/.d.mts并通过`pnpm exec tsc -p <ownedtmp>/tsconfig.json`编译实际布局（不是另写简化Document），复用现有node_modules，finally清理tmp。1行Blob2358bytes；100行11219bytes；MIME application/pdf、前5bytes %PDF-。Node main API，不运行ReactDOM/浏览器下载，不测视觉。
- `node --test packages/library-lab/entries/F08-react-pdf-renderer/tests/policy.test.mjs` exit0，6纯policy，不import renderer。行数/ASCII/类型/数值/去重/额外字段及100/140row预算。修复ASCII ID正则的/iu Unicode case-fold意外接收Kelvin/long-s，新增相同测试内负面输入。
- `node packages/library-lab/entries/F08-react-pdf-renderer/validation/check-official.mjs` exit0；匹配协议errors[]、真实4.9.0/MIT/browser映射。固定README3559bytes SHAaecadb67037f5405f666c4d4f52456404a87a279f098c37fd6f8c79bed5f59d0，LICENSE1109bytes SHA0c96b643c00775e094e8daf2de5707013d740621b735b0e4ceb9fab7698ca2e4；重新下载与保存逐字节相同。
- `pnpm exec tsc -p /tmp/f08-portable-final-…/tsconfig.json` exit0，无诊断。复制example.tsx/report.tsx/report-policy.mjs/.d.mts+新consumer及browser提案，strict/ES2022DOM/ESNext/Bundler/react-jsx/ReactNode类型。配置与consumer原字节migration-fixture.txt，现有依赖非fresh-install，仅清ownedtmp。
- entry定向`pnpm exec biome check` examples/tests/library/verification/browserproposal/officialchecker exit0，11files No fixes。初次格式化write日志单列exit0，未跑workspace检查。proposal最后对齐主控即刻卸载方案后，只重跑必要迁入编译/Biome，不无意义重复SDK。

## 生命周期/输入实质变更

保留running ref在await前置位与epoch检查；成功新URL先create，再释放旧URL；release先清ref避免失败/cleanup重复回收；错误清链接/bytes并释放旧URL。过期toBlob不创建URL、不写React状态。key=level重建；卸载epoch失效并revoke自身URL。沒有API物理取消布局，也不称renderer destroy或全局字体缓存清理。

advanced141测试通过真实同一generate路径先validatedRows拒绝，未调用pdf；可观察失败后旧下载消失。低层ReportDocument仍需可信ASCII固定title，外部动态title必须单独校验。name列flexBasis0/shrink/padding确保受控列宽，wrap=false及fixed页脚不保证任意长文本无溢出。policy通过与NodeBlob成功都不是视觉排版PASS。

四必需迁入：example.tsx、report.tsx、report-policy.mjs、report-policy.d.mts；demo可省。原创ASCII、内建Helvetica，无远程字体/图/服务。没有内嵌阅读器、文件系统持久化、Worker/上传、额外timer/订阅。生成用户下载不触碰其他URL。

## 浏览器交棒

validation/browser.spec.ts仅提案，2例，尚未作者运行：

1. basic/business/advanced真实下载，保存各PDF到test artifacts，文件头只作基本断言；主控进一步pdftoppm渲染全部页，检查单页/100行分页与固定页脚、文字无裁切，以及无外网字体/图片请求。
2. 原生Blob构造Proxy转发真实constructor，记录application/pdf实际产物；URL.create/revoke转发记录。相同evaluate点创建两次应Blob1；重复生成回收旧URL；141行失败清链接不新增PDF；注入URL创建异常时仍释放旧URL；最后创建后立即host卸载，待真实PDFBlob完成但不新增URL，证明epoch抑制迟到，不称停止layout。

匹配实际browser实现：lib/react-pdf.browser.js267–292的toBlob先await render，stream end内new Blob(chunks,{type:'application/pdf'})再resolve，探针不伪造SDK字节。Node lib/react-pdf.js同类API但环境不同。真实选择器region `React-PDF Renderer生成实验`、按钮`创建 PDF`/`测试141行输入拒绝`、p[role=status]、链接`下载PDF`。生产PDF字体/打印/iOS/可访问PDF标签未测，不在本轮成功声明。
