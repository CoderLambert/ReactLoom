# B08 Mantine：主题、表格与数字中间态

Mantine 是带默认视觉的 React 组件和 hooks，适合用主题和 CSS 变量统一中后台，而不是从无样式原语开始搭。它不管理服务端缓存、权限和工作流。Library Lab 固定 `@mantine/core@9.7.3` 与 `@mantine/hooks@9.7.3`，宿主 React 19.3.0。开源库 MIT。本条目**不**安装 `@mantine/form` 或 `@mantine/notifications`。Mantine 9 要求 React ≥ 19.2；React 18 应留在 Mantine 8，不要硬装 9。

样式入口是 `@mantine/core/styles.layer.css`，放在示例模块里，供 Library Lab 这条演示使用。生产应用把 Provider 放在根上一次，不要在每个卡片里再套一个 Provider。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。没有原研究稿的 `server/mock.mjs`、`useForm` 或通知容器。`examples/feed-history.ts` 里的 `validQuota` 只接受 1–100 的安全整数。

已挂载：

- `createTheme({primaryColor: 'teal'})`，`MantineProvider` 且 `forceColorScheme="light"`。示例不跟系统暗色走，避免和 Lab 外壳抢颜色方案。
- `basic`：受控 `TextInput`，`maxLength={60}`。`Badge` 和 `<output>` 表示名称是否为空。确认按钮在空名称时禁用，成功写进 `Alert role="status"`。
- `business` / `advanced`：筛选框经 `useDebouncedValue(filter, 150)` 再过滤标题。表格用稳定 `row.id`。`Switch` 带可见标签和 `aria-label`。撤销读 `before`。
- `advanced`：`Modal` 居中，标题带当前订阅名。`NumberInput` 的 `clampBehavior="none"`、`decimalScale={0}`、`min={1}` `max={100}`。`onChange` 把 bigint 收成字符串，其余原样保存。保存时 `validQuota` 拒绝 `''`、`'-'` 和小数。错误是 `Alert role="alert"`，不关闭弹层。通过后 `updateQuota` 记快照并关闭。
- 相同配额或非法值不会制造新的撤销点。

未挂载：`@mantine/form` 的 `mode: 'uncontrolled'`、`form.getValues()`、`Notifications` 单例、服务端 revision、503、分页。官方 form 文档里的「`form.values` 不是实时权威」仍然要教，但当前代码没有那份 store。

## 什么时候使用

适合要快速得到一致输入、表格和弹层，并愿意接受 Mantine 的主题模型。不适合：必须 Ant Design 那种高密度后台（B06）、必须 Material（B07）、必须完全掌握 DOM（B10/B11/B12）、十万行虚拟表、或不想引入全局 Provider 和 CSS 层。不要以为 `Table` 自带服务端排序或大数据引擎。

不要在同一产品里再并列第二套带皮肤的组件库。Library Lab 把它们分成条目，是为了对照，不是建议同时挂三个 Provider。

## 模型

```text
MantineProvider（theme + 强制浅色）
  ├── 输入与 Badge：本地字符串
  ├── useDebouncedValue：筛选草稿延迟 150ms
  ├── feed-history：行、配额、一步撤销
  └── Modal：配额草稿（number | string）与已保存的 number 分离
```

组件负责焦点、Portal 和键盘约定。`Modal` 不决定保存是否合法。`NumberInput` **故意**在输入中间态返回字符串：用户删到空、或先打一个减号时，值不是数字 0。把字符串 `Number('')` 成 0 再保存，会把「还没输完」写成限额 0，而 0 又被业务拒绝或误记。Lab 的类型守卫要求 `typeof value === 'number'` 且为 1–100 的整数。

取消请求不等于服务器回滚。本示例没有请求。若接上 HTTP，写操作仍要 revision，读操作要用代际令牌，不能只看谁最后 resolve。

## 三层渐进

### Demo ① 工作区（已挂载）

空名称不能确认。Badge 颜色不是唯一信息，旁边有文字。Alert 在确认后出现。

### Demo ② 表格（已挂载）

筛选停止输入约 150ms 后更新可见行。status 报 `可见/总数`。开关立即改内存。撤销恢复上一次配额或开关，然后 `before` 清空。

生产里的分页和排序应在服务端。这里的过滤只针对三行 fixture 的标题。

### Demo ③ 配额（已挂载的中间态）

打开编辑，草稿初始为当前整数。清空或输入 `-` 后点保存，弹层保持，红色 Alert 说明不能把空值和短横线当 0。合法整数写入并记入撤销。`clampBehavior="none"` 让越界值有机会被守卫拒绝，而不是被组件悄悄夹成 1 或 100 后假装用户就是这个意图。若产品希望夹紧，要显式选择并在文案里说明。

未挂载：非受控 form 的 `key={form.key('quota')}`、通知队列、脏数据时禁止误关 Modal。当前 Modal 点遮罩会关，草稿丢弃；这是演示边界。生产上有未保存配额时应先问，并且仍要留出可达的退出路径。

## 反例

```tsx
// 错：把中间态字符串当成 0
function save(value: number | string) {
  const quota = Number(value) || 0;
  persist(quota);
}

// 对：Lab 的守卫
function validQuota(value: number | string): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= 100;
}
```

```tsx
// 错：onChange 只收 number，字符串被丢掉，受控值乱跳
onChange={(value: number) => setQuotaDraft(value)}

// 对：保留组件给出的 number | string；bigint 再收成字符串
onChange={value => setQuotaDraft(typeof value === 'bigint' ? String(value) : value)}
```

```tsx
// 错：每个功能卡片一个 MantineProvider，颜色方案互相覆盖
<MantineProvider><Card /></MantineProvider>

// 对：应用根一个 Provider。Lab 为了示例自包含包了一次，并在注释里写明生产只放根上
```

```tsx
// 错：忘了样式层，组件没有 Mantine 的 token
import '@mantine/core/styles.css'; // 与 layer 版本混用且顺序随意

// 对：本示例明确 import '@mantine/core/styles.layer.css'
```

```tsx
// 错：两个 Notifications 容器
<Notifications /><Notifications />

// 对：全应用一个。本条目未安装该包，不要在示例里临时再挂一个全局 toast
```

```tsx
// 错：form.values 在非受控模式下当实时值
const live = form.values.quota;

// 对：getValues()。Lab 不用 @mantine/form，配额草稿就是 React state
```

```tsx
// 错：Table 行用 index，撤销后配额贴到别的标题上
<Table.Tr key={index}>

// 对：key={row.id}
```

样式不要用脆弱的内部选择器覆盖。用主题、`classNames` 或 CSS Modules。全局 CSS 只做页面外壳。

## 组合

**Mantine + TanStack Query**：表格行来自 Query，Modal 草稿本地持有，成功后失效 `['feeds']`。不要同时再把 rows 放进另一份 store。

**Mantine + Zod**：提交时解析配额，失败映射到 Alert。解析发生在「保存」，不发生在每个中间按键，否则 IME 和减号都会红。

**不要**用本库的 Modal 替换 React Aria 的焦点模型学习；需要完全自有样式时改 B10/B12。通知若引入 `@mantine/notifications`，容器只能有一个，并单独引入它的样式。

## 生产清单

- React ≥ 19.2 才使用 Mantine 9。
- Provider、颜色方案和样式层的主人唯一。
- 数字输入区分草稿类型和已提交整数。
- debounce 的订阅随组件卸载解除。`useDebouncedValue` 由 hook 管理；自己写的 `setTimeout` 仍要清。
- Modal 的焦点陷阱和 Escape 用浏览器验收。读屏要能读到配额错误，不只靠红色。
- 减少动画：不要另写无限 CSS 循环。库内部过渡在目标浏览器里看一眼。
- 服务端重新校验 1–100。前端守卫可被绕过。

## 升级

8 → 9 先看官方迁移：React 版本、样式入口、各包主版本对齐（core 与 hooks 同为 9.7.3）。不要只升 core。form 和 notifications 若以后加上，必须锁同一条 9.7.x，而不是混 8 和 9。

## 故障排查

| 现象 | 检查 |
| --- | --- |
| 组件没有样式 | 是否引入 `styles.layer.css`；是否有 Provider |
| 清空限额变成 0 | 是否 `Number(value) \|\| 0` |
| 越界被悄悄改成 1 | `clampBehavior` 是否还是默认夹紧；Lab 设为 `none` 并把拒绝权交给 `validQuota` |
| 筛选卡顿或每个字母都重渲染大表 | debounce 是否还在；大表不要指望这三行示例 |
| 撤销没有 | 非法保存被拒绝时本来就没有新快照 |
| 弹层关了草稿还在 | 关闭时要清 error；再次打开 `edit()` 会从行上重载配额 |
| 通知出现两次 | 挂了两个通知容器 |

## 验收

basic：空名称禁用确认。business：筛选延迟后行数变化；开关可撤销一次。advanced：空值和 `-` 保存失败且弹层仍开；15 这类整数可保存；再撤销回到旧配额。相同数字不会启用撤销。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成 Mantine PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B08 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B08-mantine/tests/feed-history.test.mts
```

断言 `validQuota` 拒绝字符串中间态、`updateQuota` 在非法值和相同值时不改历史、撤销恢复 `before`。不证明 NumberInput 的键盘或 Modal 焦点。

## 官方资料

- https://mantine.dev/
- https://mantine.dev/getting-started/
- https://mantine.dev/guides/8x-to-9x/
- https://mantine.dev/theming/mantine-provider/
- https://mantine.dev/core/modal/
- https://mantine.dev/core/number-input/
- https://mantine.dev/hooks/use-debounced-value/
- https://mantine.dev/form/use-form/
- https://github.com/mantinedev/mantine
