# @react-pdf/renderer 4.9.0｜点击之后才生成 PDF

Lab 锁定 `@react-pdf/renderer@4.9.0`（MIT）。它用 React 元素排出一份新的 PDF。它不打开用户已有的文件。阅读用 F07 或 F06，改已有字节用 F09。三个包不要因为名字都带 pdf 就互换。

用户显式启动后挂载 [`examples/demo.tsx`](examples/demo.tsx) → [`examples/example.tsx`](examples/example.tsx)。版式在 [`examples/report.tsx`](examples/report.tsx)。校验在 [`examples/report-policy.mjs`](examples/report-policy.mjs)，Node 与浏览器共用。

没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。Actions 41779873259 是仓库级安装、类型检查、构建、52 个 SDK 文件 / 153 项测试和 45 项 Playwright，不是本条目 PASS。

## Lab 当前示例

| 文件 | 作用 |
| --- | --- |
| `examples/report.tsx` | `Document` / `Page` / `Text` / `View`，Helvetica，A4 |
| `examples/example.tsx` | 点击后 `pdf(<ReportDocument />).toBlob()` |
| `examples/report-policy.mjs` | 1–140 行、ASCII 名称、非负文章数 |
| `tests/policy.test.mjs` | 纯策略，不加载 renderer |

页面不会在挂载时生成文件。按钮触发。`running` ref 在 React 把 `disabled` 画出来之前就挡住第二次点击。`epoch` 在卸载时增加。旧的 `toBlob()` 回来后如果代号不对，就不创建 URL。

已有的 object URL 放在 `liveURL`。新的成功结果会先 `revoke` 旧的。卸载 effect 再 revoke 一次。失败路径也会 revoke 并清空。

字体只有标准 Helvetica。名称必须是可打印 ASCII。没有嵌入中文字体，也不要从网络拉字体。生产若要中文，是另一项许可和子集工作，本页没有挂载。

## 1. 什么时候用

发票、简报、来源清单这类版式固定、数据已在手的 PDF。浏览器里预览别人上传的 PDF 用 F07。要在已有文件上盖字用 F09。

不要用它复刻整页 HTML。Flex 和分页规则与 CSS 不完全相同。`wrap={false}` 会把一行挪到下一页，而不是把一个字拆开。

## 2. 模型

```text
rows → validatedRows → <ReportDocument> → pdf(element).toBlob()
  → 检查 type 与 size → createObjectURL → <a download>
```

`validatedRows`：1 到 140 行；id 匹配 `^[a-z0-9][a-z0-9_-]{0,47}$`，按小写去重；name 为 1–70 个 `\x20-\x7e`；`articles` 是 0 到 1 000 000 的安全整数。组件不再拉取图片或字体。

样式用 `StyleSheet.create`。页脚 `fixed`，`render` 里写 `pageNumber` 和 `totalPages`。每行 `wrap={false}`。

Blob 必须是 `application/pdf` 且至少 100 字节，否则当失败。这只排除空结果，不是 PDF 语法证明。

basic 只用第一行。business 用三行夹具：React Notes 18、DevOps Weekly 26、Security Updates 11。advanced 在内存里造 100 行 `Local Feed`，仍低于 140 的上限。

## 3. 三层

### 基本

按钮「创建 PDF」。成功后状态写出行数，链接可下载 `reactloom-report.pdf`，并显示字节数。没有预先放置的样例文件。

### 业务

三行都进同一张 A4。表头是 Feed / Articles。这是版式演示，不是真实 RSS 拉取。

### 进阶

100 行用来观察自动换页和页脚。策略仍拒绝第 141 行。文案说明字体子集和中文要另测。不要在这个按钮里请求外部图片。

## 4. 反例

### 反例 1：挂载时就 toBlob

```tsx
useEffect(() => { void pdf(<Report />).toBlob() }, [])
```

用户还没要文件，内存和 URL 已经出现。本页只在点击时生成。

### 反例 2：只靠 disabled

```tsx
<button disabled={busy} onClick={generate} />
```

两次点击可以在 `setBusy(true)` 之前都进到函数。`running.current` 要同步挡住。

### 反例 3：不 revoke

```tsx
setUrl(URL.createObjectURL(blob))
```

每次成功都泄漏一个 blob URL。替换前 revoke，卸载时再 revoke。失败也要清掉上一次的链接。

### 反例 4：中文直接进 Helvetica

```tsx
<Text>订阅源周报</Text>
```

标准字体没有这些字形。策略会拒绝非 ASCII 的 name。要中文就嵌入有许可的字体，并单独看体积。本页不嵌入。

### 反例 5：把 HTML 组件塞进来

`<div>` 和 `<span>` 不是这个渲染器的原语。用 `View` 和 `Text`。样式里也不要写浏览器才有的选择器。

### 反例 6：无界行数

100 行是夹具。`validatedRows` 到 140 就抛错。不要为了「看看分页」去掉上限，也不要在主线程上生成上万行。

### 反例 7：外部图片和字体 URL

```tsx
<Image src="https://example.com/logo.png" />
```

生成过程会去拉取。本页禁止。数据保持离线。

### 反例 8：过期 Blob 仍给链接

卸载或再次点击后，旧 promise 不能 `setUrl`。核对 `epoch`。`finally` 只在代号仍匹配时清 `running`，避免第二次合法点击被提前放开。

## 5. 组合

**F07**：生成后的 Blob 可以交给阅读器，但要复制字节并遵守 3 MiB 上限。本页没有嵌阅读器。下载链接不是预览画布。

**F09**：声明式版式用 renderer。合并、盖章、改已有文件用 pdf-lib。不要用 renderer 去 `load` 用户 PDF。

**F03 / F04**：表格数据可以来自 CSV 或 xlsx 清洗。进 `validatedRows` 之前先丢掉非 ASCII 和控制字符。本页的夹具是写死的。

## 6. 清单

- 点击前不生成；同步 ref 防连点。
- 行先校验再进组件。
- Blob 类型和最小长度不符就 revoke 并报错。
- 成功替换 URL 时回收旧的。
- 页脚使用库提供的页码，不自己数行数冒充页码。
- 不请求字体、图片或用户文件。
- 下载文件名固定，不含用户输入。
- 策略单测不能代替 `pdf().toBlob()`。

## 7. 升级

4.9 的 `pdf().toBlob()` 和 `StyleSheet` 是这条示例的合同。升级时看 changelog：https://react-pdf.org/changelog 。Yoga 分页和标准字体的行为要以当时的 v4 文档为准：https://react-pdf.org/docs/v4 。

不要升到会改变 `fixed` 页脚或 `wrap` 语义的版本而不重做 100 行夹具。中文字体方案不要顺手加进 Lab。

## 8. 验收

```bash
node --test packages/library-lab/entries/F08-react-pdf-renderer/tests/policy.test.mjs
```

不加载 renderer。SDK 要看到真实的 `toBlob()`：类型、大小、连点只产生一次、卸载后不再留下 URL。浏览器还要打开下载的文件，确认能翻页。没有收据就保持 NOT_RUN。Node 侧的 `renderToBuffer` 本页没有调用，不要把浏览器 Blob 写成服务端已验收。

## 9. 排版和失败

这个渲染器的 flex 不等于浏览器 CSS。`wrap={false}` 把整行推到下一页。页脚是 `fixed`，用库给的 `pageNumber` 和 `totalPages`，不要用行数除以某个常数冒充页码。

标准字体只有拉丁字形。夹具名称因此限制在可打印 ASCII。嵌入字体要有许可、要看子集体积，并且会改变 `toBlob()` 的时间。本页不嵌入，也不在生成时请求字体 URL。

图片同样不请求。没有 `<Image>`。Logo、网络图表、用户头像都是未挂载的生产教学。

失败路径要清掉上一次的链接：类型不是 `application/pdf`，或小于 100 字节，或 `validatedRows` 抛错。100 字节约掉空 blob，不证明交叉引用表正确。要确认能打开，得在下载之后用阅读器看，本页没有嵌 F07。

连点：第一次把 `running` 设为 true，第二次在同一个事件里返回。`disabled={busy}` 只是提示。卸载增加 epoch，晚到的 blob 不创建 URL。换 level 靠外层 `key` 卸掉整棵会话，effect 会 revoke。

100 行夹具的 id 是 `source-0` 这种形式，名称是 `Local Feed N`，文章数 `(i * 7) % 50`。它低于 140 的上限，用来看分页，不是压力测试。第 141 行必须在调用 `pdf()` 之前抛错。

## 10. 故障对照

| 现象 | 先看 |
| --- | --- |
| 一进页面就下载 | 生成被放进了 effect。应只在按钮里 |
| 点两次出两个链接 | `running` ref 被删，只剩 disabled |
| 旧链接还能打开已卸的文档 | revoke 没做，或做在 setUrl 之前又被覆盖 |
| 中文是方框 | Helvetica。策略应已拒绝非 ASCII 名称 |
| 页脚页码不对 | 用了自己数的行，没有用 `render` 的 totalPages |
| 100 行只剩一页且重叠 | `wrap={false}` 被去掉，或 Page 没有 wrap |
| 生成中换场景仍写出链接 | epoch 在卸载时没有增加 |

可访问性：按钮在 busy 时禁用，状态在 `role="status"`。下载链接是普通 `<a download>`，文件名固定为 `reactloom-report.pdf`，不含用户输入。没有键盘陷阱，因为没有弹层。

和 F04 的差别：Excel 有单元格和公式缓存；这里是分页文本。和 F09 的差别：不能 `load` 一份已有 PDF 再盖章。需要盖章就换库，而不是在 Text 里写「已审核」就算改过原文件。

## 11. 资料

- https://react-pdf.org/docs/v4
- https://react-pdf.org/docs/v4/advanced/on-the-fly-rendering
- https://react-pdf.org/changelog

## 12. 生成之前的数据合同

`validatedRows` 在 `pdf()` 之前执行。id 只能是字母数字、下划线和连字符，最长 48，按小写去重。name 是 1 到 70 个可打印 ASCII。articles 是 0 到 1 000 000 的安全整数。行数 1 到 140。

basic 取夹具第一行。business 取三行。advanced 在内存里造 100 行，id 形如 `source-0`，名称 `Local Feed N`。这 100 行用来看 `wrap={false}` 和固定页脚，不是压测。第 141 行必须抛错，并且不会去 `toBlob()`。

页脚文案是 `ReactLoom lab  -  Page n of m`。m 来自渲染器，不来自行数除法。标题、作者、主题都是固定英文，避免把用户字符串写进文档信息。

下载名 `reactloom-report.pdf`。字节数显示的是 Blob.size。类型必须是 `application/pdf`，且不小于 100。不满足就 revoke 并清空链接。

对象 URL 只有一份活的。新的成功会回收旧的。失败和卸载也会回收。换 level 靠 `key` 卸掉会话。`running` 在 await 之前置位，`finally` 只放开同一次 epoch。

没有 `renderToBuffer`，没有中文字体，没有网络图片。打开下载文件才能谈分页外观。策略测试不调用渲染器。没有收据时 sdk 与 browser 保持 NOT_RUN。

样式用 `StyleSheet.create`，页面 A4，字体 Helvetica，字号 11。表头是 Feed 与 Articles。每行 `wrap={false}`。不要把 `<div>` 写进这棵树。不要在挂载时调用 `toBlob()`。按钮文案在 busy 时是「生成中…」。

连点若只依赖 `disabled`，第一次重绘前的第二次点击仍会进入函数。`running` ref 必须留在 await 之前。旧 URL 在写入新 URL 之前回收。

页脚使用渲染器给出的页码。

名称含非 ASCII 时在 `pdf()` 之前失败。

下载链接只在本次 epoch 仍有效时出现。

不把用户数据写进 PDF 信息字典。

策略单测通过之后，sdk 仍是 NOT_RUN。
