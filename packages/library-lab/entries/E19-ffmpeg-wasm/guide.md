# ffmpeg.wasm：把浏览器里的小文件变成统一音频

用户选了不同来源的音视频，业务希望得到可播放、可送入后续音频处理的统一格式。ffmpeg.wasm把FFmpeg放进浏览器Worker，通过内存文件系统接收输入，执行转换命令，再把输出字节交回页面。本例目标是 **16kHz、单声道、PCM16的WAV**；文件不上传，代价是较大的核心加载、解码内存和浏览器计算时间。

适合用户明确选择、体积可控、希望本机处理的小文件。仅播放用原生audio或E16；仅展示波形用E18；长视频、批量吞吐或需要处理时限保证时，应评估服务端原生FFmpeg。把Worker当作安全沙箱，或把4MiB输入上限当成总内存预算，都不成立。

本例包装器 `@ffmpeg/ffmpeg@0.12.15` 声明 MIT，单线程核心 `@ffmpeg/core@0.12.10` 声明 GPL-2.0-or-later。维护者确认后，隔离的本机 Chromium 预览实测了真实转码、文件拒绝、取消和重载。日常预览仍需维护者通过既有许可门禁供应匹配的同源核心。已验收的具体范围和日志见 [local-validation](local-validation.md)。

## 先分清包装器、核心和文件

| 对象 | 做什么 | 本例所有权 |
| --- | --- | --- |
| `new FFmpeg()` | 主线程的代理，通过消息与Worker通信 | 当前场景独享实例 |
| `load({ coreURL, wasmURL })` | 启动SDK Worker并加载FFmpeg核心 | 仅显式按钮后、本站许可核验资产 |
| `writeFile` / `readFile` / `deleteFile` | 在Worker的虚拟文件系统交换字节 | 一次转换单飞，固定输入/输出路径 |
| `exec(args, 12000)` | 运行真正FFmpeg命令，返回退出码 | 检查0才继续读取输出 |
| `terminate()` | 拒绝未完成API并销毁Worker | 取消、换场景和卸载；之后必须重新load |
| `Blob URL` | 让页面audio播放/下载输出 | 替换、取消和卸载时revoke |

这是0.12的 `FFmpeg` 类API，不能拼接0.11的 `createFFmpeg/FS` 接口。包装器、核心的版本号各自独立。安装包还明确把Node导出指向会抛“does not support nodejs”的入口，所以普通Node构造器检查不能证明浏览器SDK转码。

```text
File或原创PCM → 读取前大小/MIME预检 → 字节头一致性 → writeFile(input.*)
                                                        ↓
                                                 exec(转换参数)
                                                        ↓ exit=0
                 删除虚拟文件 ← readFile(output.wav) → WAV结构/参数校验
                                                        ↓
                                              Blob URL → audio / 下载
```

SDK负责真实媒体处理和虚拟文件系统；本例负责输入限制、目标参数、状态展示、输出校验、批次所有权和清理。没有上传、远程媒体抓取、批量队列、多线程核心或百分比进度承诺。

## 最小接入的位置

完整可迁移源码是 [example.tsx](examples/example.tsx)，入口 [demo.tsx](examples/demo.tsx) 只重导出。先由维护者完成许可复核与同源资源部署，再在用户点击中加载：

```ts
const ffmpeg = new FFmpeg()
const base = new URL(import.meta.env.BASE_URL + 'ffmpeg-core/', window.location.origin)
await ffmpeg.load({
  coreURL: new URL('ffmpeg-core.js', base).href,
  wasmURL: new URL('ffmpeg-core.wasm', base).href,
})
```

这里对应既有平台从核心包 `dist/esm` 暂存的文件，适用于Vite。必须显式传入两个同源URL；省略时SDK有远程默认地址，不能用于绕过Lab门禁。本例不使用toBlobURL/CDN，不修改根COOP/COEP/CSP。单线程核心仍通过包装器Worker运行，但不等于使用需要SharedArrayBuffer的多线程core-mt。

## 实验一：原创纯音，走通输入到产物

工程问题：先用完全可控的输入理解write/exec/read，而不是一开始处理各种未知文件。

在核心获准部署之后，basic点击“显式加载WASM引擎”，就绪后点“执行转换”。[makeToneWav](examples/wav.ts) 本地生成1秒、16kHz、单声道、440Hz PCM16音频，没有下载素材。页面显示实际读取字节数和真正传给exec的参数；成功后显示退出码0、经WAV解析得到的bytes/sampleRate/channels/seconds、audio和“下载本次WAV”。

参数由同一个 `wavArguments` 函数生成供执行/预览使用：

```text
-hide_banner -y -i input.wav -vn -ac 1 -ar 16000 -c:a pcm_s16le -t 2 -f wav output.wav
```

`-vn`舍弃视频，`-ac 1`选单声道，`-ar 16000`设采样率，`-c:a pcm_s16le`显式选择16位有符号小端PCM，`-t`设输出时长上限，`-f wav`选封装。包装器exec本身还默认添加 `-nostdin/-y`。`-t 2`不会把1秒输入补成2秒；实测产物为 1 秒、32,078 字节。WAV允许有附加chunk，不能只假定44字节文件头。

“转换参数预览”明确标记尚未执行；只有真正进入exec才切成“实际传给exec的参数”。输出信息只来自 `readFile` 后的 [inspectPcmWav](examples/wav-output-policy.mjs)，没有预填成功信息。下载输出经独立 `ffprobe` 回读，确认是 16 kHz、单声道、16 位小端 PCM。

## 实验二：本地文件预检与音频标准化

工程问题：接收不同格式、声道和采样率时，输入边界与输出目标如何分开？

business选择最多4MiB的WAV/MP3/WebM/MP4文件；不选时沿用原创纯音。点击转换先检查File.size/type，合格后才调用arrayBuffer，再验证实际字节长度与文件签名。给MIME为audio/wav但不是RIFF/WAVE的文件应失败；超限文件在分配文件字节前拒绝。头检查只做快速一致性检查，不能证明文件安全或可解码，真实坏媒体仍可能在exec失败。

本地原创 48 kHz 双声道 WAV 实测转成 16 kHz 单声道。仅有 WAV 签名的截断输入通过预检后，由真实解码器返回退出码 1；旧下载链接和 URL 清除，随后可用有效文件重试。读取快照固定本次File的名字/MIME/字节数，处理期间禁用文件选择；虚拟文件名由校验后的扩展名生成，不直接拿用户文件名当路径。错误后不会保留旧结果作为本次成功，确认输入后可再执行。

输出校验限制2MiB，并解析RIFF长度、fmt/data边界、PCM16/单声道/16kHz及实际时长。输入很小也可能在解码中占用大内存，这些限制只是拒绝线，不是解码器内存安全保证。

## 实验三：取消与重新加载Worker

工程问题：用户取消时，停止等待Promise与真正终止正在计算的Worker有什么区别？

advanced提供同样的输入，目标时长改为0.5秒，显示最后一条最多500字符的FFmpeg日志。“立即取消并终止Worker”在加载或就绪/转换期间可用，调用terminate、清掉结果URL、置为未加载；继续执行必须重新点击加载。

- `exec(..., 12000)` 的第二参数是毫秒；0为成功，非0是错误或超时，不能把它显示成成功产物。
- 包装器的AbortSignal只拒绝消息等待，源码没有以此中断Worker里的FFmpeg循环；本例显式terminate。不能把“Promise被拒绝”当成计算已停止。
- `operation`在入口同步占用，防止快速双击共用input/output路径；`session`与实例身份在每个await之后检查，旧任务不能把输出写给新实例。
- finally只对捕获的旧实例deleteFile；成功次数来自真实删除返回，不把未创建/已销毁文件声称删除成功。取消后的旧finally不能解锁新操作或覆盖新清理状态。
- 换level和卸载增加session、清operation、terminate并revoke URL。日志回调也核对实例身份。

验收分别观察了 WASM 加载期间终止，以及收到真实 FFmpeg `Input #0` 日志后、`EXEC` 返回前终止。后一用例使用原创 20 秒双声道输入，验证 Worker 被终止、没有读回或发布旧输出。重载后 0.5 秒样例可成功下载。日志能证明命令已经进入核心，以及应用尚未收到完成回复；它无法定位终止时刻的 WASM 指令。实际 `EXEC` 消息携带 12,000 ms 的超时参数，未单独触发 12 秒超时。

## 迁到自己的项目

复制example.tsx、wav.ts、input-policy.mjs及声明、wav-output-policy.mjs及声明、workshop.css；demo.tsx是Lab适配器。需要React浏览器/Vite环境和匹配的两个包，资源由获授权的维护者通过既有平台流程管理。更换宿主时只适配BASE_URL/静态路径，不把部署步骤藏进组件，也不分享别人的FFmpeg实例或清理其他页面资源。

当前没有持久化、缓存、上传或下载核心的代码。产物下载只使用本次转换生成的Blob URL；核心授权、编解码器适用条件和素材使用责任不能由包装器MIT徽标代替。生产分发前按项目既有许可流程完成核验。

## 官方原文和本轮证据

真实上游tag为 `v12.15`，固定commit `71aa99d37c02a7b4c435275ca9ef50e612f6efa1`。该处packages/ffmpeg和packages/core分别声明0.12.15/0.12.10。完整tree没有官方中文README候选，选择根英文 [README原文](official/readme.md)，2,161字节，SHA-256 `c658a2af2da82d7b290f7ecb4ff38480594ade43eaed824094fad75bf385b68d`；[固定出处](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/71aa99d37c02a7b4c435275ca9ef50e612f6efa1/README.md)。保留维护者告示、链接和原始字节，不把中文讲解当作官方翻译。

[官方用法](https://ffmpegwasm.netlify.app/docs/getting-started/usage/)结合安装包0.12.15源码/类型核对load/exec/terminate。官网 `https://ffmpegwasm.netlify.app/` 实际GET200，无XFO/CSP，但有COOP/COEP；这不是允许嵌入的证据，未从Lab origin实际浏览器确认，保持unknown和直达。[source-evidence](official/source-evidence.json) 保存完整响应与版本/候选/日期/摘要。

实际 Chromium、原始下载、独立回读、Node 策略和正式收据分别记录在 [local-validation](local-validation.md)。
