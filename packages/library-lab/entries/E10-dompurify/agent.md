# E10 DOMPurify — Agent 实施说明

## 选型与版本

React 普通文本用 JSX 转义，不需要 DOMPurify。必须渲染受限 HTML 字符串时采用 `dompurify@3.4.17`（`MPL-2.0 OR Apache-2.0`），关注供应链安全公告。不要以存在 `sanitize()` 调用就宣称通用安全。

## 迁移路径

读取 `examples/example.tsx`，只复制固定的策略和先净化后展示机制；`examples/demo.tsx` 是 Lab 入口。业务必须明确允许元素、允许 URI、远程图片策略与 DOM 二次加工边界。不执行源字符串，不拼接净化后的 HTML，不把全局 hook 当单组件局部配置。

## 禁止模式

- `dangerouslySetInnerHTML` 直接传未净化字符串。
- `sanitize` 后通过其他代码插入未审查标签/属性。
- 自行写正则去掉 script 当作 HTML sanitizer。
- 允许任意 data/javascript URI 或所有外部资源。
- 在 Node 未搭建可靠 DOM 环境时假设浏览器 sanitize 的结果等价。

## 必须的测试

输入含 script/onerror/onclick/javascript URI/SVG 与远程 img；DOM 不应出现危险节点/属性，也不应有外部网络请求；合法文本/粗体/段落保留。对 CSP、浏览器差异和可访问性作独立检查。当前 SDK 和浏览器仍未实测，不能标 PASS。

## 来源

https://github.com/cure53/DOMPurify

## 最小迁移不可漏的策略文件

`examples/example.tsx` 调用真实DOMPurify并导入 `examples/html-policy.mjs`。只复制sanitize却回到宽泛默认HTML profile不符合本条安全边界。HTTPS-only URL 正则仍只是在净化时限定出站属性，不能替代DOM/XSS/网络验收；纯Node策略用例绝不能标SDK PASS。放宽标签或允许远程媒体前重新评审威胁模型。
