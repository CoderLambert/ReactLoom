# 2026-11-18 主控闭环补充

六项本地质量PASS。Node同源SDK3/3与策略8/8、独立两页偏移CropBox回读。Chromium两项通过，下载1/2/1页及实际PDF四页版面；拒绝坏文件与超限、实际URL替换回收和迟到数据不发布。候选36及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F09.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F09 本地质量证据（2026-11-18，STABLE）

仅F09目录，未写shared/pkg/lock/e2e/队列结果，未generate/build/fulltypecheck/commit/subspawn。现有纯策略与gate复用，补必要label边界及真实同源SDK。浏览器由主控执行；正式verification sdk/build/browser/source仍NOT_RUN，不用有限本地结果替代receipt。

| 六门槛 | 状态与层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS NodeSDK+源码 | 实装pdf-lib1.17.1/MIT；真实create/load/copyPages/drawText/save3项SDK；默认加密不绕过，页数/布局/输出检查与纯policy分离 |
| 解释清楚 | PASS静态 | 新建/合并/文字盖章非阅读/交互批注/redaction，ASCII与输入解析非沙箱、URL/单飞和无物理取消边界 |
| Demo有用 | NOT_RUN browser；Node目标PASS | 一页、合并2页、本地标注源码与Node回读；浏览器实际下载/视觉由主控，不从页数推版式 |
| 可迁入 | PASS isolatedstrict | 六实际原件+新consumer+browserproposal strictcompile exit0；React/DOM/ESM前提完整，无Provider/CSS/env/Worker/服务 |
| 官方来源 | PASS原字节/实际字段 | fixedv1.17.1 commit4beeb… rootREADME61406bytes与LICENSE.md1070bytes重取同一；完整tree无中文主README，en；官网200无宿主嵌入证据unknown |
| 可复核结果 | NodePASS；DOM/视觉NOT_RUN | SDK3与policy5/gate3明确分记，精确命令/raw在validation；browser提案不当已执行；formal维持 |

## 主要修复

原允许36pt小页但固定盖章x48/y50会画出页面；现在计算首CropBox∩MediaBox可见区域，最少36pt，边距/字号按实际宽高适配。SDK真实新增36pt小页和offset CropBox保存回读，不伪称视觉已验；小页字体很小、现有内容重叠可能、复杂旋转打印另验。普通新建标题新增trim ASCII1–60前置验证并适配505pt宽，防默认Helvetica编码失败及长label超宽。

UI由keyed level重建代替passive level reset，避免新标题搭配旧下载或旧任务回写窗口。同步gate仍防立即连点；SDK/读取返回后isCurrent才创建URL；卸载invalidate不物理取消。所有URL登记，替换/失败React先撤旧链接再effect回收，卸载兜底集合清理且delete避免重复。只自己的URL，不清全局资源。

## 真实命令与结果

cwd全部 `/home/lambert/githubRepos/lambert/ReactLoom`，validation/*-command.json保存完整argv/cwd/exit，*.log保存raw stdout/stderr：

- `node --test packages/library-lab/entries/F09-pdf-lib/tests/sdk.test.mjs` exit0，3真实SDK。测试ownedtmp复制实际document.ts和policy pair，`pnpm exec tsc -p <ownedtmp>/tsconfig.json`编译后加载同源方法；Node actualpdf-lib，不是浏览器。新建1022bytes/1页，合并1273bytes/2页；本地盖章normal/36pt/offsetCropBox读回；实际损坏结构/0页/巨MediaBox/非ASCIIlabel拒绝。字节长度为本次观察，不承诺确定性。tmp finally仅定向清理。
- `node --test …/examples/document-policy.test.mjs …/examples/operation-gate.test.mjs` exit0，8纯policy＝文档5+gate3。复用原7覆盖尺寸/输出/gate，加label1项。没有import pdf-lib，不计SDK。
- `pnpm exec tsc -p /tmp/f09-portable-…/tsconfig.json` exit0，无输出。六必需原件example.tsx/document.ts/document-policy.mjs/.d.mts/operation-gate.mjs/.d.mts，新增consumer和browser提案，strict/ES2022DOM/ESNext/Bundler/react-jsx/ReactNode类型；配置原字节migration-fixture.txt。复用现有node_modules，非fresh-install，仅清ownedtmp。
- `node …/validation/check-official.mjs`最终exit0，errors[]、实装1.17.1 MIT；固定README与LICENSE.md HTTPS200 sameBytes true。README SHA79c7bc975fdb63897ce8f7f42305a38d06695f2d68e5a86a75916cc249fd01e4；license SHA f2c9fc00fdb66eb99ac156ba52d734af66d8d309f65753ae809ad34ee2883bcb。初次checker误用LICENSE路径404保留official-initial.log，按固定tree实际LICENSE.md修正，原快照从始至终取正确license。
- `pnpm exec biome check <entry examples/tests/library/verification/browserproposal/officialchecker>`最终exit0，14files No fixes。首次check提案一处格式未收敛exit1保留biome-initial.log；最终仅格式修正，不重复未变SDK语义。

## 完整运行与信任边界

六迁入原件已列sourceFiles，demo可省，guide给pnpm固定版本及ReactDOM/TSX/ESM/DOM前提，无字体包/网络服务。Node调用document仅需该TS及policy pair。PDF输出回读证明结构和页数，不验证视觉、签名、字体/阅读器兼容。盖章不是删除原数据或保留任意签名/表单/书签语义。

输入2MiB/头部/页数布局、输出4MiB只是示例预算，PDFDocument.load之前仍可能展开复杂对象流；没有安全沙箱/CPU/附件/脚本净化。ignoreEncryption:false不绕过加密；未另造加密fixture，不将源码选项称加密文件运行PASS。ASCII字体不保证中文。不保存用户文档，不读任意路径，不上传。

官网实际GET200完整header在official/source-evidence.json，无Lab-originiframe成功；unknown与直达合理。官方tree含字体资产README但无主库中文README，采用rooten，不把第三方字体README当主SDK文档。没有执行上游README命令。

## 浏览器交棒

validation/browser.spec.ts两条仅提案：保存basic/business/advanced实际下载PDF给主控pdftoppm，basic1页/business2页/advancedReviewed locally；basic产物复用File喂advanced，坏头/2MiB+1失败清旧链接再恢复。外层真实URL.create/revoke转发记录，立即双击单URL，替换回收旧URL；真实Blob.arrayBuffer拿到字节后hold，本地读取在途host卸载再release，不新增URL/晚状态。该case是读取所有权非物理取消或SDKdestroy。

主控可追加自产36pt/offsetCropBox输入做实际盖章位置视觉检查；Node已回读但不预支视觉。控件：region `pdf-lib 本地PDF实验`，按钮`执行PDF操作`，advanced input[type=file]，p[role=status]，链接`下载刚刚生成的PDF`。不会添加产品test hook或伪造SDK输出。
