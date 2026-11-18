# F14 独立迁入核查

由目录选择 Storybook 的组件隔离与交互编排。按工程指南取 10.6.1 的三包和声明的四个原件，保持 components、stories 和 .storybook 目录结构。在非作者临时 consumer 加入新 CSF 故事，title 为 `Orion manual review`，tone 为 `blocked`，使用固定版本 `storybook/test` 的 `fn()`。对四原件、新故事、独立 config 严格 TypeScript 编译 exit 0。完整命令与可复现脚本在 candidate-37 的 f14-independent.txt 与 f14-consumer.sh。

源码确认 blocked 禁用入口、失败恢复保留重试，故事的 mock 调用通过 Storybook `play` 验证。作者保存的实际 build 与真实静态站切换记录支持 Basic、Business、Advanced、Recovery 的状态结果，同一会话最后重复 Business 仍通过。add-on 实际使用 axe 4.14.0，局部报告 0 violations 和 0 incomplete。复用此证据，独立新 story 只验证了类型与迁入，不将其计作 play 或 axe 的新场景。文档也将无法取消已有 Promise、真实 HTTP 和局部无障碍检查的范围说清。官方来源与页面入口另见作者原字节记录和浏览器面板证据。正式收据 NOT_RUN。
