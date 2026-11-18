# CodeMirror6：事务更新文本，View拥有DOM

配置编辑框需要TypeScript语法着色、光标、撤销以及可以切换的只读状态。CodeMirror6适合嵌入式源码编辑；只读着色比较Shiki，跨文件语言诊断/完整IDE比较Monaco，富文本用Tiptap/BlockNote。模块化扩展有接入成本，语法包不等于TypeScript类型检查器或语言服务器。

本例固定codemirror6.0.2、@codemirror/state6.7.6、@codemirror/lang-javascript6.2.5，实际package均MIT。不同包独立发布，不要求版本数字相同，但要避免装入重复不兼容State实例。示例没有Worker、后台、账号、上传或代码执行。

## 数据模型和最小接入

EditorState是不可变文档/选区/扩展配置快照；transaction得到新State。EditorView将State呈现为可编辑DOM，并处理真实输入、焦点与测量。React只保存展示长度；权威文本来自view.state.doc。不要每键setState全文再整篇替换，尤其会干扰IME。

已有React/TSX DOM项目执行：

```sh
pnpm add codemirror@6.0.2 @codemirror/state@6.7.6 @codemirror/lang-javascript@6.2.5
```

复制example.tsx、editor-config.mjs/.d.mts、draft-policy.mjs/.d.mts，保持相对路径；demo.tsx仅Lab转发可省。渲染`<CodeMirrorExample level="business" />`。TS使用Bundler模块解析；无需Provider、env、单独CSS文件、远程资源或语言Worker。basicSetup和EditorView.theme生成所需编辑器样式，字体用系统monospace；无额外语言服务器配置。SSR需客户端专用挂载，example的effect只在浏览器创建View。

editor-config是UI/真实State测试共用配置：basicSetup提供历史/快捷键等，javascript({typescript:true})提供语法，tabSize2；Compartment初始readOnly=false。UI添加docChanged监听及260px主题。State纯计算可以Node执行，EditorView需要真实DOM，二者验收分开。

```js
const config = createEditorConfig();
const state = EditorState.create({doc: 'const n: number = 1', extensions: config.extensions});
const next = state.update({changes: {from: state.doc.length, insert: ';'}}).state;
// state仍为旧文档；View中用view.dispatch同类事务。
```

## 三个独立实验

### 基础：真实输入、高亮与撤销

输入/粘贴后UTF16长度变化；JavaScript/TypeScript语法产生高亮span，撤销恢复上一事务。new EditorView只在effect内创建，正常按键不重建View。高亮不表示代码可执行或类型正确。重置按钮程序dispatch替换默认源码，不销毁View。

### 业务：会话草稿与失败恢复

唯一key为reactloom:library-lab:E04:config-draft:v1。business创建时读取本key，坏草稿/拒绝访问加载默认并提示。保存、恢复按钮都先assertDraftText：字符串、最多50000个UTF16码元且无NUL。普通任意文本不是JSON，不存在“损坏JSON”；空字符串合法，含NUL/超限才是不合法草稿。

保存后编辑，再恢复应回到草稿。缺key显示没有草稿；非法/超限/Storage读写异常显示错误，恢复校验失败前不dispatch，当前文本不变。只读写本key，不clear全局。只有本标签页一份草稿，没有自动保存、文档id、后端版本/冲突或跨设备同步。

### 进阶：同一个View动态只读与销毁

输入后勾选只读，Compartment.reconfigure改变EditorState.readOnly，键盘编辑命令不再更改正文；取消只读后继续编辑，原View和历史仍在。**readOnly限制用户编辑，不是安全权限，也不禁止程序dispatch。** 重置按钮在只读下仍可替换文本，明确展示两者区别，不应把只读当后端ACL。

切层或卸载时effect清理本次View：先清viewRef，再view.destroy。不能只看.cm-editor消失就声称destroy完成；浏览器提案保留真实view句柄并观察固定版本destroyed状态。Compartment属于本次配置，切换只读不把readOnly放进创建effect依赖。语言Worker/队列无需清理，因为这里根本没有。

## 迁移和验收边界

50k保护按钮/初始化会话恢复，不限制用户编辑实时长度，也不证明性能/语法或内存安全；应按业务设输入预算。中文IME/软键盘/读屏需实际设备，Node事务或合成按键不能当输入法通过。避免组合过程中外部整篇恢复，生产可给恢复按钮加组合态协议；本例没有自动触发恢复。数据只当文本，不eval/innerHTML执行。

真实State测试和policy测试分计；Node没有EditorView DOM。浏览器提案观察输入/高亮/undo、合法/非法存储、同View只读、只读程序重置以及外层destroy证据。未运行不标PASS。准确命令/日志见local-validation.md，formal verification保持NOT_RUN。

## 官方来源

README原文选codemirror集成包对应的codemirror/basic-setup tag6.0.2固定commit76462c05acb10fe77e0f04edd7fcddfeb9987abd，许可证MIT原文同存。它不是state6.7.6/语言6.2.5共同发布版本；各包实装来源映射见official/source-evidence.json。固定仓库无官方中文README，保留英文原文。官网GET200无明确限制头但未Lab嵌入确认，unknown，保留官方直达。
