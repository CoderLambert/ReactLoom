# pica：实际缩小像素，再导出PNG

文章封面需要把本地图片缩到合适像素尺寸。pica10.0.3在canvas之间做重采样，再toBlob导出；它不是文件选择器、构图裁剪器或上传服务。纯布局缩略图只需CSS；要裁区域先用裁剪工具；需要实际减小图像分辨率再考虑pica。安装包与固定上游许可均MIT，本例源图为原创Canvas或用户本地文件，没有上传/远程图片。

## 数据流与预算

源为原创1280×800画布，或本地PNG/JPEG/WebP；压缩文件最多4MiB，createImageBitmap解码后检查宽高为正整数且宽×高不超过16,000,000，再画进源canvas，bitmap无论成功失败均close。像素检查在解码后，不能声称它阻止所有解码阶段内存分配；生产更严的输入还需要可信元数据/服务端预算。MIME是本地文件声明，实际损坏内容仍由解码失败拒绝。

`targetDimensions`保留比例、四舍五入、每边至少1，最长边只允许240/480/800且不放大。Canvas.width/height是位图尺寸，不是页面CSS宽度。PNG导出只保证本例的格式与尺寸，不保证文件比原JPEG更小。

```ts
const resizer = pica()
await resizer.resize(source, target, {cancelToken})
const png = assertPNGBlob(await resizer.toBlob(target, 'image/png'))
```

pica()是当前支持的工厂入口，每挂载useMemo创建一次并顺序复用。实装也导出Pica构造器，不把工厂写法说成唯一可用API。默认features为js/wasm/ww，默认filter=mks2013，本身含重采样锐化设计；额外unsharpAmount默认0。未配置滤镜，不声称原生对照只差“是否锐化”。

## 三个真实实验

### 1. 原创画布缩放

basic开始没有结果，点击调用后真实resize/toBlob产生480×300 PNG。原图在页面显示较窄，但位图仍1280×800。选择240并重跑应为240×150。成功结果必须是非空image/png Blob；pica实际toBlob在原生callback为null时可能resolve null，示例会把它当失败而非假报完成。

### 2. 本地文件预处理

business选择本地文件，旧结果立即失效，显示当前来源文件名，原创canvas不再冒充当前输入预览。点击才解码/缩放；320×160文件配480边不放大，配240边得240×120。损坏PNG即使MIME合法仍失败并清空结果；不合法类型/文件大小在解码前拒绝。没有自动处理或上传。

### 3. 原生对照与不可取消编码

advanced另用原生drawImage（smoothing high）对同源同尺寸生成PNG，等两张都成功才一起发布。原生context/编码或pica编码失败均清图并显示失败，不补假对照。图像字节数可不同，不能当画质评分；本例没有视觉质量数值。

取消分两段：resize期间reject cancelToken，请求库结束当前resize；不是AbortSignal，也不代表立即terminate所有Worker。resize已结算后移除该取消入口；已经开始的toBlob没有本例可调用的中止API，只能作废epoch、等编码结算后丢弃旧结果。解码也不物理取消。task-owner.mjs是UI共享的单飞/epoch所有权，取消后旧Promise未结算时不开放第二任务；finish旧id不能释放另一新任务。

改文件、改边长、取消或卸载都invalidate当前epoch、清旧结果。每个await后确认当前id；因此已失效的编码不能创建新预览URL或覆盖新输入。按钮disabled之外还有同步begin门禁，不能靠React状态阻止同一批重复点击。重跑必须等旧工作完成。

## BlobURL与Worker不是同一所有权

每个结果Blob由effect创建自己一个URL，替换/清空/卸载时revoke同一个URL；原生对照同样处理。没有全局URL清理，也不撤销别人的URL。bitmap由本例close；canvas为局部/组件资源，卸载释放引用。

Worker池由pica管理，默认idle2000ms回收闲置槽；本例没有公开destroy API可调用，不把卸载说成已立即销毁Worker。完整pica包内嵌worker代码、可能创建Blob Worker，CSP需允许实际worker来源及WASM执行；split pica_main构建可配置workerURL。这里没有换split入口或自定义Worker，不能凭默认features断言某浏览器真的走了Worker/wasm；不可用时库可能走可用主线程路径，实际能力/CSP与资源回收需浏览器观察。

## 完整迁入

已有React/TSX浏览器工程执行`pnpm add pica@10.0.3`。复制example.tsx、resize-policy.mjs/.d.mts、task-owner.mjs/.d.mts，保持相对路径；demo.tsx仅Lab适配可省。渲染`<PicaExample level="advanced" />`，basic/business也可。需要Canvas2D、Blob/ObjectURL、createImageBitmap（文件路径）、ESM打包与TS bundler解析；Worker/WASM是否可用按宿主CSP与实际能力验证。无Provider、env、CSS插件、字体下载、账号或后端。

key=level隔离文件/任务/结果，cleanup作废并请求取消当前resize，mountedRef避免旧finally写已卸载状态。session task-owner不是SDK，不能用它的policy测试代替pica执行。文件体积/像素预算不是浏览器CPU、色彩管理、EXIF、ICC或HDR完整处理保证；没有image-blob-reduce、JPEG质量调节或上传。

## 官方来源与证据

固定nodeca/pica tag10.0.3→commitf897666f18e9daeff540fe03d2708ba74214a046的README原字节与LICENSE保存；固定树无官方中文README，保留en。官方homepage为GitHub仓库，实际响应XFO deny/CSP frame-ancestors none，blocked并保留直达。版本字段/原文SHA与完整头见official/source-evidence.json及library.json。

Node7项只验证尺寸/文件/任务/Blob控制流，SDK仍需浏览器真实resize/toBlob。浏览器提案检查真实尺寸/文件/原生对照、PNG URL实际revoke、持有已开始的原生toBlob callback后取消/卸载并释放而不发布旧结果；这证明epoch与资源边界，不证明物理取消编码或Worker立刻结束。命令、日志和六项状态见local-validation.md，formal verification保持NOT_RUN。
