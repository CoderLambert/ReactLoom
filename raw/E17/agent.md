# E17 hls.js工程复用

固定1.7.3 Apache-2.0。MSE引擎，不做转码/皮肤/DRM。安装后复制example.tsx、media-policy.mjs/.d.mts，demo仅适配。ReactDOM/TS bundler、MSE+codec或nativeHLS/CORS/CSP许可，无Provider/env/CSS/账号。公开测试源来自固定官方README392/424行；明确用户按钮才联网，可能清单+变体/分片预缓冲，不下载存储视频或假设版权授权。

basic opt-in清单；business currentLevel请求与LEVEL_SWITCHED实际事件区别；advanced真实诊断MSE会话无loadSource，SDK.trigger fatal仅事件总线/自建清理，不算公网失败。原生分支不提供hls.js画质/诊断。

enableWorker:false，不能称销毁Worker；maxBufferLength12非绝对上限。保留默认SDK重试：主manifest错误retry1/1000ms、超时retry2/加载上限20000ms；不自动重建是应用策略，不等库没重试。不可无限递归startLoad、静默代理CORS、自动play。

stop/fatal/unmount作废generation和engine身份；destroy真实SDK后在finally clearMedia：onerror=null、pause、remove src、load。effect捕获video避免ref卸载先空。DESTROYING才转发该video的教学事件，非自建dispose假信号。清层列表/选择与旧回调屏蔽，重试new实例。Hls管理MSE URL；无全局revoke/不存在的Worker销毁。

Node3项只有policy/double，类型编译不代SDK。浏览器分别EXTERNAL清单、CONTROLLED fatal注入、CONTROLLED route abort，再观察真实destroy/MediaSource关闭/pause-src-load/请求收敛。native/帧解码/字幕/读屏人工或独立验收，当前formal各项NOT_RUN。

官方README/license原字节固定commit；发行包version1.7.3/root sourcepackage未给version，如实记录。官网无明确限制但未Lab确认unknown，urllib403/curl200取证分开保存。
