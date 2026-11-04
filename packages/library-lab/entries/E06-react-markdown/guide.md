# react-markdown 10.1.0｜默认不执行 HTML 的安全预览

`library.json` 钉住 `react-markdown@10.1.0`、`remark-gfm@4.0.1`、`rehype-sanitize@6.0.0`，MIT。它把 Markdown 变成 React 元素。它不是编辑器，不是 HTML 净化器的通用替代，也不是流式 Markdown 解析器。源码里的 HTML、脚本和危险 URL 默认不应变成可执行节点。

纯文本用 React 子节点。要编辑 Markdown 源码用 E04。要在 mdast 上做结构审计用 E07。要净化一段已经是 HTML 的字符串用 E08 或 E10。只读代码着色用 E09。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。URL 和组件策略在 [`examples/render-policy.mjs`](examples/render-policy.mjs)，React 预览和测试共用这一份。

用户点开 Demo 后才出现文本框和预览。没有 `src/App.tsx`，也没有单独的 `localhost:5173`。换 level 时，若宿主复用了同一组件实例，effect 会把样例原文换掉。

三层都渲染同一条管线：

```tsx
<Markdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeSanitize]}
  skipHtml
  urlTransform={safeMarkdownURL}
  components={markdownComponents}
>{source}</Markdown>
```

| 层 | 样例里有什么 | 你应该看到 |
| --- | --- | --- |
| basic | 标题、加粗、行内代码、一条 https 文档链接 | React 元素，不是 innerHTML |
| business | GFM 表、任务列表 | 表格和勾选框来自 remark-gfm |
| advanced | `javascript:` 链接、`<img onerror>`、`<script>`、远程图片 | 脚本不执行；不安全链接变成带标题的 `span`；图片变成「图片外链被禁用」文本 |

挂载的约束：

- 文本框 `maxLength={12000}`，受控 `value`。
- `skipHtml`：Markdown 里的原始 HTML 不进入渲染。
- `rehypeSanitize` 再收一层 hast。
- `safeMarkdownURL` 拒绝含控制字符或 DEL 的字符串；页内锚只允许 `#` 加有限字符；其他地址必须能被 `URL` 解析、协议为 `https:`、有主机名、没有用户名和密码。失败返回空字符串。
- `markdownComponents.a` 不把不可信 props 展开到 DOM。空的安全 URL 渲染成 `span`。站外链接带 `target="_blank"` 和 `rel="noopener noreferrer"`。
- `img` 忽略 `src`，只保留 alt 文本。

没有挂载：按文章 id 拉取正文、Shiki 代码块、流式不完整语法、服务端组件缓存。advanced 的提示文案要求你观察没有代码执行，**这不是浏览器 XSS 验收记录**。

## 1. 什么时候用

| 任务 | 判断 |
| --- | --- |
| 知识库、RSS、报告的只读预览 | 适合，并保持本示例的插件和 URL 策略 |
| 用户要改 Markdown | 左边 E04 或 textarea，右边才是本库 |
| 正文本来就是不可信 HTML | E10 或 E08，不要假装 Markdown 组件能净化任意 HTML |
| AI 流式半截标记 | 另选面向流的渲染；一次完整 `Markdown` 会按当前字符串重解析 |
| 需要执行 Markdown 里的脚本 | 不要。那不是这个库的用途 |

## 2. 数据流

```text
textarea 字符串（React state 拥有原文）
        │
        ▼
remark-parse + remark-gfm → mdast
        │
        ▼
remark-rehype（react-markdown 内部）→ hast
        │
        ▼
rehype-sanitize + skipHtml
        │
        ▼
urlTransform + components → React 元素
```

原文权威在 state。预览是派生视图。不要把渲染出的 DOM 再 innerHTML 回去当存储。

v10 的关键面，以官方仓库为准：[react-markdown](https://github.com/remarkjs/react-markdown)。

- 子节点是 Markdown 字符串，不是已解析的 HTML。
- `remarkPlugins` 先跑。本示例只加 `remark-gfm`。
- `rehypePlugins` 后跑。本示例只加 `rehype-sanitize` 的默认调用。没有把自定义 schema 传进去；更窄的标签策略在 E08。
- `urlTransform` 在默认变换之后仍由我们的函数决定最终 URL。返回 `''` 表示丢掉。
- `components` 替换元素。不展开未知 props。

## 3. 三层

### 基本

改左边原文，右边标题和链接跟着变。链接应指向 https 的 GitHub 文档页。重置按钮恢复该层样例。

### 业务

样例是一份「接口验收报告」。表格和任务列表依赖 `remark-gfm@4.0.1`。状态列里的 PASS / NOT_RUN 是样例文字，不是本条目的测试结果。编辑单元格文字应立即反映到预览。这不是从 Query 缓存来的文章。

### 进阶

样例故意包含四类不可信输入。预期：

- `javascript:alert(1)` 不是 `<a href>`。
- `<script>` 与 `<img onerror>` 因为 `skipHtml` 不成为元素。
- 远程图片不发请求，预览里是一段说明文字。

若你在元素检查器里看到 `script`、`onerror` 或 `javascript:`，先核对是不是改过 `components` 或删了 `skipHtml`。即便页面看起来正常，也没有 Playwright 收据，不能写 XSS 已测。

## 4. 反例（带代码）

### 反例 1：打开原始 HTML

```tsx
<Markdown rehypePlugins={[rehypeRaw]}>{source}</Markdown>
```

不可信 Markdown 里的 HTML 会进入 hast。本示例用 `skipHtml`，并且不安装 raw 插件。

### 反例 2：默认 urlTransform

```tsx
<Markdown>{userMarkdown}</Markdown>
```

默认变换比本策略宽。Lab 显式传入 `safeMarkdownURL`，拒绝 `javascript:`、协议相对 URL 和带凭据的 https。

### 反例 3：把节点 props 摊到 DOM

```tsx
a: (props) => <a {...props} />
```

mdast 上的未知字段会变成属性。Lab 只读 `href` 和 `children`，并且 href 再过一次策略。

### 反例 4：允许图片 src

```tsx
img: ({ src, alt }) => <img src={src} alt={alt} />
```

远程图片是请求，也可能是跟踪。本示例渲染成文本。若产品必须显示图，单独做允许的主机名单和 referrer 策略，不要在这个组件里放开。

### 反例 5：用正则删 script 再渲染

```tsx
<Markdown>{source.replace(/<script/gi, '')}</Markdown>
```

编码和换行可以绕过正则。用解析器和 `skipHtml`，不要自己删标签。

### 反例 6：每个 token 都重渲染整站

把 `source` 放进全局 store，侧栏和路由一起订阅。原文留在这个组件的 state。真正的文章正文用 Query，提交时再写入，而不是每个键击。

### 反例 7：把预览 HTML 存进数据库

```tsx
previewRef.current.innerHTML
```

存储 Markdown 源和版本。展示时再跑这条管线。DOM 序列化会丢掉「哪些插件当时开着」。

### 反例 8：流式半截表格当成稳定文档

AI 还在输出时，GFM 表可能缺分隔行。本组件会按当前完整字符串重解析，半截语法会闪。流式场景不要直接套这个受控预览，除非你接受重解析，或换成专门的流式渲染。Lab 没有挂流式适配器。

## 5. 中文、SSR、性能

文本框是原生 textarea，中文输入由浏览器处理。预览在合成结束后随 state 更新。不要在 composition 期间替换 `value`。

react-markdown 可以在服务端输出 React 元素。危险 URL 策略是纯函数，不依赖 `window`。图片策略也是。若你们在 SSR 里改 `components` 去用客户端专属组件，要避免水合不一致。

12_000 字符的上限是文本框限制，不是性能承诺。更长的文档应分页或在 Worker 里解析。本示例没有 Worker。

可访问性：文本框有 label。预览区有名字。任务列表的勾选状态来自 GFM，不是本示例做的键盘组件。对比度和读屏没有收据。

## 6. 组合（未挂载）

**TanStack Query + 本库 + rehype-sanitize。** Query 拥有文章原文和取消。组件只接收字符串。保存的是 Markdown，不是预览 DOM。403 不渲染上一篇的预览到新路由。

**E04 + 本库。** 左边 EditorView，右边这份预览。两边不要共用一个 DOM 节点。

**E09。** `components.code` 可以把围栏代码交给 Shiki 的文本 token。不要 `dangerouslySetInnerHTML` 贴 Shiki HTML。Lab 的 E06 没有接 Shiki。

**E11。** 持续增长的不完整 Markdown 与一次渲染是不同问题。不要把本组件说成流式方案。

## 7. 同类

| 方案 | 何时 |
| --- | --- |
| react-markdown 10.1.0 | 只读、React 元素、可插 remark/rehype |
| E07 remark | 只要 mdast、规范化字符串、审计 |
| E08 rehype | 输入已经是 HTML |
| E10 DOMPurify | 浏览器 DOM 上的 HTML 字符串 sink |
| 自己正则 | 不要用于不可信内容 |

## 8. 升级核对

- `react-markdown` 10 与 9 的插件写法不同。不要把 `className` 变换器从旧文抄来而不看类型。
- `remark-gfm` 锁定 4.0.1，和 remark 主版本要一起看。E07 用的也是 4.0.1。
- `rehype-sanitize` 6.0.0 的 schema 形状与更早主版本不同。本示例使用默认调用；收紧标签去改 E08 的 `strictHtmlSchema`，不要在两个条目各写一套却声称相同。
- 升级后用 advanced 样例看 `javascript:`、原始 HTML 和图片是否仍被挡住。没有浏览器收据就只记「待查」。

## 9. 故障

- 表格变成段落：忘了 `remarkGfm`。
- HTML 出现在预览里：删了 `skipHtml` 或加了 raw 插件。
- 正常 https 链接也没了：`safeMarkdownURL` 拒绝了空格、用户名或非 https。
- 锚点失效：只允许有限字符的 `#fragment`。
- 图片不显示：这是策略，不是网络故障。
- 换层后仍是上一层原文：effect 没有跑到。Lab 在 level 变化时 `setSource`。

## 10. 验收

1. basic：改一个字，预览变，没有脚本请求。
2. business：表格和任务列表出现。样例里的 PASS 字样不是验收结论。
3. advanced：检查 DOM 没有 `script`、`onerror`、`javascript:` href，图片不是 `img`。
4. 这三项都要在浏览器里做。做了才有收据。现在没有。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E06 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目的 XSS 通过。

## 11. 资料

- https://github.com/remarkjs/react-markdown
- https://github.com/remarkjs/remark-gfm
- https://github.com/rehypejs/rehype-sanitize
- https://github.com/remarkjs/react-markdown#security
