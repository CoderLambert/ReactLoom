# C19 nuqs — Agent 使用决策

**使用时机**：搜索、分页、排序、非敏感的展示状态需要在 URL 深链接中持久化。优先尊重现有 Router 状态模型；并非必须因为存在 nuqs 就在所有页面使用。

## 迁移代码和依赖
读取 `examples/example.tsx`，核心是 `nuqs` parsers、`useQueryState` 和当前路由对应的 `NuqsAdapter`。本例针对 TanStack Router 用 `nuqs/adapters/tanstack-router`，不能粘贴成 Next/React Router adapter；nuqs 2.10.1、MIT。运行 `examples/demo.tsx` 只是 Lab 展示出口。

## 需要保留的工程属性
- 参数命名空间不能覆盖宿主路由自己的 tab/example。
- 关键词 replace；用户明确翻页 push；不要让 IME composition 推动路由更新。
- parseAsInteger 允许语法收窄但并不负责上下限，后端参数仍做严格白名单与 ACL。
- 复杂页面先明确谁管理 search：TanStack Router validateSearch 或 nuqs；二者不要出现竞态双写。
- URL 不放 token、用户隐私、短期敏感数据，浏览器 history 可持久保存。

## 测试合同
Node 真正 import `nuqs/server` 完成 parser 断言；Chromium 确保深链接、刷新、浏览器 Back、Tab 保留、IME 与非法/越界参数都工作。server parser PASS 绝不等同浏览器适配器 PASS。当前无真实运行证据，NOT_RUN。

## 关联
TanStack Router 原生 typed search 是替代；D07 TanStack Query 管服务器缓存；C01 RHF 管输入草稿。官方 https://nuqs.dev/docs/adapters 。

一并迁移 `examples/url-policy.mjs` 与声明，避免隐藏 URL group 造成基础模式暗中过滤。当前越界页码仅钳制 UI，不强行规范化地址栏；生产 Router 的 search 所有权需要一致，不能在 render 内写历史栈。
