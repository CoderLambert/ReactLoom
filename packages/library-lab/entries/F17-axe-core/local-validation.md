# 2026-11-18 主控闭环补充

六项本地质量PASS。Chromium 真实 axe 规则 1/1/3，修复后均 0，容器外缺陷不影响结果。持有首个真实 SDK 已返回的结果，验证卸载、重挂及两个扫描串行，旧结果不回写。纯队列 4 项另计。候选37及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F17.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F17 本地质量记录

STABLE。作者只改此entry，不碰shared/e2e/队列/results/依赖，不跑全局生成/构建/browser；主控已有真实浏览器配方。正式verification无recorder仍NOT_RUN。

| 六门槛 | 状态/证据 |
| --- | --- |
| 技术准确 | PASS静态/来源：实装4.14 label any明确有non-empty-placeholder，故未修复态删除placeholder。修复是真实label关联，不靠placeholder。 |
| 解释清楚 | PASS guide/agent：三规则/规则数与节点数/incomplete/透明GIF/非WCAG边界，SDK与自建队列分开。 |
| 实验有用 | NOT_RUN修复后browser：basic/business/advanced独立目标，预期1/1/3→0，主控新运行待证。旧candidate36 business实得0是红证据，不称绿。 |
| 源码可迁移 | PASS strict：example+queue.mjs/.d.mts三原件复制strict exit0，无隐含Lab adapter；完整sourceFiles移除test。 |
| 官方可靠 | PASS原字节：固定e797173…README/LICENSE/package再次GET MATCH；installed4.14/MPL2真实字段。固定树仅根英文README。官网GET200的CSP frame-ancestors self，blocked准确。 |
| 可复核 | PASS本地policy/来源，SDK/browser NOT_RUN：commands.json保存cwd/argv/exit；四policy只是队列，不能计规则SDK。主控真实browser另记。 |

## 原始检查

cwd repo root；validation/commands.json精确命令/退出码。

- `node --test packages/library-lab/entries/F17-axe-core/examples/audit-queue.test.mjs` exit0，4/4：两个owner串行、排队失效不调用、异步失败恢复、同步throw恢复。未import axe，不叫规则PASS。
- 三原件copy至独立tmp、strict ES2022/ESNext/Bundler/react-jsx/DOM/node/noEmit，定向tsc exit0，portable-types.log空；自己的tmp已清理。不是全仓检查或freshinstall。
- official-check.mjs exit0：三个固定原件MATCH、installed axe-core4.14.0 MPL-2.0、实际axe.js label规则包含non-empty-placeholder。raw official.log。
- ScopedBiome初次exit1是故意缺alt教材触发useAltText；保留raw biome.log。增加单点解释性suppression，不给缺陷态偷偷补alt影响实际实验。最终biome-final.log exit0。

## 队列与清理审计

模块tail串行后以then正反分支恢复；isCurrent在开始前检查generation/ref/isConnected，已失效排队任务skipped。UI同步running挡重入；修复禁用避免中途DOM变化。卸载/level keyed重挂递增generation，迟到结果/错误/finally不写新会话；已开始axe.run没有物理cancel，不声称destroy。队列不协调别的模块/外部axe调用，底层永不settle会等住队列，真实限制明确。

主控已有e2e/quality-resume-axe.spec.ts覆盖真实1/1/3→0、外部坏DOM不污染、停止重挂；本次不运行共享套件、不改该文件。主控candidate36/axe-baseline.txt与artifacts是修复前red；作者读取实装源码验证原因，没有借此宣称修复后绿。未自行安装DOM模拟平台，Node不替代axe真实浏览器规则。

固定官方GET原字节、tree、homepage完整headers保存在official；CSP frame-ancestors self比“无XFO”更强，保留blocked直达。未放宽Lab iframe/CSP。指南明确placeholder的实际规则行为与持久label建议不等同。
