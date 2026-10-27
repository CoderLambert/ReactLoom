# E17 hls.js — Agent 复用契约

定位：浏览器 HLS 分段/自适应码率播放引擎，不是视频 UI 或上传。发行基线 hls.js@1.7.3 Apache-2.0。
复制源码：`examples/example.tsx`，按目标站点替换固定测试流；不要把测试 CDN URL 发布成业务媒体地址。
必须保留：先检查支持度，明确MSE/原生HLS分支；真实 `attachMedia→loadSource`；仅从已加载的levels选择码率；fatal错误保护；destroy和清理video.src；取消后generation检查。
重要安全：CORS/HTTPS/DRM许可/字幕隐私/资源域名白名单须由产品部署配置；不应用户访问页面就请求第三方测试媒体。
常见错误：把 `video.pause()` 当资源释放、对错误无限重试、假设Safari一定走hls.js、将Manifest读取算实际媒体可播放。
验收：需要媒体服务器和实际浏览器。检查清单与分段请求、质量切换、失败恢复、停止后网络无持续下载、Worker/CSP。不能用TypeScript解析或Mock播放器标SDK PASS。
相关E16 Video.js v10，E19 ffmpeg.wasm，E18 wavesurfer.js。官方：https://github.com/video-dev/hls.js
