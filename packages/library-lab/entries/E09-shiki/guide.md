# Shiki 4.5.0｜只读 token，用 React 文本节点上色

`library.json` 钉住 `shiki@4.5.0`，MIT。Shiki 用 TextMate 语法把代码切成 token。它不是编辑器，不提供光标和撤销（那是 E04 / E05），也不执行代码。语法包和主题有各自的许可，升级时要随依赖一起看，不要只看根包的 MIT。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。没有第二份高亮实现。

用户点开 Demo 之后，effect 才调用 `codeToTokens`。导入路径是 `shiki/bundle/web`，不是一份从 CDN 拉语法的脚本。换 level 时若组件实例被复用，effect 会丢掉上一层的代码、语言和 token。没有 `localhost:5173`，也没有 `src/App.tsx`。

```ts
codeToTokens(code, { lang, theme: 'github-light' })
```

160ms 的 `setTimeout` 把连续输入合成一次调用。清理函数把 `live` 设为 false 并 `clearTimeout`。过期的 Promise 不能 `setRows`。失败时清空行并显示错误字符串。

渲染是双重 `map`：每个 token 一个 `<span style={{ color }}>`，子节点是 `token.content` 字符串。没有 `dangerouslySetInnerHTML`。没有 `codeToHtml`。

| 层 | 初始文本 | 语言 | 挂载了什么 |
| --- | --- | --- | --- |
| basic | 两行 TypeScript | 固定 typescript | 文本框 + token 预览 |
| business | 一个 interface | 可选 typescript / json / html | 同上，多一个 select |
| advanced | 含 `onerror` 和 `script` 的字符串 | 默认 html | 这些字符只作为 token 文本 |

文本框 `maxLength={3000}`。主题固定 `github-light`，没有主题切换器。行数和 token 数是派生计数。

没有挂载：`createHighlighter` 单例、自定义 grammar 的远程 URL、`@shikijs/stream`、与 react-markdown 的 `components.code` 对接、暗色主题、行号插件。

## 1. 什么时候需要 Shiki

| 任务 | 判断 |
| --- | --- |
| 文章、文档、diff 旁的只读片段 | 适合。用 token 文本，不要 HTML 字符串 |
| 用户要改代码 | E04 或 E05 |
| 不可信字符串里混了 HTML | 仍然当代码文本上色。上色不等于净化后可以 innerHTML |
| 每个键击都要 IDE 诊断 | 不要。Shiki 不跑 TypeScript 编译器 |

着色成功只说明语法包识别了 token。它不证明程序能运行，也不证明字符串作为 HTML 是安全的。

## 2. 模型

```text
textarea 字符串
    │ 160ms 后，且 Demo 已启动
    ▼
codeToTokens(lang, github-light)
    │
    ▼
token[][]  { content, color, fontStyle }
    │
    ▼
React <span>{content}</span>
```

`fontStyle` 被存进状态，当前 JSX 没有用它画斜体或粗体。颜色来自 token。不要把 `content` 再包进 HTML 解析。

四条官方能力里，Lab 只用了第一条的 Web bundle 形态：

1. `codeToTokens`：本示例的路径。返回结构再映射成纯数据，避免把 Shiki 内部对象放进 React state。
2. `codeToHtml`：返回 HTML 字符串。本示例不用。若产品要用，必须把整段当成不可信 HTML 走 E08 或 E10，而且通常不如文本节点直接。
3. `createHighlighter`：预加载语言和主题，避免重复创建。本示例每次 effect 直接 `codeToTokens`。生产高流量页面应评估单例，本文件没有实现。
4. 流式 `@shikijs/stream`：半截代码的场景。未挂载。

文档：[安装](https://shiki.style/guide/install)、[性能](https://shiki.style/guide/best-performance)、[包体积](https://shiki.style/guide/bundles)、[仓库](https://github.com/shikijs/shiki)。

`shiki/bundle/web` 会带上一组预打包的语言和主题。体积比按需 `createHighlighter({ langs, themes })` 大。Lab 选它是为了 Demo 不在运行时再去拉 grammar。生产应量打包结果，不要凭感觉说「已经很小」。

## 3. 三层

在 Library Lab 打开 E09，点运行，再改文本框。

### 基本

初始是 `const count`。状态从「正在解析 token…」到「真实 Shiki token 化完成」。`<pre>` 里能看到着色，元素检查器里应是 span 和文本，不是一个 HTML 字符串被解析成 `img` 或 `script`。

### 业务

可以改语言。把 TypeScript 切到 JSON 再切回，过期请求的结果不应覆盖新语言。样例是一篇文章里的代码块，不是从 RSS 拉来的 HTML。选择 html 语言不会把缓冲区变成真实标记。

### 进阶

初始字符串像攻击载荷。预期：页面上出现这些字符的颜色，DOM 里没有因为这段字符串而出现 `script` 元素或 `onerror` 属性。快速改字再换层，旧的 `codeToTokens` 不能把上一层 token 写回来。文案已经说明这一点。

没有浏览器收据之前，不要写「XSS 样本已验证无害」。这里的保证来自渲染方式（文本节点），仍要有人在元素面板里看过。

## 4. 反例（带代码）

### 反例 1：codeToHtml 直接注入

```tsx
const html = await codeToHtml(code, { lang, theme })
return <div dangerouslySetInnerHTML={{ __html: html }} />
```

高亮器的输出是 HTML。不可信源码若被错误包进属性，风险在 sink，不在「我用了 Shiki」。Lab 只用 `codeToTokens` 和文本节点。

### 反例 2：把 token.content 再 innerHTML

```tsx
span.innerHTML = token.content
```

token 文本可能含有 `<`。必须是 React 子节点或 `textContent`。

### 反例 3：不丢弃过期高亮

```tsx
codeToTokens(code, opts).then(result => setRows(result.tokens))
```

换语言或卸载后，慢的 Promise 会覆盖新内容，卸载后还会 setState。Lab 用 `live` 标志和清理函数。

### 反例 4：每个键击立刻高亮

没有 160ms 合并时，粘贴大段会排队多次整篇 token 化。延迟不是进度条，只是合并。卸载时必须 `clearTimeout`。

### 反例 5：从远程 URL 加载 grammar

```ts
await fetch(userProvidedGrammarUrl)
```

grammar 是可执行的语法定义，不是主题皮肤。本示例只用 bundle 里的 typescript、json、html。不要让文章作者指定语法 URL。

### 反例 6：用高亮代替净化

```tsx
const colored = await codeToHtml(untrustedHtml, { lang: 'html' })
document.querySelector('#article').innerHTML = colored
```

语言设成 html 只是着色规则。它不会移除脚本。文章正文若是 HTML，走 E08 或 E10。代码块若是围栏里的源码，走文本 token。

### 反例 7：主题 class 依赖外部 CSS 却没有加载

`github-light` 的颜色在 token 的 `color` 字段上，本示例写成内联 style，不依赖主题 CSS 文件。若改成 class 名方案，必须保证样式表在预览之前到位，否则对比度会掉成一串无色字。

### 反例 8：把 fontStyle 忽略后又声称斜体已支持

状态里存了 `fontStyle`，JSX 没用。不要在文档里写「注释已是斜体」。要斜体就在 span 上根据该字段加 `fontStyle`，并检查对比度。

## 5. 性能、CSP、无障碍

包体积：先看是不是误把完整 bundle 打进每个路由。Lab 的 Demo 按用户启动才加载模块，这是宿主行为，不是 Shiki 自动代码分割。生产路由应动态 `import()`，并量 `shiki/bundle/web` 与细粒度 highlighter 的差。[包体积](https://shiki.style/guide/bundles)。

重复创建引擎有成本。[性能指南](https://shiki.style/guide/best-performance) 建议复用 highlighter。本示例没有复用。不要把 Demo 的简单计时写成生产 P95。

CSP：没有远程 grammar，就不必为语法文件开放额外的 `connect-src`。若以后改成按需加载，把来源写进策略，不要用宽泛的 `https:`。

无障碍：文本框有标签。预览是 `pre > code`。颜色不是唯一信息，源码文本还在。不要只靠颜色区分错误。高对比主题要单独选，`github-light` 没有在本条目里做对比度测量。

中文输入：文本框是原生 textarea。高亮在防抖之后更新，合成期间不要把 token 结果写回 textarea 的 `value`。Lab 没有把高亮结果写回去。

## 6. 故障

| 现象 | 先看 |
| --- | --- |
| 一直停在正在解析 | 语言名是否在 bundle 里。失败文案在 status |
| 换语言后颜色还是上一门 | `live` 是否被提前清掉，或 setState 没有守卫 |
| 出现真正的 script 元素 | 是否改成了 innerHTML |
| 卸载后 React 警告 | Promise 没有看 `live` |
| 包特别大 | 是否全站同步导入了 `shiki/bundle/web` |
| 颜色发灰 | 主题色没印到 style，或背景不是浅色 |

## 7. 组合（未挂载）

**E07 或 E06 → Shiki。** Markdown 里的围栏代码把源码字符串交给 `codeToTokens`，用文本节点替换 `code` 组件。不要把 Shiki HTML 再送进 rehype。sanitize 若先删掉了代码块里的字符，着色对象就变了，顺序要固定：围栏内容当纯文本，不进 HTML sanitizer。

**E04 / E05。** 编辑器用编辑器。保存后的只读版本才用 Shiki。不要在同一个 DOM 节点上叠 EditorView 和 token span。

**流式助手输出。** 半截代码用专门的流式高亮或不着色，直到围栏闭合。本示例每次对完整字符串 token 化。

## 8. 和同类方案

| 方案 | 角色 |
| --- | --- |
| Shiki token + React 文本 | 只读、不想 innerHTML |
| Shiki `codeToHtml` | 非 React 或邮件场景才考虑，并单独净化 |
| E04 | 要编辑 |
| E05 | 要语言服务 |
| 浏览器 highlight API | 能力参差，不作为本条目的实现 |

## 9. 升级核对

- 锁定 `shiki@4.5.0`。4.x 的 `codeToTokens` 返回形状和 0.14 教程不同，不要按旧的 `fg` 字段取色。Lab 读的是 `t.color` 和 `t.content`。
- 主题名 `github-light` 必须存在于所用 bundle。换主题时改调用点，并看背景色是否仍是浅色预览。
- 从 `codeToHtml` 迁到 token 时，删掉对应的 `dangerouslySetInnerHTML`。
- 增加语言时确认它在 `shiki/bundle/web` 里。不在就不要在运行时 `fetch` 语法文件。

## 10. 练习（未挂载）

1. 做一个 highlighter 单例，语言切换不重复下载。验收：两次调用共享同一实例，卸载 Demo 不泄漏到别的条目。
2. 在 E06 的 `components.code` 里调用同一套 token 渲染。围栏内的 `<script>` 文本仍是文本节点。

## 11. 验收

待执行的清单：

1. basic：token 数大于 0，DOM 中代码区没有 `dangerouslySetInnerHTML` 留下的子树。
2. business：快速切换语言，最终语言与 select 一致。
3. advanced：字符串里的标签名只出现在文本节点。
4. 卸载或换层后没有 setState 警告。
5. 网络面板没有语法 CDN。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E09 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目通过。

## 12. 资料

- https://shiki.style/guide/install
- https://shiki.style/guide/best-performance
- https://shiki.style/guide/bundles
- https://github.com/shikijs/shiki
- https://www.npmjs.com/package/shiki
