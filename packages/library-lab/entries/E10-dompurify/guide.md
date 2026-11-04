# DOMPurify 3.4.17｜先限定词表，再渲染

Lab 锁定 `dompurify@3.4.17`。它清理 HTML 字符串。它不决定业务能不能发公告，也不代替 CSP。React 默认文本不需要它。只有必须显示受限富文本时才用。

没有浏览器收据时不要写 PASS。策略单测不 import DOMPurify，不能当成 XSS 已测。Actions [41779873259](https://github.com/CoderLambert/ReactLoom/actions/runs/41779873259) 不是本条目的 DOM 证明。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 调用 `DOMPurify.sanitize(dirty, htmlPolicy)`。[`examples/html-policy.mjs`](examples/html-policy.mjs) 是固定词表。

已挂载：

- 允许的标签是 `section`、标题、段落、强调、列表、引用、`code`、`pre`、`a`。没有 `script`、`img`、`iframe`、`style`、`svg`。
- 属性只有 `href` 和 `title`。
- `ALLOWED_URI_REGEXP` 只接受 `https://主机` 这种形式。带用户信息的 URL、`javascript:`、`data:` 对不上。
- 不设置 `USE_PROFILES`。注释写明 profile 会压过 `ALLOWED_TAGS`，所以不要两者一起开。
- 预览把净化后的字符串交给受控展示。输入是本地样例：普通段落、带 https 链接的公告、以及含攻击字符串的 advanced 样本。
- 每次 `dirty` 变化重新 sanitize。不要缓存「上次净化结果」给新字符串。

没有挂载：可信类型（Trusted Types）、钩子 `uponSanitizeAttribute`、服务端 jsdom 净化。浏览器里有没有真的去掉 `<script>` 要看 DOM，单测只检查策略常量。

## 1. 顺序

```text
不可信字符串 → sanitize(html, htmlPolicy) → 再放进预览
```

先拼接再净化，不要净化 A 和 B 再拼回去。净化后的字符串仍然不要送进 `eval`。

## 2. 反例

### 反例 1：默认配置当安全策略

```ts
DOMPurify.sanitize(userHtml)
```

默认允许的标签比 Lab 多。业务公告用显式 `ALLOWED_TAGS` / `ALLOWED_ATTR`。

### 反例 2：USE_PROFILES 加上允许列表

```ts
DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, ALLOWED_TAGS: ['p'] })
```

profile 优先，允许列表会被忽略。Lab 只写允许列表。

### 反例 3：放开 href

```ts
ALLOWED_ATTR: ['href', 'style', 'onerror']
```

`style` 和事件属性不在 Lab 的列表里。链接只留 https。

### 反例 4：用正则自己删 script

```ts
html.replace(/<script>/gi, '')
```

绕过方式很多。用 DOMPurify，并在浏览器里看净化后的 DOM，而不是看字符串里还有没有单词 script。

### 反例 5：把净化结果当纯文本又当 HTML

React 文本节点会转义。若预览用 HTML 插入，必须是 sanitize 的返回值，且策略没被调用方改掉。

### 反例 6：策略单测等于 XSS 通过

`html-policy.test.mjs` 只断言标签数组和正则。它不创建 DOM，不跑 `sanitize`。

## 3. 组合

**react-markdown**：Markdown 走 remark，HTML 节点再决定要不要进 DOMPurify。不要两条管道各放宽一次。

**CSP**：净化减少危险标记，CSP 仍要限制脚本源。两者不是替代关系。

## 4. 练习

1. 在 advanced 样例里加入 `<img onerror>` 和 `javascript:` 链接，浏览器里确认预览 DOM 没有这些节点。
2. 确认 `USE_PROFILES` 没有出现在调用点。
3. 不要把用户 HTML 写进日志全文。

## 5. 证据

浏览器 DOM 断言和 CSP 都还没有收据。sdk 只有在真实 import `dompurify` 并记录日志之后才是 PASS。

## 6. 资料

- https://github.com/cure53/DOMPurify
- https://www.npmjs.com/package/dompurify
