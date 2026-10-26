# F14 Storybook — 文件维护规则
遵循根与 packages/library-lab/AGENTS.md；先读 library.json、agent.md、verification.json。只接受EF范围文件变更。源码面板由真实 example/stories/config 源文件生成，不能再手写展示副本。历史研究不能证明 SDK 当前运行PASS。
Node/CLI 实验必须给真实命令和可复现测试，不得在 React 网页伪造 CLI/终端输出；PLATFORM 管理公共依赖/锁文件/运行器。未执行保留 NOT_RUN/BLOCKED，单测并非生产构建或真实浏览器验证。不调用付费服务、不访问用户生产数据、不执行不可信的归档脚本。
