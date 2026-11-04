# E02 BlockNote — 工程手册

## 适用

需要斜杠菜单、块拖拽和现成工具栏的文档。完全自绘工具栏用 E01。命令级 EditorState 用 E03。代码用 E04 或 E05。只读排版不要挂 BlockNote。

## 版本

`library.json`：`@blocknote/core`、`@blocknote/react`、`@blocknote/mantine` 均为 0.56.0，MPL-2.0。`@mantine/core`、`@mantine/hooks`、`@mantine/utils` 在条目里是 `version: null`。Lab `package.json` 另写 `@mantine/core@9.7.3`、`@mantine/hooks@9.7.3`、`@mantine/utils@6.0.22`，utils 6 与 core 9 主版本错位。不要把编辑器写成已验证。不要引入 `@blocknote/xl-*`。

## 迁移

复制 `examples/example.tsx` 的 `useCreateBlockNote`、`BlockNoteView` 和两份 CSS。`examples/demo.tsx` 只是再导出。恢复必须先过 `parseBlockSnapshot`，再 `replaceBlocks`。用产品 API 替换 sessionStorage 时保留块 JSON 为事实源，Markdown 只做有损交换。0.55 的 `blockTypeSelectItems(dict)`、根路径导出的 `UniqueID`、以及旧历史组件路径都要按 0.56 发布说明改。

## 不可删的清理

`editor.onChange` 的返回值必须在 effect 清理时调用。`key={level}`（产品里用文档 id）重建实例，不要只改 `initialContent`。`parseBlockSnapshot` 丢掉持久化块 id。`sessionStorage` 的读写都在 try/catch 里。恢复失败不要假设 `replaceBlocks` 已回滚，也不要清空成空数组来“修好”。

## 反例

- 每个字符 `setState(editor.document)` 再整篇替换。
- `blocksToMarkdownLossy` 当唯一数据库。
- 输入过程中 `replaceBlocks`，打断中文输入法。
- 不退订 `onChange`。
- `uploadFile` 返回 base64。
- `blocksToFullHTML` 直接 `dangerouslySetInnerHTML`。
- 并发保存不带文档 id 和 ETag。
- 把 XL 包当成 MPL 核心。
- 忽略 Mantine utils 6 / core 9，宣称编辑器已验证。

## 测试断言

- 快照超过 60_000、超过 100 块、未知块类型、非 HTTPS 外链被拒绝。
- 图片、文件、视频块不能从这份策略恢复。
- 浏览器里：斜杠菜单和 `insertBlocks` 改变块数；坏草稿不覆盖；换层后订阅解除。
- Node 测试不加载 `@blocknote/react`。Mantine 样式是否泄漏到外壳要单独看。

## 真实限制

策略不是完整 schema。`initialContent` 不是受控 value。示例没有防抖、没有双文章键、没有上传、没有协作。`replaceBlocks` 的原子性没有 SDK 收据。

## 证据

不要写 PASS。sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E02 收据。Actions `41779873259` 是仓库级运行。Mantine 主版本错位是不把编辑器标成已验证的直接原因。

资料：https://www.blocknotejs.org/docs/getting-started 与 https://www.blocknotejs.org/docs/reference/editor/events 。
