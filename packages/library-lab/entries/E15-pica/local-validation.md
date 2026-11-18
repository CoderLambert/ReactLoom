# 2026-11-18 主控闭环补充

六项本地质量PASS。策略7与五文件strict迁入通过，非作者新consumer/官方源码复核见独立报告；浏览器3项含来源：真实480×300和本地800×600→240×180、native同尺寸、bitmap.close与所有PNGURL回收；持有真实已编码toBlob callback后取消和卸载，release不产生迟到URL，单飞等待结算再允许新任务。此项证明丢弃迟到结果，不声称物理取消编码或即时停止Worker。候选32及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E15.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E15 pica 本地质量证据（2026-11-18）

STABLE：仅E15，未改共享源码/依赖/lock/e2e/队列/results/生成，无build/fulltypecheck/browser/commit。固定pica10.0.3；formal三项NOT_RUN。

|六项|状态与层级|证据|
|---|---|---|
|技术准确|静态/迁入类型/policy PASS；真实SDK NOT_RUN|实装10.0.3 factory/resize/cancelToken/toBlob/Worker源码核实；null Blob误成功修复、原生context失败明确、结果原子发布。Node7仅尺寸/所有权/Blob策略|
|解释清楚|PASS：静态自检，独立待主控|guide区分像素缩放/上传/裁剪、尺寸/字节/像素预算、resize取消与不可取消decode/encode、Worker idle与本例URL所有权|
|Demo有用|NOT_RUN：真实browser待主控|原创Canvas、真实本地文件预算/不放大、原生对照+取消分别不同目标；浏览器提案真实尺寸和持有encoder callback后清理，不凭字节论画质|
|源码可迁移|PASS：五原件严格复制编译|example.tsx/resize-policy.mjs/.d.mts/task-owner.mjs/.d.mts全部sourceFiles；exactpica/ReactDOM/TS bundler/Canvas/Blob/ObjectURL/createImageBitmap前提，无env/Provider/CSS/账号/后端；不虚构SDK destroy|
|官方来源可靠|PASS：固定原字节与实装/HTTP|nodeca/pica10.0.3 commitf897666f18e9daeff540fe03d2708ba74214a046的README/LICENSE原文，无中文README，en；安装与固定packageMIT；GitHub homepage deny/frame-ancestors none，blocked直达|
|结果可复核|NOT_RUN：policy/编译已记证，SDK/DOM未执行|policy7/SDK0分列；定向Biome/typecheck/raw日志，真实resize/toBlob/尺寸/cancel/URL/Worker路径待主控，不生成formal receipt|

cwd `/home/lambert/githubRepos/lambert/ReactLoom`：

- `node --test packages/library-lab/entries/E15-pica/tests/*.test.mjs` exit0，7纯policy，validation/policy.log。4原尺寸/MIME/像素策略+3个UI共享task-owner/Blob控制流，不导入pica执行，不计SDK。
- 五迁入原件复制至自有tmp，根cwd `pnpm exec tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --skipLibCheck /tmp/e15-portable-ikxydytr/example.tsx` exit0，output空，validation/typecheck.json保存argv/cwd/exit。第三方声明内部skip，不是全量typecheck或DOM执行，tmp已定向清理。后续仅等价模板字面量格式修正，不重复编译。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/E15-pica/examples entries/E15-pica/tests entries/E15-pica/validation/browser.spec.ts entries/E15-pica/library.json entries/E15-pica/official/source-evidence.json` exit0；初始/最终样式信息日志biome.log/biome-final.log。手工按建议等价改模板字符串后加verification.json检查，exit0，validation/biome-clean.log。
- `git diff --check -- packages/library-lab/entries/E15-pica` exit0。
- 官方tag/tree/raw README/LICENSE/package字段实际读取；curl真实homepage头保存official/homepage-headers.txt。fixedref/语言选择/原文SHA/license与完整header在official/source-evidence.json/library.json，无执行README指令。

## 核心实质修正

实装pica.toBlob的native路径不拒绝null callback，而可resolve null（类型声明Promise<Blob>更窄）。新增assertPNGBlob在发布前要求非空image/png；不会把null/空Blob/MIME异常报成功。原生对照getContext不再可选调用后导出空白成功；两输出收集成功才原子发布，任何当前任务失败都清图。样例绘制失败不把未绘制canvas当正常源。选择文件后显示真实来源并隐藏原创源画布，避免源展示误导。

task-owner为UI实际单飞/epoch源：同步begin、invalidate请求当前cancel并作废id、resize settle后clearCancel、全部await后isCurrent；旧finish不能释放另一个新任务。取消期间旧decode/encode尚未结算仍busy，不能物理中止它们；清理/换图/边长/卸载只丢迟到结果，finally仅mounted时更新running。bitmap finally close；结果URL effect各自create/revoke，无全局清理。

## 浏览器交棒

validation/browser.spec.ts三组：真实480×300输出；本地原创PNG320×160配480不放大、损坏文件失败；native与pica相同尺寸、输出PNG URL在替换/卸载真实revoke。第三组包装native Canvas.toBlob，在真实编码完成后暂存目标480×300callback：取消后单飞仍disabled，release后没有输出/新URL，重跑240恢复；再次held编码卸载，release后无迟到URL，已有URL全部回收。末尾100ms有界窗口观察已开始编码结算，不单靠DOM消失。

该受控callback验证epoch/单飞与资源所有权，不声称物理取消编码、resize取消时序或立即terminate Worker。真实resize期间cancelToken请求由源码/API确认，若需专门Worker中断路径必须另行标实测，不拿当前encode实验冒充。Worker默认js/wasm/ww及idle2000ms来自实装，不代表本浏览器已走Worker/WASM或CSP允许。optional-null callback失败可用受控DOM注入追加，但须标注注入控制流，不冒称真实编码器故障。

4MiB压缩文件预算+解码后16MP预算不保证解码前内存限制、色彩/EXIF/ICC/HDR完整处理；默认mks2013不等未锐化，体积不等画质。无上传、远程图片、JPEG质量调节或image-blob-reduce接线。独立复核重点为以上真实边界、五源文件/types与正式NOT_RUN分层。
