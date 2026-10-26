# rehype：HTML AST 管线与不可信内容的净化

## 任务位置

rehype 用 HAST（HTML 语法树）处理 HTML，常用于 RSS 正文、服务端富文本净化、HTML 重写、Markdown 转 HTML 后的安全出口；不是编辑器，不负责 CSS、脚本隔离或远端资源授权。**parse/stringify 本身不代表 HTML 安全**，必须另定义可信插件与 sanitizer。

## 安装

```bash
pnpm add rehype@13.0.2 rehype-sanitize@6.0.0
```

```ts
import {rehype} from 'rehype'
import rehypeSanitize from 'rehype-sanitize'
const safeHtml = String(rehype().use(rehypeSanitize).processSync(input))
```

`rehype()` 预配置 HTML parse/stringify；`rehype-sanitize` 根据允许列表移除危险节点/属性。**生产代码中必须明确净化发生在字符串插入或 DOM 渲染之前。** 站点必须同时部署合理 CSP，净化不是脚本权限隔离的全部手段。

## 三层实战

**basic**：安全段落、加粗等标签经真实 HAST 管线重新输出。**business**：RSS 摘要、标题、外链、列表经过 sanitize，效果在 `sandbox=""` iframe 展示，缺省不允许脚本和同源权限。**advanced**：`script`、`onclick`、`onerror`、危险协议及 iframe 输入必须在 sanitizer 之后受到限制；同时设置 iframe CSP 禁止网络/脚本，不能仅凭文本查找判定安全通过。

实现源码是 `examples/example.tsx`，四 Tab 的源码查看应直接取这个文件，避免文档伪代码和页面分叉。

## 工程安全

- **危险写法**：`rehype().processSync(html)` 然后 `dangerouslySetInnerHTML`，等同于在文档信任边界放行恶意 HTML。
- **插件次序**：需要 `rehype-raw` 时应保证其版本和输入源经过审计，再通过 sanitizer；不能在 sanitize 后再让不可信插件插入任意节点。
- **iframe 不是默认可信**：同源且同时使用 `allow-scripts`、`allow-same-origin` 会损坏隔离边界。此实验用空 sandbox 和 CSP `default-src 'none'`。
- **资源加载**：img/iframe/a 等可能触发第三方网络、跳转或追踪；业务策略独立限制来源、URL 和 CSP，不应因为 HTML 已净化就允许远端加载。
- **性能**：不可信来源按 UTF-8 字节、节点数量与执行耗时设限；HTML 序列化会改变空标签/换行形式，代码不能依赖逐字节等价。
- **类型**：rehype AST 不等于浏览器 DOM，若需要操作用户当前文档应选 DOM API 或可信转换器，并防止水合差异。

## 组合与选型

Markdown 导入：E07 remark → 转换器 → rehype/rehype-sanitize → 输出。React 文章：E06 react-markdown，若直接处理 HTML 富文本可以比较 E10 DOMPurify。组合不等于重复净化越多越安全，要明确最后允许列表、URL 规则及 CSS 权限。

## 验证清单

实际安装后执行类型/构建和 Chromium E2E：危险属性消失，iframe 没有执行脚本，没有外部网络请求，链接协议符合策略，切换 Tab 没有异常副作用。SDK/browser 未运行不得标 PASS。来源 [rehype](https://github.com/rehypejs/rehype)、[rehype-sanitize](https://github.com/rehypejs/rehype-sanitize)。MIT。
