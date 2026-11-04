# F02 react-dropzone — 工程手册

## 适用

拖放和按钮选择，并在浏览器里按类型、大小、个数拒绝。不负责上传、分片或病毒扫描。CSV 内容交给 F03。

## 版本

`react-dropzone@20.1.4`，MIT。使用 `useDropzone`。`useFsAccessApi` 固定 false。

## 迁移

带走 `examples/example.tsx`、`examples/preview.mjs` 和 `.d.mts`。保留 `noClick: true`，对话框只从按钮 `open()`。`accept` 保持 text/plain+.txt 与 text/csv+.csv。basic 与 business 是 1 个文件、256 KiB；advanced 是 2 个、1 KiB。

上传时用应用的 API client，不要在 `onDrop` 里直接 `fetch` 用户文件。

## 不可删的清理

选择、清空、换 level、卸载都要增加 generation。预览 Promise 只有代号仍匹配才能写入。预览必须 `slice(0, 8192)` 再截到 1600 字符。不要改成整文件 `text()`。

## 反例

- 把 `onDrop` 当成上传成功。
- 不展开 `getRootProps` / `getInputProps`。
- 根可点击又在内部按钮调用 `open()`。
- 只信扩展名或 `file.type`。
- 记录 `file.path`。
- 后完成的读取覆盖新文件。
- 打开 File System Access 又不处理权限。
- 为预览创建 Object URL 却不 revoke。

## 测试断言

- 非法 size 或缺少 `slice` 的输入被 `readLocalTextPreview` 拒绝。
- 只解码前 8 KiB，可见字符不超过 1600。
- 拒绝列表展示 `errors[].code`，接受列表不包含被拒文件。
- 换 level 后列表和预览为空。
- `preview.test.mjs` 不 import `react-dropzone`。

## 真实限制

页面不发网络请求。256 KiB 和 1 KiB 是教学限额，不是库的上限。同名同大小的 key 会冲突。拖放和键盘要在浏览器里看，策略测试看不见。

## 证据

没有收据不要写 PASS。仓库级 Actions 41779873259 不是 F02 的 sdk 或 browser 收据。
