# Video.js v10 React：真实播放器、原创WebM与资源所有权

页面要播放新闻片头，同时提供统一控件、换源与本地文件入口。`@videojs/react@10.2.0`（Apache-2.0）提供React播放器/皮肤/媒体组件。它不是旧video.js@8的videojs()工厂；v8的插件对象与player.dispose不能直接套用。仅简单短片也可以原生video；HLS/MSE另选一个加载引擎，不要给同一个元素再挂两套。

播放器不生成媒体。本例用户点击后才由Canvas/MediaRecorder生成原创WebM，或者显式选择本地MP4/WebM。没有自动远程src、HLS、摄像头/麦克风、上传、DRM或字幕服务。由本例生成的图形不是第三方影片。

## 完整迁入与实装API

已有React/ReactDOM18或19、TypeScript>=5的DOM浏览器项目：

```sh
pnpm add @videojs/react@10.2.0
```

复制example.tsx、clip.ts、video-file-policy.mjs/.d.mts、media-cleanup.mjs/.d.mts，保持相对目录；demo.tsx仅Lab转发可省。ESM/TSX打包器使用ESNext模块与Bundler解析，保留 `@videojs/react/video/skin.css`。无需env、Provider、账号、远程字体或Lab内部模块；VideoPlayer已提供自己的播放器context。本例不提供SSR媒体捕获接线。

```tsx
import {VideoPlayer, VideoSkin, Video} from '@videojs/react/video'
import '@videojs/react/video/skin.css'
<VideoPlayer>
  <VideoSkin>
    <Video src={ownedBlobURL} playsInline preload="metadata" />
  </VideoSkin>
</VideoPlayer>
```

实装随包docs/README.md与reference/components/video.md说明：Video转发native属性/事件，ref是真正HTMLVideoElement；它在Player中自动注册媒体，外部单独用则是原生video。VideoPlayer有标准video功能，VideoSkin提供自定义控件，不把它误写成只有原生controls。包docs/guides/typescript.md要求TS5+和正确package exports解析。内置可选HLS/第三方适配器不等于本例已加载它们。

## 基础：媒体产物与播放分开看

点击制作，clip.ts画320×180图形、captureStream(12)，每80ms更新画面，尝试浏览器支持的WebM/VP8或WebM。1450ms后请求停止，收集真正MediaRecorder chunks为Blob；这不是Base64预制片或摄像头输入。录制调度约1.45秒不保证容器duration字段恰好1.45（WebM元数据可能不同）。

没有MediaRecorder/Canvas捕获/WebM编码时显示明确失败，并建议advanced选择本地文件。5秒watchdog处理没有正常stop的录制；成功、失败、abort均清stop/watchdog/ticker、解绑录制回调、尝试stop并结束所有captureStream tracks。不把“录制成功”当成浏览器已解码播放。

Blob生成后才createObjectURL并挂播放器，状态先显示等待解码；实际loadedmetadata才显示原生videoWidth/videoHeight与readyState。真实播放器错误事件显示解码失败code，不假装文件头通过就可以播放。本地浏览器已点击真实 Play 控件并观察 currentTime 增长。

## 业务：换源与旧播放器退役

浅/深两种Canvas片头生成不同Blob。新URL让 `key={url}` 重挂整个VideoPlayer，旧原生video通过稳定ref清理：pause→removeAttribute('src')→load，停止使用旧源；这不是虚构v8 dispose。每一步独立尝试，即便pause异常仍尝试释放src/load，helper返回诊断，不在卸载后setState。

旧URL先放retiredUrls，等React提交新播放器或移除后才revoke；不是create完马上revoke，也不是在还渲染旧播放器时先撤销。URL回收不等于原生媒体已停止，所以两项都做。用户可检查外层保留的旧video已detached、paused、src为空、readyState收敛0，以及对应旧URL实际revoke。Video.js内部store/media attach/detach仍由包管理，本例没有声称遍历内部所有监听或测得泄漏数字。

## 进阶：本地导入与代次隔离

File先过同源video-file-policy：MIME只接受video/mp4或video/webm，12字节到8MiB（含上下限），再仅读前32字节。MP4检查offset4..7为ftyp，WebM检查开头EBML魔数；两者只是明显伪装筛选，不是完整容器解析/解码器/安全扫描。只看到ftyp的12字节垃圾也能通过头检查，后续仍可能真实解码失败。MP4不同编码组合/iOS兼容不是这层策略的保证。

校验后才把整个原File交给objectURL，不上传。非法文件不创建新URL；如果已有可播放素材，保留原播放器，而不是宣称所有错误都会让播放器消失。file input清空自身值允许再次选择同一文件。

录制和arrayBuffer读取都有generation代次。新录制/导入/移除/卸载使旧代次失效，过期Blob或文件头读取结果不能createURL或回写状态。导入会abort旧录制；移除按钮也可在busy时取消，按钮禁用不是唯一竞态防线。切level的Session key重建，不能跨场景复用旧媒体。

## 清理与证据边界

录制fixture的stop/track ended，不是播放器destroy；原生video pause/src/load，不是录制轨道证明；URL revoke也不是DOM卸载。三类资源分别观察。整个Session卸载递增generation、abort录制并收回current/retired URL；子Video ref在提交卸载阶段先释放原生源。没有全局URL清空，也不关别的页面媒体。

随包React源码确认Video转发ref，Player通过store attach/detach和useDestroy管理自身生命周期；不在本例调用旧版videojs()。Chrome上Canvas/MediaRecorder、实际WebM解码、皮肤Play/键盘及所有回收都需DOM环境，没有Node媒体SDK冒充验收。

validation/browser.spec.ts保存给主控的操作/外层probe：真实320×180 WebM与Play/currentTime；浅/深替换旧video原生状态和URL；复用原创Blob为合法本地File、非法头保留旧媒体；remove收回本例URL；录制中remove和host卸载，外部记录真正tracks/MediaRecorder状态。probe只包装调用并转发原native API，不返回假播放结果。原生iOS/移动端、完整MP4编码矩阵/辅助技术另行测试。

## 生产迁移与官方来源

自有媒体要规划URL授权、字幕、错误恢复、带宽与编码矩阵。HLS适配用包对应组件或E17一种引擎；转码用E19，不能把32字节检查当转码。SSR阅读页与客户端播放器分开设计。源码中的原创Canvas clip和策略是教学fixture，不等于真实流媒体服务。

官方README选固定@videojs/react10.2.0提交的packages/react/README.md（对应实际包，不用旧v8根介绍替代），MIT旧代资料不覆盖本包Apache-2.0。固定树无官方中文对应README则en；首页实际响应头另存，未确认Lab-origin嵌入时unknown。版本/许可、原始命令日志和六项状态见local-validation.md；正式verification仍NOT_RUN。
