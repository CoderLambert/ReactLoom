# axe-core：自动化发现可访问性问题，但不能替代人的体验

## 用途与安装

axe-core 是针对真实 DOM 的开源 WCAG/最佳实践规则引擎，适合组件库、业务页面、设计系统与 CI 的基础可访问性门槛。它不是一个 React 组件库，也不是替开发者完成焦点流、键盘操作、屏幕阅读器和人工感知测试的工具。

```bash
pnpm add -D axe-core@4.14.0
```

Demo 用 `examples/example.tsx` 真实调用 `axe.run(container,{runOnly:{type:'rule',values:['image-alt','label','button-name']}})`。这里故意限定 3 条规则，仅测试当前局部 DOM；不会扫描网站所有分区，也不会把“本次没有 violations”宣称整个网站无障碍合规。

## 三层运行示例

**basic**：透明示例图片没有 alt，运行审计后展示真实 axe 违反项。勾选修复版会为图片提供准确的 `alt`，再运行比较结果。装饰性图片应使用空 alt，而不是无 alt 属性。

**business**：RSS 输入框的可见文字故意只用 `span`，未与 `input` 关联。修复版使用 `<label htmlFor=...>` + 稳定 `useId()`。`placeholder` 不能替代可靠的字段标签；提交错误也需要可读提示。

**advanced**：叠加图片alt、label、按钮名称缺失，获取每条违反规则的 target/impact/description。修复后重新审计，注意状态变化期间避免重入同一个axe扫描；仍可能存在 `incomplete` 或在其他WCAG规则中发现的问题。

## 核心 API 和证据

`axe.run(context,options)` 的context可以是DOM元素、选择器或包含include/exclude的范围。结果中的 `violations` 表示特定规则检测失败；`incomplete` 表示不能确定需要人工核对；`passes` 不是产品全功能通行证。正式环境通常用 `@axe-core/playwright` 在真实Chromium中对多个状态与路径分别运行，结合手工键盘/屏幕阅读器检查。

## 生产最佳实践

- 在关键业务状态和弹窗打开后的DOM上运行，不只扫描静态首页。
- 断言具体规则失败/通过和元素，不依赖完整HTML快照。
- 常见自动化盲点：焦点顺序、复杂ARIA交互、动态错误播报、触屏操作和目标大小的人工判断。
- 避免将生产敏感字段、内部文档或访问令牌写入外部报告；axe-core本体在本地运行，CI产物仍受访问控制。
- 失败规则应当修复生产标记和组件语义，不要通过 `runOnly` 或规则忽略来隐藏已知问题。
- 本演示中的故意不合规DOM只存在教学容器，**不可直接复制进生产组件**。

## 常见误区

- 把零 violations 说成100% WCAG合规。
- 在尚未渲染到DOM的React组件上运行axe。
- 让aria-label覆盖有效可见名称而不顾用户预期。
- 对可访问性测试采用颜色/截图相似度作为唯一断言。
- 用jsdom的局限为所有浏览器情况做结论。

## 验证与来源

需实际浏览器运行三层：缺陷版出现对应rule，修复版目标规则消失，其他区域不被误扫，点击快速切换不触发重叠运行。当前SDK/浏览器未执行，verification未标PASS。官方 [axe-core](https://github.com/dequelabs/axe-core) · [API](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md)。许可证MPL-2.0，作为浏览器依赖使用时须遵守许可及第三方依赖条款。

## 并发审计与场景生命周期（EF wave17）

axe-core 同一实例不允许并发 `axe.run`，两张并排 Demo 或切换 level 时很容易触发 `Axe is already running`。本条目新增同源 `examples/audit-queue.mjs` 将本演示内的扫描排队；`isCurrent` 在队列轮到任务之前检查当前 DOM 是否仍挂载与本次 token 是否有效，旧请求直接跳过而不会启动新的 axe 扫描。Promise 拒绝不会阻断后续任务。

React 外层使用 `key={level}` 让不同难度各有独立会话，卸载时废弃 token；调用中按 `running` 同步门禁阻止双击。**正在执行的 axe.run 无法被这段队列取消**，其他独立导入 axe-core 的应用也不在此序列化边界内；不要在不同应用之间推断全局互斥。

纯逻辑可运行：`node --test packages/library-lab/entries/F17-axe-core/examples/audit-queue.test.mjs`。它仅测排队、跳过与故障恢复，不导入 axe-core，**不是目标 SDK 或浏览器 PASS**。真正需要用 Chromium 验证两实例同时点击、level 快速切换、规则变化、CSP 和真实 `axe.run` 结果。
