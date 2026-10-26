# F01 Uppy — Agent 工程指南

**任务**：复杂批量上传编排、文件队列、断点续传或协议插件。**不适用**：只需一次文件选择、CSV解析、图片转换。基线 @uppy/core@6.1.0 / MIT，真实 npm 解析/类型与React适配仍需由 PLATFORM验收。

## 迁移最短路径

`examples/example.tsx` 是可复用源码，`examples/demo.tsx` 只是Lab适配器。读取原码，抽取创建Uppy实例、限制、事件监听/取消及卸载清理逻辑；千万不要复制Demo中的文件拒绝造假成服务器级安全策略。

如果只用Core：`new Uppy({id,autoProceed:false,restrictions})` → `addFiles()` → `getFiles()` → `removeFile()` → `destroy()`。React使用effect创建并销毁以避免StrictMode二次mount后复用已destroy实例；任意异步File.read需generation防止回写。

真正上传：明确后端XHR/Tus/S3协议并添加对应Uppy插件，上传完成需检查每份的成功/失败、服务端token/CORS、权限、幂等/重试。禁止把此Demo视为已具备断点续传或多租户后端。

## 必须测试

合法 .txt/.md/.csv 可加入；>1MiB或第4份被真正的Uppy限制拒绝；移除单项后队列数量正确；预览只读取允许尺寸且不跨旧请求回写；卸载后事件和File对象被释放。真实上传必须测试服务端403/413/422/断线/重试与超时，不可Mock目标Uppy后标PASS。需要按当前源码fingerprint保存实际浏览器命令和证据。

参考：https://uppy.io/docs/uppy/
