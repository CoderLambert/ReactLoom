# pdf-lib 1.17.1：新建、复制页面与本地文字盖章

需要用精确坐标创建/修改PDF字节或复制页面时选择pdf-lib；它不提供阅读器、DOM布局或React分页。阅读看F06/F07，声明式生成报告看F08。本例不上传，不读取远程字体/图片，只使用StandardFonts.Helvetica和原创ASCII文本。实装1.17.1/MIT。

## 三个真实目标

basic调用PDFDocument.create/embedFont/drawText/save创建一页595×842pt原创文档。标题先validateNoteLabel限制trim后1–60可打印ASCII，再按505pt可用宽度缩字号，不把中文交给WinAnsi字体。PDF本身无HTML执行语义，字面<>不是网页标签。

business分别生成Weekly summary/Technical review两份原创PDF，经load/copyPages/addPage合并为正好2页，再save与load读回真实页数。不是只拼字节，也不宣称保留任意外部文档的书签/表单/签名语义。

advanced加载本地文件或默认原创样例，校验后只给第一页drawText“Reviewed locally”。这是内容流中的文字盖章，不是PDF交互批注/评论/真实删改遮盖。不会删除原内容或敏感信息；不是redaction、病毒净化或签名维护。

## 输入与版式边界

输入10bytes–2MiB，先看字节大小和%PDF-头，再PDFDocument.load(ignoreEncryption:false)，页数1–20、所有MediaBox边长36–2000pt且有限。输出save后10bytes–4MiB再进入Blob。文件扩展名/accept是UX，真正结构由SDK解析；头部/页数策略不能将任意恶意PDF变安全，load前压缩展开/CPU/对象树/附件/脚本/宏没有沙箱预算。加密文件按库默认拒绝，不绕过密码。

盖章计算首页面CropBox和MediaBox交集，要求可见区域至少36×36pt；在交集内设置边距和自适应字号，避免原固定x48/y50在小页/偏移CropBox中画到页外。小页字号可能很小，不能由字节保存成功宣称阅读舒适。旋转/crop复杂文档、实际字体/打印显示仍需真实PDF渲染。现有页内容可能恰好与盖章重叠，不是智能避让。

同源document-policy仅检查尺寸/页数/标签/输出大小，不解析PDF。document.ts的SDK方法完成真实读取与保存；页数回读不是内容视觉或完全兼容性证明。SDK/策略必须分计。

## 异步和对象URL

createOperationGate是同步单飞：begin在活动时返回null，不只依赖React disabled。每次操作取得id，SDK结果/错误只在isCurrent时写UI；finish旧id不能关闭下一操作。keyed level换树，卸载invalidate旧gate，原布局/解析Promise继续但迟到结果不创建URL、不回写。没有AbortSignal或SDK destroy API，不称物理取消解析。

每个自有URL加入ownedUrls。React提交替换/移除旧链接后effect cleanup revoke旧URL；卸载兜底撤销集合并清空，避免双重释放。失败清页数和旧下载链接，由同一effect释放旧URL。没有全局URL/字体缓存清理，用户已下载的文件不被撤销。组件没有文件系统写入或服务连接要关闭。

## 完整迁入

```bash
pnpm add pdf-lib@1.17.1
```

复制六份：example.tsx、document.ts、document-policy.mjs/.d.mts、operation-gate.mjs/.d.mts，保留路径；demo.tsx仅Lab转发可省。React/ReactDOM/TypeScript ESM目标，jsx react-jsx/Bundler、DOM File.arrayBuffer/Blob/URL可用，无Provider/CSS/env/Worker/字体文件/服务。挂载default组件`<PdfLibExample level="advanced" />`。纯Node可只带document.ts与document-policy pair，编译后调用SDK方法，不用浏览器URL包装。

## 操作与结果

点击执行PDF操作，状态来自save结果字节数和PDFDocument.load真实页数；点击下载才保存文件。basic1页、business2页、advanced1页样例。advanced选择坏头/超2MiB看到失败且旧下载消失；再点执行恢复默认样例。操作期间控件禁用，切level清旧链接与页数；慢文件读取完成后不得覆盖新level。

真实Node同源SDK检查新建/合并/本地盖章、36pt小页和偏移CropBox、损坏/0页/巨页拒绝，产物再次load。纯policy和gate日志单列。浏览器需要实际下载并pdftoppm/阅读器检查文字/合并页面/盖章位置，不能从drawText或getPageCount推断已看过。validation/browser.spec.ts给真实文件与外层URL/held arrayBuffer方案，作者不运行共享browser。formal三NOT_RUN，原始argv/cwd/exit/log与六门槛见local-validation.md。

固定上游README/LICENSE原文字节和SHA见official与metadata；中文README候选优先，固定tree无中文时采用en。官网实际GET头不等于可嵌入，未Lab-origin确认保持unknown直达。
