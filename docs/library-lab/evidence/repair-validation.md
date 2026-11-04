# 人工审核整改验证记录

基线：`feat/library-lab@87ea2afe5957ba370f114f0acecb8cde1cd0c5eb`。本地是由固定 GitHub blob 恢复的公共平台子集，**不是完整可运行仓库**。下面只描述本次真正执行的命令，不汇总重复运行次数，不以合成 SDK/收据/Worker fixture 作为真实库验收。

## PASS（限定范围）

- `node --test packages/library-lab/tests/*.test.mjs`：59 tests / 59 PASS / 0 FAIL / 0 SKIP，原始 [repair-final-node.tap](repair-final-node.tap)。通配符只遍历本地恢复的13个目标测试文件；它不等于完整远端包的 `npm test`。
- HTML源码的真实生成/读取、链接与声明；临时 Git 仓库里提交索引的正反例；真实文件收据/日志摘要的合成正反例；共享输入变更和产物排除；实际 Git diff 测试选择；假窗口消息生命周期；Node HTTP server/fetch 的 scoped JS 资源响应。最后两项不运行真实 SW/SDK。
- 独立声明检查：`tsc --noEmit --strict --module nodenext --moduleResolution nodenext --target ES2022 packages/library-lab/tests/source-declarations.mts`，exit0。工具为全局 TS5.8.3，非项目要求的完整 TS7 依赖环境。
- Node `.mjs` 语法检查 exit0；5个 TS/TSX 文件静态解析0语法诊断；workflow YAML结构解析通过。见 [repair-final-static.log](repair-final-static.log)。均不代表 React/Vite/API 类型正确或 CI 执行通过。

## 红绿证据

初始生成器/提交索引回归曾3失败，证据接口缺陷回归4失败，来源声明 tsc 缺失导出失败。修复后在同一恢复工作区执行上述最终目标集合59通过。原始失败记录保留于本次本地工作区；主整改快照的 Git blob/SHA256 见 `repair-files.json`；并发第23轮合并后的差异见 `repair-reconciliation.json`，可核对代码与日志版本，不把日志文本包装为SDK收据。

## BLOCKED / NOT_RUN

Node v22.16.0；没有 pnpm10；registry/GitHub DNS在容器不可用。没有运行完整依赖安装、生成真实根锁文件、完整项目类型、Vite生产构建或SDK。Chromium实际尝试访问本地测试页返回 `ERR_BLOCKED_BY_ADMINISTRATOR`，见 [repair-browser-blocker.log](repair-browser-blocker.log)；未绕过管理员策略，真实 Playwright 用例 NOT_RUN。

运行器、生产 E2E 与 CI 已写入代码，但它们必须在合格完整执行环境中真正运行后才能验收。没有新增任何 entry 的 SDK/build/browser PASS。候选lock上传作业不是frozen验收，仍保留主PR为Draft。

## 并发合并复核

提交前发现远端推进到 c0614612；保留新条目改动与 startedKey 授权，合并未知条目文件/资产保守选择，移除重复 ci-plan。重新执行本地59项目标集合全部通过；另执行受影响 ci-scope/source-consumers 的6项检查，原始日志见 repair-reconcile-node.tap。两个TSX重新静态解析无语法诊断；没有新增完整应用或浏览器PASS。
