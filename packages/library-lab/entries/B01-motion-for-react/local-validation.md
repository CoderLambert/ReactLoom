# B01 Motion for React 本地质量交付

状态：**STABLE，待独立复核与主控真实浏览器验收**。本记录只确认下面的静态内容/真实React SSR/纯策略范围；formal sdk/build/browser均NOT_RUN，没有正式收据。

## 对象与范围

实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`，定向检查cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。基线HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`，9原文件无本条目既有diff；[baseline](validation/baseline.json) 保存逐文件SHA与entry-relative path+NUL+bytes+NUL摘要 `7d8cf584a6b3cef45aa1e52215fca0f91ffe914fe48552cf165c056c82c3773d`。queue初始摘要df38f4b3676dd5cb4956b4c8b94fc5bbd22a74c6102a8abab5a11f400375a90a是主控条目协议，不当作Git SHA。

仅修改B01，保留recreated/原来源说明与他人工作；未修改公共src/scripts/tests/e2e、依赖锁、索引、queue/results，没有提交/推送/发布。没有工作者全目录generate/typecheck/build或隐式build浏览器。

## 工程目标与实现

任务归档先改业务事实，退出动画稍后才移除DOM。三个独立目标保留原入口，不新增第四层：

| 目标 | 操作与实际源码对应的预期 | SDK与应用分界 |
| --- | --- | --- |
| basic presence | visible先变false，真实useIsPresent=false，退出DOM短暂保留后移除；反向切换不产生重复身份 | AnimatePresence/motion.article实际SDK；visible与回调计数为应用状态，回调不是业务成功 |
| business列表 | 稳定id增删、最多12；归档立即减业务计数，退出行inert/禁用；仅持焦归档才提交后回焦添加 | 纯策略与committedCards管理事实；Motion保留视觉子树，React管理焦点 |
| advanced布局/减动 | 同一DOM按id重排；原生系统偏好变化关闭位移/layout/时长，取消偏好后恢复；恢复初始列表不重置nextId | layout测量/transform来自SDK；顺序、实时媒体策略与所有权来自应用 |

保留原容量12、唯一id、不可变数组、id在事件中分配、提交后useLayoutEffect回焦、稳定key。新增真实presence/custom观察、退出aria-hidden/inert/归档disabled、committedCards拒绝旧退出回调重复归档、空态和本例SDK onExitComplete计数。没有把退出结束当业务提交时机。

14.6.0安装hook的useReducedMotion实际为挂载快照，未订阅重渲染；应用使用自己的matchMedia监听和标准React上下文让包括退出子树在内的视觉策略更新，卸载成对清理。MotionConfig never只禁用SDK的静态策略，所有本例位移、layout和duration均显式跟随实时策略；不能只复制never而丢掉门闩。usePresenceData单独观察SDK custom，不把它当业务状态。

## 六项复核

| 维度 | 状态与证据层级 | 依据及边界 |
| --- | --- | --- |
| 技术准确 | PASS：匹配源码/类型与真实SSR；动画NOT_RUN | motion/framer-motion/motion-dom实际均14.6.0；源码审计记录hook无setter/TODO、presence/context及VisualElement减动分支。两项真实React SSR验证SDK presence/custom与initial=false静态目标；不证明时序/布局/焦点。 |
| 解释清楚 | PASS：静态内容复核 | guide先解释React事实与视觉生命周期，再按三个实验讲输入/API/结果；明确退出DOM可暂留、业务已删除、默认sync、减动版本差异和迁移所有权，移除未挂载功能堆砌。 |
| Demo有用 | NOT_RUN：实际浏览器待主控 | 三目标有真实SDK控件/观察，三条可接入Playwright提案已静态通过；真实opacity/transform、退出inert、焦点与媒体切换没有本工作者browser证据。 |
| 源码可迁移 | PASS：静态接线/严格类型 | 六份正常TSX/TS/CSS文件齐，无Lab alias/额外资源；纯策略保留，媒体监听成对清理，退出旧回调隔离；最终入口strict tsc通过。 |
| 官方来源可靠 | PASS：固定原文与HTTP | v14.6.0固定commit/package匹配，完整tree无中文README，英文7475B/hash一致；完整官网GET200头无XFO/CSP，仅unknown，无iframe allowed假结论。 |
| 结果可复核 | NOT_RUN：整体动画；SSR/策略日志可复核 | SSR2/2、policy4/4、入口/提案类型、格式、metadata与源码审计均有原始命令/exit/日志；退出时序/真实布局/系统切换/焦点尚未运行，不升级formal PASS。 |

## 官方、版本与源码依据

实际 `motion@14.6.0` 的motion/react转出framer-motion14.6.0；motion-dom也是14.6.0，peer React/ReactDOM ^18或^19，当前19.3.0满足。MIT核心API，没有Motion+资源、付费服务、网络数据或历史PASS继承。

官方tag v14.6.0 → commit `3397236ea600094f09513fbb2bfb084dc95f5982`，固定packages/motion/package.json声明14.6.0。完整递归tree的truncated=false、11个README候选无官方中文。保存根 [README原文](official/readme.md)，语言en，7475B，SHA-256 `08915bb5254a4bc1fd47e8d7ea8fff0dcb470461f6fd6b59fb6d2f0bef0400df`，[固定出处](https://github.com/motiondivision/motion/blob/3397236ea600094f09513fbb2bfb084dc95f5982/README.md)。2026-11-10实际获取，精确UTC、tag/tree/package/readme URL/最终URL/状态/完整头/摘要在 [source-evidence](official/source-evidence.json) 与library.official。原文未改写为本地教程。

官网 `https://motion.dev/` 实际GET200、最终URL不变，保存完整响应头；没有XFO/CSP，正文NOT_READ。未真实Lab-origin iframe，unknown且保留直达，不从HTTP200推断allowed。

[源码审计](validation/sdk-source-audit.json) 保存实际解析路径、三包版本/peer和文件摘要：use-reduced-motion.mjs37只有useState无setter，42为自动更新TODO；use-presence-data.mjs7读取context.custom；PresenceChild管理真实存在性/注册；VisualElement217-227在挂载计算never/always/user策略；visual-element-target85-86对positionalKeys应用减动。这与在线说明/hook注释“动态响应”有冲突，按安装实现说明并由应用补齐。

常规MotionConfig user确实会关闭所管理的transform/layout，opacity等仍可动画；不重复旧稿“它对x/rotate一概无效”的错误。本例为动态偏好采用完整自有策略，不能据此建议全站忽略系统设置。冻结期间另只读核对ExitAnimationFeature的反向进入/退出Promise身份保护与VisualElement插入effect更新，未据此宣布浏览器运行通过。

## 真实命令与原始结果

除最终Git巡检外，以下cwd均为上述Lab目录；完整argv、UTC起止、exit、stdout/stderr与日志SHA见 [local-runs](validation/local-runs.json)。没有fake Motion/DOM/RAF、强退或skip占位。

| 实际执行 | exit / 结果 | 日志与范围 |
| --- | --- | --- |
| `node --test entries/B01-motion-for-react/tests/sdk.test.mjs` | 0，2PASS/0SKIP | [sdk](validation/sdk.txt)：真实React renderToStaticMarkup、Motion组件/useIsPresent/usePresenceData；输出两条present=true、opacity1、transform none的真实SSR HTML。只验证组件/context/静态目标，不导入TSX实际Demo或模拟浏览器时序。 |
| `node --test entries/B01-motion-for-react/tests/card-policy.test.mts` | 0，4PASS/0SKIP | [policy](validation/policy.txt)：原追加/唯一身份/容量/归档/重排/空集，非SDK。 |
| 入口strict tsc：`pnpm exec -- tsc --ignoreConfig --noEmit … entries/B01-motion-for-react/examples/demo.tsx` | 最终0 | [types-final](validation/types-final.txt)，完整ES2022/Bundler/React JSX/strict/types等参数见manifest。 |
| `pnpm exec -- biome check --write entries/B01-motion-for-react/examples entries/B01-motion-for-react/tests entries/B01-motion-for-react/validation/source-audit.mjs` | 0，9文件/格式修复2个 | [format-final](validation/format-final.txt)。 |
| 同字节提案临时.ts strict tsc | 0，仅静态 | [proposal-types](validation/proposal-types.txt)。此后仅import顺序调整，类型/API/逻辑不变，复用有效类型结果，临时.ts已删除。 |
| 提案Biome首次/修复后 | 1 → 0 | [首次](validation/proposal-biome.txt) 只报import名顺序；[修复后](validation/proposal-biome-fixed.txt) 1文件无诊断。冻结时未修，明确释放后只重跑该受影响检查。 |
| 单条目metadata/完整性/3目标/6文件/原文/hash/版本/unknown/正式NOT_RUN | 0 | [metadata](validation/metadata.txt)，此后metadata/source路径/原文不变，复用有效结果。 |
| `node entries/B01-motion-for-react/validation/source-audit.mjs` | 0 | [source-audit](validation/source-audit.txt)、sdk-source-audit.json，实际安装源码只读审计。 |

官方网络研究使用匿名Python urllib GET，全部请求URL、时间、状态和完整响应头在official证据；没有读取.env/凭据或安装依赖。新context与源码排版后只重查直接受影响类型/格式，没有重跑有效SSR/策略。正式收据未建立，类型/SSR不能替代退出/布局/焦点运行。

## 文件与真实浏览器接入

- 修改：guide.md、agent.md、library.json、verification.json；example.tsx；原card-policy.ts、demo.tsx、tests/card-policy.test.mts仅正常排版，原策略行为保留；AGENTS不改。
- 新运行文件：presence-items.tsx、reduced-motion.ts、workshop.css。sourceFiles齐全六份，可迁移五业务文件加Lab导出适配器。
- 新验证：tests/sdk.test.mjs、官方原文/完整来源、validation/source-audit.mjs与JSON、baseline/local-runs/输入摘要/实际日志、完整提案与本记录。完整文件清单见validation/final-files.txt。
- [browser-proposal.txt](validation/browser-proposal.txt) 三条精确@B01覆盖三个目标：basic原生RAF读取真实opacity与presence/inert，visible已false但退出DOM暂留，完成后移除及反向切换；business真实键盘归档/回焦、退出inert/disabled、保留DOM身份、容量与空态；advanced读取真实DOMMatrix非零投影、同DOM重排、原生media减动/恢复、停止重进。没有替换RAF/SDK、强制样式或注入假结果。

定位：region `Motion for React 实际动画演示`；b01-workshop data-reduced/data-order；b01-notice data-present；b01-visible/count/reduced/exits/empty/list；li[data-card-id][data-present]，活跃行限定data-present=true。动画进行中DOM数可能包含退出行，不能把它直接当业务数组长度。SDK onExitComplete只是本例回调计数，系统策略与实际视觉帧分别观察。

## 冻结与剩余验收

candidate09前按主控要求冻结31文件INTERMEDIATE，摘要 `a2a6bd50f12df1c5e6e4f7790576dfac9fa8c1d238d39c85b644da60eb432ee7`，期间只读研究，没有写guide/logs。主控随后报告2028输入、摘要7b126325d222079143bcd73733df045e5f901bf969d911dcad997bb8a82c02dd、新e2e lint/typecheck/build/catalog均0且输入变化[]，再明确释放收尾。该共享构建只证明当时公共候选，不是本条目独立build或动画收据。

主控独立复核并把提案接入公共e2e，匹配构建后实际记录帧样本/日志。退出动画、inert和回焦、布局投影、减动实时变化、停止清理仍NOT_RUN。运行中偏好改变对已退出动画的影响、逐监听/动画资源计数、触控/读屏、海量列表/CPU性能未覆盖。没有Reorder/弹窗/网络/IME，不宣称相应能力通过。独立复核前不记content_done；正式sdk/build/browser按授权干净提交和当前receipt协议另记。

## 主控真实浏览器闭环 / candidate10

真实 Motion 三场景和官方展示4项PASS：presence退出保留真实DOM且业务已移除、inert/aria-hidden/disabled、原生RAF中间opacity、稳定列表身份/键盘回焦、真实布局投影、系统减少动态切换、停止重进。SDK SSR2与policy4的有效局部结果另列，未代替DOM。

共享候选2182输入SHA25b58acba7305fb7dc70bd492e23c6056c21064e81cf07098cd339a5786297bf，lint/type/build/catalog全部0、stability=[]；browser固定dist，不隐式build。docs/library-lab/evidence/quality-upgrade/candidate-10/browser.txt共30项24PASS6FAIL，本条4PASS无失败，其他条目失败单独处置。非作者六项报告见路线图results/review，本地六项闭环，正式sdk/build/browser仍NOT_RUN待干净授权提交与recorder。未测触摸/读屏/性能/SSR hydration等边界保持，不泛化本地结果。
