# E12 assistant-ui — 目录维护约定

先读 `library.json`、`guide.md`、`agent.md`、`verification.json` 和上级 `AGENTS.md`。源码直接作为 Demo 和源码面板的唯一来源；不得另行伪造展示代码。修改源码后，旧验证证据应视为过期；未实际运行 SDK 不写 PASS。只修改本库目录，依赖交由 PLATFORM 管理。

本地ChatModelAdapter输出必须由最近user文本驱动，不读取tool secret；所有流式yield为累计内容而不是delta。策略测试与真实SDK验收分别报告。
