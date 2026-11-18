# D07 TanStack Query 复用指南

版本@tanstack/react-query5.104.1（MIT），React peer18/19。适合共享异步服务端快照；HTTP、鉴权、表单草稿和数据库一致性不是Query职责。

## 核心入口与迁移

先读library/guide、实际example/cache-primer、shared-query/query-keys、fixture-backend、optimistic-policy和verification。最小共享实验从CachePrimer+sharedStatsOptions理解同键observer；业务保留原列表/搜索/分页与按行mutation。完整源码和CSS均在sourceFiles，相对导入，无Lab内部依赖。shared-query使用.ts导入便于同源Node验证，独立TS项目需要allowImportingTsExtensions或调整该导入写法。

useState创建本例独立QueryClient与backend；卸载client.clear只清自己。Provider另负责mount/unmount。真实产品在稳定应用边界持有client，SSR每请求独立。fixture不走HTTP；新增来源、延迟、请求序号和409是业务模拟，不是SDK能力。

## 三个目标

- basic：两个真实useQuery调用同一keys.stats与sharedStatsOptions，同client共享在途和fresh数据；600ms请求，3秒stale窗口。A初始9/5/request1，B不增加一次请求；stale不自动轮询。修改fixture不直接改cache，invalidate后旧值保留后台刷新到10/6/request2。为控制实验关闭focus/reconnect自动刷新，不冒称SDK默认。
- business：keys包含tenant/search/page；提交搜索、换页、A/B identity独立。列表3秒、统计10秒。无placeholderData；迁移如引入需明确身份与旧数据展示约定。
- advanced：cancelQueries只取消本租户列表，signal到pause；pending+idle显示已停止并能refetch。一次409开关消费后复原，错误按行回滚；成功采用权威rev。真实mutation不可因为取消等待就声称服务端回滚。

## 不可删的所有权

cancelQueries→只快照目标行→optimisticRow(id/rev/token)→rollbackRow或commitRow。不要恢复整页旧数据，晚回调不能覆盖更新token。tenantEpoch切团队/卸载递增，A→B→A旧提示不复活。onSettled只在同租户最后一个mutation时invalidate，inFlightRows只做UI同ID防连点，scope不是数据库事务。

queryFn必须转发signal。读取延迟timer在abort清理；toggle的240ms写入没有AbortSignal，卸载client.clear不停止已开始mutation，但旧epoch不写UI。不要清宿主client或全局存储。

## 验证

控件：basic挂载/卸载第二组件、修改本地源、后台刷新；d07-observer-a/b的data-stale/data-fetch-status和d07-stat-value-a/b，d07-shared-key。业务/进阶d07-query-key、d07-query-state、d07-fetching、d07-row-a-1等与d07-message。

断言同键请求序号一致且fresh挂载不重取；3秒后stale仍idle；刷新保留旧数据；不同tenant不串。取消初始无数据不永久加载，重新获取恢复。409保留其他行/其他团队，token与revision匹配，重试成功rev增加。卸载不污染宿主缓存与旧提示。

tests/sdk.test.mjs实际执行QueryClient并复用本例键/options/backend；optimistic-policy是纯策略。Node与浏览器/正式收据分别报告，未跑不标PASS。固定官方README commit29859ae60c8dca0a5cdbf8abccc775b655cf43e2，英文目标包原文；官网XFO DENY而blocked。来源与本地结果见local-validation.md。
