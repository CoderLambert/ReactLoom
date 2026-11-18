# E14 react-easy-crop 迁入指南

6.2.4/MIT实装与固定LICENSE双核。只负责crop/zoom/aspect与onCropAreaChange第二参数像素区域；PNG由浏览器Image/Canvas代码完成。无旋转/EXIF/远程图床/上传。

已有React/TSX DOM运行`pnpm add react-easy-crop@6.2.4`。复制example、crop-policy及声明、sample-image及声明、image-runtime及声明、file-check及声明。demo可省。Bundler解析，Image.decode/Canvas.toBlob/createImageBitmap/Blob/URL，默认样式注入与相对定位330px容器不可删。关闭自动样式才需自行import styles.css；无env/Provider/服务。

basic仅方形几何；business16:9真实PNG；advanced本地文件预算/失效/清理。默认1200×800原创SVG不是生产照片，样例尺寸显式。文件≤4MiB声明MIME png/jpeg/webp；1600万像素在createImageBitmap解码后检查，不能称解码前内存保护。bitmap每次finally.close。输出矩形整数/范围/≤400万像素在Canvas分配前检查。

file-check epoch独立于export generation，防检查期间几何变化卡checkingFile。选图失败保留当前area，检查时屏蔽指针/缩放/onCropAreaChange；新检查/卸载作废旧finally，恢复默认同样。源/结果各自effect createObjectURL并revoke，只清自己资源。导出ref闸门同步防双击，变化作废旧结果；旧finally不能释放新闸门。Canvas/image finally释放本次引用，不声称取消已开始decode/toBlob。

key=level重建，Cropper官方unmount清监听；没有destroy API。Node policy不是SDK，真实Cropper+Canvas/URL必须browser。sourceFiles必须包含全部迁入文件，官方README/license/header见official；formalNOT_RUN至匹配receipt。

6.2.4纯crop.x/y受控变化只发onCropAreaChange，不发onCropComplete；必须用前者同步真实pixels，避免非零位置重置后area永久空。完成路径也包含area-change，禁止自行反算矩形。
