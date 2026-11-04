# B06 Ant Design：企业组件与本地订阅台

`antd` 是成套 React 组件：按钮、表单、表格、反馈、主题 Token 和弹层共享同一设计契约。它不是单个 Button 的渲染微基准，也不自动提供权限、缓存、SSR 安全和完整 WCAG。Library Lab 固定 `antd@6.6.7`，宿主 React 19.3.0。许可证 MIT。`@ant-design/icons`、Ant Design Pro、Ant Design X、Ant Design Mobile、Charts 都是别的包。本示例不安装图标包。

v6 要求 React ≥ 18，不再支持 React 17，并依赖 CSS 变量。浏览器支持以官网当时列出的近两个版本为准；移动手势要单独看，不等同于 Ant Design Mobile。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。没有原研究稿的 `demo/src/BusinessDemo.tsx`、`server/api.mjs`、双终端 `dev:api` 或 `127.0.0.1:5173`。数据是内存 fixture。`examples/feed-history.ts` 把「当前行」和「上一份快照」放进同一次状态更新。

已挂载：

- 顶层 `ConfigProvider`，种子 Token `colorPrimary: '#21654f'`、`borderRadius: 8`。`getPopupContainer` 在有父节点时挂到父元素，否则 `document.body`。
- `<App>`（导入时别名为 `AntApp`）包住工作区。`App.useApp()` 取 `message`，使反馈继承当前主题。
- `basic`：受控 `Input`、`Button`、成功 `Alert`。空名称禁用确认。确认后改字会清掉成功态。
- `business` / `advanced`：`Form.useForm`。`onFinish` 只在客户端规则通过后运行。URL 必须是合法 URL 且以 `https://` 开头。分类用 `Select`。`Table` 的 `rowKey="id"`，标题列本地 `localeCompare(..., 'zh-CN')`。启用列是受控 `Switch`，不放进 Form。详情 `Modal` 只读。
- 搜索框的 `value` 是草稿 `draft`，真正过滤用 `query`，只在 `onSearch` 时 `trim` 后写入。这是为了不在每次 `onChange` 里重排表格，给 IME 留出组合空间。Lab 没有再写 `compositionstart` 监听。
- `advanced`：「下一次提交注入 409」调用 `form.setFields` 把错误放回 `url`，并 `message.error`。重复 URL 同样 `setFields`，不新增行。撤销调用 `undoFeed`，没有快照时按钮禁用。
- `appendFeed` 拒绝相同 id 或相同 url，并把新行插到前面，同时记下 `previous`。`toggleFeed` 在值没变时返回原状态。

未挂载：真实 HTTP、`revision` / `If-Match`、422 字段白名单、Drawer、`Grid.useBreakpoint`、`theme.token.motion`、`zeroRuntime`、服务端分页。表格的 `sorter` 函数只排序**当前过滤后的内存行**。生产上的服务端排序不能再写一份本地比较器去排单页数据。

## 什么时候使用

适合管理后台、审批、筛选和设置页，优势是组件之间的 Token、locale 和反馈一致。不优先：要极小嵌入且样式必须隔离的 widget、完全不能接受 Ant Design 结构的品牌、原生移动交互（看 Ant Design Mobile 或别的体系）、超大网格（AG Grid 或 TanStack Table + 虚拟化）、要从原子部件自己定义键盘模型（B10/B11/B12）。

MIT 覆盖组件库源码。图标字体、Pro 模板和素材另查。成熟不等于免检。

## 模型

```text
ConfigProvider（Token、弹出层容器）
  └── App（message / modal / notification 的上下文）
        ├── basic：React state → Input / Button / Alert
        └── business：
              Form store：输入、校验、提交
              feed-history：列表和一次撤销快照
              Table：展示派生过滤结果
              Modal：只读详情，不拥有表单
```

`initialValues` 只在初始化和 `resetFields` 时生效，不会跟着后来的 props 变。改单个字段用 `setFieldValue`，批量用 `setFieldsValue`，服务器错误用 `setFields([{name, errors}])`。`onFinish` 不会在校验失败时跑。默认 `preserve=true`，条件字段卸载后值可能还在 store 里；不需要保留时设 `preserve={false}`。

`Modal` / `Drawer` 走 Portal，并处理一层焦点。`destroyOnHidden` 只卸载内容，不取消请求，也不清空外部 store。Lab 的详情框没有请求。`AbortController.abort()` 只结束客户端等待，不能回滚已经落到服务端的写入。幂等键和版本号在服务端。

`theme.zeroRuntime` 关掉运行时 CSS-in-JS 后必须自己引入静态 CSS，不要和默认模式混用。Lab 使用默认运行时主题。

## 三层渐进

### Demo ① 主题与确认（已挂载）

Tab 到输入和按钮。Enter 在这个 Card 里没有包 `<form>`，不会暗中提交。空字符串不能确认。Alert 用组件的成功语义，而不是只改颜色。

### Demo ② RSS 表（已挂载的本地表；服务端分页未挂载）

名称、HTTPS、分类。成功后 `resetFields` 并 `message.success`，文案写明没有外部请求。表格 `pagination` 每页 4 行，单页时隐藏。`scroll.x` 避免窄屏把列挤没。启用开关带 `aria-label`。

生产教学（未挂载）：`GET /api/feeds?page&pageSize&q&sort` 返回 `{items,total}`；POST 201；重复 URL 409；非法 422；PATCH 带 `revision`。搜索 effect 里 abort 旧请求，并用序号丢掉过期响应。服务端才是权威。若将来真的去抓 RSS，还要防 SSRF：内网、重定向、超时、响应体积。本示例不抓 URL。

### Demo ③ 冲突与撤销（已挂载的模拟 409）

注入一次后，下一次 `onFinish` 把「模拟 HTTP 409」写进 url 字段并 toast。它不会留下半条记录，因为函数在 `setFeedState` 之前 return。再次提交不再失败，除非地址真的重复。撤销恢复上一份行数组，并把 `previous` 清空，所以只能退一步。

未挂载：Drawer、拼音 `isComposing` 拦截 Enter、`Grid.useBreakpoint`、`token.motion = false`。减少动画不能只写一条 CSS，库内过渡还要 Token；自定义动画另外处理。Lab 没有打开这组开关。

## 反例

```tsx
// 错：Switch 默认走 value，提交布尔会错
<Form.Item name="enabled"><Switch /></Form.Item>

// 对：valuePropName="checked"
// Lab 的启用开关不在 Form 里，直接改 feed-history，避免两套布尔
```

```tsx
// 错：冲突只 toast，字段上没有错误
message.error('参数错');

// 对：先 setFields，再摘要
form.setFields([{name: 'url', errors: ['模拟 HTTP 409：订阅地址已被其他成员占用']}]);
message.error('模拟服务端冲突：请检查地址');
```

```tsx
// 错：initialValues={record} 以为换一条记录输入就会变
<Form initialValues={record} />

// 对：打开时 setFieldsValue / resetFields，并绑到记录 id
```

```tsx
// 错：关 Modal 就当旧值消失
setOpen(false);

// 对：destroyOnHidden、preserve={false}、resetFields、abort 各管一件事
```

```tsx
// 错
<Table rowKey={(_, index) => index} />

// 对
<Table rowKey="id" />
```

```tsx
// 错：服务端已经排过序，列上再 sorter:(a,b)=> 只排当前页
// 对：服务端排序时列上 sorter: true，在 onChange 里改请求参数并回到第一页
// Lab 是全量内存表，本地 localeCompare 只对这份 fixture 成立
```

```tsx
// 错：主题外静态方法，locale 和 Token 对不上
import {message} from 'antd';
message.success('ok');

// 对：App 子树里
const {message} = App.useApp();
```

```tsx
// 错：每个 onChange 都 trim，拼音被截断
onChange={event => setQuery(event.target.value.trim())}

// 对：草稿原样保存，提交或 onSearch 时再规范化。Lab 的 Input.Search 就是 draft / query 分离
```

```tsx
// 错：.ant-input > span:nth-child(2)
// 对：theme.token、组件 Token、classNames / styles
```

暗色不能只改主色。要 `theme.algorithm` 里的暗色算法，并看焦点环、占位符、Portal 背景。Lab 固定浅色种子色，没有暗色切换。

## 组合

**Ant Design + TanStack Query + Zod**：Form 管交互，Zod 做客户端预检，服务端再验一次。queryKey 带上分页和排序。mutation 成功后按范围失效。不要把 `dataSource` 再复制进 Zustand。Form 与 React Hook Form 只能有一个字段主人。

**Ant Design + react-grid-layout + 图表**：筛选归 antd，坐标归网格库，图表实例自己 `resize`。卡片点击不要吞掉拖拽。Lab 的 B15 是独立条目，这里没有嵌进去。

| 方案 | 更合适的时候 |
| --- | --- |
| antd | 中后台成套表单和表格 |
| MUI（B07） | 接受 Material 语义；X 的 Pro 网格另计许可 |
| Mantine（B08） | 想要 hooks 和另一套主题，而不是 Ant 密度 |
| Base UI / Radix | 外观完全自有 |
| TanStack Table / AG Grid | 海量列和透视；AG Grid 高级功能另授权 |

## 生产清单

- Token 放在 `ConfigProvider`，不要靠私有 DOM。
- 反馈走 `App.useApp`。
- 表格身份用业务 id。跨页选择要自己保存 id，不能靠当前页下标。
- 异步校验要防抖并取消旧请求。
- 文本走 React 转义。链接加 `rel="noopener noreferrer"`。不要 `dangerouslySetInnerHTML` 渲染用户 HTML。
- 自定义单元格、Drawer 叠层、错误回填后的焦点、200% 缩放、暗色对比度，用 axe 加真实键盘和读屏。库的默认 ARIA 不能代替这些。
- v6 的 `Form.List` 提交值有行为变化，升级时对照迁移文档，不要用本示例的单层字段代替。

## 升级

v5 → v6：先把 v5 升到最后修订并清掉弃用警告。React ≥ 18。若使用图标，`@ant-design/icons` 也要到 6，不能 v6 图标配 v5 组件。删掉 `@ant-design/v5-patch-for-react-19`。检查依赖 DOM 结构的选择器、Modal/Drawer 蒙层、Token、`Form.List`。不要把 `antd@latest` 当成迁移完成。

## 故障排查

| 现象 | 检查 |
| --- | --- |
| 没有样式 | ConfigProvider 是否包住；CSS 变量是否可用；zeroRuntime 是否忘了静态 CSS |
| useApp 警告 | 组件是否在 `<App>` 内 |
| 换了 record 输入不变 | 仍在用 initialValues |
| 关了再开还是上次的字 | preserve、destroyOnHidden、reset 是否各做各的 |
| 翻页选中错位 | rowKey 是否成了 index |
| 改排序还停在旧页 | 服务端表格要重置页码 |
| 旧响应覆盖新列表 | abort 和序号。Lab 没有请求，不存在这条网络竞态 |
| 弹层被裁 | overflow、z-index；盲目 `getPopupContainer` 会让没有 trigger 的弹层找不到节点。Lab 用了 `node?.parentElement ?? document.body` |
| 拼音跳字 | 是否在 onChange 里 trim |

## 验收

basic：空名称不能确认，确认后 Alert 出现，再编辑则 Alert 消失。business：非法 URL 和 http 被规则挡住；合法 https 出现在表顶；重复地址停在字段错误。advanced：注入 409 只失败一次；撤销回到注入前的行；搜索在点击搜索后才过滤，输入过程中表格不跟着每个字母重排。

sdk、build、browser 为 NOT_RUN。没有 `docs/library-lab/evidence/runs/` 的匹配 receipt 就不能写成组件库 PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B06 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B06-ant-design/tests/feed-history.test.mts
```

该测试只覆盖快照函数：重复拒绝、撤销一步、开关无变化时不写入。它不证明 Form、Table 或 Message。

## 官方资料

- https://github.com/ant-design/ant-design/releases/tag/6.6.7
- https://ant.design/docs/react/getting-started
- https://ant.design/docs/react/migration-v6
- https://ant.design/docs/react/customize-theme
- https://ant.design/components/form
- https://ant.design/components/table
- https://ant.design/components/config-provider
- https://ant.design/components/app
- https://github.com/ant-design/ant-design/blob/master/LICENSE
