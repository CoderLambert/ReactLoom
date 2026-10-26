# E15 pica — Agent实战手册

适用浏览器图片缩放；不是裁剪UI、文件上传、远程URL处理或Node服务端图像库。使用pica@10.0.3 / MIT，先核验目标项目浏览器/Worker/CSP条件。

- 真实源码 examples/example.tsx，优先提取Canvas尺寸计算、File校验、pica().resize和toBlob；不将实验组件整页复制。
- v10默认导出为工厂：pica()，不是new pica()。保留同一个实例处理多次请求，避免Worker池多实例竞争。
- Source必须是Canvas/Image/ImageBitmap；File在有上限的环境中先解码。createImageBitmap解码完成后要close。
- 限制格式、字节和像素总量。统一用缩放比例保持宽高比，避免“压缩”被误解为只改变JPEG质量。
- 不会自动保留EXIF/方向；颜色管理、远程CORS和上传协议要另行设计。客户端处理结果不能替代服务器验证。
- cancelToken Promise rejection + generation防旧结果回写；卸载回收Blob URL。Worker内部释放仍需实际浏览器profile而非假定。
- 对比其他缩放实现时要固定样本、目标分辨率、输出格式与设备，否则不能下真实性能结论。

## 执行检查

PLATFORM安装后执行 typecheck/build、Chromium中真实resize/toBlob、Blob PNG头/解码宽高、取消处理后无旧回写、重挂卸载ObjectURL回收、CSP Worker行为。没有真实执行证据记 NOT_RUN/BLOCKED。相关E14 crop、E13 PhotoSwipe。官方：https://github.com/nodeca/pica
