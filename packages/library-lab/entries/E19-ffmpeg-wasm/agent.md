# E19 ffmpeg.wasm — 工程手册

## 适用

用户明确选择的小文件，在浏览器 Worker 里转成单声道 16 kHz WAV。播放用 E16 或原生 audio。波形用 E18。HLS 用 E17。没有 GPL 复核就不要分发核心。

## 版本

`@ffmpeg/ffmpeg@0.12.15`（MIT 包装器），`@ffmpeg/core@0.12.10`（GPL-2.0-or-later）。API 是 `new FFmpeg()`、`load`、`writeFile`、`exec`、`readFile`、`deleteFile`、`terminate`。不是 v0.11 的 `createFFmpeg`。

## 迁移

复制 `examples/example.tsx` 的显式加载、同源 URL 和单飞 `operation`。`examples/demo.tsx` 只是再导出。输入先 `isAllowedMediaFile` 再读字节，再 `validateInputMedia`。输出必须 `validateOutputWav`。加载地址只允许 `import.meta.env.BASE_URL + 'ffmpeg-core/'`。不要写 CDN。

## 不可删的清理

换层和卸载都 `terminate` 并 revoke 结果 URL。取消同样 terminate，并把 `loaded` 设回 false。finally 删除 `input.*` 与 `output.wav`。旧 Promise 必须确认 `engine.current` 仍是当时的实例才写结果。`operation` 在入口同步占用，防止两个点击共用虚拟路径。

## 反例

- 从 CDN 加载 `ffmpeg-core.js` 或 wasm。
- 依赖一安装就复制核心，忽略 `LIBRARY_LAB_FFMPEG_CORE_LICENSE_REVIEWED`。
- 用包装器 MIT 掩盖核心 GPL-2.0-or-later。
- 先 `arrayBuffer` 再查大小。
- 并行写同一个 `input.wav`。
- 不 `deleteFile`。
- 只用 AbortSignal 而不 `terminate`。
- 自行换上 `@ffmpeg/core-mt` 并修改站点 COOP/COEP。
- 写 sdk PASS。

## 测试断言

- 非允许 MIME、空文件、超过 4MiB、文件头与 MIME 不符被拒绝。
- 输出 WAV 超过策略上限被拒绝。
- 未设置许可标志时，准备脚本不把 wasm 复制进 public，加载应失败且不请求 CDN。
- 这些断言不是 SDK 通过。

## 真实限制

sdk 因 GPL 暂存门闩保持阻断。示例默认只有 1 秒合成音。超时 12 秒。没有多线程核心，没有进度承诺。头检查不是安全沙箱。日志截断到 500 字符。

## 证据

不要写 PASS。sdk 保持阻断，直到许可复核且有真实运行收据。build 与 browser 在没有 `docs/library-lab/evidence/runs/` 的 E19 收据时保持 NOT_RUN。Actions `41779873259` 是仓库级运行，不是许可复核。

资料：https://github.com/ffmpegwasm/ffmpeg.wasm 与 https://www.npmjs.com/package/@ffmpeg/core 。
