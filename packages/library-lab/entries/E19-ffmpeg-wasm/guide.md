# E19 ffmpeg.wasm — 用户显式加载的本地媒体转换

## 核心能力与风险
ffmpeg.wasm 是在浏览器 Worker/WebAssembly 中执行 FFmpeg 的移植方案，**不是在线媒体API，也不是万能的高性能服务器转码替代**。需要大量内存和 WASM 下载，可能受移动浏览器、CSP 和 Cross-Origin-Isolation 限制。此Lab示例默认不加载任何核心文件、没有远程媒体和收费服务。

## 包与核心的分离
```bash
pnpm add @ffmpeg/ffmpeg@0.12.15 @ffmpeg/core@0.12.10
```
`@ffmpeg/ffmpeg` 是 JS/Worker 包装，`@ffmpeg/core` 承载体积较大的 WASM 核心，**二者并非相同版本号**。此示例使用单线程 core，不强行开启 cross-origin isolation 破坏主站其他功能。PLATFORM 应将核验后的 `@ffmpeg/core/dist/esm/ffmpeg-core.js` 与 `ffmpeg-core.wasm` 提供到本应用同源 `<base>/ffmpeg-core/` 路径，正确设置 JS/WASM MIME 与缓存/CSP；同时核对 @ffmpeg/ffmpeg 的 Worker URL/Vite bundler。不要通过不受控的公网CDN自动加载大文件。

## 源码与三层
`examples/wav.ts` 纯本地生成1秒 16kHz mono PCM WAV；`examples/example.tsx` 真正 `new FFmpeg()`、`load`、`writeFile`、`exec`、`readFile`、`terminate`。
- 入门：点击下载本站核心，执行 WAV → WAV 标准化，输出真实 Blob 音频。
- 业务：允许选择≤4MiB 的 WAV/MP3/WebM/MP4，转换为单声道 16kHz WAV（固定音频轨道，不包含字幕）。
- 边界：12秒 `exec` 预算、转换最长0.5秒，取消立即 terminate；后续需再次加载引擎。保留错误日志文本而不是 `innerHTML`。

## 生命周期与隔离
初始化/核心下载都必须由用户触发；一个实验持有一个FFmpeg实例。输入文件名由 MIME 白名单映射，不能直接把用户上传的路径当虚拟文件系统路径。处理后删除虚拟FS输入/输出文件；组件卸载 `terminate()`，输出 Blob URL `revokeObjectURL`。请勿假设 `ffmpeg.exec` 或 React卸载自动终止 Worker。

## 五类实际风险
1. 为所有119库预加载WASM，导致首页巨大：必须在用户点击后分chunk下载。
2. 直接复制 CDN JavaScript core 而不核对二进制完整性、CSP和来源许可：应由PLATFORM固定版本，按可验证资产部署。
3. 在主站开启跨源隔离仅为多线程加速，破坏 iframe/第三方资源：优先单线程并单独测试COEP/COOP。
4. 把进度回调当精确耗时：官方声明部分命令进度非通用，日志/实际输出才是业务证据。
5. 假设可以处理无限大文件或提供任意ffmpeg命令执行：应约束输入大小、时长、编解码器、超时和输出，避免资源耗尽。
6. 以 wrapper MIT 许可覆盖全部 FFmpeg codec patent/LGPL/GPL 合规：发行时必须单独核对 core 二进制所包含的编解码器和法律要求。

## 组合、练习和验收
E16 Video.js v10 播放转换后的本地视频；E18 wavesurfer.js播放与显示生成 WAV 的波形；F02 react-dropzone可只负责合法文件输入。练习：同时加载/取消/重新加载；检查没有持续 Worker、Blob URL、FS 字节泄漏；使用 Vite生产预览及Chromium验证 core 资源、CSP/Worker/内存和实际转换字节。**当前公共 runner 尚未提供核心资源，本批没有真实 WASM 测试。**

## 官方
https://ffmpegwasm.netlify.app/docs/getting-started/usage/ 与 https://github.com/ffmpegwasm/ffmpeg.wasm ，wrapper MIT；核心第三方许可证需要逐组件审查。
