# BlockNote：块编辑、会话草稿与有限恢复

阅读笔记需要标题、段落、列表和斜杠菜单，而不想从ProseMirror自己组装工具栏。BlockNote0.56.0提供块模型和开箱UI；成本是编辑器依赖、CSS/字体、块schema迁移与浏览器验收。完全自绘工具栏比较Tiptap；纯文本或只读排版无需挂编辑器。本文不实现协作、上传、账号或XL商业扩展。

核心/React/Mantine三个BlockNote包均0.56.0，安装包和固定LICENSE.txt为MPL-2.0。XL等扩展许可不同，不在本例。不要将Markdown当无损数据库，权威编辑数据是editor.document块JSON。

## 最小接入

在已有React/TSX、DOM浏览器项目根执行：

```sh
pnpm add @blocknote/core@0.56.0 @blocknote/react@0.56.0 @blocknote/mantine@0.56.0 @mantine/core@9.7.3 @mantine/hooks@9.7.3
```

复制example.tsx、snapshot-policy.mjs及snapshot-policy.d.mts，保持相对目录；demo.tsx只做Lab转发，可以省略。渲染`<BlockNoteExample level="business" />`。无需环境变量、服务、账号或额外Provider。@blocknote/mantine View在没有MantineContext时自包MantineProvider；已有宿主Provider则沿用。已有React/ReactDOM需满足Mantine9.7.3的^19.2.0 peer。

必须保留`@blocknote/mantine/style.css`和`@blocknote/core/fonts/inter.css`导入。前者含Mantine基础和BlockNote样式，后者提供字体资源， bundler需支持包内CSS/字体。宿主已有Mantine基础样式时评估改用blocknoteStyles.css，避免重复基础样式。样式加载不是div级沙箱，需检查portal、字体和宿主层叠。本例没有复制字体文件或远程CDN。

实装@mantine/core/hooks9.7.3满足@blocknote/mantine0.56声明的^8.3.11||^9.0.2；Lab另有@mantine/utils6.0.22，编辑器这里未直接导入，不能只凭主版本不同判断peer失败。metadata记录实际安装版本，不代表已经浏览器验收。

```tsx
const editor = useCreateBlockNote({
  initialContent: [{ type: 'paragraph', content: '阅读笔记' }],
})
return <BlockNoteView editor={editor} />
```

editor拥有文档；initialContent仅初始化，不是受控value。onChange观察块变化，不能每键输入又replace整篇。换文档用稳定documentId作key或显式替换，本例用level作key，不是双文章系统。Next等SSR应用需单独配置客户端专用加载，本例不提供SSR接线。

## 三个独立实验

### 基础：真实块编辑与菜单

编辑标题和段落，在空段输入`/`打开默认菜单并选列表/标题，观察编辑结构和外部变更回调计数。块数展示来自真实editor.onChange。默认菜单包含媒体/其他块；这里没有uploadFile服务，不能把URL输入或媒体菜单解释为完成上传。基础编辑器的默认schema比下述持久化策略更宽。

### 业务：一份会话草稿

保存将editor.document序列化并先通过有限策略，再写本标签页唯一key `reactloom.lab.E02.blocknote.blocks.v1`。编辑后恢复，通过同一策略后才调用replaceBlocks。恢复丢掉每个持久化块id（包含嵌套），SDK为新块分配id；内容不是按旧id合并。只是一份会话草稿，不是自动保存、跨设备同步或服务端冲突解决。

损坏JSON、超限、非法props/inline、媒体块在SDK调用前拒绝，原编辑内容不变。Storage读写/删除可能因隐私/配额失败，错误显示且不清空文档；清除只removeItem本例key。若真正replaceBlocks内部意外抛错，不承诺SDK事务回滚，需产品备份/恢复设计。输入法组合期间拒绝保存、恢复和插入按钮，避免半成品快照或整篇替换打断组合；真实IME仍需浏览器/人工验收。

### 进阶：命令插块与受限恢复契约

点击插入审核段落，真实insertBlocks在末块后追加，块数/变更回调上升。保存后再插入、恢复，内容回到保存时快照；清除草稿后恢复显示没有草稿而不改编辑内容。非法/过大草稿的失败后仍能修正并重新保存恢复。

恢复策略只支持paragraph、heading、bulletListItem、numberedListItem、checkListItem；标题level1..3，已知对齐/颜色/checked/isToggleable属性，内联文本/有限样式和无凭据HTTPS链接（链接内容为styled text数组）。不支持图片/文件/视频、表格、代码块、quote或自定义inline。默认菜单可创建策略之外内容，此时保存明确拒绝，不承诺通用BlockNote JSON往返。

上限60000个JS字符串UTF16单元（不是网络60KB）、总共100块含嵌套、块深度8、文本单项20000、inline数组500。该策略是自建schema子集，不是SDK全部schema或HTML净化器。生产需版本化schema、授权、大小预算及迁移，不能把未知JSON强转类型当校验。

## 生命周期与错误边界

useCreateBlockNote源码通过useMemo创建实例；BlockNoteView的ref卸载路径调用editor.unmount，本例外部onChange的unsubscribe在effect cleanup执行。这里不凭组件消失声称editor.destroy已调用或所有内部资源已被观测关闭。实例局部，不清空全局存储/其它编辑器。浏览器需要验证重挂载种子、输入焦点、菜单、事件和Mantine样式；Node策略通过不证明DOM SDK已运行。

结果不输出不可信HTML；JSON恢复也不能替代未来HTML发布的净化。无网络/上传/付费能力。Markdown和HTML交换有损，不在此示例实现。

## 证据与官方来源

本地policy命令/原始日志及六项状态见local-validation.md。真实SDK依赖DOM，validation/browser.spec.ts提供实际编辑/菜单、保存/恢复、ID更新、拒绝不变、Storage异常及卸载提案给主控；本作者不伪造Node SDK PASS。正式verification各项仍NOT_RUN。

官方v0.56.0固定commit8e0485caef54abe9cad6b84fa66505e0398acb79的README.md和LICENSE.txt原字节已保存。固定目录没有官方中文README，采用英文原文，本文为独立中文讲解。官网实际GET200但无Lab origin嵌入确认，unknown；完整响应证据在official/source-evidence.json，保留官网直达。

存储合同还不接受编号列表的自定义 `props.start`；默认值是 `undefined`，JSON 保存时省略，普通编号列表仍可保存。设置非默认起始编号后，保存会明确拒绝，需先扩展本例白名单与业务迁移策略。
