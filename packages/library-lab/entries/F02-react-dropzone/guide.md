# react-dropzone：接收本地文件，保留选择与读取边界

页面需要拖入txt/csv、显示拒绝原因，并预览一小段文本。react-dropzone20.1.4（实装与固定LICENSE均MIT，peer React>=18）提供Hook/getter/文件提取与UX校验；不上传、不续传、不检查病毒。一个普通file input就够时无需引入；真正上传交Uppy或业务API，CSV结构交Papa Parse。

本例不访问服务、持久化用户内容、显示file.path或创建Blob URL。文件MIME/扩展名/大小/数量均是前端体验限制，不能替代服务端内容验证/授权，文件名和MIME可以伪造。

## 完整最小迁入

已有React/TSX浏览器项目运行`pnpm add react-dropzone@20.1.4`。复制example.tsx、preview.mjs/.d.mts、preview-session.mjs/.d.mts，保持目录；demo只Lab转发可省。渲染`<FileInputExample level="business" />`。ESM/TSX、TS Bundler，原生File/Blob.arrayBuffer/TextDecoder；无Provider/env/CSS插件/账号/网络服务。样式仅示例内联布局。

必须展开getRootProps/getInputProps，不自己覆盖库回调。附加属性传给getter以便合并；hidden input保留在根内，外置按钮调用open，避免嵌套按钮冒泡双开。

```tsx
const {getRootProps,getInputProps,open} = useDropzone({
  noClick:true, useFsAccessApi:false,
  accept:{'text/plain':['.txt'],'text/csv':['.csv']},
  onDrop,
})
<div {...getRootProps({role:'button','aria-label':'文件拖放区域'})}>
  <input {...getInputProps()} />
</div>
<button onClick={open}>选择本地文件</button>
```

noClick只禁根鼠标点击，不禁默认noKeyboard:false的根Enter/Space。根可聚焦，键盘仍可打开；按钮Enter/Space也能open。不要写“对话框只能由按钮打开”。useFsAccessApi:false使用传统input，不走File System Access权限API。onFileDialogOpen仅说明请求对话框；传统对话框取消检测有浏览器焦点/事件启发限制，onFileDialogCancel不是每台设备可靠的取消收据。

## 三个独立目标

### 基础：真实选择/拖放与拒绝信息

一个文件、每个≤256KiB，接受txt/csv。系统对话框、根键盘与拖放都走真实useDropzone，接受列表显示名字/bytes/声明MIME；拒绝显示errors[].code，例如file-invalid-type、file-too-large、too-many-files。drag-over时浏览器可能不给完整文件类型，红边只是提示，最终拒绝以drop后回调为准。

根鼠标点击不打开，外置按钮只请求一次；文本信息不上传。接受列表只含当前批次acceptedFiles，不把rejections也显示为成功。同名同size现在按每次接收分配单调唯一id，当前选择快照内稳定，不用name:size撞React key；它不是内容哈希/去重或服务器持久ID。

### 业务：受限文本预览

第一个接受文件才读取，使用slice(0,8192).arrayBuffer，最多读前8KiB，再TextDecoder UTF8解码。stream:true且不flush会丢弃字节边界处未完成的UTF8尾序列，非法内部字节仍可能变成U+FFFD；这是有损预览，不是UTF8完整性验证。

显示最多1600个UTF16码元（旧导出名PREVIEW_CHARACTERS保留，但不是1600码点），若末尾落在高代理项则去掉，避免截断emoji。中文/emoji的字节/码元数不同。只把预览作为pre文本，不执行HTML/CSV公式，不解析CSV引号结构，也不读取整文件后才截断。

### 进阶：数量边界与迟到读取

最多2文件、每个≤1KiB，支持同时展示两个同名同size文件而不撞key；只预览第一个。固定20.1.4会按顺序保留前2个通过类型/大小检查的文件，后续文件得到too-many-files；3个合法文件不是整批拒绝。超限/坏类型仍可换合法文件恢复。多文件接受不意味着并发上传。

preview-session是UI真实共用代次：新drop、清空、换level、卸载invalidate；Promise只在自己的generation仍当前时写结果或错误。旧A即使晚于新B完成，也不能覆盖B。已经开始的Blob.arrayBuffer没有本例AbortSignal，代次不物理取消I/O；清空只撤掉展示和后续写入，不假装底层读操作已停止。

## 生命周期与生产限制

key=level换独立会话，useDropzone实装负责根/input/窗口事件与内部文件提取处理；自己的session cleanup只作废预览。没有额外timer/objectURL/Worker或存储资源。原生文件对话框/拖放/键盘/触屏与辅助技术必须浏览器/设备验，纯Node Blob测试看不见SDK Hook。

onError处理文件提取/库处理异常；preview失败可见且不将文件上传成功。清空后可再选，同文件重复选择依赖库input重置。生产上传前应对实际内容/编码/大小/权限再次校验，不信客户端accept；不要采集真实磁盘路径。

## 来源和证据

固定v20.1.4→commitb9a3e10cee6b15b6850e240caac94be80f5c7e0d的README/LICENSE原字节保存。无官方中文README回退英文en，本页独立教学。官网GET200未Lab嵌入确认unknown，响应证据见official/source-evidence.json。

Node只测preview/代次应用策略，不调用useDropzone，不标SDK PASS。主控browser proposal验证真实filechooser、Drop与根键盘、限制拒绝/同名列表、迟到读取/清空/换层/卸载边界。未执行不写真实DOM/网络验收PASS；准确命令/日志与六项分层见local-validation.md，formal verification保持NOT_RUN。
