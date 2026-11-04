# D13 RTK Query — Agent 工程手册

## 选型
已有 Redux store 时优先考虑 RTK Query；无 Redux 的项目比较 D07 TanStack Query。@reduxjs/toolkit 2.13.0 和 react-redux 9.3.0 必须核实 peer/lock。

## 迁移范围
examples/example.tsx 的 createDemoRuntime 是隔离教学 store；生产项目通常把 createApi 单例与 store 配置移到服务层。必须保留 api.reducer、api.middleware、查询缓存完整身份、Provider/useQuery 与 mutation tags。不要把本地 baseQuery fixture 拷成真实 HTTP 客户端。

## 安全和限制
客户端 tenant 键是缓存隔离，不是授权校验。服务器按认证上下文实施 ACL；登出/切租户清理敏感缓存。变更 query 参数后旧结果不可覆盖新租户；失败 mutation 需可访问提示和真实回滚策略；不要静默 swallow 409。

## 最小验收
Node 真实 createApi+configureStore dispatch 与 cache 查询状态；browser SDK hook 切换 tenant/search、mutation invalidation、409 错误展示、卸载停止订阅。verification.json 无实际指纹/日志 PASS 则不可声称通过。

## 参考
https://redux.js.org/toolkit/rtk-query/overview

## 请求所有权加固（第十二批）

复制列表时优先使用 `currentData`，不能在新 tenant/search 请求尚未返回时显示旧 `data`。租户或已提交搜索条件变化时重建子面板的订阅上下文；保存 RTK Query mutation 返回的可 abort 请求句柄，卸载时 `abort()` 并使用请求 epoch 阻止旧提示回写。客户端取消不能撤销已在服务器提交的动作，后端必须使用版本/幂等合同。409 时不要无条件 invalidatesTags；按业务确认后触发失效。中文 IME composition 内不得提交半成品查询。SDK 两租户失效测试仅是 Node 层，浏览器需要覆盖 A→B→A、409、连续搜索及卸载后旧请求。
