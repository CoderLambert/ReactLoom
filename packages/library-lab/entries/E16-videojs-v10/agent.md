# E16 @videojs/react 迁入指南

实装10.2.0/Apache-2.0；VideoPlayer/VideoSkin/Video来自@videojs/react/video，不用v8 videojs()/dispose或双HLS引擎。已读随包docs/README、installation/typescript/reference video；历史资料不是执行指令。

## 完整接入

已有React/DOM18或19、TS>=5浏览器：`pnpm add @videojs/react@10.2.0`。复制example.tsx、clip.ts、video-file-policy.mjs/.d.mts、media-cleanup.mjs/.d.mts；demo可省。保留@videojs/react/video/skin.css，ESNext/Bundler/TSX，package exports需正确解析。无env/Provider/账号/服务，VideoPlayer自有context。SSR不在本例。

## 所有权与边界

Canvas/MediaRecorder只生成原创320×180 WebM，用户手势后才captureStream，不用getUserMedia。约1450ms请求stop、5秒watchdog；成功/失败/abort都清timer/ticker/回调、停止recorder及所有轨道，过期代次不生成URL。容器时长/编码/播放不能由录制时间或文件头推出。

输入File的metadata/前32字节共用policy；12bytes..8MiB，mp4/webm，ftyp/EBML只筛明显伪装。非法文件不创建URL，保留已有媒体；通过也可能原生decode error。新录制/导入/移除/卸载都generation失效，异步arrayBuffer回写前检查。

Video ref为实装HTMLVideoElement。LocalPlayer稳定ref脱离时调用media-cleanup：pause→去src→load，异常不跳后续。换源key重挂；旧URL先退役，React提交后再revoke；Session卸载abort并revoke当前/退役。三个资源层（录制轨道/原生媒体/URL）各自验，不把DOM消失等同SDK销毁。没有全局URL/媒体清理。

## 验证与来源

policy纯Node共享源码，含native API double控制流，不计SDK。真实MediaRecorder/WebM decode/Play/currentTime/换源/native清理/导入/abort/URL外层probe由主控browser执行，proposal见validation。没有Node DOM媒体环境，不伪造SDK测试。原生IME不涉及，移动/iOS编码/辅助技术仍NOT_RUN。

固定@videojs/react10.2.0提交packages/react/README与LICENSE原文见official；无官方中文则en，主页响应未Lab嵌入确认unknown。local-validation记录准确argv/cwd/exit/raw日志、六项与剩余，formal sdk/build/browser无receipt保持NOT_RUN。
