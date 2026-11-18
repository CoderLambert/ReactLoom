# E19 ffmpeg.wasm 工程接入

先读library、guide、实际examples和verification。适合用户明确选择的小媒体本机转码，目标为16kHz/mono/PCM16 WAV；只是播放或波形不必引入大核心。包装器 0.12.15 声明 MIT，单线程核心 0.12.10 声明 GPL-2.0-or-later。已获授权的本机隔离预览验证了真实转码。正式集成仍需维护者通过许可门禁提供同源资源。

## 运行模型和迁移

真实FFmpeg类来自@ffmpeg/ffmpeg，load只显式点击后使用BASE_URL下ffmpeg-core.js/.wasm；已有平台从匹配核心dist/esm暂存，条目不另写部署。SDK默认有远程核心URL，本例必须保留两项同源配置。单线程也有包装器Worker，不需要擅自启用core-mt或修改根COOP/COEP/CSP。Node export为不支持Node的empty入口，不能用Node壳制造转换PASS。

带走example.tsx、wav.ts、input-policy.mjs/.d.mts、wav-output-policy.mjs/.d.mts、workshop.css，demo.tsx只重导出。0.12 API顺序load → writeFile → exec(args,12000) → readFile → 输出检验 → Blob URL，finally deleteFile。不是0.11的createFFmpeg/FS。

## 三个学习目标

basic用原创1秒16kHz纯音走通真实路径；business对本地文件做读取前4MiB/MIME预检及读后签名校验，再标准化；advanced教0.5秒目标、12秒超时与terminate/重新load。UI参数预览和实际exec共用wavArguments；实际退出码、读取快照、解析产物和清理计数只在对应事件后更新，未执行不能预填PASS。

参数显式-vn/-ac1/-ar16000/-c:a pcm_s16le/-t/-f wav。-t是上限，不延长短输入。输出inspectPcmWav验证RIFF/chunk、PCM16/mono/16k及2MiB/场景时长；不是只看扩展名或固定44字节头。下载本次WAV仅为本次Blob产物，不下载核心。

## 保留的安全和清理

先File元数据再arrayBuffer，之后validateInputMedia核大小/签名；签名不等于安全解码器。固定虚拟路径，不用用户文件名。operation同步单飞；session+实例身份在await后守卫。取消terminate真实Worker，AbortSignal只拒绝等待不足以中断FFmpeg循环；取消后必须重load。旧finally只删捕获实例，并核operation后才改当前状态。level/卸载增session、terminate、revoke输出URL；不清其他应用资源。日志仅最后500字符，不承诺进度精度。

## 浏览器验收

匹配构建上的四项 Chromium 流程已覆盖原创音、48 kHz 双声道归一化、预检及真实解码失败后的恢复、加载和执行阶段的终止、重载后 0.5 秒输出。测试通过实际 Worker 消息及 Blob URL 操作验证虚拟文件和输出的清理。`EXEC` 往返验证携带 12,000 ms 配置，未触发长超时。执行取消在 `Input #0` 日志到达且 `EXEC` 回复仍未抵达时操作。

`validation/run-local.mjs` 复用已完成的 Lab 构建，只在维护者确认许可后将核心暂存到独立回环预览。它与 `validation/browser-local.spec.ts` 是验收工具，常规工程迁入使用上列七个运行文件。命令、输入产物、证据和正式收据边界见 [local-validation](local-validation.md)。

## 官方来源

真实tag v12.15固定commit71aa99d37c02a7b4c435275ca9ef50e612f6efa1，两个package版本均已核；完整tree无中文README，保存根英文原文2161B及SHA/日期。官网完整GET200无XFO/CSP但有COOP/COEP，无Lab iframe实测所以unknown。source-evidence.json与local-validation保留可核查范围，不把MIT徽标扩展为核心许可结论。
