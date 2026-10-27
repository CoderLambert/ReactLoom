# E16 Video.js v10 — Agent 工程实施规则

**用 @videojs/react@10.2.0，不要误装 npm video.js v8。** 新v10 React入口 `@videojs/react/video` 的 VideoPlayer/VideoSkin/Video，样式 `@videojs/react/video/skin.css`。官方 https://videojs.org/docs/guides/installation/react 。
**迁移入口**：`examples/example.tsx` + `examples/clip.ts`。`clip.ts` 是原创媒体fixture，不是Video.js录制能力，目标项目可以换自己的授权媒体URL。组件代码通过DemoHost动态加载，同源展示。
**必须保留**：播放器源切换的mount/unmount、旧 Blob URL 回收、媒体轨道stop、用户手势播放、错误反馈，CSP/跨域字幕/HLS协议独立审查。
**反模式**：混用v8插件；以`video.js`为v10 npm包名；随组件重渲染重录制视频；在移动浏览器认为必然支持MediaRecorder；默认播放未经授权的远程内容。
**验证**：实际React19类型编译、Vite产物chunk、Chromium/Firefox/WebKit播放/失败/重挂、键盘和字幕可访问性。未运行不记PASS。
**组合**：E17流媒体、E18音频波形、E19转换产物。使用自有合法媒体与固定来源许可。


**文件输入边界**：复用 `examples/video-file-policy.mjs` 和相邻声明；先限File元数据，再只读取前32字节判断WebM EBML或MP4 `ftyp`。通过 `generation` 排除晚到的 `slice().arrayBuffer()`，不得把MIME或扩展名当可信解码结果。真实播放/源切换/MediaRecorder可用性仍需浏览器测试。
