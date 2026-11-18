# rehype：先在HTML树上净化，再创建预览

RSS公告已有HTML，需要保留标题、列表和强调，但去掉脚本、导航与远程媒体。rehype把HTML解析为HAST，插件在树上处理，最后序列化；本例使用rehype13.0.2和rehype-sanitize6.0.0，实际包与上游对应版本字段均MIT。没有用正则自研HTML解析器，也没有把原始HTML交给浏览器后才净化。

已有HTML且需要AST插件流水线时选它；Markdown源码比较remark/react-markdown，浏览器DOM上的字符串净化比较DOMPurify。策略取舍是内容损失：此schema不支持可点链接、图片、表格或嵌入，不是完整富文本保真方案。本例是原创fixture、同步本地计算，没有网络抓取/服务。

## 输入到预览的三个边界

```text
HTML字符串→UTF8字节预算→rehype解析HAST→严格schema净化→stringify
                                                    ├→pre纯文本
                                                    └→srcDoc空权限sandbox+CSP
```

input-policy.mjs先检查TextEncoder UTF8字节数，最多25,000字节（约24.4KiB），不是25KiB，也不是25,000个字符。textarea maxLength25000是独立UTF16码元限制；8334个“中”只有8334码元，却有25002字节，因此仍会被处理器拒绝。此预算不是SDK协议上限或性能保证。

sanitize-policy.mjs的sanitizeHTML是UI和SDK测试共用的实际处理器：`rehype().use(rehypeSanitize,strictHtmlSchema).processSync(input)`。先sanitize再stringify；schema不是默认列表。标签只保留article、h2–h4、段落/强调/列表/引用/代码/br/a；a仅可带title，没有href/target；protocols.href空数组不是唯一防线，属性白名单本身就不允许href。script/style/iframe/form/svg/math/object/embed/template/textarea连内容一起strip，媒体不在允许标签中。

三层职责不能互换：schema去掉源中的可执行/导航/请求通道；sandbox空字符串不给allow-scripts、allow-same-origin、表单等权限，srcDoc获得opaque origin（不透明源），不是另选了一台跨主机服务器；CSP在净化输出前写入固定meta，default-src/script/connect/img/frame/form/base全部拒绝，是额外浏览器限制，不替代树净化。父页面不能为了测试读取iframe DOM而加回allow-same-origin；浏览器自动化可独立查看frame，父页脚本读取应被隔离。

## 三个独立操作

### 1. 解析与结构保留

basic编辑HTML后点“运行安全处理器”，pre显示序列化后的允许结构，iframe展示同一净化内容。按钮前没有iframe；源输入保持原样。输入不规范的嵌套可能由HTML解析器规范化，不保证输出字符串与原文相同。

### 2. RSS公告与导航取舍

business保留article/列表/原始来源文字，但输出不含href，iframe中的来源不再可导航。HTTPS本身不代表这里应开放跳转；策略是所有导航统一删除。没有下载真实RSS或追踪图片，fixture只演示内容处理。

### 3. 攻击通道、隔离与错误恢复

advanced含事件属性、script、javascript链接、图和iframe。运行后先检查pre中这些结构消失，再看frame只留允许文字。仅“外观正常”不能证明安全：浏览器提案还监测唯一测试URL请求与无害执行标记，不通过真实危险导航验证。

先生成成功输出，再输入8334个“中”并运行：显示25000字节超限错误，同时移除旧pre和iframe，避免把旧成功当成新结果。重置清输出/错误并恢复样例，再运行可恢复。换level也清空旧输出。同步processSync没有异步队列或迟到结果，但会占主线程；更大文档应测量并另设计任务隔离/取消。

## 完整迁入已有React工程

运行`pnpm add rehype@13.0.2 rehype-sanitize@6.0.0`。复制example.tsx、sanitize-policy.mjs/.d.mts和input-policy.mjs/.d.mts，保持相对路径；demo.tsx仅Lab重导出，可省略。渲染`<RehypeExample level="business" />`，basic/advanced也可。React DOM由已有项目提供，TS使用支持.mjs/.d.mts的bundler解析，环境须支持TextEncoder。无Provider、环境变量、CSS插件、字体、Worker或服务。

previewDocument只接受sanitizeHTML的成功输出，不能把原始source传给它。不要净化后再拼接不可信HTML，这会绕过schema；不要在主DOM使用未审核dangerouslySetInnerHTML。样式是外层内联布局，frame内容没有开放style权限。卸载移除自有iframe/state，无监听、计时器、临时URL、Worker或连接需要注销；切层/错误均撤下旧frame。生产新增可导航链接/媒体必须同时修改schema、预算与浏览器负例。

## 官方来源与验证限制

固定rehypejs/rehype tag13.0.2的packages/rehype/readme.md原字节保存，实际对应目标包，固定tree无官方中文package README，使用en。rehype-sanitize使用独立6.0.0，不假设两库共同发布。官方包homepage指向GitHub仓库，实际GET的X-Frame-Options:deny和CSP frame-ancestors none明确禁止嵌入，状态blocked保留直达。来源/版本许可/原文SHA/响应头见official/source-evidence.json与library.json。

本地真实SDK4项、纯字节策略2项分别记证，不是浏览器安全穷举。SDK验证实际输出删除脚本/事件/导航/媒体，保留结构和规范化畸形输入；policy覆盖精确UTF8边界。本地浏览器检查了 frame、CSP、opaque origin、无请求和执行标记，formal verification保持NOT_RUN。命令、退出码及原始日志见local-validation.md。
