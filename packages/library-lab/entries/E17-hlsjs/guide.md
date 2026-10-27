# E17 hls.js 1.7.3 — MSE直播/点播分段播放器

## 何时选用
HLS.js 让支持 Media Source Extensions 的浏览器通过标准 HTML `video` 播放 HLS m3u8 分段。HLS 不等于播放器 UI；控件、自动播放权限、字幕和焦点由原生视频/播放器承担。Safari 的原生 HLS 应作为兼容性分支，而非尝试强制 MSE。

## 安装和真实调用
```bash
pnpm add hls.js@1.7.3
```
`examples/example.tsx` 确实调用 `Hls.isSupported()`、`new Hls({enableWorker:false})`、`attachMedia(video)`、`loadSource(...)`、`currentLevel`、`destroy()`，监听 `MANIFEST_PARSED/ERROR`。选用禁Worker配置是为了先限制 Demo 的 CSP/Worker 风险；生产可以配置真正Worker构建并单独验证资源清理和版本。

## 网络与授权规则
页面默认不请求任何远程媒体。点击“加载公开 HLS 测试流”后**主动请求**官方README示例中的 `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`。它是公开第三方测试资源而非随仓发布的本地媒体，可能发生跨域、网络、404或资源不可用。不给用户造成“已离线可播放”的错觉，不在产品中把此测试URL当生产CDN，也不调用任何付费API或上传个人媒体。

## 三层演示
基础：功能检测 / MSE或原生 HLS 分支，真实拉取 m3u8。
业务：等待 `MANIFEST_PARSED` 后读取 `hls.levels`，对真正的 `currentLevel` 设置 -1 自动/固定画质。
高级：错误事件、fatal处理、重复开始、显式stop/unmount `destroy`，保证资源销毁后旧回调不回写。

## 实际机制
Manifest → Level/音轨 → Fetch/XHR分段 → transmux → MSE appendBuffer → HTMLVideoElement 解码展示。视频暂停并不释放 MSE、Worker 与网络资源，需要 Hls.destroy() 和清空 video.src。订阅只存于本次实例并在 destroy 后作废，generation guards 阻止迟到回调写入新实验。

## 专属反例
1. 使用无CORS分段URL仍期望hls.js正常拉取。不能绕过浏览器策略，应配置媒体源响应头。
2. 依赖视频元素 remove() 而不销毁Hls。会残留请求/SourceBuffer。
3. 对 fatal 错误无限恢复/重建导致重试风暴。采用有界退避与明确错误类型。
4. 强制选择 nonexistent quality。只根据 MANIFEST_PARSED 返回的真实levels设置。
5. 混淆 hls.js 与 Video.js：前者是播放引擎，不提供完整控件主题。
6. 默认自动播放或默认联网，违背用户意图与浏览器手势限制。

## 跨库组合及复测
E16 Video.js v10 的 HlsJsVideo 封装可以替代手工接线；E18 wavesurfer.js展示波形，不是HLS解码器；E19 ffmpeg.wasm是转换器。用Chromium+WebKit检查MSE/原生分支、事件/cancel、字幕、CSP、network cleanup与设备内存。**仅提交源码，不代表真实SDK/network/浏览器成功。**

## 来源
https://github.com/video-dev/hls.js 、https://github.com/video-dev/hls.js/releases/tag/v1.7.3 。Apache-2.0。
