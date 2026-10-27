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

## 本轮修复：切换租户时的 mutation 反馈隔离

即使 QueryKey 按 tenant 隔离，**mutation 的 success/error 回调也可能晚于工作区切换**。旧版本会把 A 的成功/409 文案显示在 B。当前示例在 `onMutate` **await 之前**记录 `tenantEpoch`，返回到 context；`onSuccess/onError` 仍回滚/失效对应租户的快照，但只在 epoch 未变化时修改当前页面提示。切换 A → B → A 也不恢复最早 A 的反馈；unmount 会让旧 epoch 失效。

浏览器定向场景：在团队 A 启动需240ms的开关修改，立即切到 B；A 的完成/409 不得出现在 B 页面。再切回 A，不能展示先前过期消息，但 A 自身缓存仍可按服务器结果独立失效重拉。本地 fixture 是业务模拟，不能代表实际服务器写入可被取消。SDK/Chromium 尚未运行，本处只描述代码设计和必须验证的行为。

## 第23轮：并发写入的缓存所有权与服务器版本校验

原来 409 时整页 snapshot 回滚，会连带撤销同页另一条已经成功的 RSS 变更。此次实际 `examples/example.tsx` 导入 `optimistic-policy.mjs` 的行级策略，三层演示及源码面板读取相同源文件：

- `optimisticRow` 只修改业务 ID 匹配、revision 与服务端预期一致且当前无其他 token 的缓存行；不更改同页其他行。
- `rollbackRow` / `commitRow` 只更新仍由该次 mutation token 持有的行；成功使用服务端真实 `rev`，失败按旧行恢复，而不是恢复全部旧页。
- 内存业务 fixture `toggle` 实行 `expectedRev` compare-and-swap，触发明确 409；前端 token 只是客户端并发控制，**不替代后端鉴权、ETag 或条件更新**。
- `mutationKey` 加租户，`onSettled` 只由该租户最后一个 mutation 触发刷新，避免旧 refetch 提前覆盖新的 optimistic draft。提交参数显式带 tenant，切换 A→B→A 后仍更新原始 tenant 缓存但不误显示旧提示。
- 按 tenant/业务 ID 同步拦截 UI 连点。查询分页/搜索变化不再使用不属于新 queryKey 的 placeholder 数据，避免把前页错标成当前页。

测试应覆盖两行独立写入、并发成功/失败、后台刷新与乐观更新交错、服务端旧 revision 409、跨工作区切换、重复按钮点击。已执行的是 Node 纯策略 6 PASS 和独立类型声明静态检查；实际 TanStack Query SDK 集成测试源码已加入但 **NOT_RUN**。完整 TSX 类型、Vite、Chromium 仍 NOT_RUN，不能把策略 PASS 当第三方 SDK PASS。

参考： https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates
