# E08 rehype 工程复用

适用已有HTML的HAST解析/严格允许列表/序列化，Markdown用remark，浏览器DOM净化另评DOMPurify。固定rehype13.0.2/rehype-sanitize6.0.0，实际包与上游MIT。

安装两包，复制example.tsx、sanitize-policy.mjs/.d.mts、input-policy.mjs/.d.mts；demo仅适配。TS bundler解析、ReactDOM/TextEncoder，无Provider/env/额外CSS插件/Worker/服务。

共享sanitizeHTML先assertHTMLBudget，再真实rehype→strictHtmlSchema→stringify；25,000 UTF8字节约24.4KiB，不是25KiB。textarea maxLength25000为独立UTF16限制；中文多字节可提前触发预算。只允许当前结构，a无href，媒体不在标签列表，危险容器strip，不替换成默认schema。

成功输出才交previewDocument；严禁srcDoc={source}或净化后拼未校验内容。空权限sandbox产生opaque origin，不是跨主机；不加allow-scripts/allow-same-origin。固定CSP拒绝脚本/连接/图片/子框架/表单/base，额外防线不替代schema。父页不可读frame DOM，不为测试放宽。

失败必须清旧output和iframe，重置/切层清错误与旧输出。同步处理无异步结果竞态，但占主线程；没有资源/全局监听需清理，卸载删除自有iframe/state。生产放宽导航/图片需全链路重新审查；不是HTML保真或通用sink保证。

真实SDK4/纯预算policy2分列；Node输出不是浏览器无执行/无请求/opaque origin证明。browser提案检查实际frame、恶意通道删除、无害标记/请求、中文超字节去旧frame与恢复卸载。无匹配正式收据verification保持NOT_RUN。固定包README英文原字节无官方中文，GitHub主页实际禁止嵌入blocked。
