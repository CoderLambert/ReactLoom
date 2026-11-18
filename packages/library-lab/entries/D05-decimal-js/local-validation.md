# 2026-11-18 主控验收补充

当前六项质量在本地验收层级均PASS。真实SDK6项+策略3项；独立新输入16.42/2.05/18.47及默认配置污染隔离通过；浏览器4项覆盖三实验与官方原文/官网unknown。candidate-23类型/构建/目录检查通过，10个浏览器用例全通过；独立复核及命令见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D05.md)。正式收据仍NOT_RUN。下文保留作者冻结时检查点，浏览器待办已由本补充关闭。

# D05 本地整改证据

本条只拥有 `entries/D05-decimal-js`，保留原发票计算算法、字符串传输、clone 隔离和编辑失效规则。目标读者为首次接触 decimal.js 的 React 工程师。本轮拆清三个独立目标：可编辑字符串加法；采购预览的校验/重算；固定半分与舍入点对照。进阶不再重复业务表单。

## 六项复核

| 维度 | 状态与证据层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS：固定 SDK 源码/类型与真实 Node 执行 | 实装 decimal.js@10.6.0；decimal.d.ts 的 clone、precision、rounding、toDecimalPlaces、toFixed；真实SDK套件6项通过，策略3项另计 |
| 解释清楚 | PASS：静态内容复核，独立复核待主控 | guide 的选型、输入→Decimal→舍入→字符串模型、最小接入、fixture归属及迁移边界与源文件一致 |
| Demo有用 | NOT_RUN：设计与SDK通过，浏览器交互待执行 | basic 可编辑输入/错误恢复；business 默认64.47、编辑失效/错误恢复；advanced固定1.01/1.00与1.01/1.02。`validation/browser.spec.ts` 是待主控接入的实际 Playwright 提案 |
| 源码可迁移 | PASS：定向类型检查与静态审阅 | 四个计算/声明文件；可选React界面与Lab重导出；无环境变量、Provider、持久资源；不依赖Lab模块；`validation/types.log` |
| 官方来源可靠 | PASS：固定原文与明确unknown | 官方v10.6.0 → `1a6e845004b29a3b7dcef78fe92b8d786634f4e2`；原始README字节/sha256见metadata；根目录无中文README；完整官网响应头见`official/source-evidence.json`，GET200未见明确限制头，但未做Lab origin嵌入确认，保持unknown |
| 结果可复核 | NOT_RUN：SDK/类型/格式可复核，浏览器尚待执行 | `validation/commands.json`记录 cwd、原命令、退出码、时间及日志；测试9/9（6真实SDK+3策略）；无正式receipt；交互结果仍需主控候选浏览器检查 |

## 实际执行

cwd：`/home/lambert/githubRepos/lambert/ReactLoom`。运行时间以 `validation/commands.json` 的工具时钟为准。

- `node --test packages/library-lab/entries/D05-decimal-js/tests/sdk.test.mjs packages/library-lab/entries/D05-decimal-js/tests/amount-policy.test.mjs`：exit 0，9/9，原始 `validation/sdk.log`。覆盖精确加法、默认与零发票、半分与舍入点、拒绝非法输入、计算不修改默认构造器配置、输入上限的精确分值。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/D05-decimal-js/examples entries/D05-decimal-js/tests entries/D05-decimal-js/validation/browser.spec.ts entries/D05-decimal-js/library.json entries/D05-decimal-js/verification.json`：exit 0，`validation/biome.log`。
- 定向 `tsc` 首次因TypeScript7要求命令行文件必须 `--ignoreConfig` 而 exit 1；保留 `validation/types-initial.log`。加该参数后同一单文件检查 exit 0，`validation/types.log`。完整参数见 commands.json；此检查没有读取/变更全Lab tsconfig，不替代主控统一typecheck/build。

未执行共享生成、build、全Lab typecheck或浏览器。未产生正式 committed receipts，verification 的 sdk/build/browser 保持 NOT_RUN。正式记录须待已授权的干净提交输入与 recorder。

## 剩余项与公共请求

主控把 `validation/browser.spec.ts` 接入 e2e 并执行候选，确认默认值、基础输入错误恢复、金额结果失效、数量恢复与独立进阶页。无需新依赖或公共运行能力。官网嵌入未确认不推定allowed；平台已有unknown预览/直达降级可用。
