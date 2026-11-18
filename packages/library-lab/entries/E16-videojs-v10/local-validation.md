# 2026-11-18 主控闭环补充

六项本地质量PASS。策略6与六文件strict迁入通过，非作者实际API/cleanup新consumer复核见独立报告；浏览器3项含来源：原创WebM真实320×180解码、皮肤Play后currentTime增长、light/dark换源旧video paused/src空/readyState0且URLrevoke、本地导入和非法header保旧视频；remove与host卸载实际active captureStream轨道ended、recorder inactive、stop计数2无新URL。录制轨道证据与播放器原生媒体清理分开。候选32及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E16.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E16 @videojs/react 本地质量复核（2026-11-18）

独占E16，仅条目目录与证据；先落NOT_RUN再整改。已读实装10.2.0 bundled docs和Video/Player接线。无shared/依赖锁/e2e/队列/生成/build/fulltypecheck/commit修改。没有新增Node DOM/媒体环境，也没有真实播放器SDK或媒体录制执行；策略/编译不当SDK。正式sdk/build/browser仍NOT_RUN。

|六项|状态/证据层级|证据与边界|
|---|---|---|
|技术准确|PASS：实装docs/源码/类型+policy|@videojs/react10.2.0/Apache2、VideoPlayer/VideoSkin/Video导出、Video native ref/事件、store attach/detach据实装。fixture/播放器/文件策略分清；policy6/6。真实播放/解码未执行。|
|解释清楚|PASS：正文/源码对照|v8/v10代际、原创录制不是播放器、容器头不是decoder、源切换代次、三类清理与异常范围、完整安装/文件/配置均明确。|
|Demo有用|NOT_RUN：真实媒体/DOM待主控|basic真正Canvas→WebM→Video皮肤；business浅深换源/旧源退役；advanced文件与abort/释放。浏览器proposal由主控已写真实操作，本目录保存快照并加旧native状态断言；未执行。|
|源码可迁移|PASS：复制源严格编译|6必要文件example.tsx/clip.ts/video-file-policy.mjs/.d.mts/media-cleanup.mjs/.d.mts，demo可省。完整依赖/CSS/React18或19/TS5/Bundler/DOM说明；无账号/env/Provider/服务。隔离consumer编译exit0。|
|官方来源可靠|PASS：固定原文/实装字段/HTTP|固定@videojs/react10.2.0→1042afd430d4d661606a71abf98a3ca87c2fb6be，对应packages/react/README.md原字节；固定LICENSE Apache2与安装包一致，树无中文对应README。主页实际GET200但未Lab嵌入确认unknown。|
|结果可复核|NOT_RUN：policy/compiler完成、SDK/browser未执行|原argv/cwd/exit/raw日志齐；policy6/6、Biome12files、隔离编译、官方合同通过。真实WebM/播放器控件/轨道及URL回收由主控候选执行，无伪造SDK/receipt PASS。|

## 实际命令与原始日志

cwd `/home/lambert/githubRepos/lambert/ReactLoom`，validation/*-command.json记录精确argv/cwd/exitCode/UTC时间；*.log为真实合并stdout/stderr，不是verify:record收据。

- `node --test packages/library-lab/entries/E16-videojs-v10/examples/video-file-policy.test.mjs packages/library-lab/entries/E16-videojs-v10/examples/media-cleanup.test.mjs`：exit0，6tests/6pass/0skip，policy.log。文件metadata/header/边界4项，native API double控制流2项。没有真实解码/SDK调用。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/E16-videojs-v10/examples entries/E16-videojs-v10/library.json entries/E16-videojs-v10/verification.json entries/E16-videojs-v10/validation/browser.spec.ts`：最终exit0，12files，无诊断，biome-final.log。
- `pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e16-portable-396o6um1/tsconfig.json`：最终exit0，无诊断，portable-typecheck-final.log。复制6运行/类型文件+proposal，独立React consumer，ES2022/ESNext/Bundler/react-jsx/strict，Vite CSS+Node（仅Playwright proposal需Buffer）类型；使用既有依赖symlink，无新install/全workspace typecheck。
- `node --input-type=module -`：exit0，official-metadata.log；command.json含stdin，实际validateOfficialSources返回[]，原文SHA匹配metadata。

首次Biome发现forEach返回值及URL effect仅隐式依赖url，保留biome.log；用块体stop与显式保护不revoke当前url修正，最终通过。首次隔离编译只因包含Playwright proposal而临时types列表缺Node/Buffer，保留portable-typecheck.log及node-types日志；补proposal显式node:buffer导入与临时Node类型，最终通过，不是新增运行时依赖/API修补。未重复无关全套测试。

## 资源与错误修复

- 原创clip保留320×180 Canvas/MediaRecorder路径，不请求设备或远程素材。补pre-aborted早拒绝和5秒watchdog；成功/失败/abort最终清stop/watchdog/ticker/abort/recorder回调、停止仍活动recorder及全部captureStream tracks。定时器受浏览器调度影响，不是实时截止承诺。
- player key由url控制重挂。新增LocalPlayer稳定ref及共享releaseNativeMedia，真实HTMLVideoElement脱离时pause→remove src→load，每步异常不阻断后续。父层在提交后revoke退役URL，unmount revoke current/retired，避免只凭DOM移除或只revoke就声称媒体停止。
- native loadedmetadata才显示实际尺寸/readyState（沿用“已加载本地素材”文本但不在Blob刚生成时假称解码成功）；原生error显示code和容器头不等于可播。生成URL初期明确等待解码。
- 文件MIME/size/前32bytes共享原policy；8MiB边界及仅ftyp也可能是垃圾有纯策略反例。非法文件不创建新URL，保留旧播放器，修正原文“错误就无播放器”过度结论。generation防旧录制/arrayBuffer回写；remove可中止busy录制。
- Video.js bundled reference/components/video.md明确ref是native video，create-player有media attach/detach/useDestroy；没有调用v8 videojs()/dispose。录制轨道、native媒体、objectURL三类证据分开，不宣称全部内部SDK监听已观测销毁。

## 官方来源与许可

- 已实际读取安装@videojs/react package.json10.2.0/Apache-2.0及exports/@videojs/react/video、skin.css；peerReact/DOM18或19；随包docs/README、guides/installation.md、typescript.md、reference/components/video.md与编译源码已核对。文档中的npx安装skill/CLI提示仅资料，未执行。
- `git ls-remote https://github.com/videojs/video.js.git 'refs/tags/*10.2.0*'` exit0，@videojs/react@10.2.0对应1042afd430d4d661606a71abf98a3ca87c2fb6be（多包同发布commit）。
- Python urllib实际GET固定tree/packages/react/README.md/根LICENSE，exit0；官方原文/树/来源选择记录保存official。没有官方中文对应README则en，不把v8根介绍替代React包原文。README SHA256 `e2d3d53a2e3549976969d84c33b9437e3c873f249c296aafd83952a796af4663`。
- `curl -fsSL -D packages/library-lab/entries/E16-videojs-v10/official/homepage-headers.txt -o /dev/null https://videojs.org/`：实际响应保存；HTTP200但未Lab-origin内容确认，unknown，不推allowed。

## 交棒与独立复核重点

主控已有e2e/quality-resume-videojs.spec.ts真实操作；本目录validation/browser.spec.ts保存proposal快照，额外检查旧video.paused=true/src=null/readyState0，而非只DOM detached。两例覆盖原创WebM320×180 decode+真实Play/currentTime、light/dark替换及URL、原创Blob复用File、非法头保留旧媒体/remove回收；外层捕获真实Canvas capture tracks/MediaRecorder.start，对录制中remove与host卸载断言tracks ended/recorder inactive/stop计数且无URL。probe转发实际原生方法，不mock播放器结果。当前均未由本作者运行。

独立review请关注clip settle/timeout/abort及最终轨道、generation/退役URL提交顺序、稳定native ref cleanup和SDK媒体attach范围、header不代表codec、6文件迁入/skin CSS/官方package README。移动/iOS/真实MP4编码矩阵/辅助技术仍NOT_RUN。作者STABLE停写后由非作者与主控候选闭环，正式verification状态不变。
