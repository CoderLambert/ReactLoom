# B11 Radix Dropdown Menu：键盘、门户与菜单状态

Radix Primitives 是无样式的交互零件：焦点、键盘、typeahead、ARIA 和 Portal 由库实现，外观由项目 CSS 实现。它不是数据层，也不是完整的后台组件套件。Library Lab 这一条只固定 `@radix-ui/react-dropdown-menu@2.1.25`，宿主 React 19.3.0。许可证 MIT。不要把官方统一包 `radix-ui` 的 `import {Dialog} from 'radix-ui'` 写进当前文件来「补齐」原研究稿里的对话框——那是另一个依赖，本条目没有挂载。

样式在 `examples/dropdown.css`。业务排序和删除守卫在 `examples/feed-policy.ts`。菜单打开与否是 UI 状态；订阅列表、置顶、筛选和排序是 React 状态。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。没有 `Intro.tsx` 的 Dialog/Tooltip，没有 `AlertDialog`，没有 Mock HTTP，没有 `127.0.0.1`。

已挂载：

- `DropdownMenu.Root` 受控：`open` / `onOpenChange`。触发器 `asChild` 包着真实 `<button type="button">`，避免按钮套按钮。
- `Portal` + `Content`，`align="start"`，`sideOffset={8}`，`aria-label="订阅操作"`。
- 所有层都有普通 `Item`：查看详情、本地重命名。重命名只改当前选中频道的标题字符串。
- `business` 和 `advanced`：`CheckboxItem` 置顶，`onSelect` 里 `preventDefault`，避免勾选后菜单立刻关掉。`RadioGroup` 在 `new` 与 `popular` 之间切换。`ItemIndicator` 显示 ✓ 或 ●。
- `advanced`：`Sub` / `SubTrigger` / `SubContent` 再包一层 Portal。筛「未读」「有收藏」，以及恢复全部。删除项在锁定或没有当前频道时 `disabled`。`deleteFeed` 在 `locked` 时返回原数组的拷贝。
- 频道按钮使用 `aria-pressed`。空筛选有一句说明。底部 `role="status"` 报菜单开关、置顶、排序、筛选和最后动作。
- 文案写明：不要自己写全局 keydown 或焦点陷阱。方向键、Enter、Esc、typeahead 交给 Radix。

`visibleFeeds` 先按 scope 过滤，再把置顶排到前面，然后按热度或更新时间，最后用 id 做稳定次序。删除当前项后，选中 id 改到列表里另一个仍在的频道（用删除前的数组查找），置顶集合去掉该 id。

未挂载、仍要教的原语：`Dialog`、`AlertDialog`、`Tooltip`、`Slot` 的自定义叶子组件。异步删除确认、409/503、IME 输入、焦点在触发器已被移除时的回退，都不在这个文件里。不要把菜单 `onSelect` 说成已经等待服务端成功。

## 什么时候使用

适合设计系统要自己画外观，但需要菜单、对话框、弹出层的键盘和焦点。不适合：想要现成表格和表单皮肤（B06/B07/B08）、或要更完整的国际化行为集合（评估 B12）。一个原生 `<select>` 就能完成的三选项，不必先上菜单。

Radix 不管订阅是否真的存在于服务器。`onSelect` 只适合同步的本地选择。危险操作要另有确认，并且失败时确认框还在。

## 模型

```text
Root（open）
  Trigger（asChild → button）
  Portal
    Content
      Item / CheckboxItem / RadioGroup / Sub
业务 setState 在 onSelect 或 onCheckedChange
feed-policy 决定删除是否生效、列表如何排序
```

Portal 把 DOM 挂到别处，React Context 还在。CSS 的 `position: fixed`、层叠和滚动容器要自己看。`data-state`、`data-highlighted`、`data-disabled` 是样式钩子，不是业务数据库。

`asChild` 把 props、ref 和事件合并到子节点。子节点必须把它们转到真实 DOM。丢掉 `onClick` 的包装按钮看起来能渲染，键盘打开会失效。

## 三层渐进

### Demo ① 基础菜单（已挂载）

打开「更多操作」。两项本地动作改 status。Esc 应关闭并回到触发器——这是库的职责，需要浏览器确认，policy 测试看不到。basic 不渲染置顶和子菜单，避免第一层同时学三种 item。

### Demo ② 置顶和排序（已挂载）

勾选「收藏置顶」后，频道按钮前出现星号，`visibleFeeds` 把该 id 排前。再点一次取消。排序单选不关闭菜单（RadioItem 的默认行为以当前版本文档为准；Lab 对 CheckboxItem 显式 `preventDefault`）。热度优先按 `heat`，最新优先按 `updated`。

### Demo ③ 子菜单、筛选和禁用（已挂载）

「更多筛选」打开子内容。只看未读会留下 `unread > 0` 的频道，并把选中项改到过滤结果的第一个。没有结果时显示空文案，菜单标签变为「无频道」。锁定删除后，危险项禁用，`onSelect` 再判断一次 `locked`。即使有人去掉 disabled，`deleteFeed` 仍不删。

未挂载的生产路径：删除先打开受控 AlertDialog；请求成功才 `setOpen(false)`；503 时留在框里并显示错误。`AlertDialog.Action` 默认一点就关，所以异步危险操作不要用会立刻关闭的 Action 当作唯一按钮。焦点：若原触发按钮已经从列表消失，关闭时检查 `isConnected`，否则回到工具栏上仍在的按钮。Lab 的删除是同步的，没有这条回焦。

## 反例

```tsx
// 错：包装组件吞掉 Radix 注入的 props 和 ref
const BadButton = () => <button type="button">更多</button>;
<DropdownMenu.Trigger asChild><BadButton /></DropdownMenu.Trigger>

// 对：Lab 把 asChild 用在会展开 props 的原生 button 上
<DropdownMenu.Trigger asChild>
  <button type="button" className="rl-radix-trigger">更多操作 ▾</button>
</DropdownMenu.Trigger>
```

若必须封装，用 `forwardRef` 并把 props 展开到 `<button>`。React 19 的 ref-as-prop 仍要把调用方传入的 ref 和事件留在 DOM 上。

```tsx
// 错：Trigger 里再套 button，得到 button > button
<DropdownMenu.Trigger><button type="button">打开</button></DropdownMenu.Trigger>

// 对：asChild 合并成一个 button，或使用 Trigger 自己的默认按钮
```

```tsx
// 错：自己监听 document keydown 做焦点陷阱，和库的 Dismissable Layer 打架
useEffect(() => {
  document.addEventListener('keydown', trap);
}, []);

// 对：不注册这套监听。Lab 的 advanced 说明文字就是这个约束
```

```tsx
// 错：CheckboxItem 一选中菜单关闭，用户无法连续改置顶
<DropdownMenu.CheckboxItem checked={pinned} onCheckedChange={setPinned} />

// 对：onSelect 里 preventDefault，状态走 onCheckedChange
```

```tsx
// 错：删除只看菜单文案，锁定后仍改数组
onSelect={() => setFeeds(feeds.filter(feed => feed.id !== selectedId))}

// 对：disabled，并且 deleteFeed(feeds, id, locked) 在 locked 时返回拷贝
```

```tsx
// 错：AlertDialog.Action 里发请求，框已经关了，409 无处显示
<AlertDialog.Action onClick={() => api.delete(id)}>删除</AlertDialog.Action>

// 对：受控打开；成功才关闭。当前示例没有 AlertDialog，不要假装有
```

```tsx
// 错：Title 用视觉上的 div，对话框没有名字
<div className="title">删除订阅</div>

// 对：Dialog.Title。不想显示时用官方的视觉隐藏，不要 display:none 把名字从可访问树里拿掉
```

Dialog 与菜单的焦点转交要实测：从菜单项打开对话框时，菜单会关，焦点应进入对话框，关闭后再找得到的触发器。Lab 没有这第二层。

中文输入：本菜单没有文本框。若菜单触发器旁边有搜索框，组合期间不要用全局快捷键把菜单打开又关掉。不要在 `onChange` 里 trim 正在组合的拼音。

## 组合

**Radix + 自有 CSS**：用 `data-highlighted` 和 `data-disabled`，不要依赖「第 n 个子 div」。`dropdown.css` 是本条目的全部皮肤。焦点环保持可见。

**Radix + TanStack Query**：菜单项调用 mutation，成功后失效列表。失败留在可访问的 status 或对话框里。不要在 `onSelect` 里乐观删掉一行又不处理 409。Lab 的删除是本地数组。

**Radix Dialog + Motion**：Dialog 拥有 Portal 和焦点；Motion 只动画 Content。`forceMount` 若为了 exit 动画留着节点，请求的 abort 仍要在业务 effect 里发生，不能等 DOM 消失。

**不要**用一个 Dropdown 模拟 Select 的表单值提交，除非你把值放进真正的隐藏 input 或受控状态并在提交时读取。Lab 的排序在 React state，不在 FormData。

| 零件 | 主人 | 当前是否挂载 |
| --- | --- | --- |
| 菜单键盘、typeahead、子菜单 | 本包 | 是 |
| 复选与单选指示 | 本包 + feed-policy 排序 | 是 |
| 模态焦点陷阱 | Dialog（未安装） | 否 |
| 异步危险确认 | AlertDialog（未安装） | 否 |
| 补充说明 | Tooltip（未安装） | 否；业务标签必须可见 |

## 生产清单

- 触发器是单个原生按钮，有可访问的名字。
- 危险项可禁用，并且数据层再拒绝一次。
- 勾选类菜单项不要在用户还想继续改时被关掉。
- 子菜单有自己的 Portal，`sideOffset` 避免贴边无法点击。
- 空列表有文字，而不是只剩一个空菜单。
- 不使用 `dangerouslySetInnerHTML` 渲染频道标题。
- 缩放和窄屏下 Content 不要超出视口却无法滚动。官方碰撞策略仍要在浏览器里看。
- 减少动画：不要给菜单加长时间的位移。功能不依赖动画完成回调。

## 升级

2.1.25 使用 `@radix-ui/react-dropdown-menu` 的具名零件。若仓库别处已改用统一包 `radix-ui`，两条导入不要混在同一个组件里。升级时回归：受控 `open`、`asChild`、CheckboxItem 的 `preventDefault`、Sub 的两层 Portal、`disabled` 项不能 `onSelect`。Dialog 的 API 变化不由这个锁文件覆盖。

## 故障排查

| 现象 | 检查 |
| --- | --- |
| 点击触发器没反应 | asChild 子节点是否丢了 onClick/ref；是否嵌套了两个 button |
| 置顶后菜单立刻关闭 | CheckboxItem 的 onSelect 是否 preventDefault |
| 锁定后仍被删除 | 是否只写了 disabled，数据函数没有 locked 判断 |
| 筛选后选中幽灵频道 | 是否在过滤后重设 selectedId；空列表标签是否变成「无频道」 |
| 子菜单出不来或被裁 | SubContent 是否在 Portal 里；overflow 祖先 |
| 自己写的 Esc 监听和菜单冲突 | 删掉文档级 keydown |
| 关闭后焦点丢了 | 触发按钮是否已被卸载；需要回退目标。Lab 的触发器一直在 |
| 读屏不知道菜单名字 | Content 是否有 aria-label |

## 未挂载原语的生产写法

当前锁文件只有 Dropdown Menu。下面的 Dialog 片段是迁移教学，**不要**加进 `example.tsx`，除非 `library.json` 增加对应包并重测。

```tsx
// 错：按钮套按钮
<Dialog.Trigger><button type="button">打开</button></Dialog.Trigger>

// 对：asChild 合并成一个按钮，子组件必须转发 ref 和 props
<Dialog.Trigger asChild>
  <button type="button">打开</button>
</Dialog.Trigger>
```

```tsx
// 错：AlertDialog.Action 一点就关，503 回来时框已经没了
<AlertDialog.Action onClick={() => api.delete(id)}>删除</AlertDialog.Action>

// 对：受控 open；请求成功才关闭；失败留在框内并保持焦点
```

对话框必须有 `Dialog.Title`。不想看见标题时用官方的视觉隐藏，不要 `display:none`，否则可访问名称一起消失。没有描述时按该版本文档处理 `aria-describedby`，不要留一个空描述让读屏读出空白。

从菜单打开确认框时，菜单会关。若触发这条菜单的按钮已经随列表项卸载，关闭确认框前检查焦点目标 `isConnected`，否则回到仍在树上的工具栏按钮。Lab 的「更多操作」按钮一直挂着，所以没有这条回退；一旦删除改成异步并卸掉触发器，就要补上。

Tooltip 只能补充，不能代替按钮名字或错误文案。`Tooltip.Provider` 的延迟是视觉策略，业务状态仍在 `feed-policy`。

中文输入不在菜单内部。若旁边有搜索框，全局快捷键必须忽略 `isComposing` 和 keyCode 229，避免选词 Enter 把菜单打开。不要在 `onChange` 里 `trim` 正在组合的拼音。本文件没有搜索框。

`forceMount` 可以让退出动画留着节点，但删除请求的 abort 不能等节点消失。Portal 仍在 React 树里，Context 还在；被 `overflow: hidden` 的祖先裁切时，把 Content 留在 Portal，而不是为了「好定位」关掉 Portal。

类型检查要覆盖 `onSelect` 的事件对象是否仍有 `preventDefault`。升级 2.1.x 时回归：受控 `open`、子菜单两层 Portal、禁用项不触发删除、CheckboxItem 不会在一次勾选后把菜单关掉。

组合 Query 时，`onSelect` 只发起 mutation。409 用服务端列表替换本地 `feeds`，不要在菜单回调里乐观删掉一行后又让过期响应当成成功。Lab 的 `deleteFeed` 是同步纯函数，没有乐观网络。

## 键盘预期（库的职责，浏览器仍需看）

打开：触发按钮 Enter 或 Space。菜单内：上下方向键移动高亮，Enter 选择，Esc 关闭并应回到触发器。子菜单：右方向或 Enter 进入「更多筛选」，左方向或 Esc 回到父菜单。typeahead 按标签文字跳转。这些是 Radix Dropdown Menu 的模型，Lab 没有自己的 keydown 实现。policy 测试不能代替这次浏览器观察。

CheckboxItem 保持打开是为了连续改置顶。若升级后 `preventDefault` 不再阻止关闭，要先看 2.1.25 的事件顺序，而不是再包一层 `stopPropagation` 把键盘选择弄坏。

RadioGroup 的值只有 `new` 和 `popular`。`onValueChange` 把其他字符串收成 `new`，避免把任意字符串写进排序状态。

## 数据所有权

`visibleFeeds` 不修改入参数组。置顶是 id 集合，不是把频道对象上的布尔写进排序比较时顺手 mutate。删除返回新数组；锁定时返回拷贝，调用方即使忘记看 `disabled` 也不会少一行。选中 id 在删除后改到另一条仍存在的频道，避免菜单标题停在已删除的名字上。

重命名只改当前 id 的 `title`，不改 id。热度和更新时间是 fixture 字段，菜单不提供编辑它们的入口。若产品以后要改热度，那是另一条业务命令，不要塞进 RadioItem 的排序切换里。

空筛选时频道按钮区有一句说明，菜单标签用「无频道」。此时查看详情和重命名应无效果：重命名的 `onSelect` 在没有 `selectedFeed` 时 return。删除项同时 `disabled`。

typeahead 是库的能力：焦点在菜单内时按字符跳到匹配项。Lab 的 CSS 不阻止它。不要再写一套 keydown 去「优化」中文首字母，那会和库冲突，也会在 IME 下误触发。

## 验收

basic：Enter/Space 打开，Esc 关闭，两项动作只改 status。business：置顶改变列表顺序且菜单可保持；排序单选改变 `heat` / `updated` 次序。advanced：未读筛选不会留下 0 未读；锁定时删除项不可用，策略函数也不删；显示全部能恢复。没有自制全局键盘监听。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成 Radix PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B11 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B11-radix-primitives/tests/feed-policy.test.mts
```

断言筛选、置顶排序和锁定删除。不证明 Portal、typeahead 或焦点回到触发器。

## 官方资料

- https://www.radix-ui.com/primitives/docs/components/dropdown-menu
- https://www.radix-ui.com/primitives/docs/components/dialog
- https://www.radix-ui.com/primitives/docs/components/alert-dialog
- https://www.radix-ui.com/primitives/docs/guides/composition
- https://www.npmjs.com/package/@radix-ui/react-dropdown-menu
- https://github.com/radix-ui/primitives
