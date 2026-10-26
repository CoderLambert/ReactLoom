# E18 wavesurfer.js — Agent 实践手册

## 选择条件
需要波形、进度与播放位置，用 `wavesurfer.js@8.0.3`；不是HLS解码、转码或音频后期软件。v8 BSD-3-Clause，校验目标运行环境和是否允许WebAudio/MediaElement。

## 拷贝范围
复用 `examples/example.tsx` 的WaveSurfer实例生命周期模式：ref、effect、ready/timeupdate监听、destroy/revoke。测试源 `examples/wav.ts` 仅用于原创fixture，产品可替换为受许可且CORS有效的audio URL。宿主DemoHost不要复制。

## 禁止的反模式
每次React rerender调用create；destroy之后继续load；URL对象不回收；将load的AbortError当真实服务器失败；播放状态仅靠按钮文案；未经用户动作自动播放含声音的媒体；读取不可信远程URL绕过CORS。

## 断言与复查
- 初始无自动播放、真实波形loaded后才能控制。
- ready与timeupdate必须来自WaveSurfer真实实例；跳转位置/倍速生效。
- 离开Tab旧音频停止并销毁；重进新建实例，Blob URL被回收。
- StrictMode多次挂载、快速切换、load被覆盖、移动端播放权限需真实Chromium/Android验证。
- Node目录单测不能代表SDK或浏览器验收；当前状态NOT_RUN/BLOCKED。

官方：<https://github.com/katspaugh/wavesurfer.js>
