# wavesurfer.js8：波形、媒体播放和实例所有权

需要听一段音频并定位、缩放查看波形时，可用wavesurfer.js8.0.3（实装package与固定LICENSE为BSD-3-Clause）。只播放不用波形时原生audio足够；视频用Video.js，HLS加载引擎与转码不是本库职责。本例没有麦克风、远程音乐、录音上传或第三方音频资产。

## 完整最小接入

已有React/TSX DOM项目执行`pnpm add wavesurfer.js@8.0.3`。复制example.tsx、wav.ts、wave-cleanup.mjs/.d.mts；demo.tsx仅Lab转发可省。渲染`<WaveformExample level="basic" />`，另支持business/advanced。ESM/TSX打包器使用Bundler解析，需要HTMLAudioElement、Web Audio解码、Blob/objectURL/fetch；无Provider/env/额外CSS、字体、账号或服务。波形Renderer使用自己的Shadow DOM/CSS，外壳保留105px最小高度。

wav.ts是完整原创PCM发生器：单声道、8000Hz、16bit little-endian、12800采样帧，WAV头描述1.6秒。前后频率不同并加简单包络，不是语音识别或生产音乐夹具。字节头与长度可由Node检查，**不能据此宣称浏览器已解码**。页面总时长来自真实ready(duration)事件，播放位置来自真实timeupdate，不硬编码1.60当运行输出。

```ts
const url = URL.createObjectURL(makeLabWave())
const wave = WaveSurfer.create({container, backend:'MediaElement', height:100, normalize:false})
const off = wave.on('ready', duration => {/* 真实解码时长 */})
await wave.load(url)
// 清理：off(); wave.destroy(); URL.revokeObjectURL(url)
```

## SDK、原生媒体和Web Audio的分工

本例显式backend:'MediaElement'，SDK拥有内部HTMLAudioElement播放；解析波形会fetch本地blob并调用Web Audio decodeAudioData，不是播放也用了WebAudio backend。实装decoder为每次解码创建AudioContext并finally.close；已开始的decodeAudioData不保证可物理中断。getMediaElement在MediaElement返回native media，v8 WebAudio backend返回null，不能把两种类型混为一谈。

normalize:false避免把演示振幅归一化，不等于响度测量。波形不是FFT/语音识别结果，未计算LUFS。没有预计算peaks；小fixture不代表大文件CPU/内存成本已优化。

## 三个独立目标

### 基础：真实解码与播放

启动后状态由创建/加载转为ready，波形canvas出现，显示实际duration。点击播放，真实native媒体驱动timeupdate增长；暂停与finish改变按钮状态。播放Promise拒绝时显示错误，回调确认ref仍为本实例，避免旧会话错误覆盖新页。自动播放限制仍由浏览器处理，不自动调用播放绕过用户手势。

### 业务：定位片段

ready后“跳到0.8秒”调用setTime(min(0.8,getDuration()))，位置立即更新，播放从中间继续。这是位置操作，不是裁剪/导出片段，也没有区域插件或字幕。听感/设备输出需真实浏览器，不用WAV字节计数冒充。

### 进阶：速率与可观察的波形缩放

1/1.5倍调用真实setPlaybackRate；显示选择值之外还要在浏览器确认native playbackRate。放大使用zoom(max(1200, 容器宽×2/真实时长))，参数是最小像素/秒：至少1200px/s且总宽至少两倍容器，可横向滚动；zoom(0)恢复适配。旧120px/s对短样本通常小于容器、视觉不变，已修正。缩放不生成新音频，也不改变时长。

## 生命周期与错误边界

每个key=level会话拥有WaveSurfer、订阅与本次blobURL。ready/timeupdate/play/pause/finish/error各自on返回off，cleanup先alive=false、清ref，再wave-cleanup逐个off、destroy，finally revoke自己的URL。某个off或destroy异常也继续URL释放；不会全局清其他音频。构造失败时同样撤销已经创建的URL并报错。

v8 destroy是终态，内部scope销毁中止仍在进行的fetch、卸载renderer、清decodedData和监听；默认自有Player执行pause/remove src/load/remove。复用外部media的所有权规则不同，本例未传外部media。不要把DOM消失、revoke或取消fetch当成所有音频资源均已验收。

load只忽略AbortError，其余错误显示；alive抑制卸载后回写，但这不是中止已开始解码。无自建timer/Worker/Storage；SDK内部任务由destroy管理。按钮ready前禁用，destroy后必须create新实例，不能旧对象重新load。

## 来源与验证范围

Node只执行原创WAV字节/清理控制流policy，不实例化音频SDK/AudioContext。主控浏览器提案将验证ready实际时长、canvas、真实播放currentTime、定位、native速率、波形宽度，以及外层真实audio pause/src/load和URL撤销/AudioContext关闭。提案包装原生方法并转发，不返回假播放结果；尚未执行不标SDK PASS。触摸、读屏、iOS编码/音频输出设备另验。

官方8.0.3固定commitf855c0ed1d535b94384e50d6ba335550db6ed2e2的README/LICENSE原字节保存，固定无中文README采用en。官网GET200但无Lab嵌入确认，unknown保留直达。响应证据、真实命令与六项分层见local-validation.md；正式verification无匹配receipt保持NOT_RUN。
