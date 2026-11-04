# E10 DOMPurify — 工程手册

## 适用

浏览器里必须把有限富文本 HTML 放进唯一 sink 时。纯文本用 React 子节点。Markdown 用 E06。hast 流水线用 E08。代码用 E09。不要为了显示脚本或 iframe 放宽策略。

## 版本

`dompurify@3.4.17`，许可 MPL-2.0 OR Apache-2.0。配置对象只有 `examples/html-policy.mjs`。不设置 `USE_PROFILES`。不使用无配置的 `sanitize(dirty)`。

## 迁移

保持 `useMemo(() => DOMPurify.sanitize(dirty, htmlPolicy), [dirty])`，并且 `dangerouslySetInnerHTML` 只接收该结果。`<pre>` 打印同一字符串。文本框保留 12_000 上限。换 level 重置输入。不要把策略内联到组件。产品增加标签时同时改负例。

## 不可删的清理

禁止 `USE_PROFILES` 与 `ALLOWED_TAGS` 组合。禁止 `setConfig` 和 `addHook`。禁止在 `clean` 之后拼接标签。禁止把 `dirty` 绑到预览。`ALLOWED_URI_REGEXP` 保持无凭据 https。卸载或换层时不要留下上一份 HTML 冒充新输入。

## 反例

- 先 innerHTML 再 sanitize。
- 打开 `USE_PROFILES`。
- 默认 `sanitize` 不传 `htmlPolicy`。
- 正则删除 `<script`。
- `afterSanitizeAttributes` 里写回用户 href。
- 用 `DOMPurify.removed` 判断输入可信。
- 同一 `clean` 进入邮件、PDF 或 `document.write`。
- 把 advanced 样例的目视检查写成 XSS 已在浏览器测试。

## 测试断言

- 策略模块不含 `USE_PROFILES`。
- 事件属性、`script`、`svg`、`javascript:`、`style` 不出现在净化字符串里。
- 符合正则的 https 才可能留下 `href`。
- 预览 sink 与 `<pre>` 使用同一 `clean`。
- 浏览器 XSS 没有收据时不得写成通过。Node 策略测试不是 DOM 利用验证。

## 真实限制

未检查 `isSupported`。未启用 Trusted Types。12_000 字符不是深度限制。正则不限制主机名为自家域名。没有 jsdom 服务端路径。与 E08 的 schema 不是同一份名单。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E10 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。不要声称 XSS 已做浏览器测试。

资料：https://github.com/cure53/DOMPurify 与 https://www.npmjs.com/package/dompurify 。
