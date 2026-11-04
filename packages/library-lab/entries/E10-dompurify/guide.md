# DOMPurify 3.4.17｜先净化，再把字符串放进唯一的 HTML 预览

`library.json` 钉住 `dompurify@3.4.17`。许可是 **MPL-2.0 OR Apache-2.0**，不是 MIT。DOMPurify 在真实 DOM 上按允许列表清理 HTML。它不是 Markdown 解析器，不是富文本编辑器，也不是 CSP。

本条目只有一个 HTML sink：净化结果的 `dangerouslySetInnerHTML`。输入框和「净化后的 HTML 文本」都是普通文本。顺序是先 `DOMPurify.sanitize`，再预览。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。配置在 [`examples/html-policy.mjs`](examples/html-policy.mjs)，组件和测试共用，禁止在 JSX 里再写一套标签名单。

```tsx
const clean = useMemo(() => DOMPurify.sanitize(dirty, htmlPolicy), [dirty])
// 预览只用 clean
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

`htmlPolicy` 是固定词表，不是 DOMPurify 的宽默认配置：

```js
{
  ALLOWED_TAGS: ['section', 'h3', 'h4', 'p', 'strong', 'em', 'b', 'i', 'br',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a'],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOWED_URI_REGEXP: /^https:\/\/[a-z0-9.-]+(?::\d{1,5})?(?:[/?#]|$)/i,
}
```

文件头注释写明两件事，迁移时不要删：

1. 这不是默认的大 HTML profile。
2. **不要把 `USE_PROFILES` 和 `ALLOWED_TAGS` 一起开。** 官方语义里 profile 会盖过标签名单的直觉。本示例不设置 `USE_PROFILES`。

`ALLOWED_URI_REGEXP` 只匹配无用户信息的 `https://` 加主机名。它不是「任何看起来像网址的字符串」。复杂正则还有回溯成本，不要在生产里把表达式改成由用户配置。

| 层 | 样例 | 预览应基于 |
| --- | --- | --- |
| basic | 段落和 strong | 净化后的字符串 |
| business | section、h3、一条 https 链接、em | 同上 |
| advanced | `onclick`、`script`、`img onerror`、`javascript:`、`svg onload`、带 style 的段落 | 同上。页面要求检查 DOM，但 **没有浏览器 XSS 测试记录** |

文本框 `maxLength={12000}`。换 level 时 effect 重置原文。没有独立的 `workshop/` 工程，也没有 `localhost:5173`。

没有挂载：`USE_PROFILES`、`RETURN_DOM`、`RETURN_TRUSTED_TYPE`、全局 `setConfig`、`ADD_TAGS`、jsdom 服务端净化、钩子 `afterSanitize*`。advanced 的状态句是给人手看的检查提示，不是已执行的攻击测试。

## 1. 场景结论

| 任务 | DOMPurify 的位置 | 不适合时 |
| --- | --- | --- |
| 公告、CMS、RSS 的有限富文本 | 允许列表之后，唯一的 HTML sink 之前 | 正文只是纯文本。用 React 子节点 |
| Markdown | 不解析 Markdown。原始 HTML 若被别的库打开，才在该边界净化 | 用 E06 的 `skipHtml` 往往更合适 |
| 代码片段 | 通常不需要 | 用 E09 的文本 token |
| 必须保留脚本、iframe、小程序 | 这不是安全富文本 | 换隔离模型，不要放宽本策略来「显示出来」 |
| 服务端净化 | 需要维护中的 DOM 实现 | 不要假设本浏览器示例等于 SSR 已安全 |

原则：净化只对声明的 sink 负责。先定 sink，再定标签、属性和 URL，再准备破坏性样本。一次净化不能变成全站通行证。

## 2. 安全模型

```text
未知 HTML 字符串
    │ 文本框上限 12_000 字符（不是完整的字节预算）
    ▼
浏览器 DOM 解析（DOMPurify 内部）
    │
    ▼
ALLOWED_TAGS / ALLOWED_ATTR / ALLOWED_URI_REGEXP
    │
    ▼
净化后的字符串 clean
    ├─ <pre>{clean}</pre>     文本，不再解析
    └─ dangerouslySetInnerHTML 唯一 HTML sink
```

不要在 `clean` 后面拼接新的 `<a href>` 或 `<style>`。那一段没有再经过 `sanitize`。不要把 `clean` 放进 CSS、脚本模板、URL 参数或 SVG 的另一种解析器里，然后说 DOMPurify 已负责。

`sanitize` 在本文件里使用默认返回类型：字符串。`RETURN_DOM` 和 `RETURN_DOM_FRAGMENT` 会改变类型，React 的 `__html` 需要字符串。`RETURN_TRUSTED_TYPE` 只有在页面启用 Trusted Types 时才有意义，本示例没有开。

`DOMPurify.removed` 只能当调试时的旁路观察。它不是安全分数，也不是审计日志。不要用「removed 为空」证明输入无害。

`setConfig` 会影响后续调用。本示例每次把 `htmlPolicy` 传进 `sanitize`，不设全局配置，也不注册钩子，避免别的 Demo 改到同一实例的默认行为。

默认配置为了兼容富文本，往往比这份名单宽，并且可能留下 SVG、MathML 或 style。DOMPurify 不负责把 CSS 变成安全的，也不保证阻止远程请求。本名单没有 `img`、`svg`、`style`、`script`、`iframe`、`form`。这是这份公告预览的策略，不是「官方最安全默认值」的通用公式。

URL 和 HTML 是两件事。即使 `javascript:` 被丢掉，留下的 `https://` 链接仍然会导航到外站。本正则不检查路径是否属于你们的站点。产品若只允许自家文档，还要在路由层看主机名。`target=_blank` 需要 `rel=noopener`，本策略的属性名单里没有 `target` 和 `rel`，所以净化结果不应出现它们。

官方材料：[仓库](https://github.com/cure53/DOMPurify)、[3.4.17](https://www.npmjs.com/package/dompurify)、[安全目标](https://github.com/cure53/DOMPurify/wiki/Security-Goals-&-Threat-Model)。

## 3. 版本

3.4.17 是条目锁定的版本。安全库的升级要读发行说明，而不是只看 API 是否还能编译。已知需要记住的维护事实，来自上游说明而不是本 Lab 的利用测试：

- 3.4.16 之前的若干 3.4.x 在特定 `IN_PLACE` 与钩子组合下有已修复问题。
- 3.4.17 继续处理了模板和 Shadow DOM 相关的修复线。

不要从旧文章复制任意 3.x 版本号。本 Lab 没有做浏览器漏洞复现，所以上面只说明「为什么锁定这一版」，不说明「我们已验证那些载荷在此环境失效」。

旧浏览器上 `isSupported === false` 时，不能把未净化字符串塞进 sink。本示例没有检查 `isSupported`。若要抄到覆盖面更广的产品，加上判断并在不支持时渲染纯文本。

许可：按 MPL-2.0 或 Apache-2.0 之一满足义务。没有需要购买的「Pro 净化模块」。再分发时的 NOTICE 交给法务，本指南不是法律意见。

## 4. 三层

在 Library Lab 打开 E10 再运行。预览随输入变化，因为 `useMemo` 依赖 `dirty`。这和 E08 的按钮触发不同。

### 基本

输入一段加粗。预览和下面的 `<pre>` 应一致：有 `p` 和 `strong`，没有事件属性。`<pre>` 是转义后的文本，用来阅读净化结果，不要只看彩色预览。

### 业务

样例有指向 `https://github.com/cure53/DOMPurify` 的链接。主机名符合当前正则时，`href` 可以留下。这不等于你们的产品允许任意 https。公告场景没有图片。

### 进阶

样例包含脚本、事件、`javascript:`、svg 和 style。请在元素面板看预览子树，并阅读 `<pre>`：

- 不应出现 `script`、`svg`、`onclick`、`onerror`、`onload`。
- `javascript:` 不应留在 href。
- `style` 属性不应留下。

**不要把「我眼睛看了一下」写成 XSS 已测。** 没有 Playwright 或记录在 `docs/library-lab/evidence/runs/` 的浏览器收据时，browser 仍是 NOT_RUN。样例是本地字符串，不是渗透测试。

## 5. 反例（带代码）

### 反例 1：先写入 DOM 再净化

```tsx
<div dangerouslySetInnerHTML={{ __html: dirty }} />
const clean = DOMPurify.sanitize(dirty, htmlPolicy)
```

Lab 的预览只接收 `clean`。调试时也不要临时把 `dirty` 绑上去。

### 反例 2：打开 USE_PROFILES

```js
DOMPurify.sanitize(dirty, {
  USE_PROFILES: { html: true },
  ALLOWED_TAGS: ['p', 'strong'],
})
```

profile 与 `ALLOWED_TAGS` 同时出现时，标签名单不一定按你想的那样生效。本文件的注释禁止这种组合。不要为了「功能全」加上 `USE_PROFILES`。

### 反例 3：使用默认 sanitize

```js
DOMPurify.sanitize(dirty)
```

默认比 `htmlPolicy` 宽。公告预览必须传入 `htmlPolicy`。

### 反例 4：净化后拼接

```js
const html = DOMPurify.sanitize(dirty, htmlPolicy) + `<img src="${url}">`
```

拼接体没有经过允许列表。图片本来就不在 `ALLOWED_TAGS` 里。

### 反例 5：用正则当净化器

```js
dirty.replace(/<script/gi, '')
```

解析器差异会漏。正则最多当预算控制，不能当 sink 前的最后一步。

### 反例 6：全局钩子

```js
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  node.setAttribute('href', userValue)
})
```

钩子在净化过程中改节点，是历史安全公告里反复出现的高风险面。本示例不注册钩子。若产品必须用，要针对当前 3.4.17 做单独审查，不能复用旧文的 `IN_PLACE` 示例。

### 反例 7：把 removed 当告警系统

```js
if (DOMPurify.removed.length === 0) trust(dirty)
```

空列表不证明安全。策略本来就会留下普通段落。

### 反例 8：同一字符串进第二个 sink

邮件模板、PDF、`document.write`、Markdown 的 raw HTML 都是新的解析器。`clean` 只被授权进入这个 React 预览。

## 6. Trusted Types、CSP、性能

Trusted Types 可以让浏览器拒绝字符串形式的 HTML 赋值。`RETURN_TRUSTED_TYPE` 只有在策略已经安装时才返回 TrustedHTML。本示例没有安装策略，也不要在文档里写「已启用 Trusted Types」。CSP 的 `script-src` 仍应拒绝内联脚本。CSP 不能代替净化：它管的是脚本加载，不管你允许的 `href` 把用户带到哪里。

超大 HTML 会占用主线程解析。12_000 字符是文本框限制，不是对嵌套深度的证明。生产还应限制字节、节点数和请求超时。不要用这份 Demo 的手感代替测量。

服务端：官方路径是在维护中的 DOM 实现上 `createDOMPurify`。本示例只在浏览器调用默认导出。不要把 Lab 的通过与否（目前是未运行）写成 Node 净化已安全。jsdom 的主版本和 Node 基线会变，以你们实际锁定的 DOM 实现为准，而不是这篇指南里的某个历史版本号。

## 7. 组合（未挂载）

**E01 / E02 的阅读页。** 编辑器保存 JSON。公开 HTML 若必须生成，在写入 sink 之前用这份策略或更窄的策略。不要把编辑器 schema 当成净化。

**E06。** 优先 React 元素和 `skipHtml`。只有当产品明确允许 Markdown 中的原始 HTML 时，才把那一段送进 DOMPurify，并且名单不能比 E06 更宽而不自知。

**E08。** hast schema 与 `ALLOWED_TAGS` 是两套配置。不要对同一字符串先宽后窄地「净化两次」却在中间拼接。选定一个发布管线。

**E09。** 代码块用文本 token。不要把代码送进 `sanitize` 再 innerHTML。

## 8. 同类怎么选

| 输入 | 工具 |
| --- | --- |
| 纯文本 | React 子节点 |
| Markdown | E06 |
| HTML AST 流水线 | E08 |
| 浏览器 HTML 字符串 sink | E10，且必须带 `htmlPolicy` |
| 只读源码 | E09 |

## 9. 升级核对

- 停留在 3.4.17，直到下一则安全发行说明被读过并有回归样本。
- 升级 diff 里若出现 `USE_PROFILES`，拒绝合并。
- 新增标签必须改 `html-policy.mjs` 和负例，包括事件属性和 `javascript:`。
- 不要开启 `ADD_ATTR` 去放行 `style` 或 `on*`。
- `ALLOWED_URI_REGEXP` 保持锚点和协议限制。改正则要有灾难性回溯的反例。
- 许可文件随包升级复核，仍是 MPL-2.0 OR Apache-2.0 才保持当前说明。

## 10. 故障

| 现象 | 先看 |
| --- | --- |
| 预览里有脚本 | 是否把 `dirty` 绑到了 sink，或没传 `htmlPolicy` |
| https 链接也被删 | 主机名是否含本正则不允许的字符、端口或用户信息 |
| 样式还在 | 是否改用了默认配置或 profile |
| 预览和 pre 不一致 | pre 应打印 `clean`。若不一致，中间有拼接 |
| 别的页面的净化变宽 | 是否调用了 `setConfig` 或 `addHook` |
| 服务端结果不同 | 本示例不是 SSR。DOM 实现不同不能互相代替 |

## 11. 练习（未挂载）

1. 在策略外加主机名允许列表，只留 `github.com`。负例用 `https://example.com` 和 `javascript:`。
2. 不支持 `isSupported` 时改为纯文本。不要在该分支调用 `dangerouslySetInnerHTML`。
3. 为 3.4.17 的升级准备一组固定样本：合法段落、事件属性、svg、style、带用户名的 https。样本放在测试里，不把浏览器里的手工观察写成 PASS。

## 12. 验收

下面是清单，**不是**已完成的浏览器测试：

1. 预览的 `__html` 只来自 `sanitize(dirty, htmlPolicy)`。
2. 源码和配置里都没有 `USE_PROFILES`。
3. advanced 样例的预览 DOM 与 `<pre>` 文本都不含 `script`、`svg`、事件属性、`javascript:`。
4. business 的合法 https 链接若被保留，属性只有名单内的 `href` 或 `title`。
5. 没有任何 Playwright 痕迹时，不声明 XSS 已测。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E10 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目的安全通过。

## 13. 资料

- https://github.com/cure53/DOMPurify
- https://github.com/cure53/DOMPurify/releases/tag/3.4.17
- https://www.npmjs.com/package/dompurify
- https://github.com/cure53/DOMPurify/wiki/Security-Goals-&-Threat-Model
- https://github.com/cure53/DOMPurify#running-dompurify-on-the-server
