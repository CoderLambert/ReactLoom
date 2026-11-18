# E06 react-markdown 工程复用

固定react-markdown10.1.0/remark-gfm4.0.1/rehype-sanitize6.0.0，实际安装MIT。适用完整Markdown只读React视图；不是HTML通用净化、富文本编辑器或增量流式解析。

安装三包后复制example.tsx/render-policy.mjs/render-policy.d.mts，demo.tsx仅适配。React/DOM与TS bundler解析由已有工程提供，无Provider/env/CSS插件/网络服务。保留GFM、rehypeSanitize默认schema、skipHtml、自定义urlTransform与components全部接线。

skipHtml丢原始HTML，sanitize过滤hast，urlTransform替换默认URL策略，a/img约束最终React输出，四者不等价。safeMarkdownURL仅无凭据HTTPS与有限#锚，拒绝ASCII控制/DEL/反斜线与其他协议/相对路径。a不spread未知props，外链_blank+noopener noreferrer；img不创建img，不访问src，仅alt占位。后置不安全组件能绕过sanitize，新增插件需审查顺序与输出。

原文在state，maxLength12000仅UI码元限制；生产API自行限额/授权。level变化effect重置；无timer/订阅/存储需清理。原生textarea组合输入可触发预览重解析，不声称只在compositionend更新；真实IME与水合未验。

反例：rehype-raw、不安全props展开、dangerouslySetInnerHTML、实际远程img、只靠HTTPS当安全、默认urlTransform误当严格策略、用SSR字符串PASS当浏览器无请求/无执行。恢复通过重置样例，不碰全局数据。

SSR SDK6与policy2分计，Browser提案独立检查编辑/GFM/危险节点/无害执行标记/图片无请求/外链rel；无正式匹配收据verification全部NOT_RUN。官方固定readme英文原字节（无官方中文），demo主页无明确限制头但未Lab-origin确认故unknown。
