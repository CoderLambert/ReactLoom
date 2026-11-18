# Lexical 0.52：EditorState、草稿协议与选区命令

阅读器需要编辑文章摘要，产品又要自己控制输入UI、文档节点和格式命令。Lexical把内容放在不可变EditorState中，DOM只是投影；可以按插件组成自己的编辑器。成本是节点协议、历史、选区、样式和浏览器验收都要自己设计。要现成块菜单用BlockNote；代码用CodeMirror，纯阅读页不用编辑器。

本例真实使用 `lexical@0.52.0` 与 `@lexical/react@0.52.0`（MIT），没有网络、上传、协作或服务端保存。**该版本的LexicalComposer已标deprecated**：本例保留匹配现有插件的legacy路径，不把它说成新项目的首选。官方建议新项目评估LexicalExtensionComposer及extension模型，两套接线不可无审查混用。

## 完整最小接入

已有React/ReactDOM>=18与TypeScript>=5.2的浏览器打包项目执行：

```sh
pnpm add lexical@0.52.0 @lexical/react@0.52.0
```

复制examples下的 `example.tsx`、`snapshot-policy.mjs` / `.d.mts`、`state-operations.ts`、`styles.css`，保持相对路径；demo.tsx只是Lab转发可省。渲染 `<LexicalExample level="business" />`。打包器需要ES模块、TSX与CSS导入（如Vite的Bundler解析/react-jsx）。styles.css提供真实粗体，不能只复制主题class却依赖Lab的Tailwind。无需env、Provider、账号或远程字体；Composer已在组件内。

```tsx
const config = {
  namespace: 'my-editor',
  theme: {text: {bold: 'my-bold'}},
  onError(error) { throw error },
}
<LexicalComposer initialConfig={config}>
  <RichTextPlugin contentEditable={<ContentEditable aria-label="文章" />}
    placeholder={<span>输入…</span>} ErrorBoundary={LexicalErrorBoundary} />
  <HistoryPlugin />
</LexicalComposer>
```

legacy Composer创建时读initialConfig，后续改变忽略；**仅仅每render新建一个对象不会自动重建编辑器**。本例useMemo表达稳定配置，真正换文档靠 `key={level}`，产品应使用documentId。不要把每次服务器返回的JSON塞进initialConfig当受控value。

## 先区分read、update与序列化

`editor.update`中才能修改节点；`state.read`只读已提交快照。`$getRoot()`等$函数必须在read/update上下文内。EditorState.toJSON是数据，不是净化HTML。

基础场景：输入后OnChangePlugin在state.read里读取纯文本，展示UTF16长度。忽略纯选区变化，不在onChange中setEditorState；更新文本不会每键重建文档。重置按钮通过共享state-operations.ts在editor.update中清空并追加新段落，使用discrete:true保证本次同步提交。不能在read中写节点。

## 业务变化：有限JSON草稿与失败不替换

保存、恢复都使用同一个snapshot-policy。先校验再写sessionStorage；失败不覆盖此前草稿。恢复先读取、校验、parseEditorState，确认非空才setEditorState。损坏/超限/未知节点/非法字段在应用前拒绝，保留正在编辑的内容。只使用 `reactloom:library-lab:E03:article:v1`，没有自动保存或清全局Storage；读写被禁用/配额失败会显示错误。

本合同只允许版本1的 `root → paragraph → text/linebreak/tab` 树：最多100000个JS UTF16单元、总400节点、单text40000单元、最多8级段落缩进。树形协议本身最多两层子边，不接受任意嵌套段落。白名单逐类限制字段：对齐/方向/整数format/detail/mode均检查类型；Tab文本必须为制表符；内联style和段落textStyle只接受空字符串。bold等format位允许0..2047，detail0..3。这是匹配0.52的有限产品契约，不是Lexical的完整序列化schema。

默认RichText行为可以产生不属于这个持久化合同的粘贴样式，保存会明确拒绝。没有注册Heading/Link/列表/自定义节点，不宣称任意富文档JSON往返。新节点必须同时注册、升级schema和负例；不能在catch里放宽所有字段。旧版本/compact JSON、自定义node state不在本合同。

**onError是恢复保证的一部分。** 0.52 parseEditorState内部捕获节点错误并调用editor.onError；若只console.log并返回，可能得到部分状态。这里onError重新抛出，恢复按钮try/catch捕获同步解析错误，绝不把部分解析结果set回正文。真实SDK测试另外绕过策略直接触发未知节点，核实抛错且当前状态不变。未来更改onError不能破坏这条约束。

不能由此承诺任意setEditorState/DOM重建内部错误都会事务回滚。提示让用户保留内容、检查草稿；LexicalErrorBoundary负责其覆盖的React编辑渲染边界，不是所有异步程序错误的全局保险。

## 进阶：选区、格式与History

选中文字后点击加粗，真实dispatchCommand(FORMAT_TEXT_COMMAND,'bold')改变选区文本；空选区可能只改变接下来输入的格式。按钮阻止mousedown默认行为以保留选区。提供撤销/重做命令，实际由HistoryPlugin维护历史；历史为空时命令不保证改变内容。页面显示粗体class的真实CSS，而不是写死一份“已加粗”结果。

IME期间不保存、恢复、重置或派发格式/历史命令。本例用registerRootListener在真实根元素挂compositionstart/end监听，并结合editor.isComposing判断；root替换或插件卸载时返回的清理移除监听。不要在组合输入中整篇setEditorState或把半成品拼音当最终内容。合成composition事件只能验证按钮守卫，系统中文输入法、候选框和撤销组合仍需人工实测。

## 生命周期与可复现范围

OnChangePlugin实装effect返回registerUpdateListener的注销函数；本例callback用useCallback稳定引用。HistoryPlugin也有自己的注册清理。Actions自有root监听通过API返回清理，组件不自行调用不存在的editor.destroy。ContentEditable卸载会setRootElement(null)，真实DOM事件与选区接线由Lexical解绑；这不表示保留在外部变量里的EditorState已经不可读。

浏览器提案会从实际根元素的__lexicalEditor取匹配源码的实例（测试时fail closed，不作为业务API），用公开registerRootListener/getRootElement观察根变null，解绑测试自己的observer，再重挂载检查空文档。它不把组件消失直接当destroy，也不清其他编辑器/存储。

本地SDK用真实createEditor且没有DOM，复用state-operations.ts执行read/update/parse/set与注销；证明的是无DOM状态语义，**不证明ContentEditable、命令选区、HistoryPlugin或IME**。浏览器提案另行覆盖输入/JSON/失败、选区加粗/撤销重做、根detach和Storage失败。主控未执行前仍NOT_RUN，正式收据也独立。

## 迁移与生产取舍

- 服务器数据放Query，Composer拥有未保存草稿；切documentId才换实例，处理版本冲突，不能每次刷新都覆盖本地输入。
- 需要HTML导出/粘贴净化时另外设计节点导入与HTML输出净化。本例JSON策略不在粘贴时过滤HTML，也不是授权层。
- SSR阅读页用安全HTML/纯文本，React编辑Composer是DOM客户端边界。无DOMcreateEditor可用于受限数据处理，不等同于服务器模拟用户选区。
- 升级同步核对lexical和@lexical/react及节点字段。评估新版extension迁移时替换整套对应插件接线，不只换组件名。

官方README固定v0.52.0提交，原文与本讲解分开；许可由安装包和固定LICENSE双核MIT。官网响应头已保存，没有实际Lab-origin内容确认就保持unknown，HTTP200不能变成嵌入PASS。实际命令与分层六项证据见local-validation.md。
