# B12 React Aria Components：ComboBox、IME 与选择身份

React Aria Components 把键盘、焦点、弹出层和 ARIA 状态做成可样式化的零件。它不保存业务数据库，也不证明整站 WCAG 已经通过。Library Lab 固定 `react-aria-components@1.21.0`，宿主 React 19.3.0。**许可证是 Apache-2.0，不是 MIT。** 样式和示例文案是原创的，没有第三方素材。

1.21.0 的组合框使用 `selectedKey` / `onSelectionChange` 与 `inputValue` / `onInputChange`，列表项是 `ListBoxItem` 的 `id`。不要把别的次版本教程里的 `value` / `onChange` 或旧 alpha 的 `Item` 贴进来覆盖当前文件。类型以锁文件里的 1.21.0 为准。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。样式是 `examples/combobox.css`。纯函数在 `examples/channel-policy.ts`。没有原研究稿的整页 RSS 表单、`validationErrors`、Mock HTTP 或 `LatestTask` 类。

已挂载：

- `ComboBox` 带 `name="channel"`，以便原生表单带上选中 key。`defaultFilter={() => true}`，过滤由应用负责，避免库的默认过滤再筛一次。
- `Label`、`Input`、展开 `Button`、`Text slot="description"`、`Popover`、`ListBox`、`ListBoxItem`。空列表用 `renderEmptyState`。
- 选中项必须存在且未 `disabled`。`安全紧急通告` 带 `isDisabled`，不能成为确认结果。
- `confirmedChannel` 要求 key 对应的名称和输入框文本一致。只敲了半个名字时，旧 key 会被清掉，提交失败。
- `basic` 只给前四个频道，`menuTrigger="input"`。`business` 用全表，含禁用项。`advanced`：`menuTrigger="focus"`，本地 `setTimeout` 240ms。`generation` 加 `AbortController` 丢掉过期结果。忙碌或输入与已完成查询不一致时，`queryRows` 返回空列表，避免旧候选闪一下。
- `Input` 记录 `compositionstart/end`。提交时若仍在组合，直接 return，不把拼音确认键当成表单提交。
- 切换 level 清空 key、输入和消息。卸载 effect 清定时器并 abort。
- 提交读 `FormData` 的 `channel`，并要求它等于确认过的 id。status 写出 id，而不是只写中文名。

未挂载：Dialog / Modal、FieldError 与服务端 422 字段映射、脏数据拦截 Escape、React Hook Form、TanStack Query、MSW。那些组合留在生产教学，不要说当前 Popover 已经是完整订阅后台。

## 什么时候使用

适合要国际化键盘模型、组合框、列表框和弹出层，并且团队愿意写 CSS。不适合：要现成中后台皮肤、或只是一个原生 select 且选项从不变化。移动 React Native 不在这个包的范围。宣称「用了 React Aria 就自动 WCAG 合规」是错的，仍要做键盘、读屏、缩放和触控验收。

## 模型

```text
键盘 / 触控 / 读屏
  → ComboBox（焦点、弹出、选中公告）
  → 应用：inputValue、selectedKey、busy、resolvedQuery
  → filterChannels / confirmedChannel / queryRows
  → 提交：FormData 里的 id
```

展示名和 id 分离。`ListBoxItem` 的 `textValue` 是「React 组件工程」，`id` 是 `react`。把中文标签存进数据库会在改文案时毁掉外键。

`defaultFilter={() => true}` 的意思是：库不要再按自己的规则删行。应用在 `items` 里给出当前行。若再打开库过滤，空状态和异步清空会很难解释。

advanced 的延迟是本地 fixture。它不代表网络。旧定时器返回时，generation 已经前进，就不能 `setResolved`。

## 三层渐进

### Demo ① 键盘选择（已挂载）

四个技术/资讯项。方向键移动，Enter 选择，Escape 关闭。描述文本说明了这些键。提交前必须选中完整名称。清空按钮把 key 和输入都复位。

### Demo ② 频道发现（已挂载）

全表过滤，`toLocaleLowerCase('zh-CN')`。禁用的安全通告仍出现，但 `isDisabled`，选择它不会留下 key。分类显示在选项旁，禁用项显示「暂不可订阅」。

### Demo ③ 异步与输入法（已挂载的本地延迟）

输入改变后 status 为查询中，列表先空。240ms 后若代际仍匹配，才写入结果。快速改字只保留最后一次。组合期间按 Enter 不提交。组件说明写明：不另写一套 Enter 键逻辑去代替组件。

未挂载的生产教学：服务端 422 用 `Form validationErrors` 和 `FieldError` 按 `name` 关联；409 用 revision；脏对话框不要一点遮罩就丢稿，但必须仍能退出。`LatestTask` 若与 Query 同时包装同一次请求，会有两个主人。Lab 只有代际和 AbortController。

## 反例

```tsx
// 错：div 当按钮
<div onClick={open}>展开</div>

// 对：react-aria-components 的 Button，或原生 button
<Button aria-label="显示可选频道">▾</Button>
```

```tsx
// 错：只加 role="dialog"，没有焦点和标题
<div role="dialog">...</div>

// 对：DialogTrigger、Modal、Heading slot="title"。本示例没有 Dialog
```

```tsx
// 错：把 1.21 的 selectedKey 改成别的版本文档的 value，类型和表单 name 一起坏
<ComboBox value={selectedKey} onChange={setSelectedKey} />

// 对：保持当前文件的 selectedKey / onSelectionChange / inputValue / onInputChange
```

```tsx
// 错：每个 onChange 都 trim，拼音被截断
onInputChange={value => setInputValue(value.trim())}

// 对：原始字符串进入 state；确认发生在提交。组合期间提交函数直接返回
```

```tsx
// 错：提交中文名
formData.set('channel', 'React 组件工程');

// 对：FormData 里是 id。confirmedChannel 还要求名称与输入一致，防止半输入提交旧 id
```

```tsx
// 错：只 abort，不比较代际。不遵守 signal 的定时器仍 setState
return () => controller.abort();

// 对：Lab 在 cleanup 里 abort 并且 generation++；回调里再比较 id
```

```tsx
// 错：默认过滤再加一层应用过滤
<ComboBox items={filterChannels(rows, input)}>

// 对：defaultFilter={() => true}，items 已经是应用结果
```

```tsx
// 错：禁用项仍可确认
if (key) setSelectedKey(String(key));

// 对：找到项且 !disabled 才留下 id
```

```tsx
// 错：全局 outline: none，错误只靠红色
// 对：保留 :focus-visible，错误走 role=status / role=alert 和字段说明
```

服务端若真去抓用户填写的 URL，前端 `URL` 解析防不住 SSRF。本示例的频道是写死的 fixture，不抓取。

## 组合（未挂载）

**React Hook Form + Zod**：RAC 组件做可访问输入，schema 做规则。`Controller` 绑定 `value` / `onChange`。不要又给组件 `defaultValue` 又让 RHF 注册第二份。需要另装 `react-hook-form`、`zod`、`@hookform/resolvers`，并重测 IME。这段不是当前依赖。

**TanStack Query**：`queryFn` 接收 `signal`。保存成功后 `invalidateQueries`。不要在组件里再留一份会和缓存打架的服务器数组。不要把 Lab 的 generation 和 Query 再包同一请求。

**CSS**：Popover 是浮层，不要用 `.parent > .popover` 当定位合同。z-index 和移动软键盘要在设备上看。`[data-entering]` 一类动画要服从 `prefers-reduced-motion`。

## 生产清单

- 每个组合框有 Label，描述用 `aria-describedby` 连到说明。
- 选项 id 稳定，文案可改。
- 禁用项可见但不可确认。
- 异步结果过期不回写；卸载清定时器。
- 组合输入期间不提交。
- 空状态是一句话，不是空白浮层。
- 触控目标包括展开按钮，不只靠输入框边缘。
- 读屏验收选中公告和禁用原因。库不会自动完成 NVDA 或 VoiceOver 测试。

## 升级

锁在 1.21.0。升级前对照 ComboBox 的受控属性名、`ListBoxItem` 的 `id`、`defaultFilter` 和表单 `name`。Apache-2.0 的 NOTICE 要求随版本保持。不要为了对齐某篇 1.22 笔记去改已挂载的 props，除非示例、类型和测试一起改。

## 验收

basic：方向键选择后提交得到 id；半截文本提交被拒绝。business：安全通告不能选中；清空后 status 为已清空。advanced：快速输入只应用最后一次本地查询；查询未完成时列表为空；拼音组合中的 Enter 不提交；离开层级后定时器不能把结果写进下一层。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成 React Aria PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B12 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B12-react-aria/tests/channel-policy.test.mts
```

断言过滤、禁用项不能确认、名称不一致时确认失败、忙碌或查询未对齐时行集为空。不证明弹出层焦点或读屏。

## 官方资料

- https://react-spectrum.adobe.com/react-aria/react-aria-components.html
- https://react-spectrum.adobe.com/react-aria/ComboBox.html
- https://react-spectrum.adobe.com/react-aria/forms.html
- https://www.npmjs.com/package/react-aria-components
- https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/LICENSE
