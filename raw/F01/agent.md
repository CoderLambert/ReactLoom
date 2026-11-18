# F01 Uppy：工程检索入口

选择：需要真实本地多文件队列、限制和未来传输插件时用Core；简单拖放看F02，解析CSV看F03。锁定@uppy/core6.1.0、MIT。当前不是上传示例，无Uploader/端点/凭据/网络成功。

先读guide.md与verification.json，再读全部实际运行源码。完整迁入五份：examples/example.tsx、local-queue.mjs、local-queue.d.mts、preview-policy.mjs、preview-policy.d.mts。ESM React/ReactDOM/TS目标安装`pnpm add @uppy/core@6.1.0`，按指南挂载default组件level="business"；无Provider/CSS/env/server。demo.tsx只适配Lab。

必须保留：effect创建新Core、autoProceed:false、3份/1MiB/txt-csv-md限制；addFiles真实批次前后id差异，不能用无throw表示全部成功。类型/大小/重复限制通常只emit并部分接收；总数量超限拒绝整个新批；非限制hook异常AggregateError不提交批次。限制事件计数不等于拒绝文件数。临时订阅finally off。

清理：持久三监听off再destroy；clear不逐个file-removed，UI显式空列表。keyed level换实例；每次选择/删除/清空/预览/卸载递增generation，成功和错误均检查。arrayBuffer未物理abort，只抑制迟到结果。destroy清Core队列/store与浏览器监听，不承诺外部File引用GC、实例方法失效或全部定时器取消。

预览：≤12,000十进制字节才读；fatalUTF8、拒绝C0除TAB/LF/CR及DEL；≤4,000 Unicode码点，不切emoji；空文本合法。只渲染文本。扩展名与MIME不是内容安全或ACL。不要接上传假进度。

证据：local-validation.md记录真实Node Core5项、纯策略6项及strict五文件迁入/官方协议/Biome命令；Node无DOM，不替代input/drop。validation/browser.spec.ts仅提案，正式sdk/build/browser仍NOT_RUN。固定官方README原文/commit/hash/license及官网响应在official/；首页200且无frame拒绝头仍unknown，未证实宿主嵌入。
