# E17 hls.js — 工程手册

## 适用

在支持 MSE 的浏览器里按用户意图播放 HLS。单个 MP4 用原生 video。v10 皮肤用 E16，且不要两个引擎绑同一个元素。

## 版本

`hls.js@1.7.3`，Apache-2.0。实例配置是 `enableWorker: false` 和 `maxBufferLength: 12`。测试清单是 `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`，只作为 opt-in 常量。

## 迁移

复制 `examples/example.tsx` 的按钮、`stop`、generation 和 fatal 销毁。`examples/demo.tsx` 只是再导出。`loadSource` 只能写在点击处理函数里，放在 `MEDIA_ATTACHED` 回调中。不要在 effect 里加载，不要加隐藏 script，不要自动 `video.play()`。

## 不可删的清理

`stop` 和卸载都要 `destroy`、暂停、移除 `src`、调用 media `load()`，并递增 generation。fatal 错误作废该次 generation 后销毁，不自动 `startLoad`。过期的 `MANIFEST_PARSED` 和 `ERROR` 不能 `setState`。质量 index 必须属于当前 levels。

## 反例

- `useEffect` 里 `loadSource(TEST_HLS)`。
- 用 script 或 prefetch 默默请求 Mux。
- fatal 后无限重试。
- 渲染期间 `new Hls()`。
- 与 Video.js 共享一个 video 元素。
- 忽略 generation。
- 挂载时 `play()`。
- 失败时换一段本地视频伪装成功。

## 测试断言

- 不点击则没有清单请求。
- 点击后才 `attachMedia` / `loadSource` 或原生 src。
- 不支持 MSE 且不支持原生 HLS 时零请求。
- fatal 后实例被销毁，再次播放是新的 `Hls`。
- 没有浏览器收据就不要写 ABR 或 CORS 已通过。

## 真实限制

Worker 关闭。缓冲 12 秒只为演示。没有字幕 UI，没有 DRM，没有自动播放。测试流不代表生产片源。`canPlayType` 不是解码保证。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E17 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。

资料：https://github.com/video-dev/hls.js/releases/tag/v1.7.3 。
