# E02 BlockNote — AI Agent 工程复用说明

**任务匹配**：块级富文本/Notion式编辑、组合编辑 UI。需要完全自定义编辑交互时比较 E01 Tiptap；纯代码编辑选 E04 CodeMirror或E05 Monaco，不要只因存在ContentEditable就用BlockNote。

**依赖与许可证**：同步选 `@blocknote/core`、`@blocknote/react`、`@blocknote/mantine` 0.56.0，Mantine peers 让平台核对；MPL-2.0 的源码修改义务须遵守；`@blocknote/xl-*` GPL/商用独立审查，默认禁止复制。

**真实源码**：`examples/example.tsx`；demo.tsx仅导出。保留 `useCreateBlockNote`、`<BlockNoteView editor={editor}/>`、官方CSS；业务替换 sessionStorage 时需要文档版本和访问授权。不要在根布局 import 庞大的编辑器依赖。

**清理与能力边界**：onChange 返回 unsubscribe 必须在组件卸载调用；React Hook 自行拥有编辑器实例；不要跨路由保持全局实例。默认图片和资源扩展的授权、存储/上传不在此示例范围，必须经明确业务设计。

**输入与安全**：块JSON只进行浅层预检不是 schema 验证；版本升级仍可能报错，捕获后不要清空现有文档；导出HTML要另行净化，禁止富文本直接使用 dangerouslySetInnerHTML。中文IME/手机滚动/浮动工具条要专门实测。

**验证**：真实SDK挂载/输入/插块，数据量限制、损坏JSON、恢复失败不覆盖、卸载监听解除、跨文档切换；TypeScript/Bundler/Mantine peer 和 CSS检查。未运行SDK、浏览器继续保持 NOT_RUN。

**官方依据**：https://www.blocknotejs.org/docs/getting-started 和 https://www.blocknotejs.org/docs/reference/editor/events

## EF 迁移补充

保留 `examples/snapshot-policy.mjs` 对快照深度/数量/外链的约束，并明确当前只支持文本块，媒体/表格及其他 block schema 必须专门扩展。恢复时包括 `sessionStorage.getItem` 的异常路径；不可把 `replaceBlocks` 抛错当作事务回滚保证。切换场景 key 必须让旧 BlockNote 实例完整释放。先跑 `node --test packages/library-lab/entries/E02-blocknote/tests/policy.test.mjs`；再在目标 SDK/浏览器实测。
