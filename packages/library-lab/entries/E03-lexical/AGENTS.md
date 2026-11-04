# E03 Lexical 开发约束

先读上级AGENTS与本条目agent.md。内容 JSON 与页面展示隔离；不得执行用户富文本HTML或泄露sessionStorage。sourceFiles来自实际入口，改动必须刷新证据fingerprint。新的 Lexical 包由PLATFORM统一安装并核验peer，不改共享lock。

示例恢复和纯Node测试共享 examples/*-policy.mjs；修改文档节点、容量或局部权限时同步负例、三层sourceFiles和指南。策略测试不计入真实SDK/浏览器PASS。
