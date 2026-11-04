# ffmpeg.wasm 0.12｜同源核心、GPL 和默认不复制 wasm

`@ffmpeg/ffmpeg@0.12.15` 是 MIT 的主线程代理。`@ffmpeg/core@0.12.10` 是 **GPL-2.0-or-later** 的单线程核心（js 与 wasm）。不能把整个功能说成「MIT，可以随便闭源分发」。编解码器专利和素材版权也不在这份教学里解决。本指南不是法律意见。

Lab **不会**因为依赖已经安装就把 wasm 和 js 复制到站点。`packages/library-lab/scripts/prepare-ffmpeg-core.mjs` 只有在环境变量 `LIBRARY_LAB_FFMPEG_CORE_LICENSE_REVIEWED` 等于 `true` 时才暂存 `@ffmpeg/core` 的 `ffmpeg-core.js` 与 `ffmpeg-core.wasm`。否则它删除由 Lab 生成的目录并返回阻断原因：GPL 再分发需要明确复核。

因此本条目的 **sdk 保持阻断**。不要写 PASS。build 和 browser 也没有收据，保持 NOT_RUN。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。输入边界在 [`examples/input-policy.mjs`](examples/input-policy.mjs)。输出 WAV 检查在 [`examples/wav-output-policy.mjs`](examples/wav-output-policy.mjs)。默认音调用 [`examples/wav.ts`](examples/wav.ts) 的 `makeToneWav`：1 秒、16000 Hz、440 Hz 的本地 PCM。

用户点开 Demo 后引擎仍是「尚未加载」。**没有自动下载。** 要点「显式加载 WASM 引擎」。地址是本站：

```ts
const base = new URL(import.meta.env.BASE_URL + 'ffmpeg-core/', window.location.origin)
await ffmpeg.load({
  coreURL: new URL('ffmpeg-core.js', base).href,
  wasmURL: new URL('ffmpeg-core.wasm', base).href,
})
```

不要告诉读者改成 unpkg、jsDelivr 或其他 CDN。核心必须由 PLATFORM 在许可复核之后放到同源的 `ffmpeg-core/`。加载失败的文案只要求核对同源资源和 CSP。

换 `level` 时 effect 会 `terminate`、清掉结果 URL，并把状态设回未加载。同一个组件实例被复用时也不会偷偷留下 Worker。

| 层 | 输入 | 命令差异 |
| --- | --- | --- |
| basic | `makeToneWav()` | `-t 2`，实际样本只有 1 秒 |
| business | 可选本地文件，否则仍用合成音 | 同样 `-t 2` |
| advanced | 同样可选择文件 | `-t 0.5`，并显示日志和「立即取消」 |

转换参数：`-vn -ac 1 -ar 16000`，封装 wav。`exec` 的超时是 12000 毫秒。退出码不是 0 就失败。读回 `output.wav` 后 `validateOutputWav`。finally 里删除虚拟文件 `input.*` 和 `output.wav`。

文件预检在 `arrayBuffer()` 之前：`isAllowedMediaFile` 只接受 1 字节到 4MiB，MIME 为 wav、mpeg、webm 或 mp4。读入后再对文件头做一致性检查。头检查不是内存安全的解码器。输出还有 2MiB 上限（见策略调用）。

`operation` ref 保证两次点击不会共用虚拟路径。取消会 `terminate` 并要求重新 load。`exec` 的超时或 Abort 都不能假设 WASM 循环已经优雅停下，所以取消走销毁 Worker。

没有挂载：多线程 `@ffmpeg/core-mt`、跨源隔离头、进度条承诺、批量队列、上传。

## 1. 什么时候用

| 任务 | 判断 |
| --- | --- |
| 用户明确选择、体积有限、希望文件留在浏览器里转成单声道 WAV | 可以评估，但先过 GPL |
| 只播放 | E16 或原生 video |
| 只看波形 | E18 |
| HLS | E17 |
| 小时级影片、要 SLA | 服务端原生 FFmpeg，不在本 Demo |
| 没有人复核 GPL 就想把 wasm 打进产品 | 不要 |

v0.11 的 `createFFmpeg` 和 `ffmpeg.FS` 不是 0.12 的 API。本文件使用 `new FFmpeg()`、`load`、`writeFile`、`exec`、`readFile`、`deleteFile`、`terminate`。

官方：[用法](https://ffmpegwasm.netlify.app/docs/getting-started/usage/)、[仓库](https://github.com/ffmpegwasm/ffmpeg.wasm)、[npm 包](https://www.npmjs.com/package/@ffmpeg/ffmpeg)。

## 2. 模型

```text
点击加载
    │
    ▼
同源 /ffmpeg-core/ffmpeg-core.js + .wasm
    │ 未复核许可则文件不存在，load 失败
    ▼
Worker + 内存文件系统
    │ writeFile → exec → readFile → deleteFile
    ▼
WAV Blob URL（<audio>）
    │ 取消或换层
    ▼
terminate()，下次必须重新 load
```

日志只保留 500 字符，避免把长输出灌进页面。进度事件没有订阅。不要把日志里的时间当成剩余时间。

## 3. 三层

在 Library Lab 打开 E19 再运行。在许可标志不是 `true` 时，点击加载应当失败，而不是悄悄去 CDN 成功。把失败读出来即可，不要为了演示改加载 URL。

### 基本

加载成功后点「执行转换」。输入是合成音。成功时出现 `<audio controls>` 和字节数。这证明的是这次 exec 返回了 WAV 字节，不是音质评估。

### 业务

可以选择 4MiB 以内的文件。不选则仍用合成音。拒绝的 MIME 不会调用 `arrayBuffer`。转换目标仍是 16 kHz 单声道，而不是「保持原格式」。

### 进阶

输出截断到 0.5 秒。取消会终止 Worker。超时文案不是安全沙箱证明。日志 pre 只在这一层。

## 4. 反例（带代码）

### 反例 1：从 CDN 加载核心

```ts
await ffmpeg.load({
  coreURL: 'https://cdn.example/ffmpeg-core.js',
  wasmURL: 'https://cdn.example/ffmpeg-core.wasm',
})
```

禁止。同源路径由 PLATFORM 在 `LIBRARY_LAB_FFMPEG_CORE_LICENSE_REVIEWED=true` 之后写入。文档和示例都不要提供 CDN 地址。

### 反例 2：安装依赖后就复制 wasm

脚本在标志不为 `true` 时拒绝暂存，并清掉 Lab 自己生成的目录。不要在条目里再写一份复制逻辑绕过它。

### 反例 3：把包装器的 MIT 说成核心的许可

`library.json` 的 `license.spdx` 写的是包装器一侧的 MIT，同时 `assets` 注明核心可能带 LGPL/GPL 义务。教学时以核心 **GPL-2.0-or-later** 为准说明再分发。不要写「sdk PASS」来暗示许可已经复核。

### 反例 4：并行 exec 共用文件名

```ts
await ffmpeg.writeFile('input.wav', a)
await ffmpeg.writeFile('input.wav', b)
```

Lab 用 `operation` 单飞。取消后的旧 Promise 还必须看 `engine.current === ffmpeg`，避免删到新实例的文件或把结果写给新会话。

### 反例 5：先 arrayBuffer 再检查大小

大文件会先占满内存。`isAllowedMediaFile` 在读取之前。

### 反例 6：不 deleteFile

虚拟文件系统会留下输入和输出。finally 里对两个路径 `deleteFile`，失败被吞掉是为了不掩盖原始错误，但调用不能删。

### 反例 7：用 AbortSignal 代替 terminate

CPU 上的编码循环不一定停。用户点的取消是 `terminate()`，然后 `loaded` 变回 false。

### 反例 8：多线程核心顺手换上

`@ffmpeg/core-mt` 同样是 GPL，并且需要跨源隔离。本示例没有 workerURL，也没有要求页面去改 COOP/COEP。那是 PLATFORM 的事，不要在条目文档里给出一套要改根配置的步骤。

## 5. 内存与稳定性

4MiB 输入和 2MiB 输出是拒绝线。1 秒的合成音远小于这个值，不能用来证明长视频可行。超时 12 秒会失败，失败后是否还能复用同一个 Worker，以当时的错误为准；取消路径明确要求重新 load。

不要把浏览器里的一次成功写成服务器成本下降了多少。没有测量。

## 6. 组合（未挂载）

**E16。** 只有当输出是播放器能够校验的容器时才交给 Video.js。当前输出是 WAV，播放用本页的 `<audio>`。

**E18。** 可以把校验过的 WAV 交给新的 WaveSurfer。不要把 FFmpeg 实例和波形实例绑成同一个 ref 而不分别销毁。

**文件选择。** 拖拽组件只负责拿到 `File`。头检查仍走 `validateInputMedia`。

## 7. 升级核对

- 两个包锁定 0.12.15 和 0.12.10。
- 核心许可字符串必须以 `GPL-2.0` 开头，脚本会拒绝其他许可。
- 保持 `load` 的 URL 在 `BASE_URL` 下的 `ffmpeg-core/`。
- 不要升级到需要 CDN 示例才能跑的文档片段。

## 8. 故障

| 现象 | 先看 |
| --- | --- |
| 加载失败 | 标志是否为 true，同源文件是否存在，CSP 是否允许 wasm |
| 转换非零退出 | status 里的退出码。日志只在 advanced |
| 取消后不能再转 | 必须重新点击加载。这是预期 |
| 文件立刻被拒绝 | MIME、大小或文件头 |
| 结果不是 WAV | `validateOutputWav` 会抛错 |
| 想用 CDN 绕过失败 | 不要 |

## 9. 验收

在核心未暂存时，验收就是：点击加载得到失败状态，并且网络面板没有第三方 ffmpeg 主机。这仍然不是 PASS。

在 PLATFORM 已复核并暂存同源文件之后，才有资格另做这些观察，而且每次都要收据：

1. 加载的 js 和 wasm 来自本站 `ffmpeg-core/`。
2. basic 得到可检查的 WAV，虚拟文件被删除。
3. 超限文件不会 `arrayBuffer`。
4. advanced 取消后 Worker 不再接受 exec，直到重新 load。

sdk 因 GPL 暂存门闩保持阻断，不要写 PASS。build 与 browser 保持 **NOT_RUN**，除非 `docs/library-lab/evidence/runs/` 里有 E19 的对应收据。Actions `41779873259` 是仓库级运行，不是本条目通过，也不是许可复核。

## 10. 资料

- https://ffmpegwasm.netlify.app/docs/getting-started/usage/
- https://github.com/ffmpegwasm/ffmpeg.wasm
- https://www.npmjs.com/package/@ffmpeg/ffmpeg
- https://www.npmjs.com/package/@ffmpeg/core
- https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
