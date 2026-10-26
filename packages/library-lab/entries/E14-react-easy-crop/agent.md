# E14 react-easy-crop — Agent实施指南

**适用**：头像、文章封面、个人图片预览裁剪。**不适用**：后端图像格式转换、多图并发处理、完整图片编辑器。

- 选用版本 react-easy-crop@6.2.4 / MIT，最终核验目标工程React peer及锁文件。
- 先读 examples/example.tsx。核心在Cropper控制状态/onCropComplete与cropToPng，Demo出口无需迁移。
- 包裹容器必须 position:relative + 非零宽高。crop/zoom在React中控制；每个媒体对应的旧像素区域在切换时作废。
- 真正导出：Image.decode + Canvas drawImage + toBlob；不使用服务端URL执行任意网络请求。本例不支持rotation；添加后必须改像素旋转算法。
- 本地Blob URL必须在替换/卸载时释放；文件格式只接收PNG/JPEG/WebP，字节和总像素都做上限，真实项目也要在服务端重复验证。
- 导出异步请求使用generation序列防旧结果覆盖新裁剪。不能把几何对象当作真实文件成功响应。
- 持久化恢复需审查百分比croppedArea与像素舍入差异；照片EXIF方向与颜色管理不由Cropper自动修好。

## 必须验证

固定1:1与16:9模式的预览；拖动、滚轮、触摸；导出PNG解码尺寸；切图时旧导出作废；不能导入超过限制的文件；ObjectURL不泄露；组件卸载取消旧回写；旋转未实现要显式标注。见verification.json，未实测不可填PASS。

推荐与E15 pica组合进行裁后缩放，与E13 PhotoSwipe组合进行裁前预览。官方：https://github.com/ValentinH/react-easy-crop
