# BlockNote 0.56 — 块文档的真实 React 集成

## 定位与选型

BlockNote 是块级编辑器而非通用内容显示器。它在 ProseMirror/Tiptap 基础上提供文档块、侧栏、拖动、菜单和工具栏，更适合 Notion 式笔记、复杂内容录入。与 E01 Tiptap 比较：它减少UI自研量，但结构、资源、样式、授权与版本迁移需要更谨慎。E03 Lexical 适合从节点层控制编辑语义。版本基线 `@blocknote/core/react/mantine@0.56.0`，核心许可证 **MPL-2.0**；XL扩展是另一套许可证，不在本示例中引入。

## 安装和运行

```bash
pnpm --filter @reactloom/library-lab add @blocknote/core@0.56.0 @blocknote/react@0.56.0 @blocknote/mantine@0.56.0 @mantine/core @mantine/hooks @mantine/utils
```

准确 Mantine peers 和版本由 PLATFORM 在真实依赖树中锁定。示例 `examples/example.tsx` 按官方推荐 import `useCreateBlockNote`、`BlockNoteView`、Mantine stylesheet 和 Inter 字体 CSS；`demo.tsx` 只是导出适配。**项目的构建器/样式不能因示例懒加载而自动隔离**，主站如果同时加载 MUI/AntD/Mantine，需审查样式层并考虑独立 frame。

## 三个实际场景

1. **入门**：挂载 `useCreateBlockNote({initialContent})`，实际编辑段落、标题和 Slash 菜单，不用 contentEditable 伪装块编辑器。
2. **业务**：`editor.document` 的真实块数组 JSON 序列化，写入当前标签页 sessionStorage；有限制地解析、验证，再调用 `editor.replaceBlocks`。生产必须加 schema 版本/权限/冲突协议。
3. **进阶**：`editor.insertBlocks` 真实追加新段落，观察顶层块数；`editor.onChange` 订阅返回的 cleanup 在 React Effect 卸载时执行。当前仅检查 JSON 的顶层结构，不能把它当成完整的内容 schema 验证。

## 必须理解的工程反例

- 直接 `JSON.parse` 后无条件写入，忽略旧 Schema、媒体资源及多用户冲突。正确：按版本迁移、限制大小、捕获 replaceBlocks 失败并保留原文档。
- 在 render 中构造 editor，或每次输入重建 BlockNoteView。正确：使用官方 hook 的实例生命周期和有限同步状态。
- 把编辑器默认样式当成仅影响当前 div。Mantine CSS 与字体可能波及宿主，正式演示需审查构建输出及隔离边界。
- 默认开启图片/上传并相信浏览器已做内容安全验证。上传地址、认证、文件限制、清理和资源权限应显式实现；此示例不调用外部上传接口。
- 把 XL 套件当作 MPL 免费功能。单独审查 GPL-3.0 或商业授权，不把资源重新分发到 Lab。
- 用 JSON 块数据直接构造不可信 HTML；对导出层仍需输出净化和协议限制。

## 生命周期、IME 与可靠性

`editor.onChange` 只是变更通知，返回 unsubscribe；组合输入可能分成多个事件，不能依靠单次键盘事件断言编辑已完成。离开 Tab 需卸载真实 BlockNoteView，不能 CSS 隐藏后仍让编辑器运行。手机软键盘/浮动菜单涉及 viewport 与滚动容器。高频写入使用 debounce、AbortSignal/generation 和文档所有权，不要每次输入发 API。

## 测试与复用

验证初始块/格式操作、保存恢复、坏数据拒绝、前后两个文档隔离、热重载和重挂、IME和移动端菜单。仅在目标浏览器有证据后写浏览器 PASS。服务端需要校验权限和可用资源，不能继承前端 JSON 判断。

文档：[入门](https://www.blocknotejs.org/docs/getting-started)、[事件清理](https://www.blocknotejs.org/docs/reference/editor/events)、[React 集成](https://www.blocknotejs.org/docs/react/overview)。本条是重新实现，SDK/build/browser 仍未验收。

## 恢复的保守边界（EF 第十五批）

BlockNote `editor.document` 自带实例块 ID、资源与深层内联结构。新增 `parseBlockSnapshot` 在 SDK 调用前检查 60,000 UTF-16 字符、最多 100 个文本块（含嵌套）、深度上限、常见自由文本块类型和 HTTPS 外链，无条件拒绝图片/视频/文件块及非 HTTPS 带凭据 URL，并移除存储的块 ID 以让新编辑器生成实例 ID。它**不是**完整 BlockNote Schema 或 HTML 净化器，不能复制到需要支持媒体/表格的产品后直接把数据当有效。

恢复 `sessionStorage.getItem` 已纳入 try/catch，处理禁用存储策略；level 改变会销毁旧编辑器子组件并创建新的上下文。失败的 replaceBlocks 行为需在真实 SDK 中验证是否为原子事务，不应假设 catch 一定能回滚部分更新。Node 策略测试只检验边界，不证明 Mantine/BlockNote 真实运行。
