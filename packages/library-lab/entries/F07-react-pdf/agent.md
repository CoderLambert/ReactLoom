# F07 react-pdf — 工程手册

## 适用

用 React 组件阅读已有 PDF。生成用 F08，改字节用 F09，直接管 Canvas 用 F06。

## 版本

`react-pdf@11.0.0` 与 `pdfjs-dist@6.3.289`，阅读器 MIT。Worker 与 Document 写在同一模块。没有浏览器收据就不要声称 Worker 已加载。

## 迁移

带走 `examples/example.tsx`、`examples/fixture.ts`、`examples/worker-payload.mjs` 和 `.d.mts`。`file` 必须是 `{ data: source.slice() }`。`key` 使用 `documentGeneration`。文字层 CSS 只在打开 `renderTextLayer` 时引入。批注层保持 false。

## 不可删的清理

空字节和大于 3 MiB 不能进 Worker payload。选择、重置、卸载增加 `readTurn`。换文档时页数归零并换 key。不要把 React state 的 buffer 交给 Document。卸载由页签离开完成，不要另做全局缓存。

## 反例

- Worker 配在别的文件或 CDN。
- 只升级 F07 或只升级 F06。
- `<Document file={bytes}>` 交出原 buffer。
- 按页数一次挂上所有 `<Page>`。
- 把文件选择当成上传。
- base64 进长期状态。
- 打开批注层却没有样式和 CSP。
- 用 v10 的加载 API。
- 两页夹具成功就宣称任意 PDF、密码和 CMap 都可用。

## 测试断言

- payload 是新的 `Uint8Array`，原件在 transfer 后仍可读。
- 大于 3 MiB 或空数组被拒绝。
- 损坏字节替换文档并走错误文案；恢复回到夹具。
- 非 basic 才有文字层；批注层关闭。
- `worker-payload.test.mjs` 不加载 react-pdf。

## 真实限制

没有 4096 像素预算（那在 F06）。没有密码、字体包和 wasm。缩放档只有四档。文字层不等于抽取结构。损坏按钮会替换当前文档，不像 F06 那样只探测。

## 证据

sdk 与 browser 需要 `docs/library-lab/evidence/runs/` 收据。版本声明测试和 transfer 策略都不是 Worker 收据。Actions 41779873259 不是 F07 PASS。
