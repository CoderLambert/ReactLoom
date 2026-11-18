# B05 Rive React 本地质量交付

状态：**STABLE，待独立复核与主控真实浏览器验收**。sdk/build/browser正式三项保持NOT_RUN；原assets保留针对离线授权文件的BLOCKED，不把运行时MIT当设计资产授权。

## 对象、基线与范围

实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`，定向检查cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。基线HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`，11原文件无本条目既有diff；[baseline](validation/baseline.json) 保存逐文件SHA与entry-relative path+NUL+bytes+NUL摘要 `52474d62c4b92c6f830f61bfec4c0092426072788072ebd66cc301e212163a0e`，不当作Git SHA。

仅改本条目，保留recreated/历史来源说明与他人修改。未改公共src/scripts/tests/e2e/runners、依赖锁、索引、queue/results或公共资产，未提交推送；没有全目录generate/typecheck/build、隐式build浏览器或读取.env/凭据。没有设置许可已审标志、复制/伪造.riv或读取其正文。

## 三目标与实际实现

| 目标 | 操作与源码对应的预期 | 实际SDK与应用分界 |
| --- | --- | --- |
| basic加载/播放/Layout | 官方远程文件真实加载，核bumpy契约、SDK布尔/机器/边界/Advance及独立Canvas帧差；暂停/恢复，同对象Contain/Cover | useRive/实际Rive getters/events/Layout；网络、文件与WebGL成功不能从策略true推定 |
| business可取消任务 | 本地450ms任务捕获下次失败选项；取消/新任务使旧结果失效，pending才请求播放，失败/成功由HTML表示 | AbortSignal+generation为应用自建；bumpy只有视觉，未绑定approved/failed或View Model，模拟503不是真HTTP |
| advanced挂载所有权 | 原生减动停播；真实IO离屏卸载/回屏新实例，隐藏文档同样请求卸载；Canvas缓冲由包装器清理 | policy只给意图，包装器拥有实例；共享离屏WebGL/WASM单例不保证随单组件卸载销毁 |

保留原本地审核、参数捕获、AbortSignal+generation、场景切换/卸载取消、手动暂停、媒体与文档监听、IO缺省回退。新增player.tsx：以hook选中的已加载rive对象为权威，校验stateMachineNames确有bumpy才请求播放；业务message与runtimeError分开，资源失败不会被业务成功覆盖。

实际Artboard、机器、播放布尔、paused/playing机器、bounds、layout与Canvas尺寸来自SDK/DOM。instance是React挂载观察身份，objectIdentity是本例WeakMap标记真实Rive引用，不能当SDK内建ID；Advance/Play/Pause为本例观察到的SDK事件次数，不是绘制或GPU资源指标。Advance只写ref，不逐帧setState。应用监听在layout cleanup先摘，probe按身份清理，最终卸载alive阻止晚到错误；包装器管理SDK实例，应用不再cleanup一次。

## 六项复核

| 维度 | 状态与证据层级 | 依据及边界 |
| --- | --- | --- |
| 技术准确 | PASS：匹配源码/类型与真实WASM内核；实际Rive渲染NOT_RUN | React4.37.0→WebGL2 2.45.0，类型支持单数stateMachine、Layout、getters/events；安装MIT WASM实际初始化并计算Contain/Cover/Vec2D，两项通过。没有解析.riv、创建Canvas或伪渲染器。 |
| 解释清楚 | PASS：静态内容复核 | guide先文件→WASM→Artboard/状态机→播放/绘制，再三实验、所有权和迁移；明确业务模拟、播放意图与实际渲染、共享context、许可分别判断。移除未实现VM/定价/输入教学堆砌。 |
| Demo有用 | NOT_RUN：主控真实浏览器待验 | 三目标源码/控件/观察齐，完整三条Playwright提案静态通过；真实CDN/WASM/文件/Canvas待新修复候选；主控candidate10的旧Draw断言失败、IO/减动与卸载通过，见下方增量。 |
| 源码可迁移 | PASS：静态/严格类型 | 六运行文件含必要CSS/资产常量/策略/player，正常排版，无Lab alias或新增共享依赖；监听/实例/任务所有权明确，最终入口strict tsc通过。迁移在线运行仍需网络和真实资源条件。 |
| 官方来源可靠 | PASS：固定原文与HTTP/许可分界 | v4.37.0固定commit/root package匹配、完整tree无中文、英语4388B/hash；官网完整头XFO DENY+CSP明确blocked。远程样本只读头，未冒充固定字节或再分发授权。 |
| 结果可复核 | NOT_RUN：整体图形运行；WASM/策略日志可复核 | WASM2/2、原policy5/5、类型/格式/metadata/源码审计有实际命令/exit/日志；真实Rive文件/状态机/渲染与清理仍无本工作者browser证据，不能升级正式PASS。 |

## 官方来源、版本与资产前提

实际 `@rive-app/react-webgl2@4.37.0` 的dependency固定 `@rive-app/webgl2@2.45.0`；React peer覆盖19，当前19.3.0满足。运行时MIT，WASM是该安装包的一部分，`.riv`内容及字体/图片另有权利，不继承MIT。

官方tag v4.37.0→commit `ed0614c0050923db382df43196de80ecb38f9abd`，根package.json版本4.37.0。完整递归tree的truncated=false，四个README候选无中文；保留 [根英文原文](official/readme.md)，4388B，SHA-256 `d3db576862ff069a0889157166a11e3f3136ec74a4736cb6acbac172ab835262`，[固定出处](https://github.com/rive-app/rive-react/blob/ed0614c0050923db382df43196de80ecb38f9abd/README.md)。2026-11-10实际取得；精确UTC、tag/tree/package/readme实际URL/最终URL/状态/完整响应头与摘要在 [source-evidence](official/source-evidence.json) 和library.official，未把本地讲解冒充原文。

官网文档GET200最终URL不变，但XFO=DENY，CSP frame-ancestors仅self及Mintlify origin，不允许Lab。因此homepage=blocked与直达，不重试或绕过嵌入限制。当前官方React文档仍直接示范vehicles.riv+bumpy；这作为远程引用出处，不是复制/修改/再发布设计资产的许可证明。

[样本元数据响应](official/asset-response.json) 是实际GET头：200、宣称Content-Length58792；正文NOT_READ，没有保存/解析.riv、内容SHA或固定字节声明，也不能据未带Origin的请求推断浏览器CORS成功。当前没有获准的离线设计文件，assets针对该缺口仍BLOCKED。

按主控明确决定，保留SDK固定2.45.0的unpkg主WASM与jsDelivr备WASM网络路线，不为假设先扩大公共依赖/映射。应用没有改RuntimeLoader全局配置。Node测试在自己的独立进程用已装MIT WASM setWasmBinary、禁网络备源、awaitInstance，结束清除二进制引用；不影响浏览器全局加载器。主WASM实际2232739B、SHA `4cbbe770f3317b2ba826177e840c9eeefa37e5694f290b5c0ec479b57e371891`；备WASM2258693B，精确SHA在审计JSON。

[源码审计](validation/sdk-source-audit.json) 保存实际React/runtime包路径、版本/peer、编译JS摘要/关键摘录与两WASM摘要。已核实useRive构造实例、Load/onRiveReady、ref断开后缓冲清零、包装器unmount/final cleanup及RuntimeLoader主/备URL。getters/events按实际2.45.0类型核对；未把“请求卸载”当作全局WebGL context已销毁。

## 实际定向命令与产物

以下cwd均为上述Lab目录（最后Git巡检在仓库根）。完整argv、UTC起止、exit、stdout/stderr和日志SHA见 [local-runs](validation/local-runs.json)。无SDK mock、假Canvas/RAF、force-exit或skip占位。

| 实际执行 | exit / 结果 | 原始证据与范围 |
| --- | --- | --- |
| `node --test entries/B05-rive-react/tests/sdk.test.mjs` | 0，2PASS/0SKIP | [sdk](validation/sdk.txt)：真实MIT WASM computeAlignment/Vec2D与Layout.copyWith，100×50→200×200时Contain=[2,2,0,50]，中心点→[100,100]；Cover=[4,4,-100,0]。自有native矩阵/点finally delete，Node自然退出，无.riv/Canvas。 |
| `node --test entries/B05-rive-react/tests/runtime-policy.test.mts` | 0，5PASS/0SKIP | [policy](validation/policy.txt)：原mount/play纯门闩。测试名称描述的是策略意图，不证明分配/释放或停播。 |
| 入口strict tsc：`pnpm exec -- tsc --ignoreConfig --noEmit … entries/B05-rive-react/examples/demo.tsx` | 最终0 | [types-final](validation/types-final.txt)，完整ES2022/Bundler/strict/React JSX/types参数见manifest。 |
| `pnpm exec -- biome check --write` 指定examples/tests/library/verification/metadata及源码审计 | 0，12文件 | [format-final](validation/format-final.txt)；正常源码排版。 |
| 提案同字节临时.ts的strict tsc | 0，仅静态 | [proposal-types](validation/proposal-types.txt)，检查后删除临时.ts，没有启动Chromium。 |
| 同临时提案Biome check | 0，1文件无修复 | [proposal-biome](validation/proposal-biome.txt)。 |
| `node entries/B05-rive-react/validation/metadata-check.mjs` | 0 | [metadata](validation/metadata.txt)：validateEntry/completeness、三目标/六文件、版本/原文/hash/无中文/官网blocked/正式NOT_RUN与离线assets BLOCKED。 |
| `node entries/B05-rive-react/validation/source-audit.mjs` | 0 | [source-audit](validation/source-audit.txt)、sdk-source-audit.json，实际安装包/类型/清理/WASM审计。 |

最初 [format](validation/format.txt) exit1：旧role=group应使用fieldset、level故意作为取消边界的依赖需准确说明；未插入的读取/错误显示导致unused警告也在此暴露，已接好真实UI。修正为fieldset/legend、恢复取消边界说明并接线后 [format-fixed](validation/format-fixed.txt) 与入口类型均0。此后新增真实对象身份/事件观察仅重查直接受影响类型/格式，未重复有效WASM/纯策略。

官方网络研究为匿名Python urllib GET，完整响应在official；没有读取.env/凭据或下载可再分发资产。早期WASM只读研究先遇到pnpm符号路径解析问题，改用真实模块resolve后成功，正式SDK suite使用同样规范解析并保存实际执行证据，不将查找失败称作资源许可阻塞。

## 文件清单与浏览器接入

- 修改guide/agent/library/verification、example.tsx与styles.css；原demo/tests/runtime-policy仅格式化，runtime-policy补明共享渲染器边界，原五策略保留；asset.ts仅排版，URL、机器名和资产权利说明保留，AGENTS不改。
- 新player.tsx提供实际SDK读取/控制/监听所有权。六sourceFiles完整，复制五业务文件加demo适配器，无公共资源改动。
- 新tests/sdk.test.mjs真实WASM模型；official原文/完整来源/样本头；validation源码/metadata脚本、baseline/输入摘要/运行日志/提案；本记录。完整清单见validation/final-files.txt。
- [browser-proposal.txt](validation/browser-proposal.txt) 三条精确@B05：basic真实网络状态/机器契约/SDK播放与Advance、真实Canvas帧差/暂停稳定、同对象Layout和PNG；business真实取消/输入快照/模拟失败恢复，SDK Play/Advance观察与业务分开；advanced原生media/真实IO、旧Canvas断开清零、回屏新实例和停止清理。无page.route、伪数据/SDK/RAF或手工销毁共享context。

关键定位：region `Rive 动画与状态机制实验`，b05-workshop data-phase/runtime-mount/requested-play/reduced/in-view；b05-player/canvas/viewport/status/runtime-error/sdk-state。展开“查看真实Rive对象与推进事件”，点“读取真实播放器”；画面适配Contain/Cover、原启动/取消/503/手动暂停控件保留。观察器事件数与实际SDK对象/策略各自标注，不每帧React更新。

## 剩余验收与解除条件

在线渲染NOT_RUN：主控用匹配构建真实连接官方CDN/WASM并验证CORS/CSP/WebGL2、文件契约/绘制、播放/Layout、IO/减动与实例清理，保留PNG/网络状态/SDK读数/原始日志。实际资源失败时按真实错误记FAIL/BLOCKED，再由公共owner决定最小同源接线或其他解除条件，不用mock/截图替代动画通过。

离线资产BLOCKED的解除条件：提供可使用/可分发的自有或明确授权.riv，来源和许可、固定内容SHA、Artboard/状态机/View Model契约及所含字体/图片权利齐全，再由根负责公共资源映射并真实验收。不能拿运行时MIT、官方可访问URL或HTTP200替代这组条件。

原生document-hidden流程、实际context丢失恢复、全局/共享渲染器GPU资源计数、触摸/读屏、离线与大量实例性能未验收；View Model/文本输入/GPU Canvas/inkbleed未实现。独立复核前不记content_done；正式sdk/build/browser需授权干净提交及当前receipt协议另处理。


## candidate10 Draw=0 真实故障增量

主控真实浏览器两个失败保留于 `docs/library-lab/evidence/quality-upgrade/candidate-10/browser.txt`；第三个 IO/生命周期已通过。固定资源200、bumpy契约、isPlaying及Canvas尺寸本身未证明Draw订阅可用。

本工作者使用既有candidate10 dist与独立Chromium、真实远程资源重现：`node packages/library-lab/entries/B05-rive-react/validation/draw-probe.mjs`，cwd仓库根，exit1；[完整红日志](validation/draw-probe-red.txt)与[命令/时间](validation/draw-probe-red.json)。四个同对象样本isPlaying=true、observedDrawEvents始终0，但原生Canvas截图SHA四个均不同，已证明该时段真实绘制在变化；不保存远程.riv正文、trace或HAR。

实际安装2.45.0源码见 [draw-event-source-audit.json](validation/draw-event-source-audit.json)：Draw枚举存在却没有派发引用，`Animator.handleAdvancing`真实派发Advance，draw实际advance/artboard.draw/renderer.flush后未发Draw。最小修复改为observedAdvanceEvents并成对订阅/解绑Advance；文本明确它不证明像素输出。完整browser提案独立要求连续Canvas截图差异、暂停100ms settle后180ms画面完全相同，并保持原推进暂停至多2尾帧的限制，没有将断言删弱为始终可变。

红探针冻结为原缺陷复现，不改成假绿。新实现定向严格类型与6文件Biome均exit0，实际cwd/argv/起止/退出码在 [draw-fix-runs.json](validation/draw-fix-runs.json)，原始日志为draw-fix-typecheck.txt、draw-fix-biome.txt；完整提案也在同一次strict检查中。真实Advance+Canvas新候选回归由主控执行，尚未运行。原WASM2/policy5复用，不因注释和观察字段改名重跑；formal三项仍NOT_RUN。

## 主控candidate11真实闭环

真实Rive WebGL2三个场景+官方展示4项PASS：实际4.37/2.45 WASM与远程官方样本200、真实bumpy/artboard/bounds/getters、SDK Advance增长、连续Canvas画面变化/暂停后完全稳定、同对象Layout更新；450ms本地取消/失败输入快照、真实媒体/IntersectionObserver、卸载Canvas与共享context所有权。独立WASM布局模型2与policy5有效结果复用。

初版真实Draw计数0失败保留：安装2.45.0有Draw枚举但没有派发点，同对象实际Canvas四幅各异证实渲染在进行。修成真实Advance并明确不能证明绘制；加强独立Canvas像素变化/暂停稳定检查，未放宽失败。非作者原审及root源码/安装SHA/实际browser增量复核通过。在线引用不复制.riv；离线资产再分发仍BLOCKED，解除需独立许可确认，不绕过。

候选2208输入SHA362873dc5a79d4089300e5257e611b9fa3fab2a6af76e7355d792b13d3aa83cc：新e2e lint/type/build/catalog全部0且stability changed=[]，浏览器固定dist无隐式build。实际argv/cwd/exit/产物见docs/library-lab/evidence/quality-upgrade/candidate-11/browser-fixes与browser-mantine-status-retry，未受影响candidate10结果复用；单次7项6PASS1FAIL不隐瞒，失败仅定位并已定向闭环。非作者六项内容和本地运行完成，正式sdk/build/browser仍NOT_RUN，不冒充授权干净recorder收据。
