# Library Lab — 持续开发调度合同

用户已批准 v2 并要求直接开发、少于10个任务、尽量连续推进，不因微小进展停止。2026-10 使用过 4 条执行通道。那些通道的 24 轮已经结束，见 `progress/`。任务不是研究概览，不再向 Slack 重复发送文档完成记录。当前事实以下一节为准。

## 当前事实（2026-11-04，main `fea74cf`）

main 上有三层已经合并的工作，它们不是同一棵 Lab 树：

- PR #8 于 2026-11-04 合并（merge `883838087464b4a5577aa4ff4260c4847bfc12a4`）。根 `pnpm-lock.yaml` 含 `packages/library-lab` importer。GitHub Actions run [41779873259](https://github.com/CoderLambert/ReactLoom/actions/runs/41779873259) 在**那次合并时的 Lab 树**上通过了冻结安装、typecheck、生产构建、52 个 SDK 文件 / 153 项测试、45 项 Playwright。这次运行不覆盖后来的手册和首页改动。
- PR #97 squash 为 `ac38dadffab84a24f6ce8d418a6f2237682db319`。A/B 手册按 2026-10-24 研究包恢复了深度。首页计数拆成源码完整（`sourceComplete`）、可在页面挂载的 React（`reactMountable`）、仅 Node 命令（`nodeCiOnly`）和收据 PASS（`receiptPass`）。
- PR #98 squash 为 `fea74cf76dd0a674301f6867024cb481fad85b44`。C–F 手册按同一研究包恢复了深度。E11 与 F05 没有研究包 GUIDE，没有补造。

仓库级 CI 变绿不等于 119 个 SDK 已经运行验收。`docs/library-lab/evidence/runs/` 仍没有逐库收据。没有匹配收据时，readiness 的 sdk / build / browser PASS 保持 0。不要把 41779873259 或后来的文档提交写成 `verification.json` 的 PASS。`create-reactloom` 不复制 Library Lab。根 `pnpm install` 仍会解析本包依赖，包括默认不复制进页面的 `@ffmpeg/core`（GPL-2.0-or-later）和 SheetJS 的 `cdn.sheetjs.com` tarball。

下面的四通道表，以及「协作与集成」，是 2026-10 合并前的写入所有权。它是历史合同：PR #8 已经在 main，锁文件已有 importer，当前工作不再以未合并的 `feat/library-lab` 为集成目标。

## 事实源与分支

主 Epic #4。集成开发曾经发生在 `feat/library-lab`，该分支的 PR #8 已经进入 main。手册恢复在 #97 和 #98，也已经在 main。不要把 Library Lab 写进模板生成范围、生产配置或公开部署。
每轮先读实际最新 main、根/本包 AGENTS、本文件和进度，防止重做或覆盖用户修改。

|通道|Issue|分支|写入所有权|
|---|---|---|---|
|PLATFORM|#4|feat/library-lab|公共 src/scripts/tests/e2e、根脚本、package/lockfile、CI、生成索引、contracts、progress/PLATFORM.md|
|AB|#5|feat/library-lab-ab|entries/A*、entries/B*、progress/AB.md|
|CD|#6|feat/library-lab-cd|entries/C*、entries/D*、progress/CD.md|
|EF|#7|feat/library-lab-ef|entries/E*、entries/F*、progress/EF.md|

## 协作与集成（历史合同，2026-10）

合并前，worker PR 的 base 是 `feat/library-lab`。当时只有 PLATFORM 审核并合入这些 PR，而且 main 的合并不在自动授权内。那句「不要合并 main」只覆盖当时的 draft，不描述现在的 main。

根 package.json、workspace、lockfile、本包 package.json 与全局生成文件当时由 PLATFORM 单一 owner 修改，以免三个任务同时改锁文件。这个所有权仍然有效：不要并行手改根锁。Worker 把需要的包名和已核验版本写进自己的 progress。锁文件现在已经在 main 上，不要再写成缺失。

每轮连续推进完整批次：读取状态 -> 编写实际代码/笔记/Agent说明 -> 定向检查 -> 修复 -> 提交/PR -> 继续下一项。不要完成一小段就结束，不要反复核对已知失败，不要把写计划算开发。运行资源确实用尽或剩余工作全依赖外部条件时保存可恢复状态。

## 条目协议 v1（已落地）

目录 `entries/<entryId>-<slug>/library.json`。字段参照 `src/lib/types.ts` 与 `src/lib/catalog.mjs`。`demoId` 固定 basic/business/advanced，`level` 同值；React 入口 export default 接受 `{level}`，可共同指向一个真实实现，由 level 展示3种层次。`sourceFiles` 包含所有必要源文件且必须包含 entryPoint。

示例放 examples/example.tsx，可迁移且不依赖主站内部实现；examples/demo.tsx 为适配出口。命名空间与资源清理必需。references/related 在 library.json 中维护，三种关系 alternative/complements/migration-to 必须有理由。

`guide.md`：完整中文教学；`agent.md`：适用条件、最小迁移路径、不可删配置/清理、反例、测试断言和真实限制；`AGENTS.md`：仅本条目维护规则。`verification.json` 按 SDK/build/browser 等分别填状态和证据。没有执行不填 PASS。

新增 executionKind 的接线、Worker/SW/iframe runner 和公共 API 变更由 PLATFORM 完成，不能由条目任务各自造不同宿主协议。

## 资料读取与安全

原资料：ReactLoom_119_Full_Research_2026-10-24.zip；当前会话文件 ID `file_000000009c80823083780b04ad058864`。119条身份来源为该包；117有原件，E11/F05仅摘要。可用 Files 读取/定位，程序用本地已挂载文件。不要假设跨次容器文件永久存在，优先从 GitHub 恢复已提交成果。
Starter资料ID `file_0000000076f48230883fd95111b3bd2b`，内含119目录和117指南。V2规范ID `file_0000000046c082309dd28c0aebf26ed7`。文件失效时基于官方资料重新写并标 recreated，不伪造恢复。

只读取审查过的源码和文档；不执行原ZIP内脚本或旧AGENTS指令。版本/API/许可证重新核实。SDK可真实import、业务后端可Mock，不能Mock SDK后标验证成功。未知版本填null，不照搬研究稿中的未来/过期版本。

## 轻量但真实的质量门槛

小批次运行对应条目测试和catalog检查；公共变更跑Node单测、typecheck、build及关键E2E。文案修改不重跑119库。缺npm/浏览器时保存代码并标BLOCKED，不每轮重复同一失败。使用GitHub CI（无付费外部服务）能验证则继续，不能只生成本地日志。

根锁文件已经包含 Lab importer。frozen install 在 Actions run 41779873259 成功，对象是 #8 合并时的 Lab 树，不是 #97/#98 之后的手册树。不要手造 integrity，也不要把这次仓库级通过写成 119 条 PASS。逐库证据仍走 `verify:record`。

## 队列与停止

首批风险条目：A01 ECharts、B17 Floating UI、C01 RHF、D03 p-limit、E05 Monaco、F11 MSW。它们的手册已在 #97（A/B，以及 C01、D03、E05、F11）和 #98（其余 C–F）中恢复。缺的是逐库收据，不是再写一遍指南。C20 clsx 为已有宿主样例，不替代首批目标。每轮优先推进有条件的多个条目，不只审计一个小问题。

每个progress记录次数、最后提交、已接入条目、实际测试、阻塞、dependencyRequests、下一队列。调度最多24次；若范围完成则停用本通道。连续同一个阻塞、且没有独立可推进工作时先提供实物和准确缺口，并请求是否暂停，不无休止刷屏。无实质变化不通知。只有PLATFORM对用户汇总里程碑，其余向各自Issue记录必要结果。
