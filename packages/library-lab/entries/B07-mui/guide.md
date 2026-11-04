# B07 Material UI：主题、表格与对话框

Material UI（`@mui/material`）是带 Material 语义的样式化组件库：按钮、输入、表格、对话框、主题和设计 token。它不负责服务器缓存、鉴权、复杂网格授权或路由。它也不是无样式原语。Library Lab 固定 `@mui/material@9.5.0`、`@emotion/react@11.14.0`、`@emotion/styled@11.14.1`，宿主 React 19.3.0。Core 许可证 MIT。`@mui/icons-material` 本示例不安装。MUI X 的 Community 组件另包；Pro / Premium（列固定、Excel 导出、日期范围等）是商业许可。看到 `DataGridPro` 示例不等于可以投产。本条目没有许可证密钥，也不调用付费 API。

v9 稳定线不要换成 `v10.0.0-alpha`。官方安装页的 React peer 覆盖 17/18/19，但 v9 的浏览器目标已经提高（当时文档列出 Chrome 117、Edge 121、Firefox 121、Safari 17 一档）。React 版本匹配不等于旧浏览器仍被支持。SSR 还要处理 Emotion 注入顺序，本示例没有做。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。没有 `workshop/src/components/FeedDashboard.tsx`、Mock API 或 `127.0.0.1:4817`。`examples/feed-history.ts` 保存行、上一份快照和 `nextId`。

已挂载：

- 模块级 `createTheme`：主色 `#2b674e`，辅色 `#987a45`，圆角 10。`ThemeProvider` 包住整段。主题对象不在每次渲染里新建。
- `basic`：`TextField` 用 v9 的 `slotProps.htmlInput.maxLength`。`Chip` 和 `<output>` 表达名称是否为空。
- `business` / `advanced`：搜索 `TextField` 直接过滤内存行（标题 + `endpoint`）。`Table` 用 `key={row.id}`，地址格允许换行。`Switch` 走 `slotProps.input` 的 `aria-label`，`toggleFeed` 只在值变化时记快照。
- `advanced`：`Dialog` 受控 `open`，`aria-labelledby` 指向标题。保存前用 `URL` 解析，协议必须是 `https:`，名称 1–60 字。冲突或重复地址写入 `Alert role="alert"`，不关闭对话框。成功才清空草稿并 `Snackbar`。撤销按钮在没有 `before` 时禁用。
- `addFeed` 拒绝空标题、空地址和重复 endpoint，新 id 为 `local-` 加递增序号。

未挂载：暗色切换、`CssBaseline`、`TablePagination` 的服务端 `total`、`TableSortLabel`、`Autocomplete` 的 `inputValue` 与 IME、`fullScreen` 媒体查询、AbortController、409 的 revision。Dialog 在所有层都挂在树上，但只有 advanced 会把它打开。`Snackbar` 的 `autoHideDuration` 只关通知，不撤销业务。

## 什么时候使用

适合接受 Material 交互、需要统一 token 的管理界面和中等密度配置台。不适合：DOM 和样式必须完全自有（B10/B11/B12）、已经有另一套 ThemeProvider 的产品（不要两套皮肤同时加载）、上万行同步网格（TanStack Table 或 AG Grid，许可分开）、只有两个原生控件的页面。明确要支持 Safari 16 或更老的环境时，v9 的浏览器目标对不上。

## 模型

```text
ThemeProvider(createTheme)
  ├── basic：workspace 字符串
  └── 列表：feed-history 为唯一列表权威
        ├── Table 只显示过滤结果
        ├── Dialog 草稿（title/url/error）与列表分离
        └── Snackbar 只投影最近一次说明
```

`palette` / `shape` / `components` 是视觉权威。局部差异用 `sx`。不要在 200 行 JSX 里每次 `createTheme`。列表不是数据库。客户端 URL 检查不能代替服务端校验，更不能当 SSRF 防护。

v9 移除了 `inputProps`、`InputProps` 这类旧 TextField 属性。新代码用 `slotProps.htmlInput`、`slotProps.input`。不要粘贴 v5 教程。

## 三层渐进

### Demo ① 主题与输入（已挂载）

改工作区名称，Chip 在空与非空之间变化。没有 HTTP。焦点环应仍可见；Lab 没有全局去掉 outline。

### Demo ② 订阅表（已挂载的过滤；服务端表未挂载）

搜索是受控输入，过滤大小写不敏感。开关改 `enabled` 并记一步撤销。status 报匹配数和总行数，数据只在组件状态里。

生产教学：分页用接口的 `total`，不要用当前页 `rows.length`。排序点击后 page 回到 0。effect 里 `AbortController`，StrictMode cleanup 把 `active` 设为 false，旧搜索不能覆盖新结果。Lab 的过滤是同步的，没有这条竞态。

### Demo ③ 对话框（已挂载的本地校验）

保存：非法 URL、非 https、空名称或超长，错误留在对话框里。勾选「下一次保存注入 409」或地址已存在，同样留在框内，并清掉注入标记，避免每次都失败。成功关闭对话框并 Snackbar。取消清错误。

未挂载的 Autocomplete：`value` 与 `inputValue` 分开，`isOptionEqualToValue` 按 id。`freeSolo` 时选项类型会变成 `string | Option`。composition 期间不要提交查询。Dialog 默认 Portal 到 body，关闭后焦点应回到触发按钮——这是组件职责，仍要在浏览器里看，policy 测试看不到。

## 反例

```tsx
// 错：v5 的 inputProps 在 v9 已移除
<TextField inputProps={{maxLength: 60}} />

// 对：Lab 的 basic 字段
<TextField slotProps={{htmlInput: {maxLength: 60}}} />
```

```tsx
// 错：key={index}，撤销或追加后行对错
{rows.map((row, index) => <TableRow key={index} />)}

// 对
{rows.map(row => <TableRow key={row.id} />)}
```

```tsx
// 错：把显示文本当主键，或只在 Snackbar 里报字段错误
setNotice('地址不对');

// 对：字段级 Alert 留在 Dialog 里，Snackbar 只做成功摘要
{error && <Alert severity="error" role="alert">{error}</Alert>}
```

```tsx
// 错：客户端过了就当服务端会抓取这个 URL
fetch(userUrl);

// 对：本示例不发请求。生产服务端重验协议、主机、重定向和内网
```

```tsx
// 错：每个按键新建 theme，或再包一个第二套 ThemeProvider
const theme = createTheme({palette: {primary: {main: color}}});

// 对：稳定的 createTheme，放在模块或 useMemo
```

```tsx
// 错：Dialog 没有标题关联
<Dialog open><DialogContent>...</DialogContent></Dialog>

// 对：Lab 使用 aria-labelledby="mui-lab-dialog-title"
```

```tsx
// 错：撤销把 Snackbar 当成状态源，关掉通知就恢复数据
onClose={() => undo()}

// 对：撤销按钮读 feed-history.before；通知关闭只清 notice
```

`DataGridPro` 不在依赖里。需要列固定或 Excel 导出时先走许可评审，不要从 Core 的 `Table` 推断已经买了 X。

## 组合

**MUI + TanStack Query**：表格显示 Query 数据，mutation 成功后失效对应 key。不要把 rows 再复制进 Zustand。Dialog 草稿可以是本地 state，提交结果以响应为准。

**MUI + React Hook Form**：只能有一个字段主人。若用 RHF，不要同时再维护一套和 `value` 打架的 MUI 内部状态。Lab 的对话框是直接受控 state，没有 RHF。

**不要**与 Ant Design 或 Mantine 的 Provider 叠在同一棵产品树上「看看哪个好看」。Lab 把它们分成不同条目。

## 生产清单

- 文本用 React 子节点，错误字符串不要进 `dangerouslySetInnerHTML`。
- 焦点可见、不单靠颜色。Chip 的 success/warning 旁边还有文字。
- 触摸目标和 200% 缩放下 Dialog 仍可用。窄屏的 `fullScreen` 本示例没开。
- `prefers-reduced-motion` 不会自动关掉每一个第三方动画。本示例没有自建循环动画。
- 自己创建的 debounce、请求和观察器要 cleanup。Lab 没有这些订阅。
- Emotion 缓存和 SSR 样式顺序在 Next 里单独验证。本宿主是 Library Lab 的客户端页。

## 升级

从 v5/v7 教程升级：替换 `inputProps` / `InputProps`，核对 `Autocomplete` 的 `freeSolo` 类型，不要引入 v10 alpha。X 的包版本和 Core 版本分开锁。主题从 JSS 迁到 Emotion 的旧项目要看注入顺序，而不是只改 import。

## 故障排查

| 现象 | 检查 |
| --- | --- |
| 类型报 inputProps 不存在 | 改 `slotProps` |
| 换行后开关仍是旧行 | key 是否稳定；`toggleFeed` 是否因值相同提前返回 |
| 保存后列表没增加 | URL 解析失败、非 https、重名，错误应留在 Dialog |
| 撤销无效 | `before` 为 null 时按钮应禁用；连续两次撤销不是栈 |
| 通知关了数据也没了 | 把业务写进了 Snackbar onClose |
| 对话框标题读屏读不到 | 缺 `aria-labelledby` |
| 样式闪或和 Tailwind 打架 | Emotion 插入点与 reset 的顺序 |

## 验收

basic：空名称是 warning Chip，有名称是 success，output 与输入一致。business：搜索即时过滤；开关记入可撤销历史；重复点同一状态不制造新快照。advanced：坏 URL 不关闭；注入 409 只影响下一次；成功后 Snackbar 出现且列表多一行；撤销回到保存前。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成 MUI PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B07 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B07-mui/tests/feed-history.test.mts
```

断言开关、追加和撤销的纯函数。不证明 Dialog 焦点或 Emotion 样式。

## 官方资料

- https://mui.com/material-ui/getting-started/
- https://mui.com/material-ui/migration/upgrade-to-v9/
- https://mui.com/material-ui/react-text-field/
- https://mui.com/material-ui/react-dialog/
- https://mui.com/material-ui/customization/theming/
- https://mui.com/x/introduction/licensing/
- https://github.com/mui/material-ui/blob/master/LICENSE
