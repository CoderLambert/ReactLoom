# hls.js 1.7.3｜用户点名之后才加载公开测试流

`library.json` 钉住 `hls.js@1.7.3`，Apache-2.0。hls.js 在支持 MSE 的浏览器里拉取 HLS 清单和分片，写入 `MediaSource`，交给 `<video>` 解码。它不画皮肤、不签发 DRM、不做转码。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。`key={level}` 每个层一个 `HlsSession`。

**打开 Demo 不会发媒体请求。** 状态文案是「未加载：演示不会自动联网」。只有点击「加载公开 HLS 测试流（外部请求）」才进入 `load()`。

测试地址写在源码常量里，不是隐藏脚本：

```ts
const TEST_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
```

这是 opt-in。不点击就没有 `loadSource`，也没有 `video.src`。不要改成 `useEffect` 里自动加载。不要另找一个 CDN 播放列表在文档里让读者默默请求。

`load()` 的顺序：

1. `stop()`：generation 递增，`hls.destroy()`，暂停并 `removeAttribute('src')`，再 `load()` 清空元素。
2. 新的 generation。
3. `Hls.isSupported()` 为真时 `new Hls({ enableWorker: false, maxBufferLength: 12 })`。
4. `MEDIA_ATTACHED` 之后才 `loadSource(TEST_HLS)`。
5. `MANIFEST_PARSED` 把各层的高度和码率放进选择框。不自动调用 `video.play()`。文案要求再点原生播放按钮。
6. `ERROR` 显示 `type/details`。`fatal` 时作废 generation、`destroy`、清空元素和码率列表。**不会无限自动重试，也不绕过 CORS。**
7. 不支持 MSE 时，若 `canPlayType('application/vnd.apple.mpegurl')` 为真，把同一 URL 赋给 `video.src`，并说明这是原生 HLS，不是 hls.js 的 MSE。
8. 两者都不支持则不发请求。

business 和 advanced 才显示质量 `<select>`。`-1` 是自动，对应 `hls.currentLevel = -1`。选项必须来自当前清单，陌生 index 直接返回。

卸载 effect 同样 destroy 并清空 video。没有挂载：Video.js 皮肤、字幕选择器、CMCD、自动播放、重连循环。

## 1. 什么时候用

| 任务 | 判断 |
| --- | --- |
| 已有 HLS，要在 Chrome 等环境看 ABR 和错误事件 | hls.js |
| 一个 MP4 | 原生 video |
| 只要 v10 皮肤 | E16。不要和 hls.js 绑同一个元素 |
| DASH 或 DRM | 别的播放器 |
| 制作 HLS | 打包器，不是这个库 |

Safari 上可能走原生分支。`canPlayType` 只是提示，不保证这条 Mux 测试流的编码能播。

官方：[仓库](https://github.com/video-dev/hls.js)、[v1.7.3](https://github.com/video-dev/hls.js/releases/tag/v1.7.3)、[演示](https://hlsjs.video-dev.org/demo/)。

## 2. 模型

```text
点击加载
    │
    ▼
Hls.isSupported ?
    ├─ 是 → attachMedia → MEDIA_ATTACHED → loadSource
    │         ERROR fatal → destroy，停止
    └─ 否 → 原生 m3u8 或明确失败
    │
    ▼
用户再点 <video> 的播放
```

`enableWorker: false` 是本示例的选择，用来减少一条 Worker 线程的变量。不要在文档里写成「1.7.3 不能开 Worker」。生产若打开 Worker，要单独看 CSP 的 `worker-src`。那不是当前文件的行为。

generation 用来丢掉过期回调。fatal 之后必须新建 `Hls`，不能对已 destroy 的实例 `startLoad`。

## 3. 三层

在 Library Lab 打开 E17 再运行。确认网络面板仍然安静，然后才点加载。

### 基本

点击后状态变为等待清单。成功时说明层数，并提醒播放按钮还没代按。失败时是 CORS、网络或解码错误的原文，不是假的「播放成功」。

### 业务

清单解析后可以选择自动或某一层。选择框在没有实例时禁用。切换是否真的换了码率，要看播放中的带宽，本指南不写已测。

### 进阶

fatal 之后再点加载，会走新的 `new Hls`。停止按钮走 `stop()`。不要期待库自己无限恢复。

## 4. 反例（带代码）

### 反例 1：effect 里自动 loadSource

```tsx
useEffect(() => {
  const hls = new Hls()
  hls.loadSource(TEST_HLS)
  hls.attachMedia(video)
}, [])
```

这会在打开 Demo 时访问 Mux。Lab 禁止这种挂载。地址可以出现在源码里，请求必须来自按钮。

### 反例 2：把测试流写进隐藏脚本或标签

```html
<script src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"></script>
```

清单不是脚本。也不要预加载 link。opt-in 就是按钮。

### 反例 3：fatal 后立刻递归 startLoad

```ts
if (err.fatal) hls.startLoad()
```

Lab 销毁实例并停住。再次播放由用户点「加载」。

### 反例 4：每个渲染 new Hls

实例放在 ref 里，创建在 `load` 函数里。渲染只读状态。

### 反例 5：两个引擎

```tsx
<Video src={TEST_HLS} />
hls.attachMedia(videoElement)
```

一个元素一个 MSE 所有者。E16 与 E17 分开挂载。

### 反例 6：忽略 generation

慢的 `MANIFEST_PARSED` 在用户已点停止后仍 `setQualities`。回调第一行比较 `run !== generation.current`。

### 反例 7：自动 `video.play()`

没有用户手势时浏览器会拒绝，也会在不该出声时出声。Lab 不调用 `play()`。

### 反例 8：用演示流当生产片源

Mux 的测试流是公开示例，不是你们的内容授权，也可能不可用。失败要显示，不能换成另一段静默视频假装成功。

## 5. 安全与性能

请求离开本站，发往 `test-streams.mux.dev`。不要在适配器里附带 Cookie 或业务头。本文件使用默认加载，没有自定义 `xhrSetup`。

`maxBufferLength: 12` 是演示用的缓冲上限，不是全站推荐值。缓冲、延迟和内存要用真实码率测量，不要抄成 SLA。

CORS 失败是预期中的可见错误之一。不要通过代理去「修」演示而绕过浏览器的跨源规则，除非产品有自己的同源清单。

可访问性依赖原生 `controls`。皮肤不在这里。

## 6. 升级核对

- 锁定 1.7.3。不要用 1.6 的错误对象字段假设 `networkDetails` 的类型。
- 保持 `enableWorker: false`，除非单独做了 Worker 验收。
- 保持按钮触发。代码评审时搜索 `loadSource` 和 `TEST_HLS`，确认它们只出现在 `load` 的点击路径上。

## 7. 故障

| 现象 | 先看 |
| --- | --- |
| 一打开就有 m3u8 请求 | 是否把 load 放进了 effect |
| 状态停在等待清单 | 网络、CORS、混合内容 |
| 有清单但不能播 | 编码与浏览器。先读 error 事件 |
| 停止后码率还在增加 | generation 没有挡住回调 |
| fatal 后再点没反应 | 是否对已销毁实例调用方法。应重新 `new Hls` |
| 说明是原生 HLS | `Hls.isSupported()` 为假且 canPlayType 为真 |

## 8. 验收

1. 进入 Demo、不点击：没有对 `test-streams.mux.dev` 的请求。
2. 点击后才有清单请求，且播放仍要第二次手势。
3. 停止后请求不再往这个已销毁的实例上写状态。
4. fatal 不会自动打满重试。
5. 以上任何一条没有浏览器记录，就不能写通过。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E17 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目通过。公开测试流的一次成功也不等于生产 CDN 已验收。

## 9. 资料

- https://github.com/video-dev/hls.js
- https://github.com/video-dev/hls.js/releases/tag/v1.7.3
- https://github.com/video-dev/hls.js/blob/v1.7.3/docs/API.md
- https://hlsjs.video-dev.org/demo/
