# nuqs 2.10.1 — 将 URL 变成显式的状态合同

## 使用边界
新闻/RSS 的关键词、分组、分页需要分享和刷新恢复，URL 比只保存在 Zustand/localStorage 更合适。nuqs 不是请求缓存、授权机制，也不自动替代 Router 自己的 validateSearch；它需要匹配当前路由框架的 Adapter。

## 安装与适配
```bash
pnpm add nuqs@2.10.1
```
此应用采用 TanStack Router，示例直接使用 `NuqsAdapter` from `nuqs/adapters/tanstack-router`，不使用只适配 Next.js 或 React Router 的路径。官方 TanStack 支持被标记为实验性；已有 TanStack 路由 validateSearch 适合简单状态时应优先使用原生 API，以减少两套序列化规则的耦合。

## 三层交互
**基础**：`useQueryState('ll_c19_q',parseAsString.withDefault(''))` 把输入与 URL 双向联系。已组合中的输入法候选词不立即提交 URL。
**业务**：查询词、分组和页码联合筛选内存中的 RSS 列表。筛选变化时页码复位；页码来自 URL 但业务仍限制上界，防止无效深链接。
**高级**：搜索输入 `replace`，分页 `push`，比较浏览器返回按钮；非法整数由 `parseAsInteger` 解析失败并退到默认值。

## 生产决策
1. URL 键使用 `ll_c19_` 命名空间以避开 Lab 的 `tab` / `example`。
2. 通常筛选词 replace，页面跳转 push；不能每个按键都 push，历史栈膨胀影响返回体验。
3. 用户文字输入区分 composition 和 change；提交时再处理 normalize，不把中文候选误当最终查询。
4. `useQueryState` 值来自 URL，不可作为权限校验。解析合法仍需页面大小范围、ACL 和后端参数白名单。
5. 同一页面已有 TanStack Router validateSearch 时，应决定唯一数据所有权；特别是跨路由跳转可能丢掉未声明的参数，必须在目标项目 E2E 验证。

## 反例与修复
- 不安装 NuqsAdapter → hooks 缺少上下文。应只用当前路由对应的 adapter。
- 每次输入 pushState → 浏览器返回需要点几十次。限制 push 到语义化导航事件。
- 直接 Number(location.search) → 空字符串、NaN、负数和越界。使用 parser 并做领域裁剪。
- URL 混入访问令牌、邮箱、隐私搜索历史 → 可被复制或日志收集。URL 只存非敏感展示筛选。
- 将 URL state 与服务器 cache 混为一谈 → 查询参数改变时未更新 Query key。需带完整 filter/tenant identity。

## 关系与练习
对比 TanStack Router 原生 search、nuqs 与 Zustand 的所有权。练习：将 NewsHub RSS 过滤界面的关键字/分类/页码迁移到明确的 URL Schema，复测刷新、返回、中文 IME 和无效参数。nuqs 的 server parser 可在 Node 单测，但浏览器 adapter 必须另测。

## 当前验证与许可
`tests/sdk.test.mjs` 直接 import `nuqs/server` 验证 parser/serializer；此轮未执行，且 Node 单测不足以证明 TanStack Router 集成。浏览器 E2E、React19 类型和 URL 历史由 PLATFORM 统一跑。MIT 许可。

官方 https://nuqs.dev/docs/adapters 与 https://github.com/47ng/nuqs 。

## 隐藏的旧参数与深链接
`examples/url-policy.mjs` 负责显示层的唯一筛选派生规则：basic 模式必须忽略 business/advanced 遗留的隐藏分组；非法、负数、非安全整数和越界页码只在显示时裁剪，不将旧参数意外 push 入历史栈。关键词移除控制字符并限制 80 个 Unicode 码点。它既不是 nuqs 适配器验证，也不是服务端 ACL。真正浏览器返回、IME、Tab URL 保留另做 E2E。
