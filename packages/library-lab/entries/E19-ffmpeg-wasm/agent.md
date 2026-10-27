# E19 ffmpeg.wasm — Agent 复用与安全边界

**真实执行对象**：`@ffmpeg/ffmpeg@0.12.15` + `@ffmpeg/core@0.12.10`（版本分离）；不是服务器ffmpeg命令，也没有远端转码API。必须先由PLATFORM验证本地资源 `/ffmpeg-core/ffmpeg-core.{js,wasm}` 能在Vite bundle/Preview按base path访问。
**复制**：`examples/example.tsx` 的Worker生命周期与 `examples/wav.ts` 的原创fixture，产品项目可替换fixture为授权文件，但保留输入大小、类型、时间及资源预算。不能从网页暴露任意ffmpeg命令执行器。
**核心调用**：构造实例 → 用户显式 `load({coreURL,wasmURL})` → `writeFile` → `exec` → `readFile` → 删除FS文件 → `terminate`。退出Lab立即终止Worker并回收BlobURL。
**禁止**：自动从远程 CDN 加载任意可执行WASM、跨主站打开COOP/COEP、无限体积输入、拼用户路径/任意shell参数、把进度百分比当精确验证、仅凭 wrapper MIT 宣称 core 所有codec版权免责。
**验收**：真实Chromium/生产预览加载自有 WASM ，检查新输出是有效WAV、取消后Worker消失、再次加载创建新实例、低内存失败恢复。未真实构建/SDK/浏览器运行，状态保持NOT_RUN/BLOCKED。
**关联**：E16 Video.js、E18 wavesurfer.js、F02 react-dropzone。官方 https://ffmpegwasm.netlify.app/docs/getting-started/usage/ 。

**最新资源/输入契约**：迁移时一并读取 `examples/input-policy.mjs` 及 `input-policy.d.mts`。在 `arrayBuffer()` 前拒绝过大的File，读取后校验MIME与文件魔数及字节数，输出限定2MiB并核查WAV头。它只阻断明显不匹配的数据，不证明媒体解码器安全。`examples/example.tsx` 通过同步 operation token 防止连续点击并发写同一虚拟文件名，通过 session + FFmpeg实例身份排除取消后回写。不能删去这些检查或把纯Node 3个测试当真实WASM PASS。

## 新增明确的不变量

FFmpeg构造和on('log')/load放在同一个异常边界内，确保finally释放同步操作门禁。组件原地切换level必须终止旧Worker和失效session；不要只更新UI下拉选项而保留旧转换的Promise所有权。库核心/编码器的重分发许可仍须独立审查，真实浏览器构建及FFmpeg SDK保持NOT_RUN。


**输出文件契约补充**：迁移时一并复制 `examples/wav-output-policy.mjs` 及 `.d.mts`。必须在创建可播放 Blob URL 之前验证 PCM16/16kHz/单声道、RIFF/chunk 长度和实际 data 时长。不得只以 `exec()===0` 或 `RIFF/WAVE` 魔数断言正确转换。此检查只保证格式约束，不是解码器沙箱或 codec 授权证明。
