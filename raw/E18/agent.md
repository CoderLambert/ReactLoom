# E18 wavesurfer8 工程复用

8.0.3/BSD-3-Clause实装与固定LICENSE核对。波形播放/定位/速率缩放，非视频/HLS/转码/录音。已有React TSX DOM运行`pnpm add wavesurfer.js@8.0.3`；复制example.tsx、wav.ts、wave-cleanup.mjs/.d.mts；demo可省。Bundler，HTMLMediaElement/WebAudio decode/BlobURL/fetch，默认Shadow DOM样式，无Provider/env/CSS/账号/远程媒体。

完整原创WAV1.6s/8000Hz/mono16bit/12800帧，Node头检查不是浏览器decode。UI总时长必须来自ready参数，位置timeupdate，不能写死常量当运行结果。显式MediaElement backend内部native audio播放，波形WebAudio解码上下文finally.close，区别WebAudio播放backend的getMediaElement=null。

ready前禁按钮，playPause catch比对当前ref。业务setTime不超过getDuration；进阶setPlaybackRate与zoom(max(1200,容器宽×2/真实时长))（不是120，短音频否则无视觉变化），zoom0恢复。不是裁剪或新音频输出。

所有on返回off保留；cleanup alive=false/ref清空，再releaseWave逐个off/destroy/finallyrevoke自有URL。构造失败也revoke。v8 destroy终态，内部scope abort fetch、默认自有media pause去src/load，不能保证在途decodeAudioData物理取消。没有自有timer/Worker/storage或全局清理。

policy单列，不伪造Node音频SDK。browser需真实canvas/ready时长/Play位置/seek/rate/zoom和外部native/URL/AudioContext生命周期，不以DOM消失代destroy。官网unknown，固定原文/许可/header见official，formalNOT_RUN到匹配receipt。
