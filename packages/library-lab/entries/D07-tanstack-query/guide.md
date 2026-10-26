# D07 TanStack Query v5：查询缓存的业务所有权

**基线**：`@tanstack/react-query@5.104.1`（MIT，与当前 ReactLoom SPA 模板对齐）。安装：`pnpm add @tanstack/react-query@5.104.1`。本例运行真实 QueryClient、useQuery、useMutation；网络端是明确标记的内存 fixture，不代表已连真实 NewsHub 服务。实际源码 `examples/example.tsx`，适配入口 `examples/demo.tsx`；页面源码读取同一份文件。

## 三层可运行内容

**入门**：QueryClientProvider 建立独立缓存，`useQuery` 查询来源统计，`staleTime:10000` 表示 10 秒内 fresh；手动 invalidate 触发重新查询。注意 fresh 不代表无限期永久缓存，gcTime 则决定无订阅观察者的缓存保持期限。

**业务**：RSS 来源列表查询身份包含 `tenant/search/page`，切换工作区时不同 QueryKey 绝不能显示另一个租户的 placeholderData。搜索提交后重置页码；读取页码与状态的所有权在 QueryClient，UI 只保存输入/选择状态。

**边界**：`queryFn({signal})` 使用官方传入的 AbortSignal，传递给本地可取消 fixture；`cancelQueries` 恢复已存在旧状态并中止等待。`useMutation` 更新开关时先 cancelQueries，再 snapshot 当前租户列表，写入乐观更新；409 fixture 触发 onError，按快照回滚，onSettled 失效查询重新拉取。mutations 使用按 tenant 的 scope 串行，以免多个乐观快照覆盖彼此。

## 关键反例

1. QueryKey 忽略 tenant / search / page，导致不同工作区缓存串线；将全部参数纳入 key，禁止把凭据、token 明文塞入 key。
2. 用 useEffect + fetch 自造第二套缓存，导致所有权不清；统一由 Query 管理真正 server state。
3. 忽略 queryFn signal，以为卸载必然取消网络；官方默认未消费 signal 的请求可能继续结算入缓存，需显式接线。
4. 乐观更新前不取消旧查询，后台 refetch 可覆盖临时值；先 cancel，再 snapshot 与 setQueriesData。
5. 并发修改后以同一个老快照无条件全量回滚，可能覆盖其他已成功写入；需要串行 scope、mutation ID 或更细粒度回滚。
6. 把 staleTime、gcTime、refetchInterval 当同一配置；应理解 fresh、无人订阅回收和轮询独立。
7. 业务异常只抛字符串、不给字段反馈；标准化错误并让 UI 可恢复，取消不能被展示为 HTTP 失败。

## 生产设计

生产系统的缓存作用域必须与登录身份/租户绑定。身份变更时应根据敏感度创建/清理独立 QueryClient、撤销旧请求并移除需要清理的敏感缓存。不要在 Demo 里清除浏览器或整个主应用存储；本例只清理自己创建的 QueryClient。

变更后 invalidateQueries 并不等于所有 query 都马上重新请求，尤其是 inactive query 与 staleTime 的关系需要按选项确定。重型编辑器或长列表可结合虚拟化，但 Query 只负责数据，不负责 DOM 性能。

## 可验证断言

不同 tenant 绝不共享列表内容；快速搜索/翻页，旧慢请求不能回写当前 key；点击取消，实际等待被 AbortSignal 中止；更新失败的乐观状态被回滚；成功更新后统计和列表重新一致。当前新源码 SDK/build/browser 仍为 NOT_RUN，见 verification.json。

官方：https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation · https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
