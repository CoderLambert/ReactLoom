# D07 TanStack Query v5 — Agent 工程指导

目标 SDK `@tanstack/react-query@5.104.1`（MIT）。用于缓存与同步外部异步数据，**不是**全局 UI Zustand store 的替代品。先读 library.json/verification.json，再从 `examples/example.tsx` 提取 query keys、queryFn、mutation callback 和 Provider 生命周期。

## 迁移时保留

- queryKey 覆盖用户/租户和所有数据入参，但不存明文凭据；
- 所有 queryFn 从函数上下文解构 signal，传给可取消网络客户端；
- 对相同资源更新前 cancelQueries，再 snapshot → optimistic update → error rollback → invalidate；
- 多次 mutation 需串行 scope 或更细粒度版本化，以免旧快照覆盖并发成功结果；
- 正确区分 staleTime（是否 fresh）、gcTime（无人观察者的生命周期）、refetchInterval（轮询）；
- SSR 需要单独设计 QueryClient 生命周期和 dehydration/hydration，不能将本地 client-side demo 直接当作完整 SSR 实现。

## 可丢弃

本例的内存 fixture server、初始任务名称、ReactLab 视觉控件和本地延迟；替换为真实HTTP时保留 signal / status / 租户隔离策略。示例只清理自己的 QueryClient，不执行全局 cache.clear 或退出登录动作。

## 测试

使用目标 SDK 模拟业务服务但不 mock SDK。检查取消信号、旧响应无串线、缓存键隔离、乐观 409 回滚、成功失效重拉及卸载资源。项目 SDK/类型/构建/浏览器此提交未真实通过，不能继承历史研究测试结果。

官方：https://tanstack.com/query/latest/docs/framework/react/overview
