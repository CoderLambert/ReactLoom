# shadcn/ui：拥有组件源码，也承担它的演进

产品需要一套符合品牌的按钮：同样的交互语义，不同的危险操作配色、尺寸和业务忙碌状态。shadcn/ui 采用源码分发方式，让团队把组件放进自己的仓库，阅读、定制并维护它。适合愿意管理设计系统的团队；如果更希望由上游统一维护整套企业组件，可比较 Ant Design 或 Mantine。选用源码分发的成本是后续 diff 合并、键盘行为、对比度和依赖更新都要有人负责。

本例运行的是 [`examples/ui/button.tsx`](examples/ui/button.tsx) 中的**原创教学组件**。它真实使用 CVA、Radix Slot、clsx 和 tailwind-merge，演示 shadcn/ui 的可拥有源码模式；没有执行官方 CLI，没有把该文件当作 Registry 原文。官方资料固定到提交 `8ab27715521cbd4f87ae6886cd989cbb678f6de7`，该提交的 CLI 包版本为 4.23.0，仅是资料版本。

## 一次调用怎样变成 DOM

```tsx
<Button variant="outline" size="sm" className="px-8">归档</Button>
```

1. `buttonVariants` 是 `cva` 创建的函数。它把基础类、`variant` 和 `size` 对应的类组合成字符串，TypeScript 从这份配置推导合法取值。
2. 本地 `cn` 执行 `twMerge(clsx(...args))`：clsx 处理条件片段，tailwind-merge 处理已知 Tailwind 工具类的冲突。调用方的 `px-8` 放在后面，会替换小尺寸里的 `px-3`；它不会解决所有自定义 CSS 或任意组合语义。
3. 默认根节点是原生 `<button>`，本例显式默认 `type="button"`，避免放进表单后意外提交。`disabled` 的行为由浏览器提供，类名只表达视觉状态。
4. `asChild` 时根组件改为真实 Radix Slot，属性合并到一个子元素。如果子元素是 `<a>`，结果保留链接语义，并不会额外包一层按钮。

源文件里的 `data-slot`、`data-variant` 和 `data-size` 方便检查实际输出。CSS 类是外观；选择、权限、归档请求和错误恢复属于页面状态，不应塞进通用 Button。

## 三个独立实验

### 1. 变体、尺寸与调用方覆盖

工程问题：同一份组件怎样提供受约束的外观，并允许业务局部调整？

选择“描边”和“小”，观察预览按钮以及下方实际 className。勾选“用 px-8 覆盖间距”，输出中应有 `px-8`、没有 `px-3`，按钮变宽。切换“危险操作”观察本例红色配色。点击或用键盘 Enter / Space 激活预览，计数增加；勾选“禁用预览按钮”后，原生 disabled 应阻止激活。键盘焦点环仍须在真实页面检查。

这不是预先写好的 class 示意：预览与输出都调用同一份 `buttonVariants` / `cn`。更换变体和尺寸不会创建新的事件或业务状态机。关键源码：[Button](examples/ui/button.tsx)、[页面](examples/example.tsx)。

### 2. 批量归档：失败保留选择，再重试

工程问题：按钮进入忙碌状态后，怎样让失败可恢复，避免重复归档或旧回调污染新状态？

1. 初始三篇文章中一篇已归档。勾选“React 工程工具精选”，按钮只计算尚未归档的选择。
2. 打开“模拟归档失败”，点击“归档已选 1 项”。处理中不能修改选择或失败开关。250ms 后出现明确失败，原文章与选择保留，忙碌结束。
3. 关闭失败开关并重试，成功后该篇变成已归档，选择清空，计数从 1/3 变为 2/3。
4. 恢复示例，重新选择后开始归档；点“取消本次归档”会保留文章和选择；点“恢复示例文章”则撤销本次操作并回到初始文章。

本地文章与 250ms 定时器是**业务 fixture**，没有 HTTP 服务或服务端持久化。`pendingArchiveIds` 从当前已知、未归档文章取不可变 ID 快照，`archiveByIds` 只更新这些 ID。每次取消/重置使 operation epoch 增加，定时回调只有仍属于当前代才写状态；卸载同时清除自己的 timer。接真实服务时，保留当前代检查，增加请求取消、服务端鉴权和幂等约束；单靠 disabled 不能保证服务端只执行一次。

关键源码：[归档策略](examples/archive-policy.ts)、[失败/取消/重试](examples/example.tsx)。失败开关的取值在启动本轮时捕获，不能在处理中改变已经发出的结果。

### 3. Slot 链接与原生禁用

工程问题：看起来像按钮的链接，应该怎样保留导航与权限语义？

“打开示例详情”由 `<Button asChild><a href="#b09-slot-target">...</a></Button>` 生成。检查 DOM：只有一个 `<a data-slot="button">`，没有嵌套 button。Tab 可聚焦，Enter 使用浏览器原生锚点导航，URL 的 hash 变为 `#b09-slot-target`；Space 保持链接的原生行为，不要求它像按钮一样触发。

取消“允许打开示例详情”，应用改为无 href 的 `<span aria-disabled="true">` 说明节点，不再提供可聚焦导航。“原生禁用按钮”则是真 button 的 disabled。`aria-disabled` 只表达状态，本身不会阻止带 href 的链接导航；因此本例不用 `<a disabled>` 伪装禁用。外部官方文档链接保留新页打开及 `noopener noreferrer`。

本例 Slot 接收单个元素。Radix 会合并 class、style、ref 和事件；具体属性优先级看匹配版本实现，不能把“子组件必须传递 props/ref”省略成任意 React 组件都自动兼容。

## 本地源码与固定上游的差异

[固定上游 Radix 风格 Button](https://github.com/shadcn-ui/ui/blob/8ab27715521cbd4f87ae6886cd989cbb678f6de7/apps/v4/registry/new-york-v4/ui/button.tsx) 是对照资料，未覆盖本地文件：

| 项目 | 本例 | 固定上游文件 |
| --- | --- | --- |
| Slot / cn 导入 | `@radix-ui/react-slot`、本地 `cn` | `radix-ui`、`cn` 包 |
| 外观 | 原创 emerald / red 配色 | primary / destructive 等主题 token |
| variant | default / secondary / outline / destructive | 另有 ghost / link |
| size | default / sm / lg | 另有 xs 与多种 icon 尺寸 |
| 原生 type | 本例默认 button | 由调用方/原生默认值决定 |

这是一个已核实文件的差异，不推断所有 Registry、所有基座或未来 CLI 默认值。官方页面提供多个基础实现入口；选定输出后应整份评审其类型、样式和交互。升级 CLI 与修改已复制组件是不同操作；上游变化需与本地定制做差异合并。

## 迁入 Vite React 项目

```sh
pnpm add class-variance-authority@0.7.1 @radix-ui/react-slot@1.5.0 clsx@2.1.1 tailwind-merge@3.7.0
```

复制 `examples/ui/button.tsx` 即可使用基础 Button；完整实验还需要 `examples/example.tsx`、`examples/archive-policy.ts` 和 `examples/workshop.css`，保持相对目录。`demo.tsx` 只是 Lab 适配出口。目标项目需 React 19、Tailwind CSS v4，入口全局 CSS 引入 Tailwind 并扫描这份组件源码；不需要为了这份手写实现额外生成 components.json。

`workshop.css` 提供布局，并针对 Lab 的通用按钮样式使用作用域内 `revert-layer`，让 Tailwind 工具类不被宿主未分层的 background/padding/font 等规则覆盖。迁入只有 Tailwind preflight 的项目时可以删除这一段宿主适配；其余样式都限定在 `.b09-workshop`，不会改其他条目。按钮颜色和间距的来源仍是 Button 的实际类配置，没有再维护一套变体 CSS 表。

需要官方 CLI 工作流时，在独立、可审查的工程中按固定版本的官方说明选择基座/风格与路径，再检查新增文件和依赖。本页没有执行安装、生成或覆盖目标项目；官方 CLI README 原文是流程参考，不能作为本例生成记录。目标应用中组件的导入来自自己的源码路径。

## 维护时保留什么

- 变体配置与调用方覆盖顺序：定制配色后同时看焦点与对比度，避免只改截图。
- 原生节点语义：真实 disabled、明确 type、单个 Slot 子元素，以及无权限时实际撤销导航能力。
- 归档所有权：选中 ID 快照、失败保留、busy 恢复、epoch 检查与本 timer 清理。不要清理其他页面的资源。

CVA 的许可是 Apache-2.0，Radix Slot、clsx、tailwind-merge 与 shadcn/ui 为 MIT；本例使用原创文章与文本。额外 Registry、图标、字体和第三方素材需按其来源另核对。

## 官方资料与运行边界

“官方 README”展示 `shadcn-ui/ui` 的 `packages/shadcn/README.md` 英文原文，固定提交对应 CLI 4.23.0；已实际检查目标包及根目录的 README 候选，没有官方中文版本。原文摘要、同步日期、来源和适用范围记在条目元数据与官方证据文件中。官网 GET 返回 200，完整响应头未见 X-Frame-Options / frame-ancestors，但尚未从 Lab origin 验证 iframe，因此保持 unknown 和直达入口。

本地定向检查把实际 Button 源码在内存中转为 JS，真实运行 CVA/Slot/clsx/tailwind-merge 并做 React SSR；策略测试只验证归档 helper。它们不能证明键盘事件、视觉排版、异步失败恢复和卸载计时器已经在浏览器通过，也不能证明 CLI 生成一致性。正式收据状态与本轮局部结果分别记录，不借用其他库或旧 CI 的通过。
