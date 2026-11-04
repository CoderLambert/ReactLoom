# B18 cmdk：命令菜单、分组与输入法

`cmdk` 是无样式的命令菜单原语：输入、过滤、分组、高亮和选择。它不是搜索引擎、权限系统或已经画好的产品面板。Library Lab 固定 `cmdk@1.1.1`，宿主 React 19.3.0。许可证 MIT。导入 `import {Command} from 'cmdk'`。官方 1.x 使用 React 内置的 `useSyncExternalStore`，peer 覆盖 React 18/19。它不是 Server Component，也不是 React Native 组件。

`Command.Dialog` 底层用 Radix Dialog 做门户和焦点。自定义容器、Escape 和滚动锁仍要在浏览器里看。1.1.1 修过输入法组词期间快捷键重复触发；这不等于你自己写的全局热键自动安全。Lab 仍在应用层拦了一层。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。纯函数是 `examples/keyboard-policy.ts` 和 `examples/command-state.ts`。没有 Mock 服务器，没有 2000 条虚拟列表，没有 `shouldFilter={false}` 的远程搜索。

已挂载：

- `basic` / `business`：内联 `Command`，`label` 写明用途。`Command.Input` 受控。`Command.List` 必须存在。两组：阅读、管理。basic 只渲染阅读组。
- 每项有稳定 `value`（用中文 label）、`keywords`、禁用的「删除所有订阅」。`onSelect` 走 `applyDemoAction`，改本地文章：稍后阅读可切换、已读只进不退、引用是固定字符串、刷新只加计数。不写剪贴板，不发请求。
- advanced：按钮 `aria-haspopup="dialog"`。`Command.Dialog` 受控 `open`。document 的 keydown 只在 advanced 注册，cleanup 移除。
- `shouldTogglePalette`：Ctrl 或 Meta 加 `k`，不要 Shift/Alt，不要 `isComposing`，不要 keyCode 229。面板已开时允许关闭；未开时若焦点在 input、textarea、select 或 contentEditable 上则不抢。
- `shouldSuppressCommandEnter`：组合中、组合刚结束的 pending、`isComposing` 或 keyCode 229 的 Enter 都 `preventDefault` 并停止传播。keyup 的 Enter 才清掉 pending。blur 时两者都清。
- 选中后清空查询。advanced 关闭对话框并用 `queueMicrotask` 把焦点还给触发按钮。
- 切换 level 重置文章、查询、文案和打开状态。
- 危险项 `enabled: false`，`select` 再拒绝 `delete`。

未挂载：`Command.Loading`、服务端分页、`shouldFilter={false}`、虚拟滚动、嵌套命令页、剪贴板 API。官方对两三千项有经验描述，那不是本页的基准。大列表应自己裁剪后再渲染，cmdk 不会虚拟化。

## 什么时候使用

适合后台命令面板、少量命令的键盘选择、需要分组又不想手写 `aria-activedescendant`。不适合：必须虚拟滚动的巨大候选、React Native、希望零 CSS 的成品皮肤、或把命令执行当成鉴权。UI 点了删除，服务端仍要拒绝。Lab 直接禁用了删除。

## 模型

```text
Input 文本（查询）
  ≠ Item 的 value（选中身份）
过滤：默认 filter(value, search, keywords)
List 按 DOM 顺序移动高亮
onSelect → applyDemoAction → 文章 fixture
Dialog 只在 advanced，负责门户和焦点
```

`value` 在 1.0 起区分大小写但仍会 trim。不要靠 `textContent` 推导 id。Lab 的 value 是可见标签，keywords 覆盖「收藏」「refresh」等词。空状态文案是「没有匹配命令」。

全局快捷键不是 cmdk 的全部。Lab 的监听在捕获阶段之外的 document keydown，并且会避开正在编辑的控件。

## 三层渐进

### Demo ① 内联阅读命令（已挂载）

上下键移动，Enter 执行。稍后阅读来回切换，status 和下面的文章卡同步。管理组不出现，避免第一层同时处理禁用项。

### Demo ② 工作台（已挂载）

刷新增加计数。生成本地引用只改 `citation` 字段。标记已读是单向的。删除项可见但禁用，选不中。

### Demo ③ 对话框（已挂载）

按钮或 Ctrl/Cmd+K 打开。在别的输入框里按同一组合不应打开。面板打开后同一组合关闭。中文候选上的 Enter 不执行当前高亮命令。关闭后焦点回到按钮。

未挂载的生产搜索：`shouldFilter={false}`，由服务端排序和裁剪，前端只渲染一页。不要默认过滤再叠加服务端过滤。429/503 用 `Command.Empty` 或旁路 `role="alert"` 说明，而不是空列表假装没有命令。加载态用 `Command.Loading`，本文件没有这个零件。

## 反例

```tsx
// 错：没有 List，或把查询 state 当成 Item value
<Command>
  <Command.Input value={selectedId} />
  <Command.Item>新闻</Command.Item>
</Command>

// 对：Input 受控查询；Item 另有 value；List 包住项
```

```tsx
// 错：全局 Ctrl+K 在任何输入框都 preventDefault
document.addEventListener('keydown', event => {
  if (event.key === 'k' && event.metaKey) open();
});

// 对：shouldTogglePalette(event, editable, open)，并且 cleanup
```

```tsx
// 错：composition 期间 Enter 触发 onSelect
onKeyDown={event => { if (event.key === 'Enter') run(); }}

// 对：shouldSuppressCommandEnter，含 keyCode 229 和 pending 的一次 keyup
```

```tsx
// 错：onSelect 里无条件执行危险命令
onSelect={() => deleteAll()}

// 对：disabled，处理函数再拒绝 id === 'delete'
```

```tsx
// 错：把 toast 或命令面板当成文章是否已读的唯一记录
// 对：applyDemoAction 更新 fixture，面板只是入口。status 复述结果
```

```tsx
// 错：两千条 Item 全挂上，再谈「cmdk 很慢」
// 对：裁剪或虚拟化，并关闭内建过滤如果数据已在外部排好
```

```tsx
// 错：Dialog 关闭后焦点丢在 body
// 对：Lab 在关闭后把焦点还给 trigger。microtask 等关闭提交
```

`forceMount` 会让被滤掉的项仍参与渲染策略，不要随便加。Group 在筛选后可以隐藏而不是卸载整个组；依赖这个行为时要在浏览器里看标题是否还在。

## 组合

**cmdk + 路由**：`onSelect` 里导航，然后关闭面板。权限不够就不要渲染该项，而不是选中后再 403。Lab 没有路由。

**cmdk + Query**：查询键包含搜索词。`shouldFilter={false}`。过期请求用 signal。不要把命令列表再复制进 Zustand。

**cmdk + 剪贴板**：若产品需要复制，用 Clipboard API 并处理拒绝；不要像危险演示那样写「复制成功」却没调用 API。Lab 的「生成本地引用」故意不碰剪贴板。

样式在组件内的 `<style>`，选择 `[cmdk-item][data-selected=true]` 等属性。不要依赖 DOM 序号。焦点环在 input 上用 `:focus-visible`。

## 生产清单

- 每个 Command 有 `label`，输入有 `aria-label`。
- 危险命令禁用，并且处理函数再判断。
- 快捷键不抢编辑控件，除非面板已经打开需要关闭。
- IME 的 Enter 不执行命令。
- 监听在卸载和离开 advanced 时移除。
- 选中结果写进可访问的 status 和可见数据，不单靠高亮行。
- 大列表限制渲染数量。
- 不把 1.1.1 的快捷键修复当成所有自定义热键的证明。

## 升级

1.0 起 `value` 大小写敏感、List 必填、aria 属性值有变。1.1.x 的 IME 修复仍要保留应用层守卫，因为业务快捷键是自己注册的。升级后回归：内联与 Dialog、禁用项、中文输入、Ctrl/Cmd+K 在输入框内的行为。

## 验收

basic：选择「稍后阅读」切换布尔；再次选择再关掉。business：刷新计数加一；删除项不能选。advanced：在命令输入里组字时 Enter 不执行；在页面其他输入框按 Ctrl/Cmd+K 不打开；面板打开时该组合关闭并回焦。切换 level 后文章回到初始。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成 cmdk PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B18 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B18-cmdk/tests/keyboard-policy.test.mts packages/library-lab/entries/B18-cmdk/tests/command-state.test.mts
```

断言快捷键守卫、Enter 抑制、文章动作的纯函数。不证明 Radix Dialog 焦点或中文候选窗。

## 官方资料

- https://github.com/dip/cmdk
- https://github.com/dip/cmdk/blob/main/ARCHITECTURE.md
- https://github.com/dip/cmdk/releases/tag/v1.1.1
- https://github.com/dip/cmdk/blob/main/LICENSE.md
- https://www.npmjs.com/package/cmdk
