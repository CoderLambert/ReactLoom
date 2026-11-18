# Tiptap：正文由编辑器拥有，草稿用结构化 JSON 恢复

文章后台需要自定义工具栏、保存草稿和拒绝不符合文档结构的导入。Tiptap把ProseMirror的Schema、事务、选区与命令封装为headless编辑器；UI由产品绘制，而不是一个现成Word。此例固定@tiptap/react、@tiptap/pm、@tiptap/starter-kit 3.32.0，安装包及固定上游package声明均MIT；平台托管服务与商业扩展不在本例。

纯文本备注用textarea；要现成块编辑界面比较BlockNote。需要自己设计富文本体验且接受Schema和输入法验收成本时选Tiptap。本例是内存编辑器与本标签页sessionStorage，没有上传、网络、协作、自动保存或发布接口。

## 数据怎样流动

Editor拥有ProseMirror文档和选区。键入/toolbar命令产生Transaction，EditorView更新DOM；React仅订阅update计算字符数，不把每次getJSON再setContent写回。JSON不是HTML，也不是靠任意对象的type=doc就能信任。

```tsx
const editor = useEditor({
  extensions: createExtensions(),
  content: START,
  immediatelyRender: false,
})
// 选择文字后：editor.chain().focus().toggleBold().run()
return <EditorContent editor={editor} />
```

editor-config.ts是完整可复制配置：StarterKit默认文本/列表/代码/历史扩展，标题仅2/3级；Link禁用自动识别、粘贴自动链接和点击导航，并只允许无凭据HTTPS。v3 StarterKit已有Link、Underline、UndoRedo，不重复注册。immediatelyRender:false让React/SSR先得到null再创建浏览器编辑器，按钮在null时禁用。Next等SSR使用方还需客户端组件边界。

## 三个独立实验

### 1. Headless编辑与撤销

basic在正文中键入，选中文字后点击加粗或斜体，选区内容生成对应mark。列表按钮切换节点结构，撤销通过真实历史命令恢复之前事务。正文字符数随update变化；不是document.execCommand或父组件改innerHTML。toolbar先focus恢复编辑焦点；当前按钮未订阅isActive，因此没有声称完整选区状态栏。

### 2. 本标签页草稿

business修改正文，点保存草稿：getJSON→20,000个JS字符串码元限额与保守策略→仅DRAFT_KEY的sessionStorage.setItem。再改正文、点击恢复，应回到保存内容。没有草稿、空字符串、损坏JSON、超限或Storage异常均显示失败，不把失败假装成功。不会sessionStorage.clear，也不清其它应用键。

snapshot-storage.mjs可注入Storage接口；实际UI仍使用真实sessionStorage。它不是后端协议，没有文档id、schemaVersion、ETag、跨设备同步或冲突解决；同源脚本能修改草稿，恢复必须再校验。纯策略测试的Storage异常由受控fake注入，不冒称真实浏览器配额耗尽。

### 3. JSON边界与真实Schema

advanced可修改“待恢复JSON”并点校验恢复。输入`{`、空字符串、超过20,000码元、image节点或非法属性，应显示失败且正文不变。输入节点白名单允许、但结构错误的`{"type":"doc","content":[{"type":"paragraph","content":[{"type":"paragraph"}]}]}`，也必须被真实Schema拒绝。

恢复分三步：parseTiptapSnapshot限制大小/节点/属性/深度/计数；editor.schema.nodeFromJSON(parsed).check()验证节点组合；全部通过后才setContent(...,{errorOnInvalidContent:true})。先check再发命令，避免失败导入改变当前文档。合法段落JSON可替换正文，查看JSON结构以pre文本展示（超过2400字符预览截断），重置只改本编辑器、不删草稿。

策略允许当前文本StarterKit节点/marks；标题2/3级、列表start正整数、链接只无凭据HTTPS，拒绝src/style/on*/原型字段。不是任意Schema通用净化器：新增图片/自定义节点必须同步扩展、策略与负例，不能把导出HTML直接塞进另一个宿主。发布HTML另做允许列表和服务端校验。

## 完整迁移

已有React/TS项目安装`pnpm add @tiptap/react@3.32.0 @tiptap/pm@3.32.0 @tiptap/starter-kit@3.32.0`。复制example.tsx、editor-config.ts、snapshot-policy.mjs/.d.mts、snapshot-storage.mjs/.d.mts，保持相对路径；demo.tsx只Lab适配，可省略。渲染`<TiptapExample level="business" />`，basic/advanced也可。TS使用支持.mjs/.d.mts的bundler解析，React DOM由宿主提供。无额外Provider、环境变量、CSS插件、Worker或资源下载；内联边框和demo-controls仅布局，可自行换排版。

useEditor拥有实例，卸载由Hook调度destroy，应用不重复destroy；自己的update监听在effect cleanup中用同一函数off。key=level确保换层换实例/撤销栈。浏览器验收需要抓住真实editor句柄，检查isDestroyed及自有off调用，不能只看DOM消失。编辑时不重建Editor，组合输入交给ProseMirror；中文候选、移动键盘与组合期间点toolbar需真实输入法人工验收，合成composition事件不是该证据。

## 限制、取舍与官方来源

20,000是本例JSON码元上限，不是字节或SDK协议限制；节点500、深度12为应用预算。大文章应测真实设备、做后台保存/错误恢复，不每键写同步Storage。useEditorState可做选区状态订阅，但本例只保留简单toolbar；没有性能提升数字。

README保存ueberdosis/tiptap固定v3.32.0提交的packages/react/README.md原字节；固定树没有中文package README，使用英文en。官网实际响应X-Frame-Options:SAMEORIGIN，禁止跨源Lab嵌入，状态blocked并保留直达。原响应、原文SHA与安装包许可依据见official/source-evidence.json和library.json。

本地SDK2项仅执行真实StarterKit Schema，不创建EditorView，不能证明编辑、撤销或Hook清理；Node策略5项分列。浏览器提案实际执行编辑、格式/undo、草稿、非法结构拒绝和真实实例销毁；未执行前这些保持NOT_RUN。具体命令、日志与六项状态见local-validation.md，正式verification不由本地测试推成PASS。
