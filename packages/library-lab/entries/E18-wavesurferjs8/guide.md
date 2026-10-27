# E18 wavesurfer.js v8 — 波形可视化与音频交互

## 使用定位
真实播放已有音频并显示可交互波形，适合新闻语音试听、Podcast时间轴、阅读笔记片段。不是媒体转码器，也不自动提供HLS协议支持。

## 安装/引入
```bash
pnpm add wavesurfer.js@8.0.3
```
`examples/example.tsx` 直接 `import WaveSurfer from 'wavesurfer.js'`，在React effect中调用 `WaveSurfer.create({container,waveColor,progressColor})`。测试音频来自 `examples/wav.ts` 的原创PCM/WAV字节，不下载远程素材。

## 三层实验
**入门**：真正 `load(blobURL)`、等待ready、Play/Pause、timeupdate文本反馈。
**业务**：用户可按指定时间 `setTime(0.8)`，支持语音课程回放定位。
**高级**：`setPlaybackRate(1.5)`、`zoom(120)`、恢复，观察新版本取消与卸载行为。

## v8生命周期关键点
创建实例发生在React effect挂载后；不在每次render创建实例。关闭Demo：事件取消订阅、`destroy()`、`URL.revokeObjectURL`。**v8 destroy不可复用**，不能在已经销毁的实例继续load。新一次load会使前一次Promise以AbortError拒绝，必须捕获并避免通知错误。示例用alive标志防异步跨Tab回写。

## 误区
1. 把波形显示当做上传/录音成功：这里只播放内存PCM，用户权限与媒体设备从未开启。
2. 业务状态更新就重新建播放器：会重新解码并中断播放。稳定ref和effect依赖。
3. 把全部大型音频一次解码：大文件应提前计算peaks和duration，谨慎选择流/缓存，不声称任何WAV都可常驻内存。
4. v7旧destroy/load行为套用到v8：必须重新实例化，旧Promise捕获AbortError。
5. 网络音频无CORS可绕过：没有CORS权限无法读取，示例不访问网络。

## 跨库组合与练习
E16 Video.js播放视频，E17 hls.js处理HLS分段，E19 ffmpeg.wasm转换媒体，它们不直接替代波形渲染。练习：切换两段本地音频后立即离开页面，验证没有旧播放或资源泄漏。

## 官方与验证
<https://github.com/katspaugh/wavesurfer.js/releases>、<https://www.npmjs.com/package/wavesurfer.js>，BSD-3-Clause，8.0.3。真实SDK/浏览器测试尚未运行，不能把代码编写当验收。

## Wave16 会话边界

三层示例按level重新挂载 `WaveformSession`：切换时销毁旧波形、撤销 Blob URL、重置倍速/时间/播放状态并重新加载原创WAV。`playPause`异步错误只可更新仍为当前的WaveSurfer实例。真实音频播放与StrictMode资源验收尚未运行。
