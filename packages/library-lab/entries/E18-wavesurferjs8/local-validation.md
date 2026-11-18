# 2026-11-18 主控闭环补充

六项本地质量PASS。policy2/四文件strict迁入与非作者consumer通过，不当Node音频SDK。浏览器3项含来源：真实WAV1.60s/波形Canvas/播放暂停、0.8s定位、native playbackRate1.5、scrollWidth实际放大和恢复；换层/卸载所有audio pause/remove-src/load、owned URLs回收、decoder AudioContexts关闭，无外网音频。受控held blob loader观察真实SDK AbortSignal在卸载abort并回收URL，不声称物理终止在途decode。候选33及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E18.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E18 本地质量整改

只E18目录，无shared/依赖锁/队列结果/e2e/生成/build/fulltypecheck/commit。真实wavesurfer8.0.3，原创WAV，不用远程音频/麦克风。实际DOM SDK由主控浏览器执行，不装Node音频平台。

| 六项 | 状态 / 层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS：实装API/实现与policy；SDK NOT_RUN | 实装8.0.3/BSD3、MediaElement默认Player/native清理、decoder AudioContext finally.close、destroy内部scope abort据源码。ready duration替代写死1.60；zoom按容器宽/真实时长至少2倍，不再短样本zoom120无变化。 |
| 解释清楚 | PASS：静态自检 | 区分PCM头/真实decode、native播放/WebAudio解析、三个目标、库scope abort/不能中断已开始decode、URL所有权，完整4文件迁入。 |
| Demo有用 | NOT_RUN：browser待主控 | 基础真实波形/播放，业务seek0.8，进阶native倍速与可见zoom；提案外层audio/WebAudio/URL及held fetch signal观察，未执行。 |
| 源码可迁移 | PASS：隔离strict与静态 | example.tsx/wav.ts/wave-cleanup.mjs/.d.mts全列sourceFiles；精确依赖/React TSX ESM DOM/WebAudio/BlobURL前提、Shadow CSS/容器高度、无Provider/env/服务，隔离编译exit0。 |
| 官方来源可靠 | PASS：固定原字节/实际包/响应 | tag8.0.3→commitf855c0ed1d535b94384e50d6ba335550db6ed2e2 README/LICENSE原字节，实装BSD-3-Clause；固定树无中文README en回退；首页GET200未Lab嵌入确认unknown。 |
| 结果可复核 | NOT_RUN：policy/类型已记证，DOM未跑 | policy2/SDK0明确，原始argv/cwd/exit/log齐；浏览器解码/播放/速率/seek/zoom/清理须主控真实执行，formal各项仍NOT_RUN。 |

## 实际定向检查

cwd `/home/lambert/githubRepos/lambert/ReactLoom`；validation/commands.json保存argv/cwd/exitCode/UTC/log：

- `node --test packages/library-lab/entries/E18-wavesurferjs8/tests/policy.test.mjs` exit0，2纯policy，validation/policy.log。WAV RIFF/WAVE/PCM1channel/16bit/8000Hz/12800frame/data-size/非零采样检查；releaseWave异常控制流double确保off后destroy且finallyrevoke。它们不是音频decoder或SDK运行。
- package scoped Biome check/write examples/tests/browser/metadata/verification：exit0，初始格式化与3个模板字符串信息保留biome.log；等义修正后最终exit0无信息，biome-final.log。
- 4必需原件+browser proposal复制自有tmp，ESNext/Bundler/react-jsx/strict/ES2022DOM，`pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e18-portable-…/tsconfig.json` exit0，无诊断，portable-types.log；现有依赖symlink，无安装、无全workspace检查，tmp定向清理。
- 安装package8.0.3/BSD3实际字段、dist/wavesurfer.d.ts、player.js/decoder.js/wavesurfer.js实际源码核对：getMediaElement的WebAudio null边界、默认自有audio pause去src/load/remove、destroy终态/scope abort/清decodedData、decoder finally AudioContext.close均据源码。
- 官方GitHub tag/tree/raw README+LICENSE与官网真实GET保存official/source-evidence.json，固定原文与metadata合同/hash另有validation/official-contract.log。

## 核心整改与资源边界

页面总时长来自ready事件，WAV12800frames/8000Hz=1.6仅作为fixture设计，不能当解码成功。位置来自timeupdate，播放Promise失败比对当前实例；未ready禁控件。明确MediaElement backend播放与WebAudio解析不同，默认自有内部媒体由SDK销毁，不传外部media。

zoom原120px/s×1.6只有192px，通常小于容器，不会可见放大；改max(1200,容器宽×2/真实时长)，总宽至少2倍容器。浏览器直接比较part=scroll的scrollWidth/clientWidth，再zoom0恢复，不只检查控件文案。

构造失败后revoke本例URL。清理alive=false/清ref，releaseWave逐一off/destroy/finallyrevoke；异常不跳过自有URL释放。库destroy中止scope fetch，但已开始decodeAudioData无物理取消保证，迟到Promise被alive抑制。库decoder最终close自身AudioContext，未做假音频结果。

## 主控浏览器交棒

validation/browser.spec.ts两例：

1. 真ready duration1.60、canvas存在、native currentTime播放增长、暂停；business定位0.80；advanced实际native playbackRate1.5、可见横向zoom并恢复。外层包装document.createElement(audio)、native pause/remove-src/load和URL创建回收、AudioContext.close，保留实际媒体句柄；卸载后每个自有audio paused/src空且调用序列完整，全部URL回收/context关闭。探针转发实际原生方法，不返回假播放结果，不以DOM消失替代清理。
2. 受控hold本地blob fetch，用SDK传入的真实AbortSignal在卸载后reject，验证destroy scope abort。这个注入只证明取消接线，不是已执行原生网络或取消WebAudio解析；真实fetch/decode行为由第一例提供。无远程请求/麦克风。

作者未执行共享browser；真实触摸/读屏/移动Safari/音频设备兼容仍未验，policy/strict不是DOM PASS。STABLE后停写交非作者/主控；formal sdk/build/browser保持NOT_RUN。
