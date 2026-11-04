# F02 · react-dropzone：文件选择不是文件上传

## 适用场景

需要拖放与键盘/按钮选择文件的前端组件时，可以使用 react-dropzone 提供的 `useDropzone` Hook，复用其文件筛选、拖放状态和文件选择能力。这个库不会替你上传到服务器、处理断点续传、病毒扫描或后端存储。对于上传队列、分片和恢复可联动 Uppy；选中文本 CSV 则用 Papa Parse 解析。

本案例采用 `react-dropzone@20.1.4`（MIT，React ≥18）。仅在用户显式启动 Demo 后加载。

## 安装、引入和代码结构

```sh
pnpm add react-dropzone@20.1.4
```

`examples/example.tsx` 是真正执行 `useDropzone` 的实现，`examples/demo.tsx` 是 Lab 薄适配。界面与源码查看展示的是同一份代码。关键接口包括 `getRootProps`、`getInputProps`、`isDragActive`、`isDragReject`、`open`、`onDrop` 和 `fileRejections`。

## 三个可见场景

1. **basic**：支持选择 TXT/CSV，列出文件名、大小和 MIME；筛选错误立即反馈。
2. **business**：对合法文件只调用 `File.slice(0, 8192).text()`，最多预览 1600 字符，不上传或存储文件。
3. **advanced**：最多选择2个文件，单文件限 1 KiB。用户换文件/清空/切换学习场景/卸载时增加 generation，旧的异步读取结果不再覆盖新预览。

## 为什么需要 generation？

浏览器的 File.text 是异步的：用户先选 A 再选 B，A 读取可能晚于 B 结束。单纯 `setPreview(await file.text())` 会让旧文件的结果覆盖当前界面。这里用自增 generation 比较回调归属；卸载时递增 generation。更大的文件读取应使用 streaming、Worker 或可取消策略，不能把这个轻量例子当大文件处理组件。

## 正确无障碍与交互方式

通过 `getRootProps` 绑定拖放区域，并在内部保留 `<input {...getInputProps()} />`；没有 input 就无法正确打开文件对话框。当前示例使用 `noClick:true`，明确用 button 的同步点击调用 `open()`，避免嵌套按钮重复打开选择器。文件错误在 `role=status` 文本中反馈，不仅靠颜色。多数系统浏览器不会提供文件真实路径，不应该依赖 `file.path`。

## 关键反例

- 误以为选择成功表示上传成功：必须将选中文件的后续上传进度和服务端结果独立建模。
- 对外部不可信文件只按扩展名检查：攻击者可以伪造 MIME/扩展名，必须在服务端验证大小、格式、内容和权限。
- `getRootProps` / `getInputProps` 未完整展开：破坏内部事件或文件对话框，必须通过 getter 合并额外属性。
- 既让根 click 打开又在嵌套按钮中调用 open：导致打开两次。当前用 noClick 避免。
- 文件重选后旧 FileReader/File.text 覆写新状态：增加版本标记或 Abort 机制，卸载时清理引用。
- 将每个大文件 `File.text()` 读进主线程内存：对大文件使用流式分块，不要只靠预览文本截断就认为开销小。

## 生产安全

文件选择是用户授权，但不能据此上报路径、文件名、文件内容到统计服务；业务必须显式告知上传位置和保留策略。本演示不调用网络、不创建 ObjectURL；因此无需 image URL revoke。若后续新增 ObjectURL 预览，务必 `URL.revokeObjectURL`。使用 File System Access API 时注意权限与浏览器兼容，默认 `useFsAccessApi:false` 保留传统 input 行为。

## 组合与实战练习

配合 F01 Uppy 实现大文件上传队列，后端实现分片和最终校验。配合 F03 Papa Parse 将浏览器 File 解析为具有类型约束的数据表，但不要仅用 `split(',')`，需要处理引号、换行和编码。练习：选择超大小文件与正确文件，确认错误状态可恢复；快速切换两个文件，检查只显示后一个结果；用键盘打开文件对话框。

## 当前验证

源码已包含真实 `react-dropzone` 调用，但依赖安装、TypeScript、真实拖拽 E2E 尚未运行。验证以 `verification.json` 为准。

## 官方

- https://react-dropzone.js.org/
- https://github.com/react-dropzone/react-dropzone

## 独立可复用读取边界（本轮）

同源 `examples/preview.mjs` 最多读取 8KiB 而不是解码整个合规的 256KiB 文件，再截取 1600 个字符。SDK 负责文件选择，Blob.slice 负责内存预算，generation 负责旧 Promise 归属。复现纯 Node Blob 用例：`node --test packages/library-lab/entries/F02-react-dropzone/examples/preview.test.mjs`；这不是 `react-dropzone` SDK 测试。Chromium 仍要实测文件对话框、拖放、键盘、A→B 快速换文件和场景切换。
