# E16 Video.js 10 — React 视频播放器与真实媒体生命周期

## 关键版本事实
2026-10-01 Video.js 10 正式 GA。**新版本 React 包是 `@videojs/react`，npm `video.js` 仍是旧版8，不是直接升级包名即可替换。** 本示例固定官方当前 React 安装指南中的 `@videojs/react@10.2.0`，使用 `VideoPlayer`、`VideoSkin`、`Video`。2026-10-27审查原仓库的 E16 仍为未接入，本页为重新实现，不继承历史测试状态。

## 安装 / 导入
```bash
pnpm add @videojs/react@10.2.0
```
```tsx
import '@videojs/react/video/skin.css';
import { VideoPlayer, VideoSkin, Video } from '@videojs/react/video';
```
真实代码在 `examples/example.tsx`。样式由 Vite 在详情 chunk 中按需加载；如果有全局 CSS 影响，需由 PLATFORM 提供隔离方案，不修改其他模板的CSS。**不要按Video.js v8 `videojs(element,...)` 教程写 v10。**

## 三层可见练习
入门：用户点击才用 `Canvas.captureStream` + `MediaRecorder` 制造约1.45秒的原创WebM，生成 Blob URL，交由真实 Video.js 播放器显示。
业务：浅色/深色新闻片头切换，实例随新URL重新挂载，旧 URL 被撤销。
进阶：从用户本机选择不超过8MiB的 MP4/WebM，校验 MIME/文件大小，退出实验时不继续使用Blob；浏览器不支持MediaRecorder时允许改用本地文件。

## 生命周期 / 最佳实践
- `MediaRecorder` 视频录制由原生 API 完成，**这部分不属于 Video.js 的录制功能**；Video.js 只负责最终的媒体播放与 UI。
- 不自动获取摄像头、麦克风或上传。Canvas stream track 录制完成后 stop，避免页面离开仍保持捕获。
- React组件使用 `key={url}` 迫使旧player卸载、新媒体实例重建；同时调用 URL.revokeObjectURL，注意运行环境中的异步解码/播放错误。
- 自动播放通常被浏览器限制，播放器控件要由用户手势启动。
- 视频字幕、HLS/DASH 等应使用与 v10 匹配的独立源适配器，不在这个教程伪造媒体加密或直播支持。

## 五个常见错误
1. 混装 `video.js@8` 的插件与 v10 React API。
2. 将 MediaRecorder 产物当 MP4：此处明确是 WebM，Safari等不支持时友好失败。
3. 先 revoke 正在播放的 Blob URL 然后期待旧流继续：先卸载旧player。
4. HLS 链接缺CORS或媒体协议适配却当作MP4：用 E17 hls.js 或 Video.js v10 的HlsJsVideo。
5. 提供“自动播放成功”的断言而未真实浏览器运行：区分编写与验证状态。

## 跨库组合与练习
E17 hls.js 解决 HLS 分段；E18 wavesurfer.js 提供音频波形；E19 ffmpeg.wasm负责媒体转换。练习在移动端模拟多次切换视频，在网络面板检查没有外部访问，移除视频后无继续播放，键盘可用、字幕/画中画按浏览器能力校验。

## 官方与授权
https://videojs.org/docs/guides/installation/react 和 https://videojs.org/changelog/10.0.0 。Apache-2.0，播放器是真实包；SDK/浏览器测试尚未执行成功。


## 视频源切换的异步渲染边界（补充）

切换 Blob URL 时，不能在调用 `setUrl(next)` **之前**立即撤销旧 URL：React 可能尚未提交旧 Player 的卸载，旧浏览器媒体实例仍在使用该地址。当前 Demo 将旧 URL 加入待释放队列，等 `url` 更新后的 Effect（React commit 后）撤销；卸载时对当前与待释放 URL 全量清理。此修复是源码生命周期审查，尚未执行真实媒体浏览器测试。
