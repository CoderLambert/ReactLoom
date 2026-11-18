# E03 Lexical 迁入指南

用于自控命令/选区/节点协议的富文档。0.52.0核心与React包均MIT；实装LexicalComposer是deprecated的legacy插件路径，本例保留其完整接线，新产品评估LexicalExtensionComposer，不混用legacy插件与extension假定。

## 完整迁入

已有React/ReactDOM>=18与TypeScript>=5.2浏览器宿主：`pnpm add lexical@0.52.0 @lexical/react@0.52.0`。复制example.tsx、snapshot-policy.mjs/.d.mts、state-operations.ts、styles.css；demo.tsx仅Lab转发。ES模块/TSX/CSS打包器需要支持包export subpath；无env/服务/账号。样式不能省掉，否则主题class不产生粗体。已有DOM宿主渲染LexicalExample level。

initialConfig只创建时读取，useMemo稳定引用不是重新创建条件；新对象本身不会重置，换文档靠key。EditorState是事实源，$函数限read/update，OnChange只读不整篇替换；resetDocument用discrete同步更新。

## 协议与失败处理

保存与恢复均调用同一assertLexicalSnapshot；只操作固定key reactloom:library-lab:E03:article:v1。root→paragraph→text/linebreak/tab，version1，100000UTF16单元、400节点、text40000、缩进0..8；类型/字段白名单、格式位0..2047/detail0..3/mode枚举，拒绝非空inlineCSS。不是任意schema/compact JSON/HTML净化。默认粘贴样式可能不能保存，必须明确拒绝而不是悄悄丢失。

restoreSnapshot先检查再parse，再非空检查后set。onError必须重抛：实际SDK会把解析异常交给onError，吞掉可返回部分state。同步解析/策略失败不应用状态；不承诺任意SDK应用异常原子回滚。不要在失败catch清空根或自动放宽协议。将来加节点同步变更注册/协议/测试/迁移版本。

## 选区/历史与清理

加粗/撤销重做按钮保留mousedown选区，命令由真正RichText/History插件处理；空选区加粗可能仅改变后续输入。composition ref与editor.isComposing共同阻止保存/恢复/重置/格式历史操作；registerRootListener挂的DOM事件通过返回函数移除，root变更会重新接线。系统IME仍未测试，合成事件不代表真实候选输入。

OnChangePlugin实际返回update unregister；History内部清理，ContentEditable卸载setRootElement(null)，不是自造destroy。浏览器外部probe取根__lexicalEditor只作匹配版本测试句柄，公开registerRootListener/getRootElement验证detach，测试observer自身也解除。

SDK测试真实无DOMcreateEditor导入UI共用state-operations.ts；只验状态read/update/parse/注销，不代表DOM格式命令/History/IME。纯policy单列。validation/browser.spec.ts交主控执行，正式sdk/build/browser无匹配receipt保持NOT_RUN。官方原文/许可/响应头见official，实际命令/日志与六项分层见local-validation.md。
