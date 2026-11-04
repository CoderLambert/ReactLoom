# Floating UI 0.27.20｜定位、非模态焦点、IME 和剪贴板代际

Lab 锁定 `@floating-ui/react@0.27.20`（MIT）。它解决「浮层相对谁、如何躲开视口、打开时焦点怎么走」。菜单和弹层的完整组件可以先看 Radix 或 Base UI。只有定位和交互原语需要自由组合时再用本库。

没有逐库收据就不要写 PASS。Actions 41779873259 不是本条目的浏览器收据。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 使用真实的 `useFloating`、`autoUpdate`、`offset`、`flip`、`shift`、`useClick`、`useDismiss`、`useRole`、`FloatingPortal`、`FloatingFocusManager`。

- 参考按钮和浮层都只在 `open` 时挂上浮层。因此 `whileElementsMounted: autoUpdate` 是合适的：两边都在文档里时才跟踪位置。若改成隐藏而不卸载，要自己在 effect 里启动和停掉 autoUpdate。
- middleware：`offset(10)`、`flip({padding: 12})`、`shift({padding: 12})`。advanced 的 placement 是 `top-start`，其它是 `bottom-start`。实际用的是 hook 返回的 `placement`，不要自己缓存第一次的结果。
- `useRole(context, {role: 'dialog'})` 加上 `FloatingFocusManager` 的 `modal={false}` 和 `returnFocus`。这是非模态浮层：Tab 可以离开，不是焦点陷阱。不要把它写成模态对话框。
- 关闭走同一个 `setPopoverOpen(false)`，并在调用时同步 `++clipboardRequest`。Escape、外部点击和选择动作都因此作废进行中的剪贴板 Promise。不要等 `useEffect([open])` 才作废。
- business：[`business-policy.ts`](examples/business-policy.ts) 的 `toggleArticleAction` 改本地已读 / 稍后阅读；复制使用 `navigator.clipboard.writeText`，失败留在 `role="alert"`，成功才关闭。
- advanced：[`ime-guard.ts`](examples/ime-guard.ts) 在合成中、`isComposing`、`keyCode === 229` 或刚刚结束合成的那一次 Enter 时不提交。过滤作用于本地标题列表，草稿 `query` 和已提交的 `appliedQuery` 分开。

没有 VirtualElement，没有选区工具条，没有安全上下文以外的剪贴板降级。那些是下面的生产教学。

## 1. 数据流

```text
open / onOpenChange
        │
 useFloating + middleware
        │
 refs.setReference / setFloating + floatingStyles
        │
 useInteractions(click, dismiss, role)
        │
 Portal 把浮层挂到 body，FocusManager 在非模态下移动焦点并归还
```

定位结果不是业务状态。已读、过滤和「已复制」放在 React。浮层坐标不要写进 store。

## 2. 三层

### 基本：能躲开视口的 Popover

按钮是锚点。打开后浮层在 Portal 里，`offset` 留缝，`flip` 在放不下时换边，`shift` 把整块拉回视口并留 12px。确认按钮关闭并归还焦点。

动手：把窗口压矮，看 placement 是否变化。不要用固定 `top` 像素代替 middleware。

### 业务：操作要改数据

稍后阅读和已读必须改 `article`，不能只改一句「已收藏」。复制成功才 `choose`。权限拒绝或没有 `clipboard.writeText` 时浮层保持打开，错误可读。

`clipboardRequest` 在关闭、卸载和下一次复制时递增。旧 Promise 只能在编号仍相等时写状态。

### 进阶：中文输入法

合成期间不要 `preventDefault` 以外的提交。Lab 的策略是：合成中和 keyCode 229 不应用过滤；合成结束把 `suppressNextEnter` 设为真，吞掉同一次 Enter；随后的 Enter 才提交。blur 且不在合成中时清除这个抑制。

这不能只靠 `useState` 里的布尔。React 可能批量处理 composition 事件，守卫放在 ref 上。

研究稿里的 VirtualElement（选中文字旁边的工具条）没有实现。要做的话，reference 是 `{ getBoundingClientRect }`，选区消失必须关掉浮层并 `autoUpdate` 停掉。不要把过期的矩形留在页面上。

## 3. 反例

### 反例 1：隐藏了还在 autoUpdate

元素卸掉之后继续 `autoUpdate` 会读到空矩形。条件挂载就用 `whileElementsMounted`。常驻 DOM 就在 cleanup 里停。

### 反例 2：Portal 当成焦点管理

Portal 只改变父节点。没有 FocusManager 时，焦点留在按钮后面，读屏也不知道对话框。Lab 两者都有，并且明确 `modal={false}`。需要陷阱时用真正的模态组件，不要把 `modal` 悄悄改成 true 又不处理滚动锁。

### 反例 3：外部点击和剪贴板各写各的

```tsx
onOpenChange: (next) => setOpen(next)
```

若作废逻辑在 effect 里，关闭和 Promise resolve 的顺序会反。在 `onOpenChange` 变成 false 的同步路径里递增代际。

### 反例 4：只看 isComposing

部分输入法在 Enter 时 `isComposing` 已经是 false，但 `keyCode` 仍是 229。守卫要同时看 ref、原生事件和 229。合成刚结束的那次 Enter 也不提交。

### 反例 5：两个浮层抢 Escape

和 cmdk 或 Radix 菜单叠用时，只允许一个所有者处理 Escape 和焦点。Lab 这一页只有一个浮层。

### 反例 6：点击即显示已复制

写入失败不能 `choose('已复制')`。没有剪贴板 API 就显示 alert，不要退回「假装成功」。

### 反例 7：过滤改的是另一份列表

草稿和已提交查询分开。应用之后列表必须变短或变回全文。只改浮层里的一行提示不算过滤。

### 反例 8：把交互结果存进 floatingStyles

样式是这一帧的定位。刷新后不应从坐标恢复「已读」。

## 4. 故障

| 现象 | 先查 |
| --- | --- |
| 浮层跑到左上角 | 参考元素是否还在；虚拟矩形是否为 0 |
| 滚动时不跟随 | `autoUpdate` 是否在两边都挂上时才运行 |
| 焦点出不去 | `modal` 是否被设成 true |
| 中文回车误提交 | ref 守卫和 keyCode 229 |
| 关闭后仍出现已复制 | 代际是否在同步路径递增 |
| 点外面关不掉 | `useDismiss` 的 outsidePress，以及是否有另一层 stopPropagation |

z-index 本示例写了 9999。生产环境用设计系统的层，而不是再加一位。

## 5. 组合

**阅读工作台**：文章状态在列表，浮层只发动作。Query 保存服务端已读时，乐观更新要能回滚，回滚不能依赖浮层还开着。

**选区工具条**：VirtualElement 加 DOMPurify 之后的纯文本。不要把选区 HTML 写进剪贴板。Lexical 或 React Aria 若也管焦点，先定谁听 Escape。

## 6. 练习

1. 快速点复制然后 Escape。不允许出现「已复制」。
2. 用中文输入法输入候选词并回车，列表不应被提交；再按一次 Enter 才提交。
3. 可选：用选区矩形做 VirtualElement。选区折叠时浮层关闭。

## 7. 证据

`ime-guard` 和 `business-policy` 的单测不是 Portal、焦点或剪贴板权限的证明。浏览器要看翻转、Escape、外部点击、IME 和卸载。没有收据保持 NOT_RUN。

## 8. 资料

- https://floating-ui.com/docs/react
- https://floating-ui.com/docs/FloatingFocusManager
- https://floating-ui.com/docs/autoUpdate
- https://github.com/floating-ui/floating-ui
