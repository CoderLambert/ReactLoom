# PLATFORM 当前进度

- 分支：`feat/library-lab`；主 Issue #4 / PR #8，必须保持 Open/Draft。
- 本次为用户明确要求的人工审核整改；基线 `87ea2afe5957ba370f114f0acecb8cde1cd0c5eb`。
- **scheduled runCount：23/24（不重置；本次人工整改不伪记为新自动轮次）。**
- 状态：代码修复已实施并有定向回归；完整运行交付仍未完成。
- 旧0–23轮进度原样归档至 [PLATFORM-rounds-00-23.md](archive/PLATFORM-rounds-00-23.md)。本轮提交 SHA 以本文件所在提交及 PR #8 为准，避免在提交内容中伪造自引用 SHA。

## 本次直接修复

源码 `.txt` 惰性读取和文档链接；缺失 TS 导出；Git HEAD 索引门禁；真实收据/日志验证与完整执行输入失效；文档/条目/公共变更 CI 分流；frozen 验收与候选锁文件任务分开；F11 跨 origin 逐会话 MSW 浏览器运行器与显式清理；默认构建/预览同时提供两个本地服务；旧 E2E 断言修正及新 HTML/MSW 回归源码。发布前远端推进至 `c0614612f5ff0af44994399d51c62852746867b4`（第23轮）。保留已合并 #83/#84 的 A01/B17/C07 与 AB/CD 进度；合入 startedKey 场景授权和切换回归；CI未知条目路径/资产保守选择并入 ci-scope，删除重复 ci-plan 实现及重复测试。没有重新合并这些 PR，没有新增依赖版本。

## 实际命令和验证

详见 [repair-validation.md](../evidence/repair-validation.md) 与同目录原始 TAP/静态检查日志。测试发生在从固定 GitHub blob 恢复的公共文件子集，不是完整克隆：59 项定向 Node 测试通过，包括合成收据、真实临时 Git 仓库和 Node HTTP fixture。独立声明 tsc、改动模块语法与 YAML 结构检查单独列出，不扩大为项目类型/构建/浏览器通过。

## 明确未完成

- BLOCKED：可访问 registry 的 Node>=22.18/pnpm10 完整执行工作树；根 `pnpm-lock.yaml` 真实 Lab importer，未手造 integrity；历史 Actions 作业无执行步骤，原因不臆测为欠费。
- BLOCKED：本容器 Chromium 导航被管理员策略 `ERR_BLOCKED_BY_ADMINISTRATOR` 拦截，未绕过策略。
- NOT_RUN：完整项目 npm/pnpm test、真实依赖兼容、完整 TypeScript、Vite生产构建、真实MSW与其他SDK、Chromium E2E、六风险切片和119库验收。新增浏览器源码与未执行命令不是 PASS。
- 未关闭 #12、#22、#40，不以公共改造证明这些运行/生命周期问题解决。

## 分项口径和下一步

历史静态口径119目录/119源码文档包/357场景声明沿用，**本次未重新统计完整远端树，也未重审117原文**；本次新增真实SDK PASS=0、浏览器实测成功Demo=0。首要工作只有运行环境、真实锁文件、完整构建与六风险切片，达到关口前不再扩充条目或制造相同阻塞报告。总范围仍未交付，不宣称自动后台保证完成，不擅自超过24轮。
