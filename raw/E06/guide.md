# react-markdown：把完整Markdown转换成React元素

知识库与RSS报告需要标题、代码、链接和GFM表格，但原文可能不可信。react-markdown通过真实remark/rehype AST管线解析Markdown，再创建React元素，不把字符串交给dangerouslySetInnerHTML。此例固定react-markdown10.1.0、remark-gfm4.0.1、rehype-sanitize6.0.0，实际安装包许可均MIT。

需要只读Markdown视图时选它；编辑源码可用textarea或CodeMirror；输入本来就是HTML时需专门HTML处理边界。它不是富文本编辑器、通用XSS防火墙或流式增量解析器。本例每次用当前完整字符串重解析，没接网络/缓存/代码着色服务。

## 管线和四层职责

Markdown字符串由组件state拥有→remark解析为mdast，remark-gfm增加表格/任务列表等语法→内部remark-rehype转成hast→rehype-sanitize默认schema过滤hast→react-markdown完成HTML/URL处理与React组件输出。

```tsx
<Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}
  skipHtml urlTransform={safeMarkdownURL} components={markdownComponents}>
  {source}
</Markdown>
```

这些配置不等价，不能互相替代：

- skipHtml丢弃原始HTML节点；没有rehype-raw，不把HTML源码解析成可执行DOM。它不负责Markdown链接URL，也不约束自定义组件创建什么元素。
- rehype-sanitize按默认允许列表过滤hast，包含插件可能生成的节点/属性。它不是最终React DOM的万能审计；之后不安全的组件仍可主动创建危险DOM。当前不是E08的定制严格schema。
- urlTransform显式替换默认URL转换，不是“先默认过滤，再追加本函数”。本策略拒绝空格/ASCII控制/DEL/反斜线、凭据、http/mailto/data/协议相对/相对路径；只允许无凭据HTTPS与有限#锚。SSR测试对照具体拒绝结果，不能误以为默认行为同样严格。
- 自定义a再次校验href，只显式传href/children/target/rel；安全外链使用_blank与noopener noreferrer，锚不新开页；无效链接降级span。img完全不创建img、不使用src，只输出alt占位，因此远程跟踪图不会触发图片或预加载请求。只限制URL协议并不能做到禁图。

不要新增插件就默认信任：安全转换应放在可能产生不可信hast的插件之后，并审查自定义组件。不要展开未知AST props，不把HAST处理当成另一宿主HTML净化承诺。

## 三个操作实验

### 1. 最小渲染

basic修改“Markdown输入”为标题、加粗、行内代码，预览立即显示实际React元素；修改HTTPS链接可在DOM观察target/rel。不会实际导航来测试危险地址。重置恢复该层样例。

### 2. GFM报告

business有表格和两项任务，表格来自remark-gfm，任务勾选框是只读disabled而非可编辑任务应用。修改单元格文字可见即时变化。示例PASS/NOT_RUN是报告内容，不是条目验收结果。去掉GFM插件会失去这些扩展语法，核心库并非默认实现完整GFM。

### 3. 不可信输入

advanced包含javascript链接、原始script/img事件属性与远程图片。预览不产生script/img/onerror节点，不安全链接变为span；图片显示“图片外链被禁用”与alt。输入带凭据HTTPS、mailto或相对路径也不会变成a。重置恢复原文，不清全局数据。

SSR真实SDK测试能检查输出字符串中没有危险元素、图片src和链接；不能证明浏览器无请求或脚本未执行。浏览器提案单独监测跟踪图请求和无害执行标记，不点击危险链接、不接真实账户。没有执行的浏览器结果保留NOT_RUN。

## 完整迁移

已有React/TS工程安装`pnpm add react-markdown@10.1.0 remark-gfm@4.0.1 rehype-sanitize@6.0.0`。复制example.tsx、render-policy.mjs和render-policy.d.mts，保持相对路径；demo.tsx只Lab重导出可省。渲染`<MarkdownExample level="business" />`，也支持basic/advanced。React DOM由宿主提供；使用支持.mjs/.d.mts的TS bundler解析。无需Provider、环境变量、额外样式插件、资源下载或服务。

原文在本地state，预览派生，不用预览innerHTML做存储。maxLength12000为textarea的JS字符串码元限制，不是服务端安全限额或性能保证；生产API必须在自己的输入边界限额/授权。换level时effect重置原文；单篇文档若要保留编辑内容，应由外层显式决定重置时机。本例没有timer、监听、Worker、存储或连接，卸载释放state。中文输入由原生textarea/React处理，onChange可能随组合过程更新预览，不承诺“仅compositionend后更新”；没有人工IME/移动端验收。

SSR可用同样纯URL与组件策略，但本例未验水合。大文档需实际测量设备/语料，不能由12000上限推断帧率；没有Worker或增量流式解析，频繁整串更新会重解析。

## 官方来源与结果范围

固定remarkjs/react-markdown的10.1.0提交readme.md原字节保留官方README页签，完整固定tree没有官方中文README，因此英文en，不把本地中文讲解冒充原文。README链接的官方demo站实际GET无明确嵌入限制头，但未从Lab origin确认内容，因此unknown保留直达。来源/响应/原文SHA见official/source-evidence.json与library.json。

本地SSR SDK6项、纯URL策略2项分别记录。SSR覆盖基本/GFM表格+任务列表、HTML/URL/图像、默认URL替换及sanitize对不可信插件HAST的作用；不是安全性穷举证明。实际命令/日志和六项状态见local-validation.md。Browser与正式收据另行验收，verification保持NOT_RUN。
