# C01 React Hook Form 维护边界

阅读上级 AGENTS.md、library.json、agent.md、verification.json。修改 example.tsx 后同步 guide/agent，源码由生成器直接读取，不另存展示版。业务端仅用本地 fixture；不得使用付费端点或将 mock 服务端视为真实 SDK 验证。动态行固定 `field.id`、取消保留 AbortController cleanup。版本更新须先核对 v7/v8 兼容。
