# D07 TanStack Query v5

遵循上级 AGENTS。此例的 QueryClient 是自己创建的，卸载只清理它，不清理宿主全局缓存。不要用 Mock SDK 冒充真实验收。修改 queryKey、取消、乐观 rollback、mutation scope 时必须同步 guide/agent/verification 与真实定向测试。

行级乐观更改必须使用业务 ID 与可追踪 token；回滚不可覆盖同页其他行，也不能假设 UI 防连点等于真实服务器串行化。
