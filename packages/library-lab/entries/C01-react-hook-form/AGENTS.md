# C01 React Hook Form 维护边界

阅读上级 AGENTS.md、library.json、agent.md、verification.json。修改 example.tsx 后同步 guide/agent，源码由生成器直接读取，不另存展示版。业务端仅用本地 fixture；不得使用付费端点或将 mock 服务端视为真实 SDK 验证。动态行固定 `field.id`、取消保留 AbortController cleanup。版本更新须先核对 v7/v8 兼容。

第22轮约束：RHF 回包须同时验证输入快照、异步 generation 和 AbortSignal；字段数组增删先失效旧回包，不得把旧索引的 409 错误映射到新行。IME Enter 不可只检查 `isComposing`，需保留公共策略测试。实际 SDK/浏览器未运行前 verification 保持 NOT_RUN。
