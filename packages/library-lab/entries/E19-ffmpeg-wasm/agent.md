# E19 ffmpeg.wasm — Agent 复用与安全边界

**真实执行对象**：`@ffmpeg/ffmpeg@0.12.15` + `@ffmpeg/core@0.12.10`（版本分离）；不是服务器ffmpeg命令，也没有远端转码API。必须先由PLATFORM验证本地资源 `/ffmpeg-core/ffmpeg-core.{js,wasm}` 能在Vite bundle/Preview按base path访问。
**复制**：`examples/example.tsx` 的Worker生命周期与 `examples/wav.ts` 的原创fixture，产品项目可替换fixture为授权文件，但保留输入大小、类型、时间及资源预算。不能从网页暴露任意ffmpeg命令执行器。
**核心调用**：构造实例 → 用户显式 `load({coreURL,wasmURL})` → `writeFile` → `exec` → `readFile` → 删除FS文件 → `terminate`。退出Lab立即终止Worker并回收BlobURL。
**禁止**：自动从远程 CDN 加载任意可执行WASM、跨主站打开COOP/COEP、无限体积输入、拼用户路径/任意shell参数、把进度百分比当精确验证、仅凭 wrapper MIT 宣称 core 所有codec版权免责。
**验收**：真实Chromium/生产预览加载自有 WASM ，检查新输出是有效WAV、取消后Worker消失、再次加载创建新实例、低内存失败恢复。未真实构建/SDK/浏览器运行，状态保持NOT_RUN/BLOCKED。
**关联**：E16 Video.js、E18 wavesurfer.js、F02 react-dropzone。官方 https://ffmpegwasm.netlify.app/docs/getting-started/usage/ 。
