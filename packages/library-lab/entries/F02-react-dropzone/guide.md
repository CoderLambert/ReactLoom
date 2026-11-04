# react-dropzone 20.1.4｜把文件放进组件，不负责上传

Lab 锁定 `react-dropzone@20.1.4`（MIT，peer 为 React 18 及以上）。它提供拖放、`open()` 和按 MIME/大小过滤。它不上传、不续传、不扫描。

包已在锁文件中。没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。Actions 41779873259 是仓库级安装、类型检查、构建、52 个 SDK 文件 / 153 项测试和 45 项 Playwright，不是本条目 PASS。

## Lab 当前示例

执行种类是 `react`。显式启动后挂载 [`examples/demo.tsx`](examples/demo.tsx)，实现在 [`examples/example.tsx`](examples/example.tsx)。离开时卸载，effect 增加 generation，避免旧的 `slice().text()` 回写。

| 文件 | 作用 |
| --- | --- |
| `examples/example.tsx` | `useDropzone`：`noClick`、accept、maxSize、maxFiles、拒绝码 |
| `examples/preview.mjs` | `slice(0, 8192).text()`，再截到 1600 字符 |
| `examples/preview.test.mjs` | 纯 Blob 边界，不 import dropzone |

`accept` 是 `{ 'text/plain': ['.txt'], 'text/csv': ['.csv'] }`。`useFsAccessApi: false`，走传统 input。basic / business 最多 1 个文件、256 KiB；advanced 最多 2 个、每个 1 KiB，并 `multiple: true`。

旧研究里的「手动上传队列」和「对象 URL」没有挂到这个页面。那是生产教学，不要在 Lab 里上传用户文件或创建不回收的 `blob:` URL。

## 1. 什么时候用

需要一块可拖入区域，加上按钮打开系统对话框，并在选择当下按类型和大小拒掉一批文件。上传协议、分片、授权用 F01 或你们自己的 API client。CSV 结构用 F03，不要 `split(',')`。

原生 `<input type="file">` 够用时不必加这个依赖。

## 2. 模型

`useDropzone` 返回 `getRootProps`、`getInputProps`、`isDragActive`、`isDragReject`、`open`。根节点必须展开 `getRootProps`，内部必须留 `<input {...getInputProps()} />`。少一个，拖放或对话框就会断。

本页 `noClick: true`。打开对话框只走按钮的 `onClick={open}`，避免根节点和按钮各开一次。

`onDrop(accepted, rejections)` 里，拒绝项带 `file` 和 `errors[].code`（例如 `file-too-large`、`file-invalid-type`、`too-many-files`）。接受列表只保留 `{ name, size, type }`。列表的 React key 用 `name + ':' + size`，同名同大小会撞 key，生产要换稳定 id。

预览只在非 basic、且有接受文件时读取 `files[0]`。generation 在选择、清空、换 level、卸载时增加。Promise 回来时代号不对就丢弃。

`file.path` 在多数浏览器里不是真实磁盘路径，不要上传或记录它。

## 3. 三层

### 基本

拖入或按钮选择一个 txt/csv。状态写「已接受 n 个文件；本示例不进行网络上传」，或把每个拒绝文件的 `errors` code 拼进 `role="status"`。列表给出字节和 MIME。没有预览。

### 业务

同样的限制。第一个被接受的文件走 `readLocalTextPreview`：先确认有 `slice` 且 `size` 是非负安全整数，再只解码前 8 KiB，显示 1600 字符。预览区 `whiteSpace: pre-wrap`。

### 进阶

限制收紧到 2 × 1 KiB。快速换文件时，只有最后一次的 generation 能写预览。清空会作废进行中的读取。标题写的是拒绝与竞态，不是上传失败。

## 4. 反例

### 反例 1：选择成功等于已上传

```tsx
onDrop={(files) => fetch('/api/upload', { body: files[0] }) }
```

本页禁止这条路径。产品里上传进度、服务端 413 和病毒扫描是另一套状态。不要把用户文件发到统计或第三方。

### 反例 2：只信扩展名

```ts
accept: { 'application/octet-stream': ['.csv'] }
```

攻击者可以改扩展名和 `file.type`。dropzone 的过滤是体验。服务端仍要看内容。

### 反例 3：不展开 getter

```tsx
<div onDrop={onDrop}>
  <input type="file" />
</div>
```

库收不到自己的事件，也不会带上它设置的 `accept`。用 `getRootProps()` 和 `getInputProps()`，额外属性从 getter 的参数合并。

### 反例 4：根点击和按钮都 `open()`

根默认可点击时，按钮在内部会冒泡，对话框开两次。本页用 `noClick: true`，只保留按钮。

### 反例 5：后到的读取覆盖先选的文件

```tsx
const text = await file.text()
setPreview(text)
```

用户先选 A 再选 B，A 可能更晚结束。要 generation 或 Abort。卸载时也要加代号。8 KiB 截断不能代替大文件的流式读取。

### 反例 6：打开 File System Access 却不处理权限

`useFsAccessApi: true` 在部分浏览器走另一套权限。本页显式关掉，保持 `<input>` 行为。不要把未授权的目录句柄留在状态里。

## 5. 组合

**Uppy（F01）**：dropzone 交出 `File[]`，Uppy `addFiles` 接管队列。不要两套限制各写各的，用户会看到两次互相矛盾的拒绝。

**Papa Parse（F03）**：把 `File` 交给解析器，处理引号和换行。本页的 1600 字符预览不是解析结果。

**API client**：上传走应用的客户端，带上取消信号。本 Demo 不调用它。

## 6. 清单

- 根和 input 都展开官方 props。
- 拒绝信息是文本，不只改边框颜色。`isDragReject` 用红色只是辅助。
- 预览先 `slice` 再 `text`，并在回调里核对 generation。
- 换 level 清空列表、预览和文案。
- 不创建 Object URL。若产品要图片预览，离开时 `URL.revokeObjectURL`。
- 不读取、不展示、不提交 `file.path`。
- 键盘：按钮可聚焦，Enter/Space 能 `open()`。拖放本身还要在真实浏览器里看。

## 7. 升级

20.x 的 hook 形态和旧 class `Dropzone` 组件不同。升级时核对 `accept` 是 MIME 到扩展名数组，而不是单一字符串。`useFsAccessApi` 的默认值以当前版本文档为准，本仓库显式设为 false，不要靠默认。

React 19 是 Lab 运行时。不要为了演示升到下一个 major。

## 8. 验收

```bash
node --test packages/library-lab/entries/F02-react-dropzone/examples/preview.test.mjs
```

这只覆盖 Blob 切片，不是 dropzone SDK。浏览器还要看：对话框、拖入合法与非法文件、1 KiB 拒绝后仍能再选、A 然后立刻 B 只显示 B、换场景不留旧预览。没有收据就保持 NOT_RUN。

## 9. 资料

- https://react-dropzone.js.org/
- https://github.com/react-dropzone/react-dropzone
- https://www.npmjs.com/package/react-dropzone
