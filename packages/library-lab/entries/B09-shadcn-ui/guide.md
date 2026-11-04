# shadcn/ui｜源码归你，不是一个运行时包

shadcn/ui 是一套用 CLI 把组件源码复制进应用仓库的分发方式。`npm install shadcn` 得到的是开发工具，不是 `<Button>` 的运行时。复制之后，`npm update shadcn` 不会改写 `components/ui`。升级等于对上游 diff 做一次有审查的合并。

Lab 的按钮是**按公开写法手写的教学实现**，不是某次 `shadcn add button` 的 Registry 原文。它使用 Radix Slot，而不是 2026 年中之后新项目默认的 Base UI。不要把这份文件说成官方组件，也不要在它旁边再接一套 Base UI 的 `data-*` 选择器。

锁定版本：`class-variance-authority@0.7.1`、`@radix-ui/react-slot@1.5.0`、`clsx@2.1.1`、`tailwind-merge@3.7.0`。`cn` 在按钮文件里本地写成 `twMerge(clsx(...))`，不是后来独立发布的 `cn` 包。

没有逐库收据时不要写 PASS。Actions 41779873259 不是本条目验收。

## Lab 当前示例

- [`examples/ui/button.tsx`](examples/ui/button.tsx)：`cva` 变体 `default | secondary | outline | destructive`，尺寸 `default | sm | lg`。`asChild` 时根节点换成 `Slot`，否则是 `<button>`。`data-slot="button"`。焦点环是 `focus-visible:ring-2`，disabled 同时 `pointer-events-none` 和降低透明度。
- [`examples/example.tsx`](examples/example.tsx)：本地文章列表。basic 切换变体；business / advanced 选择后归档。
- [`examples/archive-policy.ts`](examples/archive-policy.ts)：只归档当前选中且尚未归档的 id；`isCurrentArchiveRun` 用 epoch 丢掉过期回调。切换 level 或卸载会增加 epoch 并清掉 timer。

没有 Dialog、Table、`components.json`、官方 CLI 流程，也没有服务端。归档只改这块浏览器内存。

## 1. 什么时候用

| 场景 | 建议 | 不要 |
| --- | --- | --- |
| 品牌要改组件内部结构 | 把源码放进仓库并自己回归 | 改完不测键盘和对比度 |
| 只要一套现成中后台 | Ant Design 或 Mantine | 用 shadcn 重写所有企业组件 |
| 菜单、弹层、焦点 | 选定 Radix、Base UI 或 React Aria 之一再包一层 | 自己重写 focus trap |
| 大表 | TanStack Table 或专用网格，皮肤可以用这套 token | 把无头 `<Table>` 当成企业网格 |
| 拖拽、动画 | dnd-kit、Motion | 用按钮 hover 冒充拖拽 |

开源核心多为 MIT，Radix 也是 MIT。第三方块、图标、字体和付费 Registry 另算。本 Demo 不下载这些素材。

## 2. 四个所有权

```text
CLI / Registry     只负责把文件写进仓库
        │
components/ui      应用拥有，改动要审查
        │
React 状态         选中、busy、文案
        │
服务端             真正的归档和版本号
```

`components.json` 是生成配置，不是运行时 store。选定 Base UI 之后，不能继续把 Radix 组件的类型和选择器当成同一套。文件进仓库后，CLI 版本号和组件内容是两件事。

Lab 故意停在 Radix Slot。官方文档现在同时存在 Radix、Base UI 和 React Aria 分支。新项目用 CLI 且不传基座时，默认可能已经是 Base UI。迁到那种输出之前，先 diff，不要假设 `asChild` 和 `Slot` 还在。

## 3. 三层

### 基础：Button

变体是 CVA 的闭集，不是任意字符串。`className` 走 `tailwind-merge`，后面的冲突类可以覆盖前面的，但不是任意 CSS 注入口。不要把用户输入拼进 `className`。

`asChild` 把属性和 ref 合并到**单个**子元素。包两个子节点会报错或丢掉行为。Slot 不会替你补 `type="button"`。

### 业务：归档一代人

`pendingArchiveIds` 去掉已经归档的 id，避免重复提交把计数算大。点击之后记下 epoch，超时回调里 `isCurrentArchiveRun` 为假就什么都不写。切换 Tab 必须让上一代失效。这是本地 `setTimeout`，不是 API。生产环境换成可取消的请求时，仍然要保留「这一代还是不是当前代」。

列表选择在 `busy` 时不改，避免归档集合和勾选集合分叉。

### 进阶：键盘和失败

disabled 必须真的不能按。焦点环在键盘聚焦时可见，鼠标点击不必一直留着环（`focus-visible`）。失败文案用文本，不靠颜色。本示例没有失败分支：定时器总会成功。你要补的是拒绝后恢复 busy、允许重试，并且过期的失败不能写到下一代。

## 4. 反例

### 反例 1：把它当 npm 组件库

```tsx
import { Button } from 'shadcn-ui'
```

没有这个稳定的运行时入口。从你仓库里的 `button.tsx` 导入。

### 反例 2：className 不用 merge

```tsx
<button className={buttonVariants({ variant }) + ' ' + className} />
```

`px-4` 和传入的 `px-2` 会同时留下。用 `twMerge`。

### 反例 3：asChild 包了片段

```tsx
<Button asChild>
  <>
    <a href="/a">A</a>
    <a href="/b">B</a>
  </>
</Button>
```

只放一个元素。链接按钮要保证名字、禁用和键盘都还在那个元素上。

### 反例 4：Radix 源码配 Base UI 选择器

```css
button[data-base-ui-pressed] { }
```

Lab 按钮只有 `data-slot="button"`。换基座时整份组件一起换，不要混。

### 反例 5：归档没有代际

```tsx
setTimeout(() => setArticles(archiveByIds(articles, selected)), 400)
```

闭包里的 `articles` 是点击时的快照还好，但卸载之后仍会 `setState`。用 epoch，卸载时加一。

### 反例 6：覆盖变体却不测对比度

`destructive` 是深底白字。改成浅黄底白字会过不了对比度。改 token 要连焦点环一起看。

### 反例 7：用 Button 做拖拽手柄

hover 位移不是拖放。键盘、抓取取消和放置目标用 dnd-kit 或 Pragmatic DnD。

### 反例 8：表格皮肤当成行模型

排序、分页、行 id 属于表格库。Button 和 class 只负责外观。

## 5. 组合

**Query + Zod**：按钮进入 busy，请求带 AbortSignal。409 显示字段错误，不把乐观归档当成已提交。generation 和 Query 的请求 id 对齐。

**TanStack Table + 虚拟列表**：表头和行高用这套 token，行身份用 table 的 row id。不要在 Button 里缓存行数据。

**MSW + Playwright + axe**：MSW 提供 200 / 422。Playwright 看键盘路径。axe 看名字和对比度。三者都不能证明 Registry 和你手里的文件字节相同。

## 6. 升级

1. 记下现在的基座（Lab 是 Radix Slot 1.5.0）。
2. 在空目录运行你选定版本的 CLI，看新按钮还是不是 Slot。
3. `git diff` 每一份复制进来的文件。不要整目录覆盖本地改过的焦点环和中文文案。
4. 回归：变体、disabled、asChild、键盘、对比度、归档代际。

官方若把 `cn` 抽成独立包，那是新的依赖决定。在你改 import 之前，Lab 仍是本地函数。

## 7. 练习

1. 给归档补一个失败：第一次拒绝，第二次成功。过期回调不能改下一代的文章。
2. 用 `asChild` 渲染一个链接，检查禁用时链是否还会导航。
3. 把按钮换到 Base UI 的官方输出时，单独开分支，列出删除的 Radix API。

## 8. 证据

`archive-policy` 单测不渲染按钮。浏览器要看变体、disabled、焦点环和卸载后的定时器。没有收据就保持 NOT_RUN。

## 9. 资料

- https://ui.shadcn.com/docs/components/radix/button
- https://www.radix-ui.com/primitives/docs/utilities/slot
- https://cva.style/docs
- https://github.com/dcastil/tailwind-merge
