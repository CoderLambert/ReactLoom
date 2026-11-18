# F02 react-dropzone 工程复用

20.1.4/MIT实装与固定LICENSE核对，React>=18。拖放/选择/accept-size-count UX，非上传/格式安全/病毒扫描。已有ReactTSX `pnpm add react-dropzone@20.1.4`，复制example.tsx、preview.mjs/.d.mts、preview-session.mjs/.d.mts；demo可省。Bundler、Blob.arrayBuffer/TextDecoder，无Provider/env/CSS/网络/账号。

保留getRootProps/getInputProps完整展开，附加属性走getter。noClick:true仅禁根鼠标，默认根Enter/Space仍打开（noKeyboard:false）；外置open按钮无嵌套冒泡双开。useFsAccessApi:false走input。FileDialogOpen是请求，Cancel传统检测有浏览器启发限制，不是可靠所有平台cancel证据。

basic1×256KiB选择/拒绝codes；business首文件受限预览；advanced2×1KiB与迟到读取。接受列表当前快照id单调唯一，同名同size无key碰撞，不表示持久ID/去重。声明MIME/扩展名非服务端内容安全。

preview先slice8192 bytes再arrayBuffer；UTF8 stream decode不flush丢不完整尾序列，内部坏字节可能替换。显示≤1600UTF16码元，末尾高代理项去掉，不称1600码点。只React文本，不解析CSV/HTML/公式，无file.path/objectURL。

preview-session新read代次与drop/clear/level/unmount invalidate，晚结果/晚错误不能写；不取消已经开始的arrayBuffer。key=level换会话，Hook清自己的事件处理；无全局资源清理。Nodepolicy不能SDK，真实chooser/drag/keyboard与拒绝需browser。官方原文/header见official，formalNOT_RUN至匹配receipt。

20.1.4数量限制语义：先做逐文件类型/大小/validator检查，再保留前maxFiles个accepted，其余给too-many-files；advanced输入3个合法文件实际接受前2个并拒绝第3个，不得套用旧版整批拒绝假设。主控真实浏览器与实装dist/index.js627-635已核对。
