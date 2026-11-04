# F09 pdf-lib — 工程手册

## 适用

在浏览器里创建、合并、短标注 PDF 字节。不负责画布阅读，也不负责 React 排版。

## 版本

`pdf-lib@1.17.1`，MIT。`ignoreEncryption: false`。字体只用 `StandardFonts.Helvetica`。

## 迁移

带走 `examples/document.ts`、`examples/document-policy.mjs`、`examples/operation-gate.mjs` 和类型声明。操作必须经 `begin` / `isCurrent` / `finish`。输出经过 `validateOutputPdf`。不要把用户文件上传或写进仓库。

## 不可删的清理

已有活动时 `begin` 返回 null。换 level 和卸载 `invalidate`。每个 object URL 进入 `ownedUrls`，替换和卸载都 revoke。输入 ≤ 2 MiB，输出 ≤ 4 MiB，页数 1–20，边长 36–2000 pt。

## 反例

- 只用 `setBusy` 防连点。
- `ignoreEncryption: true`。
- 不检查页数和边长就盖章。
- 泄漏 blob URL。
- 把 `drawText` 当成已经在屏幕上渲染。
- 上传所选 PDF。
- 用 Helvetica 写未嵌入的中文。
- 策略单测写成 SDK PASS。

## 测试断言

- basic 输出非空且不超过 4 MiB。
- business 读回正好 2 页。
- 坏文件头、0 页、超大边长、超限输入被拒绝。
- 第二次 `begin` 在 `finish` 前返回 null。
- policy 与 gate 测试不 import `pdf-lib`。

## 真实限制

没有表单、签名、附件清理或视觉回归。文件头检查不是沙箱。页面不显示 PDF 内容，只给下载链接。合并夹具固定两页，不是任意页数的证明。

## 证据

sdk 与 browser 需要 `docs/library-lab/evidence/runs/` 里的收据。Actions 41779873259 不是 F09 PASS。

`document-policy` 与 `operation-gate` 的测试都不 import `pdf-lib`。
