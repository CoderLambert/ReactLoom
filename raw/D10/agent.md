# D10 Zustand 工程检索

选它：跨组件客户端偏好与轻量动作；单组件用 useState，远程缓存留 Query，复杂互斥流程比较 XState，原子派生比较 Jotai。版本 5.0.16，React 18+，MIT。不是权限隔离或请求缓存。

先读 guide.md、library.json、实际 examples/store.mjs、example.tsx、migration-policy.mjs 和 verification.json。store.mjs 是 SDK 测试与页面共用原件。

迁入：pnpm add zustand@5.0.16，复制 store.mjs/store.d.mts、migration-policy.mjs/migration-policy.d.mts；页面按 example.tsx 惰性创建实例，useStore 选择稳定原始字段。无额外配置、CSS、Provider、环境变量。demo.tsx 仅 Lab 适配器。真实持久化在客户端传 localStorage，SSR 按请求建 store，不跨请求共享，也不在服务端读取 window。

保留：persist version=2、partialize 偏好白名单、skipHydration 与显式 rehydrate、受控 v1 migrate；tenant 和动作不序列化。嵌套 set 展开保留另一团队。name 变更不会自动读旧键。不要返回新对象作为不稳定 selector 快照；需要组合选择用 useShallow。useStore 按 Object.is 比较选择结果，面板有其他订阅，不能由面板重渲染证明某字段订阅更新。

边界：业务是 Map 内存 storage，不跨真实页面刷新；business 第二面板是独立 store+独立 Map，相同键名不共享。团队字段隔离只是业务结构，不是授权。partialize 不验证入站 v2 JSON。非法 JSON 在 migrate 前失败，hasHydrated=false，完成回调报错；生产增加可见错误和入站校验。不要声称迁移接管所有坏数据或当前做了跨标签同步。

清理：useStore 管理 React 订阅；自建 subscribe 要 unsubscribe。v5 无 destroy API。每个挂载 Map 仅 dispose 删除自己 KEY；别用全局 storage.clear。重建保留 Map，卸载丢弃它；没有网络/计时器。异步 storage 的竞态须另测。

断言：首次 A=true/B=false；仅改第一实例的 B 后第二实例不动；重建恢复偏好且 tenant=A；JSON 只有 view、enabledByTenant；v1 false/grid→A=false/B=false/grid；字符串 false→默认 true；取消订阅后不再通知；dispose 后新建恢复默认；非法 JSON 不调用 migrate 且可删自有键恢复。tests/sdk.test.mjs 真实导入当前源码；migration-policy.test.mjs 只是策略。

正式状态不能从局部日志推成 PASS，见 verification.json。README 固定源/树/API/homepage证据在 official/，官网unknown不冒充浏览器嵌入成功；Chromium 验证见 local-validation.md。
