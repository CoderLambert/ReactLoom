# 2026-11-18 主控闭环补充

六项本地质量PASS。policy3/三文件strict迁入与非作者实际API/defaultConfig/新consumer通过，非Node媒体SDK；浏览器4项含来源：公开真实清单+native键盘播放currentTime、画质0的真实LEVEL_SWITCHED及184p帧/低码率请求；stop实际DESTROYING、video paused/src空/readyState0、MediaSource closed及1500ms后无新请求。另显式SDK.trigger fatal诊断重建/卸载，route.abort真实loader网络fatal与新会话恢复，均分别标注控制条件。候选33及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E17.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E17 hls.js 本地质量证据（2026-11-18）

STABLE：仅E17目录，未改shared/pkg/lock/e2e/queue/results/生成，无build/fulltypecheck/browser/commit。未下载存储媒体分片，无代理/凭据/付费源。实装hls.js1.7.3；formal SDK/build/browser均NOT_RUN。

|六项|状态与层级|证据|
|---|---|---|
|技术准确|静态/类型/policy PASS；真实SDK NOT_RUN|实装1.7.3 MEDIA_ATTACHED/MANIFEST_PARSED/LEVEL_SWITCHED/ERROR/DESTROYING/trigger类型编译；修复unmount读取null ref风险、buffer12非硬上限、Workerfalse不称terminate、load可预缓冲分片、默认retry并非0|
|解释清楚|PASS：静态自检，独立待主控|guide区分MSE/native、用户触发、公开源与授权、画质请求/实际事件、本地fatal事件/受控网络失败/公网成功与清理所有权|
|Demo有用|NOT_RUN：真实browser待主控|basic真实公开清单；business质量请求/LEVEL_SWITCHED；advanced无外部清单的诊断MSE+本地fatal/手动new实例。三者不同能力，不把同UI数量当目标|
|源码可迁移|PASS：3原件strict复制编译|example.tsx/media-policy.mjs/.d.mts全sourceFiles，demo仅适配；精确依赖/ReactDOM/TS Bundler/MSE+codec或native/CORS/CSP明确，无env/Provider/CSS/账号；字幕与读屏未实现|
|官方来源可靠|PASS：固定原字节+实际来源/HTTP|v1.7.3 tag→e5ff3583965e3af16c4a4b4d2b5f7bd1ffb5b7de，README/LICENSE原文，官方README392/424行同Mux源；安装1.7.3/Apache2、源root无version如实null；无中文README，en；Demo官网curl200未Lab确认unknown|
|结果可复核|NOT_RUN：policy/编译已记证，SDK/DOM未跑|policy3与SDK0分列；EXTERNAL与CONTROLLED浏览器提案不互相替代；命令/raw日志及首次失败/取证限制保留，不写formal receipt|

cwd `/home/lambert/githubRepos/lambert/ReactLoom`：

- `node --test packages/library-lab/entries/E17-hlsjs/tests/*.test.mjs` exit0，3纯policy，validation/policy.log。cleanup double检查destroy→pause→remove src→load及destroy异常finally，质量index校验。没有加载真实MSE/流，不计SDK。
- 3迁入原件复制至自有tmp，根cwd `pnpm exec tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --skipLibCheck /tmp/e17-portable-519h8lb0/example.tsx` exit0/output空，validation/typecheck.json保存argv/cwd/exit。第三方声明内部skip；不是全Lab检查或媒体运行；后续仅格式/注释文案，tmp定向删除。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/E17-hlsjs/examples entries/E17-hlsjs/tests entries/E17-hlsjs/validation/browser.spec.ts entries/E17-hlsjs/library.json entries/E17-hlsjs/official/source-evidence.json` 首次exit1，外部测试流没有配套字幕触发useMediaCaption，validation/biome.log。未伪造空track，添加精确局部原因注释并文档明确字幕/读屏未实现；最终同命令exit0/8files/no fixes，validation/biome-final.log。verification另定向exit0，metadata-biome.log。
- `git diff --check -- packages/library-lab/entries/E17-hlsjs` exit0。
- 官方tag API→annotated tag→固定tree/README/LICENSE/package实际读取，source-evidence保存source/package字段。源root package省略version，初次脚本KeyError如实通过null+说明修正，不伪造字段；安装发行包version1.7.3。Demo官网urllib初次403，curl实际GET200完整头保存official/homepage-headers.txt。没有执行README中的媒体示例或保存视频，仅保存官方文本资料。

## 实质边界与更改

原cleanup在effect return中读取videoRef.current，React卸载可能先置null，导致显式pause/remove/load漏掉；现在effect捕获本次video，销毁引擎并finally清媒体。stop/fatal先generation作废/ref置null；回调还检查engine身份，旧事件不能回写。media-policy是唯一cleanup/质量索引源。DESTROYING教学DOM事件只从真实SDK事件回调转发到该video，不从dispose自造成功事件；外层可保留原video直接观察卸载。

Worker关闭没有线程可销毁；Hls自身MSE内部URL/订阅由destroy处理，本例不global revoke。media显式pause/src/load与MediaSource实际sourceclose/网络收敛须浏览器证明，不靠组件消失。maxBufferLength12为缓冲目标配置，不是绝对12秒上限。点击load可能在播放手势前加载分片；没有自动play。native能力提示不等解码保证，质量API仅MSE模式。

实装默认主manifest errorRetry1、1000ms delay，timeoutRetry2且maxLoadTimeMs20000；playlist/frag另有更多重试，本例未改默认。route.abort主清单可在15s边界观察实际network fatal；不能用“应用不无限new实例”误写“库不重试”。本地诊断load(false)不loadSource；trigger注入fatal只测真实事件总线/应用清理，不算外部失败。

## 浏览器交棒

validation/browser.spec.ts独立3例：

1. EXTERNAL：不点零Mux请求；显式点击真实master响应包含STREAM-INF与SDK levels；质量请求setter/自动；真实MediaSource曾open后停止closed/sourceclose，实际DESTROYING、pause/src/load、请求1.5s收敛。此作者提案不称decoded frame/实际LEVEL_SWITCHED已验，主控可另真实播放核实。
2. CONTROLLED local：真实诊断MSE无外部流，SDK.trigger fatal→DESTROYING与src清理，新诊断实例id不同，卸载仍真实destroy/pause/load；不算网络/解码故障。
3. CONTROLLED route.abort：主清单拦截失败走实际SDK网络error/fatal，destroy与后续请求停止，不代表公网endpoint当前故障。

主控所有真实浏览器尚待执行；未把另一项curl主清单可达继承为本条SDK/播放PASS。真实媒体解码、原生fallback、码率切换、字幕/辅助技术各自验收；CSP/codec/网络阻塞如实保留，不静默换本地视频。外部请求只来自明确用户意图，公开测试源不提供生产/再分发许可。

独立review重点：真实API/诊断事件来源、捕获video的cleanup与过期回调、默认retry边界、三组浏览器证据分离、fixed README/源字段缺version与公开Mux出处、formal NOT_RUN。
