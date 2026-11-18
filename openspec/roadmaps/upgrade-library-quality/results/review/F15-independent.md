# F15 独立试用

从目录与 `agent.md` 选定 Knip 6.41.0，按声明复制完整 workspace 至新临时目录，复用现有固定依赖。新增一份未连接入口的 `src/independent.ts`，从 Lab 包运行 `pnpm exec knip --directory <临时目录> --config knip.basic.json --reporter json`。实装输出 6.41.0，退出 1，JSON 新增 `issues[].files[].name=src/independent.ts`，其余三类原证仍在。脚本进行了真实 JSON 断言并退出 0，见 candidate-37/f15-independent.txt 和 f15-consumer.sh。没有扫描其他项目或修改原夹具。

guide/agent 与源码解释入口、项目文件集合、报告抑制以及生产模式的作用。`project` 包含测试，仍需入口或导入；`ignoreIssues` 只改变报告。实际 3/3/5 项是作者三场景结果，纯策略 5 项另计；未重跑。独立新文件与 CLI 输出支持最小迁入，真正清理源码需要逐项确认动态入口等情况。README/LICENSE 固定且原字节，主页状态据作者实际 GET 保留 unknown。Lab 面板只作命令/源码展示。正式收据 NOT_RUN。
