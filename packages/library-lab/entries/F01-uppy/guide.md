# Uppy Core：文件选择 ≠ 上传成功

## 选型与结构

Uppy 是文件队列/限制/事件/上传插件协作框架。适用于复杂附件、批量图片和断点续传；只有文件选取/预览时可直接使用 F02 react-dropzone。Uppy 的插件体系分为 Core、来源/UI 插件、传输插件和服务端能力；**Core 不会自动上传**，本课件特意只使用 Core，避免向不受控终端发送文件。

```bash
pnpm add @uppy/core@6.1.0
```

基于官方文档的实际源文件 `examples/example.tsx`，通过 `new Uppy({restrictions,autoProceed:false})` 创建对象。Core ID 隔离于本条目和场景；每次挂载创建新实例，卸载后移除事件监听并 `destroy()`，避免持有用户 File 对象和生命周期泄漏。

## 三层实战

**basic**：选择或拖入本地 .txt、.md、.csv；Uppy 的 `addFiles` 统一执行类型、单文件 1 MiB、最多3份的限制。UI 从 `getFiles()` 与 `file-added` / `file-removed` 事件获得变化。文件没有传出。

**business**：加入多份文件、删除单项，点击“本地查看文本”调用 File/Blob 的 `text()`；只预览 ≤12KB 的数据且最大显示4KB。generation token 避免上一次较慢 FileReader 结果在重选/删除/卸载后回写新视图。真实项目需进一步识别内容编码和防止超长列表。

**advanced**：按钮构造 1MiB+1 byte 文件，真实交给 Uppy restrictions 拒绝；观察错误状态。清空只操作当前 queue，不清理全局localStorage或其他组件。没有 XHRUpload/Tus/S3，不能假装看到上传百分比。

## 实际上线的上传方案

若要传输，请新增 `@uppy/xhr-upload`、`@uppy/tus` 或 `@uppy/aws-s3`，根据后端协议选择。生产中必须实现服务端身份校验、真实 MIME/魔数识别、大小/总配额、权限、对象存储临时授权、失败重试和幂等性。Uppy 的 `allowedFileTypes` 只是 UX 限制，**绝不是服务器安全校验**。

真正的 `complete` 事件也可能包含失败的文件，务必分别检查 `successful` 与 `failed`，不要使用 `complete` 就向业务写“所有文件已上传”。一个上传会话跨路由持续执行时，Uppy 应放在受控高层 Service 中；本实验页面生命周期内无上传插件，适合组件级所有权。

## 常见反模式

- 把 `File input` 成功当成服务器已收文件。
- 让多个 React render 都执行 `new Uppy()`，队列/监听不断重复。
- 使用全局默认ID造成多个 uploader 存储碰撞。
- 客户端扩展名过滤当作服务端病毒/内容验证。
- 在旧版配方中继续导入 Uppy 5 已移除的 React `DragDrop` 组件，而不核对现代 Hooks。
- 使用假定时器画上传百分比并对外声称真实 XHR 传输通过。

## 验收与官方依据

后续平台安装实际版本，执行真实 DOM/File/Drop 测试；Uppy实例销毁、类型与大小限制、拒绝后仍能添加合法文件、删除后的过时回写必须验证。库本身未被加载运行前状态为NOT_RUN；网络上传能力为 **N/A（未设计）**，不能冒充SDK失败或成功。

官方 [Core](https://uppy.io/docs/uppy/) · [React](https://uppy.io/docs/react/) · [上传协议](https://uppy.io/docs/guides/choosing-uploader/)。开源 Core MIT，远程云服务或协议服务器可能独立收费。
