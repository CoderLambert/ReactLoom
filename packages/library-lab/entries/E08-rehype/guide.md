# rehype 13.0.2｜先净化 HAST，再放进无脚本 iframe

`library.json` 钉住 `rehype@13.0.2` 与 `rehype-sanitize@6.0.0`，MIT。rehype 处理 HTML 的抽象语法树（hast）。本条目用它把不可信 HTML 收成一份允许列表里的字符串。它不解析 Markdown（那是 E07），也不替代浏览器 DOM 上的 DOMPurify（E10）在所有 sink 上的角色。Markdown 预览若已经走 E06 的 React 元素，不必再把同一段内容变成 HTML 字符串。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。允许列表在 [`examples/sanitize-policy.mjs`](examples/sanitize-policy.mjs) 的 `strictHtmlSchema`，React 与测试共用。

用户点开 Demo 后编辑文本框。**要点「运行安全处理器」才会解析。** 换 level 清空输出和错误。没有 `localhost:5173` 工作台。

顺序写在源码注释里：解析 HTML 到 hast，净化，然后才 stringify。预览用的是净化后的字符串，不是原始输入。

```ts
rehype().use(rehypeSanitize, strictHtmlSchema).processSync(input)
```

字节数超过 25_000 抛错。文本框 `maxLength` 同为 25_000。

`strictHtmlSchema`：

- 标签：`article`、`h2`–`h4`、`p`、`strong`、`em`、`b`、`i`、列表、`blockquote`、`code`、`pre`、`br`、`a`。
- `a` 只留 `title`。没有 `href`。
- `protocols.href` 是空数组，不保留可导航 URL。
- `strip`：`script`、`style`、`iframe`、`form`、`svg`、`math`、`object`、`embed`、`template`、`textarea`。

预览 iframe：`sandbox=""`（没有 `allow-scripts`，没有 `allow-same-origin`），`referrerPolicy="no-referrer"`，`srcDoc` 里再加一条 `default-src 'none'` 的 CSP，禁止脚本、连接、图片、子框架和表单。注释写明：不能只靠 iframe CSP，链接和媒体在 schema 里就已经去掉。

| 层 | 输入 | 挂载结果 |
| --- | --- | --- |
| basic | 标题和加粗 | 净化后的源码文本 + iframe |
| business | `article`、https 链接、列表 | 链接文字可留下，href 不留下 |
| advanced | `onclick`、`onerror`、`script`、`javascript:`、iframe | 输出源码里不应再有这些可执行结构 |

页面状态写「真实 XSS 与网络验证仍须 Playwright」。**不要把这次预览写成浏览器 XSS 已测。**

没有挂载：remark 插件链、自定义组件映射、远程图片代理、服务端 jsdom。

## 1. 什么时候用 rehype

| 任务 | 选择 |
| --- | --- |
| 已有 HTML 片段，要在统一 AST 流水线里裁剪 | rehype + 这份 schema |
| Markdown 源码 | 先 E07 或直接 E06 |
| 浏览器里唯一 sink 是 `dangerouslySetInnerHTML`，策略用 DOM API | E10 |
| 只读代码 | E09 的文本 token，不要把代码当 HTML 解析 |

顺序重要：先 schema，再字符串，再进 iframe。把原始 HTML 先写进 iframe、再打算净化，窗口已经打开。

## 2. 运行模型

```text
HTML 字符串
    │ 超过 25KiB 则拒绝
    ▼
rehype parse → hast
    │
    ▼
rehype-sanitize(strictHtmlSchema)
    │
    ▼
stringify → 文本 <pre>
    │
    └─ srcDoc iframe（sandbox 空、CSP 全无）
```

hast 节点不是 DOM 节点。schema 在树上行进。`processSync` 在按钮点击时同步跑，避免把半成品异步写回。生产若文档更大，应放到可取消的任务，而不是在渲染函数里调用。

官方说明：[rehype](https://github.com/rehypejs/rehype)、[rehype-sanitize](https://github.com/rehypejs/rehype-sanitize)。iframe 的 `sandbox` 见 [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)。

## 3. 三层

在 Library Lab 打开 E08 再运行，然后点按钮。

### 基本

输出源码仍能看到标题和加粗一类结构。iframe 里是同一份字符串。输入框继续显示原文，原文不会被按钮改写。

### 业务

样例有 `<a href="https://example.org">`。schema 不允许 `href`，所以预览里不应当出现可点击的外链。文字「原始来源」可以留下。这是 RSS 公告教学，没有网络请求。

### 进阶

样例堆了事件属性、脚本、错误图片、`javascript:` 和 iframe。看 `<pre data-testid="rehype-output">` 的文本，而不是只看 iframe 的外观。外观正常可能只是因为脚本没跑，源码里仍可能残留你没禁的属性。本 schema 的目标是源码里也不留脚本和导航。

## 4. 反例（带代码）

### 反例 1：先预览再净化

```tsx
<iframe srcDoc={source} />
const clean = sanitize(source)
```

Lab 只有在 `output` 已是净化字符串时才创建 iframe。

### 反例 2：sandbox 上加 allow-scripts

```tsx
<iframe sandbox="allow-scripts allow-same-origin" srcDoc={clean} />
```

空的 `sandbox` 才是本示例的隔离。加上脚本和同源，等于把净化失败的后果放大。CSP 也不能代替 schema。

### 反例 3：用默认 sanitize 代替 strictHtmlSchema

```ts
rehype().use(rehypeSanitize).processSync(input)
```

默认列表比本文件宽，可能留下本条目明确 strip 的标签。必须传入 `strictHtmlSchema`。

### 反例 4：为了链接能点而打开全部协议

```js
protocols: { href: ['http', 'https', 'javascript'] }
```

本 schema 的 `protocols.href` 是空数组，并且 `a` 的属性里根本没有 `href`。产品若要站内链接，单独加允许的相对路径，并写负例。不要恢复 `javascript:`。

### 反例 5：正则删除 script

```ts
input.replace(/<script[\s\S]*?<\/script>/gi, '')
```

换行、注释和浏览器解析差异会漏。用 hast。

### 反例 6：把净化字符串再拼进模板

```ts
`<a href="${user}">` + clean
```

拼接发生在净化之后，schema 管不到。链接目标在进处理器之前就要是数据，而不是字符串拼接。

### 反例 7：在渲染期间 processSync 大文档

```tsx
const html = useMemo(() => sanitizeHtml(source), [source])
```

Lab 用按钮，是为了大字符串和错误态可见。若改成输入即处理，仍要保留字节上限和错误边界。不要在 SSR 里对不可信 HTML 无限制同步解析。

### 反例 8：iframe 当成可信文档

父页面不要读 `iframe.contentDocument` 再插回主 DOM。`sandbox` 不含 `allow-same-origin` 时，这种读取本来就应失败。不要为了测试方便加回该令牌。

## 5. 组合（未挂载）

**E07 → E08。** remark 只出 Markdown 或指出危险链接。若发布格式是 HTML，用明确的 Markdown→HTML 步骤，再进这份 schema。不要跳过 schema 直接 iframe。

**E06。** react-markdown 已经用 React 元素和 `skipHtml`。不要再把同一预览 outerHTML 送进 rehype，形成第二个不可审计的序列化。

**E10。** DOMPurify 在真实 DOM 上工作，配置是 `ALLOWED_TAGS` 而不是 hast schema。两套允许列表不会自动相等。选定一个 sink 一种策略，避免「净化了两次所以更安全」的错觉。第二次若用更宽的配置，会把第一次收紧的结果再放宽。

## 6. 同类

| 输入 | 工具 |
| --- | --- |
| Markdown | E06 / E07 |
| HTML 字符串，要 AST 流水线 | E08 |
| HTML 字符串，要 DOM 净化器 | E10 |
| 代码文本 | E09 |

## 7. 升级核对

- `rehype@13` 与 `rehype-sanitize@6` 的 schema 字段（`tagNames`、`attributes`、`protocols`、`strip`）按当前文件写，不从 sanitize 5 的文章抄类型。
- 升级后用 advanced 样例对比输出源码，而不是只看 iframe 是否空白。
- 放宽标签时同步改 `sanitize-policy.mjs` 和负例。不要在组件里内联另一份 schema。

## 8. 故障

| 现象 | 先看 |
| --- | --- |
| 按钮报超过 25KiB | 字节上限，不是样式 |
| 链接不能点 | schema 故意去掉 href |
| iframe 空白但 pre 有字 | 沙箱和 CSP。先读 pre |
| 输出仍有 script | 是否忘了传入 `strictHtmlSchema` |
| 换层仍显示旧 HTML | effect 应清空 `output` |
| 父页面能访问 iframe DOM | sandbox 被加了令牌 |

## 9. 练习（未挂载）

1. 只允许站内路径的 `href`，拒绝 `https:` 外链和 `javascript:`。用 advanced 样例加三条负例。
2. 把按钮改为可取消的异步处理，卸载后不得 `setOutput`。

## 10. 验收

清单，不是已通过的记录：

1. 未点按钮时没有 iframe。
2. basic 的 pre 与 iframe 使用同一字符串。
3. business 的输出源码没有 `href=`。
4. advanced 的输出源码没有 `script`、`onclick`、`onerror`、`javascript:`、`iframe`。
5. iframe 的 sandbox 属性为空字符串。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E08 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目的 XSS 通过。

## 11. 资料

- https://github.com/rehypejs/rehype
- https://github.com/rehypejs/rehype-sanitize
- https://github.com/syntax-tree/hast
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
