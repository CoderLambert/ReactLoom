# Video.js 10.2.0｜React 播放器、本地 WebM 和显式换源

先分清代际。本条目使用 `@videojs/react@10.2.0`（Apache-2.0），组件来自 `@videojs/react/video`：`VideoPlayer`、`VideoSkin`、`Video`。这不是 `video.js@8` 的 `videojs()` 工厂，也不能把 v8 的插件选项对象套进这些组件。

播放器负责控件和生命周期。它不生成媒体。本示例的画面来自 Canvas 和 MediaRecorder，不打开摄像头或麦克风，也不自动请求第三方片源。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。录制在 [`examples/clip.ts`](examples/clip.ts)。文件头在 [`examples/video-file-policy.mjs`](examples/video-file-policy.mjs)。

`key={level}` 使三层各自一份会话。用户点开 Demo 之后页面仍是「未创建视频」。要点按钮才录制。没有 `localhost:5173`，没有自动 `src`。

| 层 | 按钮 | 媒体 |
| --- | --- | --- |
| basic | 制作本地片头、移除 | 浅色 Canvas → WebM Blob |
| business | 再加深色片头 | 换 Blob 就换播放器 |
| advanced | 再加本地文件 | mp4 或 webm，先校验再播放 |

录制细节：

- 320×180 画布，约 1.45 秒，`captureStream(12)`。
- MIME 只在浏览器声明支持 `video/webm;codecs=vp8` 或 `video/webm` 时使用。
- 没有 MediaRecorder、不能捕获画布、不能录 WebM 时抛错，文案建议改用 advanced 的本地文件。
- `AbortSignal` 会停掉录制。新的一次录制会 abort 上一次。
- 轨道在 finally 里 `stop`。

播放器：

- 只有 `url` 非空才渲染 `VideoPlayer`。`key={url}`，换地址就挂上新的播放器。
- `Video` 的 `src` 是 blob URL，`playsInline`。
- 旧的 blob URL 放进 `retiredUrls`，在 **下一次** `url` 提交后再 `revokeObjectURL`，避免刚换上的播放器还在读就被收回。
- 卸载时 generation 递增、abort 录制、revoke 当前和退役的 URL。

本地文件：

- `validateVideoMetadata`：类型只能是 `video/mp4` 或 `video/webm`，大小 12 字节到 8MiB。
- 只读前 32 字节。`validateVideoHeader` 核对 `ftyp` 或 EBML 头。不一致就拒绝，不创建 URL。
- 通过后把整个 `File` 交给 `URL.createObjectURL`。文件仍在浏览器里，不上传。

没有挂载：hls.js、字幕轨道编辑、广告插件、远程 MP4、DRM、摄像头采集。

## 1. 什么时候用

| 任务 | 判断 |
| --- | --- |
| 要皮肤、控件、可更换的媒体元素 | Video.js v10 的 React 包 |
| 只有一个短 MP4、不需要皮肤 | 原生 `<video>` |
| HLS 清单和 ABR | E17，或播放器的 HLS 适配。不要两个引擎绑同一个元素 |
| 音频波形 | E18 |
| 转码 | E19，而且有 GPL 核心约束 |

v8 教程里的 `videojs(el, options)`、`player.dispose()` 和插件注册表不是这份源码的 API。迁移要换组件，而不是改个版本号。

官方：[React 安装](https://videojs.org/docs/guides/installation/react)、[10.0.0 说明](https://videojs.org/changelog/10.0.0)、[仓库](https://github.com/videojs/video.js)。

## 2. 生命周期

```text
用户点击
    │
    ├─ createLocalClip → Blob → object URL
    └─ 或 File → 32 字节头 → object URL
            │
            ▼
VideoPlayer key={url}
    Video src={url}
            │
            ▼
换 url：先记下旧 URL，提交后再 revoke
卸载：abort 录制并 revoke
```

React 提交和媒体元素的网络缓冲不是同一时刻。所以 revoke 放在依赖 `url` 的 effect 里，而不是在 setState 之前。

## 3. 三层

在 Library Lab 打开 E16，运行，再点「制作本地片头」。

### 基本

状态从「正在录制」到带有 KiB 大小的「已加载」。然后才出现播放器。用原生控件播放。失败时读 status，常见原因是浏览器没有 MediaRecorder。

### 业务

再点深色片头。播放器因 `key` 更换。上一份 URL 在新地址提交后收回。快速连点时，旧的 generation 不能把过期 Blob 写回来。

### 进阶

选择本地 mp4 或 webm。错误类型、过小、超过 8MiB、文件头不符，都停在校验失败，不出现播放器。移除按钮清空地址并进入退役列表。

iOS 上 MediaRecorder 和编码支持没有在本条目里测试。源码把这条写成需要测的项，不是已通过。

## 4. 反例（带代码）

### 反例 1：继续用 v8 工厂

```ts
import videojs from 'video.js'
const player = videojs(ref.current, { sources: [{ src }] })
```

本条目的依赖是 `@videojs/react`。混用两套会得到两个播放器堆在一个元素上。

### 反例 2：未点击就写远程 src

```tsx
<Video src="https://cdn.example/trailer.mp4" />
```

Lab 在没有 blob URL 时只显示说明，不发媒体请求。

### 反例 3：换 src 不换播放器实例

有的状态机会留着上一份缓冲。Lab 用 `key={url}` 重新挂载。不要只改 prop 就声称内部状态已重置，除非你在浏览器里看过。

### 反例 4：立刻 revoke 还在使用的 URL

```ts
const url = URL.createObjectURL(blob)
setUrl(url)
URL.revokeObjectURL(url)
```

元素还没加载完。Lab 把旧 URL 推迟到下一次提交。

### 反例 5：不校验文件头

MIME 可以由用户改。32 字节检查挡住明显的伪装。它不是完整的容器解析，也不证明编码能播。

### 反例 6：用摄像头代替 Canvas

`getUserMedia` 不在这个 Demo。不要为了「更像视频」打开设备。`createLocalClip` 只画布。

### 反例 7：卸载不停录制

MediaRecorder 和定时器必须在清理函数里停。Lab abort 控制器并 `stop` 轨道。

### 反例 8：同一个 video 再挂 hls.js

v10 若已经有 HLS 源处理，再 `new Hls(); hls.attachMedia(video)` 会抢 MSE。E17 是单独的 `<video>`。组合时只能有一个引擎。本示例没有 HLS。

## 5. 安全、无障碍、授权

Blob 留在本地。不要把用户文件读进日志。8MiB 是拒绝阈值，不是播放性能承诺。

控件来自 VideoSkin。键盘和字幕是否完整，没有 axe 或手工记录。不要写已通过。

片头是程序绘制的图形和「Library Lab」文字，不是第三方成片。若换成有版权的文件，许可不在本条目里。

CSP 若禁止 blob 媒体，播放会失败。那是部署问题，本指南没有浏览器收据。

## 6. 组合（未挂载）

**E17。** HLS 引擎和 Video.js 二选一绑定元素，或使用 v10 文档里的单一适配路径。不要两个 `attachMedia`。

**E18。** 波形是音频时间轴，不是这个播放器的皮肤。

**E19。** 转码产物若是浏览器能播的 WebM 或 MP4，再走本条目的文件头校验和 blob URL。ffmpeg 核心的 GPL 不因播放器是 Apache-2.0 而消失。

**Query。** 媒体元数据可以在 Query 里。可播放的 URL 仍要有代次，过期响应不能 `setUrl`。

## 7. 同类

| 方案 | 何时 |
| --- | --- |
| `@videojs/react` 10.2.0 | 要 v10 皮肤和 React 组件 |
| 原生 video | 一个文件、控件够用 |
| E17 | 自己控制 HLS |
| video.js 8 | 不要和本文件的组件混用 |

## 8. 升级核对

- 依赖名是 `@videojs/react@10.2.0`，样式是 `@videojs/react/video/skin.css`。
- 不从 v8 复制 `dispose` 教程。换源用新的 `key` 和 URL 回收。
- 录制 MIME 列表以 `MediaRecorder.isTypeSupported` 为准，不要写死一种编码却不检查。

## 9. 故障

| 现象 | 先看 |
| --- | --- |
| 没有播放器 | 还没点按钮，或录制抛错。读 status |
| 一换片就黑屏且报错 | URL 是否被过早 revoke |
| 本地文件被拒绝 | 类型、大小、前 32 字节 |
| 深色片头不出现 | 旧 generation 是否仍在写 |
| 离开页面还在画布上跑 | 清理函数是否 abort |

## 10. 验收

1. 打开 Demo 的网络面板没有媒体请求。
2. 点录制后出现本地播放器，能播放或给出真实错误。
3. 换片后旧 URL 最终被 revoke，且当前片仍能播。
4. 伪造文件头的文件不会得到 URL。
5. 卸载后轨道停止。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E16 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目通过。

## 11. 资料

- https://videojs.org/docs/guides/installation/react
- https://videojs.org/changelog/10.0.0
- https://github.com/videojs/video.js
- https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
