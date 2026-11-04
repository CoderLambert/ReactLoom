# Tiptap 3.x — 在 React 中建设可控的富文本编辑器

## 能解决的问题与边界

Tiptap 是基于 ProseMirror 的 Headless 编辑器。它负责 Schema、文档事务、扩展和命令，**不会替产品自动设计所有工具栏或业务存储**。适合公告撰写、邮件模板、笔记与可组合的文本编辑。完整块编辑 UI 更偏向 E02 BlockNote；代码编辑首选 E04/E05。研究版本采用 `@tiptap/react@3.32.0`、`@tiptap/pm@3.32.0`、`@tiptap/starter-kit@3.32.0`，三包应同系列安装；目前真实构建仍待 PLATFORM 验证。

## 安装、入口与运行

```bash
pnpm --filter @reactloom/library-lab add @tiptap/react@3.32.0 @tiptap/pm@3.32.0 @tiptap/starter-kit@3.32.0
pnpm --filter @reactloom/library-lab dev
```

上述安装动作只能由 PLATFORM 执行；EF 只记录请求。实战代码在 `examples/example.tsx`，`examples/demo.tsx` 只是薄适配；源代码展示由平台生成并附 SHA-256。入门需要 `useEditor({extensions:[StarterKit],content,...})`、`<EditorContent editor={editor} />`；编辑命令使用 `editor.chain().focus().toggleBold().run()`，不是手写 DOM execCommand。

## 三种应用场景

**入门**：点击加粗、斜体、列表和撤销，直接观察真实编辑区域的文档变化。命令通过 `focus()` 维护选择区；只改按钮颜色不能代表 ProseMirror 状态正确。

**业务**：通过 `editor.getJSON()` 保存到本标签页的 sessionStorage，恢复时使用 `editor.commands.setContent()`，限制序列化长度，展示失败状态。生产应加入文档版本、迁移与服务端验证，不应以 JSON 可以解析就认定所有节点可信。

**高级**：查看真实结构与截断预览、设置容量限制、仅重置当前示例，说明状态/内容所有权。React effect 监听 update，解绑相同函数身份；编辑器本体由 useEditor 生命周期托管，不要额外重复 destroy 同一个实例。

## 必须掌握的反例

1. **把编辑器每个键击同步成整页 React state**：大文档时造成大量无意义渲染。只同步必要统计或节流后的业务草稿状态。
2. **接收任意 HTML 并直接写入宿主**：Schema 解析不意味着产物可自由插入到其他 HTML 容器。来自外部的 HTML 需要单独净化、URL 协议约束、尺寸上限。
3. **在编辑器还未创建时调用命令**：`editor` 在首次渲染可能为 null；按钮禁用并保护空值。
4. **全局持有一个 editor 实例**：详情页切换、StrictMode 重挂、快捷键及插件观察者容易泄漏；实例属于挂载的编辑器组件。
5. **依赖旧版本 API**：v2/v3 的 StarterKit、扩展及 React 更新策略可能不同；只在锁定版本上复制此模板。

## 工程建议

发布和编辑分离：编辑端保存结构化文档，服务器按身份控制授权与版本；展示端渲染经过验证的结构而不是复制富HTML。中文 IME、组合输入、粘贴多段内容、Selection/Undo 历史及 SSR hydration 都需要真实浏览器回归。示例仅在客户端使用，Next.js 需避免 SSR 编辑器实例。

## 如何迁移到业务项目

从 `examples/example.tsx` 拿到 `useEditor`、工具栏、`on('update')` 与 `off` 的模式，保留命令焦点管理；用产品 API 替换 sessionStorage，不要复制实验室 CSS。逐项验证恢复损坏数据、文档容量、切换文档及卸载后无写回。与 E03 Lexical/E02 BlockNote 做需求驱动的技术选型。

## 当前验证与官方资料

来源：[React 官方安装](https://tiptap.dev/docs/editor/getting-started/install/react)、[Editor API](https://tiptap.dev/docs/editor/api/editor)。原材料属于研究参考；本条示例为重新实现。依赖尚未统一安装；SDK NOT_RUN、完整构建 BLOCKED、浏览器 NOT_RUN，不能推断实际渲染已通过。

## 本地 JSON 恢复防护补充（EF 第十五批）

浏览器 sessionStorage 可以被开发者工具或同源脚本修改，不可信任顶层 type=doc 就直接替换 ProseMirror 文档。源码将 `parseTiptapSnapshot` 与 React 恢复按钮共用，检查 20,000 UTF-16 字符、最多 500 节点、12 层深度、StarterKit 节点/marks 类型及无凭据 HTTPS 链接；再使用 Tiptap 3 官方 `setContent(json, {errorOnInvalidContent:true})` 明确拒绝无效 Schema，而非静默丢弃未知节点。该边界只面向此演示的 StarterKit；生产新增图片/表格/自定义 marks 时，必须同步改版本化文档 Schema 和校验，不得直接开放白名单。

三层示例在 level 切换时用 React key 独立重新挂载编辑器，避免一个实例跨场景遗留草稿、撤销历史和统计。纯 Node 检查位于 `tests/policy.test.mjs`；它未加载 Tiptap，不能替代真实 Tiptap/IME/浏览器测试。
