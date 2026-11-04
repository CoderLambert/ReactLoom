# E16 Video.js v10 — 工程手册

## 适用

需要 Video.js 10 的 React 皮肤来播放浏览器里的 WebM 或 MP4。HLS 用 E17 且不要双引擎。波形用 E18。转码用 E19。不要把 v8 的 `videojs()` 教程贴进本文件。

## 版本

`@videojs/react@10.2.0`，Apache-2.0。组件路径 `@videojs/react/video`，样式 `@videojs/react/video/skin.css`。媒体由 `examples/clip.ts` 在用户点击后用 Canvas 和 MediaRecorder 生成。

## 迁移

复制显式按钮、generation、`key={url}` 和延后 revoke。本地文件必须先过 `validateVideoMetadata` 和 `validateVideoHeader`（前 32 字节，8MiB，mp4/webm）。`examples/demo.tsx` 只是再导出。不要在挂载时写远程 `src`。

## 不可删的清理

卸载时递增 generation、abort 录制、revoke 当前和退役 URL。换地址时把旧 URL 放进退役列表，在新 `url` 提交后再收回。新录制 abort 旧的控制器并停止轨道。过期 Blob 不能 `setUrl`。

## 反例

- `import videojs from 'video.js'` 与 v10 组件同时用。
- 未点击就请求 CDN 片源。
- `createObjectURL` 后立刻 revoke。
- 只信 MIME，不看文件头。
- `getUserMedia` 打开摄像头。
- 卸载不停 MediaRecorder。
- 同一 `<video>` 再 `attachMedia` 一个 Hls。
- 把「能播」写成所有移动浏览器已测。
- 在 `setUrl` 的同一轮同步 revoke 新地址。旧 URL 要等下一次提交。

## 测试断言

- 小于 12 字节、大于 8MiB、非 mp4/webm、头不匹配被拒绝。
- 浏览器：打开页面无媒体请求；录制或合法文件后才有播放器；非法文件没有 URL。
- policy 测试不是播放器 SDK PASS。MediaRecorder 缺失应显示错误而不是假成功。

## 真实限制

片长约 1.45 秒，分辨率 320×180。没有字幕、没有 DRM、没有 HLS。32 字节不是完整解复用。iOS 编码支持没有收据。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E16 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。

资料：https://videojs.org/docs/guides/installation/react 。
