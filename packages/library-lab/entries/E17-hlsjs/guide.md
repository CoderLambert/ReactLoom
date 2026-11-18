# hls.js：用户触发清单请求，再观察MSE与清理

已有HLS直播/点播，要在支持MediaSource Extensions的浏览器读取清单、选择画质和处理错误，可以用hls.js。它负责HLS分片传输/MSE缓冲，不提供皮肤、转码、DRM授权或片源版权。单个MP4先用原生video；完整播放器UI另选组件，不要把两个引擎绑定同一个video。

此例固定hls.js1.7.3，安装包和固定README/LICENSE为Apache-2.0。清单是官方README明确使用的Mux公开测试地址：`https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`。公开示例不等于生产可用性或视频再分发许可；不下载/存储视频文件，不换付费源，不做代理绕过CORS。

## 用户意图与真实请求

打开本条Demo没有src/loadSource，不访问Mux；点击“加载公开HLS测试流（外部请求）”才创建引擎并请求。该按钮可能拉取主清单、变体、音频与分片并预缓冲，不能误说只有点击播放才发分片。没有自动play；用户需要原生controls操作才能开始可见播放，加载/解析清单不是解码播放成功。

`Hls.isSupported()`走MSE分支，new Hls({enableWorker:false,maxBufferLength:12})→attachMedia→MEDIA_ATTACHED后loadSource→MANIFEST_PARSED显示真实levels。不支持MSE但canPlayType(m3u8)为真时，同一个URL交给video.src与load，明确显示原生HLS模式；能力提示不保证编码可播放。两者都不支持则零请求并显示未运行。

Worker在本例明确关闭；不把它写成销毁过Worker、hls.js不能开Worker或已验Worker CSP。maxBufferLength12是本例前向缓冲目标的一部分，受码率/字节等其它参数影响，不是12秒绝对内存/缓冲硬上限。

## 三个不同实验

### 1. 真实公开清单

basic开始是未加载；点击后如网络/CORS允许，状态显示“已读取真实HLS清单（n层）”。否则保留实际type/details或浏览器media错误。不要用本地fixture清单成功代替公网成功，也不要把SDK可导入当MSE/解码证明。

### 2. 请求画质与实际事件

business清单成功后列出实际index/height/bitrate。-1设置currentLevel=-1自动；固定index必须是当前hls.levels中的整数。当前选择表示请求的画质，不保证立刻显示该层；SDK LEVEL_SWITCHED才更新“已切换层”。播放、带宽与缓冲影响实际结果，不伪造已切换码率或ABR评测。

### 3. 可重试fatal与所有权

advanced额外有“本地诊断会话（不拉清单）”：真实new Hls/attachMedia连接本地MSE，但不loadSource、不请求Mux。“注入本地fatal（非网络测试）”调用真实Hls.trigger(ERROR)，仅检验SDK事件总线和本例fatal清理，不是外部网络、解码或真实流失败。状态明确本地注入；fatal后再点诊断或公开加载才创建新实例。

真实网络错误另测：浏览器route.abort主清单会使真实SDK走网络错误分支，但这是受控拦截，不代表外部endpoint故障。实装默认manifest errorRetry最多1次、延迟1000ms；timeout最多2次且每次加载上限20000ms。此例没有覆盖默认retry配置，因此“不无限自动重建实例”不等“SDK根本不重试”。playlist/fragment策略更长，不能套主清单15秒测试边界。

## 停止、fatal与卸载

每次load先停止旧会话；stop/fatal/unmount递增generation、清hlsRef，再调用真实engine.destroy。回调同时检查generation与引擎身份，旧MANIFEST/ERROR/LEVEL事件不能回写。fatal清层列表和选择，停止原生media.onerror、pause、removeAttribute(src)、load重置元素，不在已destroy实例上startLoad。

media-policy.mjs是UI唯一清理与质量索引策略；disposePlayback用finally保证destroy抛错时仍尝试清video。组件effect捕获本次video再返回cleanup，避免卸载时ref已置null而漏pause/src/load。Hls自身管理MSE对象URL/缓冲，不由本例全局revoke。真实DESTROYING回调仅向该video转发reactloom-e17-destroying教学DOM事件，供外部观察；不是dispose自己伪造销毁成功，也不成为SDK标准API。

本例没有Worker、业务连接或自行注册的全局监听。Hls.destroy按实装实现解除内部订阅/停止加载/分离媒体，真实网络收敛/MediaSource关闭仍须浏览器观察，不以组件消失代证。原生分支没有hls实例/质量API，仍显式清video。网络已发出不保证远端停止传输或没有在途响应。

## 完整迁入

已有React/TSX浏览器项目执行`pnpm add hls.js@1.7.3`，复制example.tsx和media-policy.mjs/.d.mts，保持相对路径；demo.tsx只Lab适配可省。渲染`<HlsExample level="business" />`，也支持basic/advanced。需要ReactDOM、TS bundler/DOM、MSE及相容codec或原生HLS、HTTPS/CORS/CSP媒体与连接许可。组件已有原生controls与布局，无Provider/env/CSS插件/账号。无caption轨/字幕选择/读屏验收，不用空track伪装字幕支持。

生产必须替换为自己有权提供的片源并明确凭据/CORS/缓存/媒体预算；本例没有自定义业务头、代理、上传、DRM、字幕UI或自动重连策略。保留显式外部按钮与cleanup/key=level，不把公开测试流当生产片源。Worker生产开启需另测worker-src与资源生命周期，不能由当前关闭分支推定。

## 官方来源与验收边界

v1.7.3 annotated tag解析固定commite5ff3583965e3af16c4a4b4d2b5f7bd1ffb5b7de。原README字节与LICENSE保存；README第392/424行包含同一Mux地址，来源可追溯。固定树无中文README，保留英文en。源仓库root package没有version字段，安装发行包实际1.7.3；没有编造上游缺失字段。官网Demo curl GET200无明确嵌入限制，但未Lab origin内容确认，unknown直达；urllib403也留取证经过。

Node3项仅清理double/索引策略，真实hls.js媒体SDK未运行。隔离类型编译不证明MSE/网络。浏览器提案分别标EXTERNAL公网清单、CONTROLLED本地fatal事件、CONTROLLED路由失败，不把三者混算。公开清单成功仍不证明帧解码或实际码率切换；准确命令/日志和六项状态见local-validation.md，formal verification保持NOT_RUN。
