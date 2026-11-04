# nuqs 2.10.1｜URL 是已提交的筛选，不是输入法草稿

Lab 锁定 `nuqs@2.10.1`（MIT）。适配器是 `nuqs/adapters/tanstack-router` 的 `NuqsAdapter`，因为 Lab 路由是 TanStack Router。不要把 Next.js 的 `nuqs/adapters/next/app` 套到这个 SPA 上，也不要从 v1 的 `nuqs/parsers` 导入。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 使用真实的 `useQueryState`、`parseAsString`、`parseAsInteger` 和 `NuqsAdapter`。`demo.tsx` 只做再导出。筛选数据是组件内的五条 RSS，没有 Query，也没有服务端 loader。

键都带 `ll_c19_` 前缀。Lab 页面自己已经使用 `tab` 和 `example`。写成 `q` 或 `page` 会覆盖宿主的查询参数。

- **basic**：只有搜索。`ll_c19_q` 使用 `parseAsString.withDefault('').withOptions({ history: 'replace' })`。分组参数即使留在地址栏，[`url-policy.mjs`](examples/url-policy.mjs) 的 `deriveSearchView` 在 basic 也强制 `safeGroup = 'all'`，避免从 business 留下的分组偷偷生效。
- **business**：加上 `ll_c19_group` 和 `ll_c19_page`。页码默认 replace。每页 `PAGE_SIZE` 是 2。换分组或提交搜索时 `setPage(null)`，让缺省回到第一页。
- **advanced**：页码改为 `history: 'push'`，搜索仍是 replace。浏览器返回应能回到上一页码，而不是退回每一个按键。非法页码由 parser 落到默认，再被 `deriveSearchView` 夹到 `1…pageCount`。

`sanitizeQuery` 去掉控制字符、trim，并按码点截到 80。这是展示规则，不是鉴权。

草稿 `draft` 和 URL 上的 `query` 分开。`useEffect` 在非组合时把 URL 写回输入框，这样后退能更新输入。组合期间不覆盖 draft，也不在每个拼音字母上把未完成的词写进历史。

## 什么时候用

筛选、页码、排序这种应该能被复制到另一个标签的状态。表单里正在输入的长文、token、一次性错误不要放进查询串。它们会进历史、日志和分享链接。

nuqs 不发请求。`setQuery` 的 Promise 表示 URL 写完，不表示接口成功。`shallow: false` 在纯 SPA 里也不会自动 `fetch`。需要数据时另接 Query，并把同一份已清洗的参数放进 queryKey。

## 数据与模型

一条业务键只有一套 parser。`ll_c19_page` 若有的地方用 `parseAsInteger`、有的地方用 `parseAsFloat`，读到的类型会飘。

`parseAsInteger` 接受 `-1` 这种整数。负数不是合法页。Lab 在 `deriveSearchView` 里把非正整数收成 1，再夹到最后一页。不要以为 parser 已经做了业务范围。

`withDefault` 让缺失的键有值。清空搜索时 `setQuery(null)`，让键从 URL 消失，而不是留下 `q=`。`clearOnDefault` 的相等比较若用在每次 render 都新分配的数组上，会永远写不回默认。自定义 parser 需要稳定的 `eq`。本示例的默认是空串和 1，没有这个数组问题。

历史：

| 操作 | history | 原因 |
| --- | --- | --- |
| 搜索按键 | replace | 否则后退要穿过每个字母 |
| business 翻页 | replace | 演示里翻页不必堆历史 |
| advanced 翻页 | push | 后退恢复页码 |

v1 的 `throttleMs` 已换成 `limitUrlUpdates`。本 Demo 没有加 debounce。若产品要节流 URL，记住 React state 可能先变、URL 后变，fetch 仍要自己防抖。不要以为限制 URL 写入就限制了请求。

严格模式：`createLoader` 的 `{ strict: true }` 只让类型错误抛出，不保证 `page >= 1`。那仍是业务规则。Lab 没有 `nuqs/server` 的 loader，因为这不是 Next 请求。

适配器必须包住使用 hook 的组件。示例在默认导出里包 `NuqsAdapter`。缺了适配器，hook 没有路由的 history。不要再包一层别的框架的适配器。

## 三层示例

### 基本

输入「官方」。列表只剩名称里含该词的源。地址栏出现 `ll_c19_q`，不出现新的 `tab` 值。清空按钮去掉实验参数。组合中文时，未确认的拼音不应把 URL 写成半截；确认后 `compositionEnd` 再 `commit`。非组合的 `onChange` 会立刻 commit，所以英文是逐字 replace。

### 业务

选「商业」，页码回到 1，每页两条。下一页用按钮而不是链接。结果为空时有「没有匹配的订阅」。分组只接受 `tech`、`business` 或全部。别的字符串在 `safeGroup` 里变成 `all`。

### 进阶

翻到第 2 页，地址栏是 push。按浏览器后退，页码和列表回到前一页，输入框在非组合时跟着变。把 `ll_c19_page` 改成 `abc` 或 `-3`。parser 和 `deriveSearchView` 之后界面仍是合法页，而不是空白或负数。搜索框继续 replace，后退不会一步一步吃掉字母。

## 反例

### 1. 不包适配器，或包错框架

```tsx
useQueryState('q', parseAsString) // 没有 NuqsAdapter
```

TanStack Router 的页面用 `nuqs/adapters/tanstack-router`。Next App Router 才用 next 适配器。

### 2. 搜索用 push

每个字母一条历史。Lab 的搜索是 replace。只有 advanced 的翻页用 push。

### 3. 键名 q 和 page

会覆盖 Lab 的 `tab` 和 `example`，或和宿主将来的参数相撞。使用 `ll_c19_` 前缀。

### 4. 认为 parseAsInteger 已保证页码合法

`?ll_c19_page=-1` 仍是整数。业务层夹范围，服务端再拒绝。

### 5. basic 仍沿用上次的分组

用户看不到分组控件，结果却被旧的 `ll_c19_group` 滤掉。`level === 'basic'` 时忽略分组。

### 6. 组合期间用 URL 回写 input

```tsx
useEffect(() => setDraft(query), [query])
```

拼音会被 URL 的旧值盖住。Lab 在 `composing` 时跳过这步。

### 7. 把 token 放进查询串

分享和访问日志都会带走它。URL 只放可公开的短筛选。

### 8. setQuery 的 await 当成保存成功

它只等到 URL 队列。接口 503 仍要单独显示。不要自动重试非幂等的写入。

### 9. limitUrlUpdates 当成请求防抖

状态先更新。Query 要有自己的 key 和 AbortSignal。本 Demo 没有请求。

### 10. 同一键两套 parser

整数和字符串混用会让默认值和清空语义不一致。导出一份 parser 定义共用。

## 组合

**TanStack Query + Table。** URL 保存已清洗的 `q`、group 和 page。Query key 使用同一对象。表的 `pageIndex` 若是 0 基，要和 URL 的 1 基换算一次，并只在一处换算。`manualPagination` 打开。本 Demo 的列表是 `<ul>`，没有表。

**React Hook Form。** 草稿留在 RHF。提交成功才 `setQuery`。后退之后 `form.reset` 到 URL 的值，不要在每个 `onChange` 上 reset，否则光标和 IME 会断。服务器字段错误用 `setError`，不要写进 URL。

## 生产清单

- 正确的适配器包住 hook。
- 键有前缀，不覆盖宿主参数。
- 搜索 replace，需要后退的步骤才 push。
- parser 之后再做范围和枚举。
- 组合输入不把半截拼音写入 URL，也不用 URL 回写正在组合的框。
- 清空用 `null`，让默认键消失。
- 服务端再验一次。nuqs 不是权限。
- 不把长 JSON 或密钥放进查询串。

## 升级

v2 需要适配器，`throttleMs` 改为 `limitUrlUpdates`，共享的服务端 parser 从 `nuqs/server` 引入。v2 是 ESM。旧的 `next-usequerystate` 教程不要抄。升级后看 `clearOnDefault` 是否把现有链接折成更短的 URL，并为旧链接留兼容。

页码按钮在第一页和最后一页禁用。禁用看的是 `safePage`，不是地址栏里的原始字符串。因此 `ll_c19_page=99` 在只有两页数据时会显示最后一页，按钮状态也按夹取后的数字计算。把原始 99 继续发给接口会造成空页。服务端应返回同样的夹取规则或 422，而不是静默空列表。

`sanitizeQuery` 用码点截断，避免把一个汉字切成半个代理项。比较时 `toLocaleLowerCase` 只用于名称包含判断。不要对 path 或 id 做同样的小写化。空查询写成 `null`，这样默认值不会留在地址栏里变成 `ll_c19_q=`。

宿主参数 `tab` 和 `example` 由 Lab 自己写。示例只调用三个 `ll_c19_` setter。不要 `setQuery` 一个对象把整份 search 换掉。

## 练习

1. 搜索「官方」，复制地址到新标签，结果相同，且 `tab` / `example` 仍在。
2. basic 下手动留下 `ll_c19_group=business`，列表仍按全部分组计算。
3. advanced 翻页后后退，页码恢复；搜索过程中后退不会按字母回放。
4. `ll_c19_page=abc` 和 `-1` 都显示合法页码。
5. 中文组合未结束时，URL 不更新为未确认的拼音。

## 故障排查

| 现象 | 先看 |
| --- | --- |
| hook 直接报缺少 adapter | 是否用了 `NuqsAdapter`，并且来自 `nuqs/adapters/tanstack-router` |
| 刷新后 `tab` 丢了 | 实验键写成了 `tab` 或 `example`。必须带 `ll_c19_` |
| 后退要按很多次 | 搜索用了 `history: 'push'`。搜索保持 replace |
| 后退后输入框是旧词 | effect 在组合中把 URL 写回了 draft，或根本没有同步 |
| 拼音被截断 | `onChange` 在 `compositionStart` 之后仍 `commit` |
| 页码是负数仍去请求 | 只用了 `parseAsInteger`，没有 `deriveSearchView` 的夹取 |
| basic 结果比预期少 | 地址栏残留 `ll_c19_group`，而 basic 没有把它强制成 `all` |
| `await setPage()` 之后以为数据到了 | 这个 Promise 只表示 URL 写完 |
| Safari 历史报错 | 写入过快。要用 `limitUrlUpdates`，并且请求自己再防抖 |
| Next 页面数据不刷新 | 那是 `shallow` 和 RSC 的问题。本 SPA 没有这条路径 |

自定义 parser 若用数组当默认值，每次 render 的新引用会让 `clearOnDefault` 失效。需要 `eq`。日期若放进 URL，用 `YYYY-MM-DD` 这种日历日，不要用带本地时区的 `Date.toString()`。

`parseAsNativeArrayOf` 对应重复键 `?tag=a&tag=b`。`parseAsArrayOf` 常用逗号。和旧链接兼容时先定一种，不要两种一起读同一个键。

服务端仍要鉴权、租户隔离和参数化查询。React 文本节点会转义名称。不要把查询串再塞进 HTML。

## 从旧写法迁出

自写的 `history.replaceState` 先列出真正要分享的字段，再收成 parser。删掉散落的 `parseInt`。为后退和 replace 各写一条测试。v1 的 `throttleMs` 换成 `limitUrlUpdates`。`nuqs/parsers` 换成现在的入口。

进阶若要把排序放进 URL，用自定义 `createParser`，`parse` / `serialize` / `eq` 都要写，列名走白名单。界面语言可以是中文，URL 里的分组值仍是 `tech` 和 `business`，不要把翻译后的「技术」写进查询串。

## 官方链接

- https://nuqs.dev/docs/adapters
- https://nuqs.dev/docs/basic-usage
- https://nuqs.dev/docs/parsers/built-in
- https://github.com/47ng/nuqs

SSR 若以后要做，`createSearchParamsCache` 必须在当前请求里 `parse`，不能放进模块级变量跨用户复用。本 Lab 是客户端路由，初始值来自浏览器地址栏。hydration 不一致的修法是适配器拿到同一次 search，而不是在 effect 里先渲染默认值再改 URL。

```tsx
const [page, setPage] = useQueryState(
  'll_c19_page',
  parseAsInteger.withDefault(1).withOptions({
    history: level === 'advanced' ? 'push' : 'replace',
  }),
)
```

页码 parser 在 advanced 和另外两层不一样。切换 level 时 nuqs 会按当前选项解释同一个键。不要在三个组件里各写一个 `page` 键。分组的 `setGroup(null)` 表示回到默认 `all` 并从 URL 去掉该键。传 `'all'` 会把默认值写进地址栏，和「空即全部」的约定相反。

`deriveSearchView` 先清洗查询，再决定分组，再过滤，再算页数，最后夹页码。顺序反了会出现「页码合法但切片为空」。`pageItems` 只给 business 和 advanced 的列表。basic 渲染全部 `matches`，否则每页 2 条会让入门看起来像坏了。清除按钮同时 `setQuery(null)`、`setPage(null)` 和 `setGroup(null)`，并清空 draft。只清 draft 会在 effect 里被 URL 填回来。

`history: 'replace'` 的搜索仍会触发使用这些 state 的组件渲染。没有接口时只是本地过滤。接上 Query 之后，queryKey 用 `safeQuery` 和 `safeGroup`，不要用尚未提交的 `draft`，否则组合中的拼音会打出请求。

## 证据

`url-policy` 单测不经过 TanStack Router，也没有 history。sdk 要真实 import `nuqs@2.10.1` 并在 `docs/library-lab/evidence/runs/` 留下收据。后退和 IME 属于 browser。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C19 的条目 PASS。不要改 `verification.json`。
