# TanStack Query：先看共享缓存，再处理写入和取消

两个组件显示同一组订阅源统计时，分别在effect里请求会重复工作；切团队、搜索、翻页后，又要区分哪些数据能复用、哪些必须重取。TanStack Query用查询键标识一份服务端状态的客户端快照，让组件订阅数据、共享在途请求，并在需要时后台刷新。它不代替HTTP客户端、业务数据库或鉴权，也不负责表单草稿。

本例固定 **@tanstack/react-query 5.104.1**，MIT。三个场景使用真实SDK与各自的QueryClient，业务输入来自每例独立的内存fixture，没有HTTP请求、真实RSS服务或服务器持久化。需要跨组件的异步快照、缓存和写后重取时适合使用；只有本地开关或一次性静态数据时不必引入另一套缓存。已有Redux中心的项目可比较RTK Query，避免两套状态所有权。

## 四个概念的关系

| 概念 | 本例怎样使用 | 看什么结果 |
| --- | --- | --- |
| QueryClient | 每个演示实例用useState创建一个，只清理自己的实例 | 同场景组件共享；离开后重进回到初始fixture |
| queryKey | 统计包含tenant；列表还包含search/page | 同键共享，不同团队/筛选/页码分别缓存 |
| queryFn | 接收SDK给的signal，调用本地异步fixture | 取消会中断真正的延迟工作，非2xx式业务失败用抛错表达 |
| observer / useQuery | 每个组件订阅同键的数据和查询状态 | 两个组件显示同一次读取的结果；订阅者不等于请求次数 |

`status`描述数据结果，`fetchStatus`描述请求是否正在进行：首次没有数据时是pending；已有数据后台刷新时可以同时是success和fetching。`isPending`不等于此刻一定在请求，取消首次查询后可能仍pending但fetchStatus已idle，所以页面明确显示已停止并给恢复操作。

`staleTime`是成功数据的新鲜窗口，不是删除倒计时。窗口结束后允许后续挂载、聚焦、重连等触发重取，**不会只因为变stale就自动轮询**。`gcTime`控制无订阅缓存的回收等待，本例设60秒；仍被订阅的数据不会因为这个时间而删除。SDK查询默认staleTime为0、浏览器失败默认会重试，本例统一retry:false便于观察；mutation默认不自动重试。

## 场景一：相同查询键，两个组件

工程问题：共享是共享数据，还是每个组件都请求一次？fresh/stale对新订阅有什么影响？

1. 打开“共享查询、fresh/stale与后台刷新”。组件A首次请求约600ms后显示技术团队A的9个来源、5个启用，fixture请求序号1。这里的序号是本地backend真实调用次数，不是预置动画。
2. 在首次加载中挂载组件B，可以观察两个useQuery共用同一次在途请求；或在A显示fresh的3秒内点击“挂载第二个统计组件”，B直接拿缓存。两者均显示同一请求序号，不因为多一个组件就多一次读取。
3. 等待3秒变为stale，两个组件仍显示已有数据，fetchStatus为idle，不会主动清空或轮询。若此时新挂载B，默认挂载行为可以触发一次后台刷新。
4. 点击“在本地数据源新增1条”。它只修改fixture的数据源，缓存仍显示原来9条。点击“后台刷新共享统计”，页面保持旧数据并显示后台刷新中；返回后两卡同时变10条、6个启用、请求序号增加一次。
5. 切换商业团队B，键中的tenant变为team-b，初始统计为6条、3个启用，不会把A的9条当成B的占位。

[`cache-primer.tsx`](examples/cache-primer.tsx) 的两个卡片调用同一份 [`shared-query.ts`](examples/shared-query.ts)：

```ts
queryOptions({
  queryKey: keys.stats(tenant),
  queryFn: ({ signal }) => backend.stats(tenant, signal, 600),
  staleTime: 3_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
})
```

fixture序号在每次调用开始时递增，包含后来被取消的读取。开发态StrictMode、提前切团队或取消后重新进入可能改变起始值；重点比较同键两卡是否共享序号、一次刷新是否只增加一次，不把某个固定序号当SDK保证。

queryOptions帮助集中配置和类型，本身不发请求。两个useQuery在同一个QueryClient下使用这些配置才共享。为了控制这个实验的读取次数，basic关闭焦点/重连自动刷新；这是本例选择，不是SDK默认。业务/进阶场景保留通常默认行为。

“后台刷新共享统计”调用当前统计键的`invalidateQueries`：标记失效并重取活跃查询。它不是直接把fixture对象塞进缓存，也不表示服务端已经确认写入。缓存仍有旧数据时显示后台刷新，不能重新画成首次空白加载。

## 场景二：身份、搜索和分页决定缓存边界

工程问题：上一页或另一个团队的结果可以显示在哪个位置？

1. 切换到业务场景，技术团队A有9条、每页3条。点击“下一页”读后续记录，页码和当前queryKey一起改变。
2. 在“RSS搜索”输入“工程频道 1”，点击“查询”。提交后的search进入键，页码回到0；输入草稿本身不发查询。
3. 切商业团队B，搜索和页码复位；显示该团队的6条来源及独立缓存。空结果明确显示没有匹配的来源。

[`query-keys.ts`](examples/query-keys.ts)保留了实际键工厂：

```ts
['library-lab', 'query-demo', tenant, 'feeds', search, page]
```

任何决定queryFn结果的变量都应进入身份。不要只用`['feeds']`，也不要把Date.now放进去强行绕过缓存。延迟开关不改变数据身份，不需要进键。

本例列表staleTime为3秒，工作区统计为10秒；数值都是教学选择。换键时没有使用placeholderData，新的pending与后台fetching分别显示。生产分页可以使用v5的placeholderData或keepPreviousData辅助函数，但必须明确身份和展示约定，不能让旧团队或旧搜索结果冒充当前请求。

## 场景三：可中止查询与按行回滚

工程问题：慢查询和失败写入怎样恢复，并且不覆盖别的行？

1. 将“本地请求延迟”设900ms，点“重新获取当前列表”，再点“取消当前列表查询”。SDK发出的signal被传到fixture的pause，定时器会清除；已有缓存保留。如果首次读取没有数据，页面显示查询已停止，不永久显示加载中。再次获取即可恢复。
2. 勾“模拟下一次更新409”，在a-1行点击“暂停”。该行立即显示乐观状态和等待确认；约240ms后真实fixture抛409，行恢复原值，错误说明可见。开关只消费这一次，随后自动取消勾选。
3. 再次点击该行操作，成功后rev从1增加到2，临时token消失；结尾的失效重取刷新列表和统计。
4. 更新后立刻切团队，再切回A：旧会话的成功/失败提示不应重新出现。不同团队缓存和请求身份独立。

业务状态没有复制到另一个全局store。[`optimistic-policy.mjs`](examples/optimistic-policy.mjs)保留ID、revision与token三层所有权：

- `onMutate`先取消当前租户列表前缀的在途读取，再只快照目标行。
- `optimisticRow`只改ID/rev匹配且还没有token的行，生成新对象，不原地改缓存。
- 失败时`rollbackRow`只恢复仍携带本次token的行；同页其他成功更改保留，晚到的失败不能撤销新token。
- 成功时`commitRow`使用fixture返回的权威rev并移除token。
- `onSettled`仅在同租户没有其他mutation时失效，避免旧读取盖住更新中的草稿。

mutation scope按租户串行，页面pending时禁用操作，inFlightRows再挡同一ID连点；这些不是数据库锁。tenantEpoch在切团队与卸载时增加，提示只有在开始时的会话代与当前相同时才能回写；只比较旧闭包中的tenant不能处理A→B→A。

查询取消和写入取消不是同一件事。这里toggle的240ms本地写入不提供AbortSignal，client.clear也不取消已经开始的mutation；卸载后旧epoch不写UI、清空缓存也不去碰宿主client。真实POST若已到服务端，取消等待不意味着服务端回滚，仍需revision/幂等键和明确的冲突策略。

## 迁入业务项目

```sh
pnpm add @tanstack/react-query@5.104.1
```

React peer为18或19。复制`example.tsx`、`cache-primer.tsx`、`fixture-backend.ts`、`query-keys.ts`、`shared-query.ts`、`optimistic-policy.mjs`及`.d.mts`、`workshop.css`，保持相对导入。`demo.tsx`是Lab重导出。TypeScript需支持Bundler解析和allowImportingTsExtensions；本仓库TS7已提供，独立项目若不允许.ts导入可将shared-query内扩展名改为构建器支持的写法。

生产中由应用确定QueryClient边界，一般在稳定Provider处持有一个；SSR每个请求独立，避免不同用户共用模块级client。本例useState创建自己的client和backend，卸载只clear自己；不要照抄成去清理宿主全局缓存。Provider自身负责mount/unmount焦点和在线订阅。

替换fixture时保留键工厂与queryFn入参signal，调用业务HTTP客户端并校验返回结构；非成功HTTP响应要抛错。fixture的数组、延迟、请求序号、新增来源和409开关都应留在测试/演示层。业务列表、后台刷新与错误说明使用局部CSS，不依赖Lab内部组件。

## 重要取舍与验证

`setQueryData`更新客户端快照，`invalidateQueries`触发重新校验；两者不等于持久化。查询返回值避免undefined。mutation通常不是幂等读取，不能为提高“成功率”随意开启重试。多个写操作的回滚不能恢复整页旧快照。不要把服务端查询结果再同步到Zustand作为第二份业务缓存。

SDK套件使用真实QueryClient及本例实际键/统计options/backend，分别验证共享去重、fresh复用/失效重取、signal取消和按行回滚。纯策略测试验证ID/token的细节；两层都不能证明浏览器订阅状态、时间边界、焦点行为和实际控件已经通过。当前本地命令、六项复核与剩余项见local-validation.md；verification正式状态仍依照匹配收据。

## 官方原文与版本

官方原文选自`TanStack/query`目标包`packages/react-query/README.md`，固定到`@tanstack/react-query@5.104.1`标签对应提交`29859ae60c8dca0a5cdbf8abccc775b655cf43e2`。同提交包版本为5.104.1，根/目标包候选没有官方中文README，因此保存英文原文，不自译替代。版本/语言/日期/摘要与完整响应头见library.json和official/source-evidence.json。

- [查询键](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [重要默认值](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [查询取消](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
- [乐观更新](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

官网本次GET200，但返回`X-Frame-Options: DENY`，明确禁止iframe嵌入，官网页签保持blocked并提供直达；不把它记为SDK失败，也不冒称从Lab origin完成浏览器允许验收。
