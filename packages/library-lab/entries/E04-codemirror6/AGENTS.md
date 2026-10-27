# E04 CodeMirror 6 条目规则

首先遵循根目录与 library-lab/AGENTS.md；阅读当前 library.json、agent.md 与 verification.json。运行源码只在 examples 维护，生成器从真实文件展示 SHA。禁止 Mock 目标 SDK 冒充验证成功。不得修改公共 package/lockfile、CI 或其他分组。

示例恢复和纯Node测试共享 examples/*-policy.mjs；修改文档节点、容量或局部权限时同步负例、三层sourceFiles和指南。策略测试不计入真实SDK/浏览器PASS。
