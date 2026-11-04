# E04 CodeMirror 6 — Agent 迁移手册

**用途**：React 里的多行代码/配置/SQL 编辑器。不是静态着色、HTML 净化或完整 LSP。先看 `library.json` 的包版本、`verification.json` 的真实状态。

**迁移最小路径**：`examples/example.tsx` 是真实实现，`examples/demo.tsx` 只做 Lab 入口。安装 `codemirror`、`@codemirror/state`、对应语言包；只迁移 EditorView+EditorState+Effect 清理，按目标项目替换 sessionStorage 草稿策略。

**不可删**：挂载时创建一次 EditorView；effect cleanup 调用 `view.destroy()`；内部编辑不反复重建 React 容器；Compartment 重配置读写权限；storage 异常捕获；只存业务允许的非敏感值。

**反例**：直接修改 DOM contentEditable；每个击键新建 EditorView；误认为 readOnly 禁用复制；将格式化套在 IME composition 期间；没有保存大小/版本约束；以 CodeMirror 高亮当作 TypeScript 语义校验。

**验收断言**：真 CodeMirror 依赖可 import/构建，输入影响 state.doc，Compartment 切换不重建 view，切 Tab 卸载后不会留下旧 DOM，sessionStorage 拒绝时编辑仍可用，IME/移动端需另测。禁用 SDK Mock 冒充成功。

**备选**：E05 Monaco（IDE）、E09 Shiki（只读）、E06 react-markdown（预览）。官方 https://codemirror.net/docs/guide/ 。本次新实现未运行 SDK/浏览器。

## EF 迁移增补

所有 sessionStorage 读取（首次初始化和“恢复”按钮）与保存都必须调用 `examples/draft-policy.mjs` 的 50,000 字符/NUL 校验，拒绝大草稿时保留当前 EditorView 内容。原文可能包含非可信代码；本示例只编辑文本不运行代码。先运行 `node --test packages/library-lab/entries/E04-codemirror6/tests/policy.test.mjs`，然后验收真实 CodeMirror 事务/只读、IME和卸载。
