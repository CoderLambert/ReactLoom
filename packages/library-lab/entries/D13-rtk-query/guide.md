# RTK Query：Redux 项目里的服务端状态层

## 选择定位
项目已经采用 Redux Toolkit/React Redux 时，RTK Query 提供端点、缓存订阅、请求去重、标签失效及自动 hooks。若项目没有 Redux 状态体系，可优先评估 D07 TanStack Query，避免为了一个请求引入额外全局 store。

## 安装与入口
目标 @reduxjs/toolkit 2.13.0、react-redux 9.3.0：

    pnpm add @reduxjs/toolkit@2.13.0 react-redux@9.3.0

真实代码使用 configureStore、createApi（来自 @reduxjs/toolkit/query/react）与 Provider。注意在 store 注册 api.reducer 与 api.middleware，两者缺一不可。

## 入门：订阅与缓存
builder.query 定义 list，useListQuery 自动加载；相同查询参数使用缓存，查询 result 内的 isLoading/isFetching 区分初次加载与后台刷新。builder.mutation 定义 toggle，invalidatesTags 根据 tenant 标签触发相应查询重新获取。

## 业务：多租户隔离
list 参数包括 tenant 和 search，形成独立序列化缓存键。仅查询参数区分不是后端权限隔离；服务端仍需验证用户身份及 tenant 成员关系。团队切换应清理敏感数据及旧订阅，并检查缓存 TTL/退出行为。本实验使用每个 Demo 独立的 store 与内存数据。

## 边界：失败/取消与生命周期
业务网络被严格换成本地 fixture 的异步 BaseQueryFn，但真正的 createApi/store/hooks/middleware 由 SDK 执行。冲突频道返回模拟 409；手动 resetApiState 只清当前实例，避免其他项目受影响。生产 HTTP 请求使用 fetchBaseQuery 和 AbortSignal，注入认证头需准确区分凭据与业务缓存身份。

## 典型错误与修复
1. 仅注册 reducer 不注册 api.middleware：缓存生命周期和无效化不工作。
2. 缓存键遗漏 tenant/account/重要筛选条件：会跨用户显示过期数据。
3. mutation 一成功就手改多个地方却没有回滚：先明确 invalidatesTags 策略或 onQueryStarted.patch.undo。
4. 单次组件 render 创建新 store/API：订阅重新创建且缓存失效；示例在 useState initializer 创建，卸载后 reset。

## 性能/安全/验证
tags 不应无限展开成每条都触发全站重拉；对大规模列表可提供分页或范围缓存。SDK 启动不代表真实网络正确，mock 后端不可声称服务端鉴权通过。真实 Node SDK 测试应至少 dispatch query、读取 cache 状态、验证租户键独立和 mutation 失效；浏览器还要测焦点、网络中断和切换。

## 官方资料
https://redux.js.org/toolkit/rtk-query/overview
https://redux.js.org/toolkit/rtk-query/usage/cache-behavior

## 第十二批：查询身份、IME 与突变反馈隔离

RTK Query 的 `data` 可以保留**上一次参数**成功时的数据；要求当前参数严格不显示旧工作区记录时，使用 `currentData`。本示例的 `FeedsPanel` 另以 `[tenant,search]` 为 React key，每次切换都卸载旧订阅/组件状态，避免 A→B→A 重现旧提示。正在执行的 mutation 会在卸载时调用真正 RTK Query 请求句柄的 `abort()`，请求 epoch 过滤旧成功/409结果；这只取消本地等待，**不能保证服务端已提交的变更回滚**。

搜索框区分输入草稿与提交的 `search`，IME composition 期间 Enter 不发送半成品查询。失效标签仅对**成功** mutation 生效，409 不应无意义刷新相同租户的查询；真实SDK测试新增两个租户的缓存失效断言。若服务端允许部分提交，请引入版本号/幂等键和强制重新校验，不能把本地 abort 当成事务隔离。此行为仍待真实浏览器切换/IME 以及已安装SDK运行测试。
