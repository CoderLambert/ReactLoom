# RTK Query：订阅共享缓存，写入后定向刷新

RSS 管理页中，两个组件可能同时读取同一租户的订阅；切换租户不能闪出上一组数据；修改频道后又要刷新相关列表。RTK Query 把这些资源请求定义为 endpoint，让 Redux store 持有缓存，middleware 调度请求、订阅和失效，React hooks 订阅结果。

已有 Redux、希望资源和本地流程共用 store 与 DevTools 时值得选它。没有 Redux 的项目先比较 TanStack Query；不要为同一资源维护两份缓存。它随 `@reduxjs/toolkit@2.13.0` 发布，React 接线还需要 `react-redux@9.3.0`（均 MIT）。缓存隔离不等于授权，服务端仍须验证会话所属租户。

## 一条查询怎么流动

`createApi` 定义 `list` query、`toggle` mutation，并生成 reducer、middleware、hooks。`Provider` 提供 store；`useListQuery({tenant,search})` 创建订阅。端点名与序列化参数形成缓存键，相同参数的多个订阅共享缓存与在途请求；不是每个组件各发一次。

`baseQuery` 返回 `{data}` 或 `{error}`。本例为可取消的内存 fixture：它等待 200ms，读取虚构频道，或返回固定 409。没有 HTTP、账号或外部后端；但 createApi、缓存、标签和 hooks 都是真 SDK。诊断面板显示真实 baseQuery 执行次数、在途数量及当前 store 的查询键，不把等待时间当性能指标。

`list` 提供 `{type:'Feeds',id:tenant}` 标签。成功 mutation 使本租户标签失效：仍有订阅的相关查询重取，无订阅的缓存可被移除；失败返回空标签，因此不会自动重取。搜索词是缓存键的一部分，同租户的不同搜索共享租户级失效策略。

## 最少接入需要什么

```tsx
const store = configureStore({
  reducer: {[api.reducerPath]: api.reducer},
  middleware: getDefault => getDefault().concat(api.middleware),
});
// 在 Provider 内调用 API 的生成 hook
const {currentData, isLoading, isFetching} = api.useListQuery({tenant, search});
```

只有 reducer 不够，middleware 才负责请求生命周期。`isLoading` 表示初次无数据，`isFetching` 也包括已有缓存时的刷新。`data` 可以保留上一组参数的成功结果；`currentData` 只对应当前参数。本例再用参数 key 重挂载面板，卸掉旧 mutation 提示和订阅，避免串租户展示。

## 三个实验

### 共享订阅：组件数量不是请求数量

basic 初次出现「科技日报」「前端精选」，诊断 reads 中 team-a 为 1。勾选「第二个相同参数订阅」，第二面板显示 2 行，reads 仍为 1。点「重新获取本租户」，reads 增加，两订阅共享这次刷新。关闭第二订阅不会清掉第一订阅的缓存。

默认最后一个订阅离开后保留缓存 60 秒；演示整个 runtime 卸载会主动清空，因此这里不等待缓存回收。源码 [`runtime.ts`](examples/runtime.ts) 定义 API，`example.tsx` 的 SharedSubscriber 建立第二订阅。

### 参数隔离：切换租户和搜索

business 切 team-b，只出现「安全研究」「只读受保护频道」；切换后加载期间不出现 team-a 的行。诊断产生不同 tenant 参数的键。立即切回 team-a，命中保留缓存，reads 不因返回原参数而增加。搜索「前端」后提交，出现单行并新增 search 参数键。IME 组合期间 Enter 或 keyCode 229 不提交中间字符串，空白搜索 trim 后恢复全列表。

### 成功失效与失败保留

advanced 先在 team-a 切换「科技日报」状态，成功后本租户 list 的 reads 增加，刷新后显示「暂停」。切到 team-b，在「只读受保护频道」切换：提示出现 409，paused 不变，reads 不增加。失败不是成功空列表，也不会用一次重取掩盖错误。

默认传输延迟为200ms。点「模拟慢传输」后，当前runtime的后续请求均使用700ms，重新挂载才恢复默认值，发起切换后立即换租户或搜索。面板卸载递增 epoch 并 abort mutation，旧完成回调不能写回新面板。`unwrap()` 将失败转为 catch，只有当次 epoch 仍匹配才更新提示或清掉 in-flight 引用。取消不是授权，也不能保证真实服务器没有收到写入，接服务后仍需幂等与版本检查。

「清空当前示例缓存」先 abort 本 runtime 所有运行中的查询和 mutation，再 resetApiState；活跃 hook 随后可重新订阅。它不恢复 fixture 种子，修改后的频道仍保留。停止并重挂载整个示例才建立新 fixture，回到初始启用状态。

## 完整迁移与资源所有权

在已有 React + TypeScript 项目执行 `pnpm add @reduxjs/toolkit@2.13.0 react-redux@9.3.0`。复制 `examples/runtime.ts`、`examples/example.tsx`，保留相对导入；`demo.tsx` 只是 Lab 重导出，可省略。渲染 `<RtkQueryExample level="basic" />`（也支持 business/advanced）。需要 React DOM、现代 AbortSignal/DOMException 与 TypeScript bundler 解析。没有样式文件、额外 Provider 配置、环境变量或资源下载；组件内部已提供 Provider，demo-controls 仅为宿主排版 class。

运行时每次示例挂载创建一次 API/store，不要每次 render 重建。`runtime.dispose()` abort 所有运行中的 SDK 请求并 resetApiState；wait 在成功/取消时移除 abort listener、清理 timer；组件的 store 订阅由 useSyncExternalStore 自动解绑。每个面板另行 abort 自己的 mutation。清理只触碰私有 store，不重置应用其它 slice 或全局缓存。

生产通常把 API/store 放在应用模块，Provider 提升到根。此时不能因一个页面卸载就 dispose 整个共享 API，只卸掉页面订阅；账户退出才按账户范围清缓存。把内存 baseQuery 换成实际受控传输层，保留 signal、可序列化错误、参数和标签模型。数据应在网络边界验证；TypeScript Feed 不是运行时校验。不要把令牌、Response 或 AbortSignal 放进 Redux state。

本例没有轮询、setupListeners、乐观补丁、持久化和 ETag。若增加这些资源，应有自己的停止和版本策略；不要把 mutation 结果再抄进另一份 slice。RTK Query 缓存是资源数据的唯一主人。外部权限与事务由服务端承担。

## 来源与验证

RTK Query 属于 Toolkit；README 页签保存官方仓库 `packages/toolkit/README.md` 在 v2.13.0 对应提交的原文，固定树没有中文 package README。官网是官方 RTK Query 文档，响应头与最终地址见 `official/source-evidence.json`；未从 Lab origin 确认 iframe，保留 unknown 与直达入口。

`tests/sdk.test.mjs` 直接导入本例 `runtime.ts`，覆盖订阅合并、租户标签、409/404 与 abort/reset 后没有 fixture 写入，不再另造测试 API。浏览器检查 currentData、交互和重新挂载；实际命令及六项状态见 local-validation.md。正式 verification.json 仍需匹配收据。
