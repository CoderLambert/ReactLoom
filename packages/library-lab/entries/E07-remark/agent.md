# E07 remark — Agent 工程手册

适用：Markdown 结构化分析与变换，不是 HTML 净化/浏览器编辑器。与 E06 react-markdown、E08 rehype 联用需审查完整插件顺序。

源码：`examples/example.tsx` 真正调用 `remark().use(remarkGfm).parse/processSync`；`examples/demo.tsx` 只是入口。复制业务需要的 mdast 扫描与规则；不要照搬 UI 壳。

规则：仅可信代码静态注册插件；限定来源输入长度；结构变换使用 AST 而非正则；链接与图片 URL 独立执行允许列表；对最终 HTML 再净化；不要用纯字符串输出证明安全。
测试：GFM table/task、嵌套 heading、dangerous javascript:、raw HTML、长文本/取消边界和生成格式；真实 remark SDK 必须执行测试，不能用手写 Markdown parser 冒充。
当前 SDK/build/browser 不是 PASS。版本 remark 15.0.1 + remark-gfm 4.0.1；许可证 MIT。
参考 https://github.com/remarkjs/remark
