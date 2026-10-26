# E10 · DOMPurify：受限富文本的输出防护

## 能解决的问题

React 默认会转义普通文本，不需要在每个 `<p>{text}</p>` 都进行 HTML 净化。**只有必须把 HTML 字符串呈现为富文本**（例如遗留公告、受限 CMS 文档）时，才应使用 DOMPurify 对输入进行净化，并核对业务允许的标签与 URI 策略。它不能替代服务器验证、鉴权、CSP 或对导入文件的信任审计。

本条 `dompurify@3.4.17`，许可为 `MPL-2.0 OR Apache-2.0`；版本必须纳入安全升级与漏洞审查，历史版不要盲目复用。

## 安装与代码

```sh
pnpm add dompurify@3.4.17
```

实际示例在 `examples/example.tsx`。先用 `DOMPurify.sanitize(dirty, {USE_PROFILES:{html:true},FORBID_TAGS:[...]})` 得到干净字符串，再交给 React 的 `dangerouslySetInnerHTML`。这里只使用 HTML profile，禁止 iframe、form、style、img 等不需要的元素，并移除 style 属性。该策略是**教学中的严格子集**，不等于适合所有 CMS 的通用策略。

## 三层可交互实验

- **basic**：保留合理的 `strong` 和 `p`，学习净化不会破坏全部格式。
- **business**：保留公告结构与允许的 HTTPS 链接；只有业务真的需要时才调整 allowlist。
- **advanced**：包含 script、SVG、事件属性、javascript 协议和定位样式的恶意输入。观察净化后原文的区别，并在浏览器里检查最终 DOM。

## 安全边界与生命周期

**关键规则是净化之后不要再改变 HTML 结构。**如果将已经净化的字符串交给后续第三方插件重新拼接或重新解释，可能重新引入 XSS。不要在 DOMPurify 全局单例上随便增设影响其他组件的 hooks；特别是不要把允许任意事件属性或 `SAFE_FOR_TEMPLATES` 当作默认安全做法。安全版本需要跟踪更新公告，不能只拿“代码里调用了 sanitize”证明没有 XSS。

DOMPurify 在浏览器里直接使用 DOM；Node/SSR 运行时需要可靠、受维护的 DOM 实现（如合适版本的 jsdom），不应假装浏览器净化 API 无条件可在服务端直接执行。服务端净化/持久化的责任归业务边界所有；客户端展示前也要根据威胁模型选择是否重新净化。

## 五个实战反例

1. 直接用 `dangerouslySetInnerHTML={{__html: userHtml}}`：XSS。正确方式是先 sanitize 并限定用途。
2. 净化后给字符串重新拼接 `<script>` 或未知 HTML：破坏信任边界。禁止二次加工。
3. 使用过于宽泛的 `ALLOWED_URI_REGEXP`：可能放过危险协议。优先使用默认协议安全策略。
4. 允许远程 `img` 导致私密 URL/访问事件外泄：确定代理和允许域，不依赖 HTML 安全性判断业务隐私。
5. 将 Vue/React 的 HTML 输出当作服务端输入校验：净化与权限、字段合法性是不同任务。

## 生产策略

将允许的标签/属性形成明确的业务 policy，记录使用场景、版本与真实攻击样例；为自定义渲染组件单独写 URL 安全检查；给所有展示路径追加 CSP 边界、a11y 回归和供应链更新流程。不要通过正则替代专业 HTML 解析器；不要把一次测试结果当作通用安全证明。

## 两种组合

- 不可信 Markdown：优先 E06 react-markdown + rehype-sanitize 的语义树渲染；不是所有 Markdown 都要先变 HTML 字符串。
- 后端 CMS：服务器端校验来源、存储结构与允许标签，浏览器按显示策略再次处理，避免富文本存储跨业务复用。

## 练习与验收

练习：在“公告内容”中添加一个带 onclick 的标题，再加一张外部跟踪图片；检查最终 DOM 中没有事件属性、script/svg/img 和危险 URL。再检查合法粗体与段落仍可读；完成 Chrome/Firefox 的渲染回归。只有浏览器里真实执行 DOMPurify 且完成攻击用例才能记 SDK/浏览器 PASS。

## 官方参考

- https://github.com/cure53/DOMPurify
- https://www.npmjs.com/package/dompurify

当前安装和浏览器验证仍为 NOT_RUN/BLOCKED，不继承历史安全结论。
