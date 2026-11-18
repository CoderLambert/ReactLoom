# Shiki：把源码变成只读的着色文本

技术文章需要展示TypeScript、JSON或HTML源码。Shiki4.5.0用TextMate语法和主题产生token，React把token.content作为文本节点输出。它不提供编辑选区、撤销、类型诊断，也不执行源码；编辑器比较CodeMirror/Monaco，HTML正文净化另设计。高亮成功不是程序正确或HTML可注入的证明。

## 实际模型

UI与SDK共用highlight.mjs：`codeToTokens(source,{lang,theme:'github-light'})`从shiki/bundle/web导入，返回行数组，每token保留content/color/fontStyle。UI只将color写进span内联样式，fontStyle暂存但**未渲染粗斜体**。无codeToHtml、innerHTML或远程代码执行。

4.5.0实装web bundle用createSingletonShorthands包装共享highlighter，因此连续codeToTokens会复用库级singleton，不是每次新建引擎。本例没有自己创建/持有/销毁私有highlighter，不应dispose共享singleton影响别人。web bundle语言/主题通过本地动态import，Oniguruma engine导入shiki/wasm；构建器会处理这些模块/可能的拆分资源，不是运行时从用户URL下载grammar。浏览器仍需支持WebAssembly且部署CSP允许实际引擎加载/编译；不编造“零资源请求”或未测的宽松CSP方案。

## 最小迁入

已有React/TSX浏览器打包项目根执行`pnpm add shiki@4.5.0`。复制example.tsx、highlight.mjs/.d.mts、highlight-session.mjs/.d.mts；demo.tsx仅Lab适配可省。渲染`<ShikiExample level="business" />`，另支持basic/advanced。需要ES模块动态import、WASM支持及包exports解析，TS使用Bundler。无Provider、env、账号、额外CSS、字体包或Worker；预览用浅色背景配github-light，字体用宿主默认monospace。

Shiki根包MIT，固定LICENSE和实装package双核；打包的语法/主题/引擎仍应保留各自适用许可，不能将整个生态资产都简化为一行MIT。web bundle提供一组语言/主题入口，最终体积应测实际构建；没有体积/性能数字。

## 三个独立目标

### 基础：token与原文保持一致

修改两行TypeScript，160ms输入合并后预览应重建行/着色，源码字符原样显示。行数/token数是真实派生值；空文本也有其token行结构，不凭token多就声称有性能改善。只有渲染层为只读，textarea是原始输入工具，不是Shiki编辑器。

### 业务：文章代码块的语言规则

编辑interface样例，切JSON/HTML/TypeScript观察同一源码不同语法着色；语言不转换代码，也不执行HTML。主题始终github-light，没有主题选择器或暗色自适应。快速修改/切语言后只有最后一次结果能写回；重置按钮恢复该层原文和默认语言。

highlight-session.mjs自建调度：160ms后调用真实runtime，cleanup清尚未触发timer，并将live=false。已经开始的token化不能被clearTimeout/布尔值物理中止，只是迟到成功或失败不更新React。新输入先清旧预览并显示解析中，失败时显示错误并清行。该策略测试与真实SDK分计，不将fake延迟当SDK运行。

### 进阶：不可信HTML只是文本

默认script/onerror样本在pre>code的span文本中完整显示，不创建script/img或事件属性。测试可用无害window标记和example.invalid图片URL，验证输出字符/DOM并单独监测请求；重置恢复fixture。不能从Node token返回值直接断言浏览器没执行或没请求。

高亮不是净化器；把token.content重新innerHTML或换为codeToHtml注入会改变安全边界。这里保持React文本子节点，颜色来自固定主题元数据而非用户属性。新增插件/输出HTML必须另审查sink。

## 生命周期、输入和限制

code/lang变更effect清旧timer并阻止旧Promise回写；level变化重置原文/语言/结果。卸载清本次timer和live，不全局清其他任务，也不声称取消在途WASM计算或销毁库singleton。输入框maxLength3000是UTF16 UI约束，不是API/CPU安全限额。原生textarea组合输入期间可能触发重新调度，不写token结果回输入，不声称仅compositionend解析；真实IME仍需人工验收。

无上传、网络业务、持久化、流式解析/行号/Markdown接线。SSR可预先token化但本例未验水合。大文档需实际设备测试，160ms是教学调度常数而非延迟性能保证。

## 来源与验证

官方shikijs/shiki v4.5.0固定commitf7d0167873fd676fe4e190bc9b53832fba9ee01d的packages/shiki/README.md原字节保存。固定树无官方中文README，保留英文原文，本文独立中文教学。官网GET200但无Lab嵌入确认，unknown，响应证据见official/source-evidence.json，保留直达。

真实token SDK与纯调度策略各自运行，原始命令/日志及六项状态见local-validation.md。浏览器提案覆盖三目标、语言输入更新、字符安全及实际timer清理；浏览器未跑保持NOT_RUN，不能从SDK或policy推DOM/网络/执行PASS。正式verification无匹配receipt不提升。
