# PLATFORM 当前进度

## 2026-11-04 main

- PR #8 已合并到 main（`883838087464b4a5577aa4ff4260c4847bfc12a4`）。
- 根锁文件有 `packages/library-lab` importer。
- Actions run [41779873259](https://github.com/CoderLambert/ReactLoom/actions/runs/41779873259) 通过 install、typecheck、build、52 个 SDK 文件（153 项）和 45 项 Playwright。Lab 树与该 run 的 head 一致。
- 这不是 119 条 sdk / build / browser 收据。`docs/library-lab/evidence/runs/` 没有逐库收据时，readiness 的 PASS 保持 0。
- 下面和归档里的 23/24 轮是合并前的记录，不是当前环境仍缺少锁文件。

## 合并前的整改记录

- 整改发生在 `feat/library-lab`，基线 `87ea2afe5957ba370f114f0acecb8cde1cd0c5eb`。
- **scheduled runCount：23/24（不重置，也不要把后来的文档更正记成第 24 轮）。**
- 旧 0–23 轮进度原样归档至 [PLATFORM-rounds-00-23.md](archive/PLATFORM-rounds-00-23.md)。

## 本次直接修复

源码 `.txt` 惰性读取和文档链接；缺失 TS 导出；Git HEAD 索引门禁；真实收据/日志验证与完整执行输入失效；文档/条目/公共变更 CI 分流；frozen 验收与候选锁文件任务分开；F11 跨 origin 逐会话 MSW 浏览器运行器与显式清理；默认构建/预览同时提供两个本地服务；旧 E2E 断言修正及新 HTML/MSW 回归源码。发布前远端推进至 `c0614612f5ff0af44994399d51c62852746867b4`（第23轮）。保留已合并 #83/#84 的 A01/B17/C07 与 AB/CD 进度；合入 startedKey 场景授权和切换回归；CI未知条目路径/资产保守选择并入 ci-scope，删除重复 ci-plan 实现及重复测试。没有重新合并这些 PR，没有新增依赖版本。

## 实际命令和验证

详见 [repair-validation.md](../evidence/repair-validation.md) 与同目录原始 TAP/静态检查日志。测试发生在从固定 GitHub blob 恢复的公共文件子集，不是完整克隆：59 项定向 Node 测试通过，包括合成收据、真实临时 Git 仓库和 Node HTTP fixture。独立声明 tsc、改动模块语法与 YAML 结构检查单独列出，不扩大为项目类型/构建/浏览器通过。

## 明确未完成

- 逐库收据：119 条的 sdk / build / browser PASS 仍是 0。不要把 run 41779873259 批量写进 `verification.json`。
- E19 的 GPL 核心默认不复制。这是许可证开关，不是锁文件缺失。
- B05 的远程 `.riv` 和 A09 的远程字体仍然是资产阻塞，不是安装阻塞。
- 未关闭 #12、#22、#40。公共改造和仓库级 Playwright 不证明这些运行或生命周期问题已经解决。

## 分项口径和下一步

历史静态口径 119 目录 / 357 场景声明仍然有效，但它们不是 PASS。首要工作改成逐库收据和手册是否还在教过时的阻塞。不把策略单测数当成可用程度，也不再把「锁文件还没有」写成当前事实。
