# E18 wavesurfer.js — 工程手册

## 适用

播放本地或已授权音频并显示波形、定位和倍速。视频用 E16。HLS 用 E17。转码用 E19。不需要波形时用原生 audio。

## 版本

`wavesurfer.js@8.0.3`，BSD-3-Clause。`WaveSurfer.create` 后 `load` 一个由 `makeLabWave` 生成的 1.6 秒 8 kHz WAV。`normalize` 为 false。

## 迁移

复制 effect 里的 create、事件退订、`destroy` 和 `revokeObjectURL`。`examples/demo.tsx` 只是再导出。`playPause` 必须 catch，并确认 ref 仍是该实例。产品换音频时新建实例，不要在已销毁对象上 `load`。时长标签要和真实 PCM 一致。

## 不可删的清理

`on` 返回的函数在清理时全部调用。然后 `destroy()`，再 revoke 本次 URL。`alive` 防止 ready 回调在卸载后 setState。`key={level}` 保证倍速和缩放不留在下一层。AbortError 只忽略中止，不忽略解码失败。

## 反例

- 创建后不 destroy。
- destroy 之后继续 play 或 load。
- 渲染路径里 create。
- 不处理 play 的拒绝。
- 空 catch 掉所有 load 错误。
- 默认加载远程 mp3。
- 用 innerHTML 写曲目标题。
- 打开 normalize 后把振幅当成响度测量。

## 测试断言

- 生成的 Blob 类型是 `audio/wav`，时长逻辑对应 1.6 秒、8000 Hz。
- 浏览器：无远程音频请求；播放与暂停一致；离开后无声且 URL 已 revoke。
- 跳转不超过 `getDuration()`。
- 没有收据就不要写解码器兼容性 PASS。

## 真实限制

样本是合成音，不是语音识别夹具。没有 peaks 预计算，没有麦克风，没有区域插件。zoom 和倍速没有跨浏览器收据。v8 destroy 不可逆。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E18 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。

资料：https://github.com/katspaugh/wavesurfer.js 。
