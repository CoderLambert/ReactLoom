# F02 react-dropzone — Agent 复用说明

## 何时使用

只需要文件选择/拖放/文件类型与大小反馈：react-dropzone；需要正式上传、分片、恢复、进度：结合 Uppy 或 API Client。它**不负责上传**。版本 20.1.4，MIT，React ≥18。

## 实现入口

复用 `examples/example.tsx`：`useDropzone` 返回 `getRootProps/getInputProps/open`；将 input 保留在根容器内，文件数据不需要经过任何后端。Lab 的 demo.tsx 仅转发组件。输入非可信数据，所有客户端筛选必须由服务端复核。

## 必须保留

- `<input {...getInputProps()} />` 和根属性 getter；不要手动覆盖掉内置事件。
- 如果有单独按钮调用 `open()`，根应 `noClick:true` 防双重文件对话框。
- 异步文件读取使用 generation/取消保护，旧结果不能回写新选择；卸载时释放对象引用。
- 限制文件大小与个数，错误内容文本反馈并可键盘访问，不仅靠颜色。
- 严禁将文件的任意内容自动传给收费、分析或第三方服务；上传必须明确触发。

## 验证

选择合规文本显示文件名/大小；选择过大或不支持格式显示拒绝原因；快速 A→B 更换只能出现 B 预览；离开 Demo 不可继续更新。Browser File API 与拖拽行为要用 Playwright 实测，Node 静态脚本不能代替。

## 关联与来源

F01 Uppy（上传）；F03 Papa Parse（CSV 解析）；官方：https://react-dropzone.js.org/。当前SDK/浏览器 NOT_RUN/BLOCKED，未实际证明通过。

## 本批迁移约束

务必连同 `examples/preview.mjs` 迁移；不要回退为全文件 `.text()` 后 slice。8KiB 原始预算/1600字符预览和 react-dropzone 256KiB 接受上限独立。场景切换要使旧 File Promise 失效。Node Blob 测试不能证明浏览器 SDK 行为。
