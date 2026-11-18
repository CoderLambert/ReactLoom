# react-easy-crop：选像素区域，再用Canvas导出

新闻封面需要拖动/缩放图像、按16:9选区域，并得到真正的新PNG。react-easy-crop6.2.4（实际package与固定LICENSE为MIT）只提供裁剪选择UI和几何回调，不替你编码、上传或存储。纯浏览选PhotoSwipe，整图重采样选pica；不需要用户选区时无需Cropper。

本例默认素材是原创1200×800 SVG data URL，显式width/height/viewBox；不是实拍照片、图床或EXIF样本。高级模式仅本地PNG/JPEG/WebP，无远程资源/上传/账号/旋转/EXIF保留。

## 完整最小迁入

已有React/TSX DOM项目执行`pnpm add react-easy-crop@6.2.4`。复制example.tsx、crop-policy.mjs/.d.mts、sample-image.mjs/.d.mts、image-runtime.mjs/.d.mts、file-check.mjs/.d.mts，保持相对目录；demo仅Lab转发可省。渲染`<EasyCropExample level="business" />`。需要ESM/TSX打包器、DOM Image.decode/Canvas.toBlob/createImageBitmap/Blob/objectURL；无Provider/env/服务/字体。

Cropper默认自动注入样式，必须保留相对定位且有高度的330px父容器；若产品关闭disableAutomaticStylesInjection，需自行引入库styles.css并满足CSP，不能既关闭又漏样式。TS使用Bundler解析。跨源远程图片会涉及CORS/Canvas污染，这里只受控data/本地blob，不假称处理任意远程图片。

```tsx
<Cropper image={source} crop={crop} zoom={zoom} aspect={16/9}
  onCropChange={setCrop} onZoomChange={setZoom}
  onCropAreaChange={(_, pixels) => setArea(pixels)} />
```

crop是UI偏移，zoom是缩放，onCropAreaChange第二参数才是源图像素矩形；第一个是百分比，不能送给drawImage。6.2.4纯受控crop坐标变化只emitCropAreaChange，不触发onCropComplete；所以用实时onCropAreaChange同步有效area，既覆盖拖动/缩放，也覆盖程序重置。完成回调也会发area-change，不需手算坐标。真实导出由image-runtime负责：Image.decode→检查自然尺寸→检查整数裁剪矩形→分配Canvas→drawImage源区域→toBlob('image/png')。完成/失败finally清Image.src并将Canvas尺寸置0释放本次缓冲；Blob仍由调用方拥有。

## 三个独立目标

### 基础：几何选择而非CSS截图

方形框拖动和缩放，观察真实croppedAreaPixels的x/y/width/height；这层只学习选择，不导出。像素宽高随zoom变化，不把屏幕裁剪框尺寸当原图输出尺寸。无旋转，加入rotation必须同步重写导出几何，不能只给Cropper一个属性。

### 业务：真实16:9 PNG

调整封面构图后点击裁剪导出。结果img来自新Blob URL，浏览器decode后自然宽高应等于显示的area.width/height（整数舍入导致比例近似16:9）。PNG字节数只说明编码体积，不是画质/上传成功。输入SVG也会被栅格化成PNG，不保留SVG矢量或原图EXIF。

导出同步ref闸门阻止双击；source/aspect/zoom/crop变化递增导出generation，清旧结果。已开始的解码/编码不物理取消，但旧结果不能回写；旧finally仅在id匹配时清闸门，不释放新导出。按钮失败显示错误；合法重新选择后可重试。

### 进阶：本地输入预算和资源所有权

选择本地PNG/JPEG/WebP前先检查MIME声明、非空、≤4MiB；MIME不证明实际格式，解码失败仍报错。createImageBitmap解码后检查正整数尺寸和总像素≤1600万，并finally.close。**源像素检查发生在解码之后，不能防止第一次解码内存开销。** 4MiB也不保证解码内存小，生产还需格式/元数据/沙箱预算。

成功文件才设置localFile并创建blob URL；检查失败保留当前源与几何、清旧导出，可直接重试。文件校验有独立file-check epoch，不受crop/zoom/export generation影响：修复旧实现校验期间几何变化导致checkingFile永远不清的竞态。新文件或卸载作废旧检查，旧finally不修改新检查；检查时禁用缩放和指针交互、忽略旧onCropAreaChange。恢复默认图片使旧文件检查失效、清本次结果并恢复受控SVG。

导出前检查裁剪矩形在源图范围、整数/非负、输出≤400万像素，再分配Canvas。源URL由localFile effect创建/清理，结果URL由resultBlob effect创建/清理；换图/换结果/恢复默认/卸载均revoke自己URL，不global clear。createImageBitmap在迟到/失败时也close；浏览器仍需实测这些资源路径。

## 生命周期与限制

level作为子组件key，换层会新建实验并作废旧文件检查/导出代次，默认源重新开始。Cropper实装componentWillUnmount解绑监听/观察者，React组件不调用不存在的destroy。图片解码、编码Promise未提供AbortSignal，不能把丢弃结果说成计算取消。

输入MIME/大小、尺寸和矩形检查属于自建policy；Cropper负责真正几何回调；Canvas是浏览器API。Node策略不能证明Cropper挂载、图像decode、PNG生成、URL清理或键盘/真实IME。拖动/触摸/辅助技术仍需对应设备。这里没有文字输入法控件，不用合成composition当裁剪验收。

## 来源与验证范围

官方v6.2.4固定commit91bfd8f0928ead345e5126a539edab4657d82993的README/LICENSE原字节保存，固定树无中文README回退en。本页独立中文教学。官网Demo实际GET200但未从Lab origin确认嵌入，unknown保留直达，响应头见official/source-evidence.json。

policy与资源代次测试分项原始日志见local-validation.md；真实DOM SDK由validation/browser.spec.ts交主控执行，不伪造NodeSDK PASS。正式sdk/build/browser无匹配receipt保持NOT_RUN。
