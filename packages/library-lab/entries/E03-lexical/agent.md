# E03 Lexical — Agent 迁移实施手册

**适用**：需要结构化 RichText、扩展节点、格式命令、草稿 JSON 的业务编辑器。**不适用**：单纯 textarea / 代码 IDE / 简单 Markdown 只读。Lexical 0.52.0 与 @lexical/react 0.52.0 必须锁一致，升级时核对完整扩展包兼容。

## 从哪里开始
- 阅读 `library.json`、`verification.json` 及 `examples/example.tsx`（真实运行源），`examples/demo.tsx` 只是展示层出口。
- 拷贝 EditorState read/update 的应用逻辑，而非整块 Lab 页面 UI。目标项目自身管理持久化和业务模型。
- Composer 配置保持稳定；内部 `$` API 限于 read/update/command handler。多 editor 请用独立 namespace 与实例。
- 保存时调用 `getEditorState().toJSON()`，恢复时 `parseEditorState()` 再 `setEditorState()`。加文档ID、schemaVersion、大小限制、冲突检测与迁移兼容。
- 不能把 JSON 结构直接当作 HTML 或未经净化地注入站点；处理粘贴 URL/富HTML 时依据产品独立安全策略。
- 选区格式命令触发时注意鼠标按下是否导致 selection 丢失；中文输入法/撤销/粘贴测试必不可少。
- 真实产品中的服务端保存和协作功能不可从本地 sessionStorage demo 推导为已实现。

## 验证合同
- basic：输入改变文本长度，重置不触发其他组件重挂。
- business：sessionStorage 结构化快照恢复，同页损坏 JSON 提示且不覆盖当前内容。
- advanced：有选区时 bold 工作；IME/焦点/撤销在 Chromium 真实测试。
- 路由卸载清理编辑器 DOM、监听和历史。构建须在锁文件提供后跑 `pnpm --filter @reactloom/library-lab typecheck` + `build`，再跑对应 browser E2E。
- `PASS` 需要当前源码 fingerprint、真实命令和耐久日志，否则状态维持 NOT_RUN/BLOCKED。

**边界**：v0.52 新 Extension Composer 值得后续升级评估；当前官方兼容的传统 Composer 示例不等于推荐继续为新项目无条件使用旧 API。链接：https://lexical.dev/docs/getting-started/react

## EF 迁移增补

持久化 Lexical JSON 前后保持非空根检查；`parseEditorState` 之后必须检查 `isEmpty()` 再应用，不要根据 parse 成功假定状态可提交。场景级 key 阻断历史/草稿串用。节点 Schema 升级时同步 `examples/snapshot-policy.mjs` 与负例；当前政策仅覆盖原生 paragraph/text。先运行 `node --test packages/library-lab/entries/E03-lexical/tests/policy.test.mjs`，再进行真正 Lexical SDK/Chromium 验证。
