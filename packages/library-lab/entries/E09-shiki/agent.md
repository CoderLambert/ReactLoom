# E09 Shiki — 工程手册

## 适用

只读代码着色。用户要编辑时用 E04 或 E05。不可信 HTML 正文用 E08 或 E10。不要用语法高亮代替净化。

## 版本

`shiki@4.5.0`，MIT。调用 `codeToTokens`，从 `shiki/bundle/web` 引入，主题 `github-light`。不要按 0.14 的字段名读 token。语法和主题的许可证随依赖审查。

## 迁移

复制 `examples/example.tsx` 的防抖、`live` 取消和文本节点渲染。`examples/demo.tsx` 只是再导出。状态里只放 `content`、`color`、`fontStyle` 这类纯数据。产品若要单例 highlighter，在此之上加，不要改回 `codeToHtml` + `dangerouslySetInnerHTML`。

## 不可删的清理

effect 清理必须 `clearTimeout` 并把 `live` 设为 false。过期 Promise 不能 `setRows`。换 level 时清空行和状态，避免上一门语言的 token 留下。文本框保持 3000 字符上限。不要把高亮结果写回 textarea。

## 反例

- `codeToHtml` 后 `dangerouslySetInnerHTML`。
- `token.content` 用 innerHTML。
- 无 `live` 标志的 then。
- 每个键击无合并地 token 化。
- 用户提供的 grammar URL。
- 用 html 语言高亮冒充 XSS 净化。
- 文档声称斜体已启用，但 JSX 没用 `fontStyle`。
- 全站同步导入 bundle 却不量体积。

## 测试断言

- advanced 样本在 DOM 中只以文本存在，不产生 `script` 元素。
- 快速修改或换层后，最后一次结果对应当前 `code` 和 `lang`。
- 失败路径清空行并给出状态文案。
- 卸载不触发 setState。
- 没有浏览器收据时，不把上述观察写成 PASS。

## 真实限制

每次调用没有复用 highlighter。`fontStyle` 未画到样式上。语言只有 typescript、json、html。没有暗色主题，没有行号，没有流式 API。160ms 只是合并输入。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E09 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。

资料：https://shiki.style/guide/install 与 https://shiki.style/guide/bundles 。
