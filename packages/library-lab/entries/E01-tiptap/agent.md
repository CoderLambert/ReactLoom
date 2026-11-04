# E01 Tiptap — 面向编码 Agent 的迁移手册

**识别任务**：自定义富文本、Schema 扩展、受控工具栏、结构化文档。需要开箱即用的块级产品界面时优先评估 E02 BlockNote；需要 IDE 语义高亮时不要选 Tiptap。

**版本事实**：`@tiptap/react`、`@tiptap/pm`、`@tiptap/starter-kit` 3.32.0，MIT；查看目标项目是否为 React19 和客户端运行环境。当前版本仍未经本Lab实际构建，见 verification.json。

**最小迁移路径**：先读 `examples/example.tsx`，复制 `useEditor/EditorContent/StarterKit`、`editor.chain().focus()`、update监听/清理，示例 `demo.tsx` 不是必需业务代码。不要复制整套Lab容器或 CSS。

**必须保留**：编辑器 null 检查；只在稳定实例上订阅/退订 update；限制 JSON 输入尺寸；持久化需要版本、schema、服务端权限；不在 HTML 显示层信任富文本；切文档时明确编辑器/存储所有权；IME 不按单次 keydown 误读文本完成。

**禁止的反模式**：`document.execCommand` 替代真实命令、在 render 中 new Editor、把 parse 成功当安全验证、每个按键写 sessionStorage、复制 v2 教程到 v3、把私有文档嵌入外部 AI 服务。

**验收**：选区加粗/撤销、内容保存重进恢复、非法 JSON 与超长输入、两标签页独立、卸载无更新回写；在真实浏览器执行并记录 commit SHA / pkg lock / 截图。命令：`pnpm --filter @reactloom/library-lab typecheck`、`build`、针对 E01 的浏览器检查。NOT_RUN 不能写 PASS。

**资料**：https://tiptap.dev/docs/editor/getting-started/install/react 与 https://tiptap.dev/docs/editor/api/editor。

## EF 迁移补充

复用 `examples/snapshot-policy.mjs` 时保留 20KB / 500节点 / 深度12 / StarterKit 白名单限制及 `errorOnInvalidContent:true`，并针对业务新增 Node/Mark 类型升级校验。独立场景通过子组件 key 重挂，不能把切换 Tab 等同 CSS 隐藏。先跑 `node --test packages/library-lab/entries/E01-tiptap/tests/policy.test.mjs`，再用真正 SDK + Chromium 验证，不能把此纯策略测试记为 SDK PASS。
