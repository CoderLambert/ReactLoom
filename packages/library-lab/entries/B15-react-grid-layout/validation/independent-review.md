# B15 独立质量复核

复核者 `/root/quality_f05`，非本条目作者；UTC `2026-11-10T15:23:06.617616+00:00`。实际 cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。范围为 B15 的 AGENTS、library/guide/agent/verification/local-validation、全部 examples/tests、官方原文/证据、三条完整 browser proposal 与既有日志；另只读核对实际安装 RGL2.3.0、react-resizable4.0.2、间接 react-draggable4.7.2 源码/类型/CSS。

仅本报告由复核者写入。没有修改生产源码、原验证收据、公共文件、依赖或索引，没有运行共享检查、浏览器或重复作者已有效 SDK/policy 套件。主控另行接管下述局部 CSS 修复及真实浏览器裁决。

## 结论与具体问题

未发现 P1。确认一项 P2 迁移问题，主控已修代码、我已静态复读；另有一项需要真实运行裁决的上游生命周期风险，不能称为已复现 browser FAIL。整库运行仍 NOT_RUN。

### P2-1：卡片的盒模型依赖未列出的 Lab 全局 reset

原 [styles.css](../examples/styles.css):23–28 给卡片 padding12px、border1px，却未设置 border-box；[guide](../guide.md):65 只要求复制四个 sourceFiles 和两官方 CSS。实际 RGL `dist/chunk-Z6CWRR74.mjs`:563–577 合并生成的 width/height，RGL 官方 CSS 不定义卡片 box-sizing，react-resizable CSS 的 border-box 仅限缩放手柄。Lab `src/styles.css`:15–17 的全局 `*` 恰好遮住遗漏。

在采用浏览器默认 content-box 的迁移宿主中，SDK 给出 width390/height166 时卡片外盒成为416/192（两侧 padding+border 合计26px），使真实10px间距、碰撞几何与指针边界不一致。这是静态可确定的迁移缺陷；本复核没有声称已运行迁移宿主。

**处置**：已即时上报主控。主控在 `.b15-card` 当前24行补 `box-sizing: border-box`，guide 当前86行补明确迁移条件。复读确认没有复制公共 reset 或改变 SDK 几何算法。修后 CSS SHA256 `42033698dccee5a98d85fb6c405ee82d63333a05bb3d34e14a216a36e11105cd`。源码处置完成，目标浏览器核对由主控负责；现有 SDK3/policy6 不受此 CSS 改动影响，复用有效结果。

### P2 风险待裁决：拖动期间卸载的 SDK 自动滚动 RAF

实际安装 RGL2.3.0 `dist/chunk-Z6CWRR74.mjs`:24–71 的 `createEdgeScrollController` 在存在滚动祖先时，`feed` 置 running=true 并逐帧续 RAF。GridItem:235–238 创建、315 feed；唯一停止调用是365的正常 `onDragStop`。GridItem:74–614 未见卸载 effect 调用该 controller 的 stop。间接 react-draggable4.7.2 `build/cjs/Draggable.mjs` 的 DraggableCore `componentWillUnmount` 移除自有 document/touch 监听和选择样式，但不调用消费方 GridItem 的 stop 回调。

因此，**真实存在滚动祖先且在拖动仍活跃时卸载或切断点**，源码表明可能遗留自动滚动 RAF；标准停止拖动路径有 stop，不能把两者混同。当前 [browser-proposal](browser-proposal.txt):82–92 的 drag helper 总在返回前 mouse.up，第三 case:204–220 随后才卸载，不能覆盖此条件。[guide](../guide.md):74 对 Hook 自有 RO/RAF 清理描述与安装源码相符，但“指针资源由 SDK 子树卸载”不能外推为此内部自动滚动 controller 的全量清理证明。

已将准确调用链和条件上报主控。建议在匹配真实 dist、具有真实滚动祖先的私有 context 中，以真实鼠标保持按下后卸载/切断点，分开观测遗留 RAF/滚动与 document 监听；不 mock SDK/RO，不以手工清空全站资源掩盖。运行前保留为 **待裁决风险**，不是既成运行失败；若复现再决定 SDK 限制说明或有所有权的修复，不需要重复数值/SSR/policy 检查。

## 六项逐项结论

| 项目 | 独立结论 | 依据与限制 |
| --- | --- | --- |
| 技术准确 | 静态/匹配源码与有限 SDK 证据通过；活跃卸载风险待裁决 | v2 width/layout/gridConfig/dragConfig/resizeConfig、readonly Layout 回调、static、verticalCompactor 与实装类型/代码一致。显式 measureBeforeMount:true 修正默认 mounted 初值误读；实测容器决定12/6列，而非假设 window。SDK3确实调用目标库，不是 policy 或伪 DOM。 |
| 解释清楚 | 静态通过 | 中文按格子/像素与宽度测量→真实拖缩/回写→独立草稿/锁/键盘替代递进。明确 onLayoutChange 不是一次用户保存，stop 计数只来自真实目标回调；说明原生按钮不是 SDK 完整键盘拖放。无未实现持久化承诺。生命周期补充见风险项。 |
| Demo有用 | 三独立目标静态成立；真实交互 NOT_RUN | basic 实测只读投影；business 真实标题 handle/se 缩放及回调；advanced 两份草稿、static 锁定、键盘邻居规则与重置。三完整提案用真实 mouse/keyboard/DOM/RO，SDK calc 只预测后与 boundingBox 比较；没有 mock SDK 或人为伪造 stop。待主控执行，不能由类型通过记交互 PASS。 |
| 源码可迁移 | P2-1 已静态修复；宿主运行 NOT_RUN | 四必要文件含 CSS/纯模型，无 Lab alias/网络/资产/存储。稳定 i/key、handle 与按钮分离；SDK own refs/style 原样，未手工覆盖坐标。主控补卡片 border-box 后不再依赖公共 reset。应用不拥有 SDK 内部 controller，活跃卸载风险不能靠描述抵消。 |
| 官方来源可靠 | 固定原文与记录通过；官网 unknown 合理 | 正式 README repo/commit/path/en/version/time/hash 齐，npm gitHead=tag 解引用=manifest2.3.0，完整 tree 无官方中文候选。实读原文42045B，与安装 README 均 SHA256 `10e8e14f3e5cbcf6f8d8f27381e122d17f8d2312b3208e3a2528c5b62b7c6ca1`。8请求有状态/最终URL/完整头；官方 Pages GET200 无 XFO/强制CSP，未 Lab-origin browser，保持 unknown；官网正文明确未读，未捏造 hash。 |
| 结果可复核 | 限定证据可复核；整体运行/正式 NOT_RUN | 作者 SDK3/policy6、strict入口/提案、格式/metadata/diff 均真实 cwd/argv/UTC/exit0 日志，无 SKIP/强退。复核重算初次13输入、10日志 hash 全一致；随后主控 CSS/guide 改动是明确增量，不能继续称旧13输入包含该修复。formal 三项仍 NOT_RUN，真实拖缩/RO/焦点/生命周期不由数值测试替代。 |

## 关键实现核对

- [example](../examples/example.tsx):16–32 初始三项固定 i/key，wide/narrow 分开初始化；43–54 Hook 真实 width、<640断点、visibleLayout 投影和 static；GridLayout key=breakpoint 防止旧 SDK 内部交互状态跨档。窄模型不是宽模型硬截。
- example:57–75 的 onChange 使用 updater 中当前模型，克隆 SDK callback 项，并对 frozen 项恢复当前断点上一份几何；sameGeometry 去重不写共享数组。77–99 的按钮规则写当前断点，101–105重置两份文档/解除锁/清 SDK 观察，changes累计。不应把这些本地内存操作描述为 revision、事务、持久化或撤销。
- example:165–184 的 dragStops/resizeStops 只在真实 API 回调更新，复制 item 几何；185–188 为真实 bounded/handle/se/verticalCompactor。稳定 child key 与 SDK cloneElement/ref/定位兼容；自建按钮不冒充库 sensor。
- [layout-policy](../examples/layout-policy.ts):15–39 只负责投影和独立窄初始化，55–95 列边界/锁定/窄邻居和 min/maxWidth。原 policy6 确实只覆盖这些规则，不测碰撞求解或 DOM。窄 y 交换适用于本例等高 fixture，没有宣称支持任意高度完整排序协议。
- 无障碍：原生 label/select/checkbox/button、含方向和卡片名的 aria-label、disabled 与实际可执行规则一致，CSS focus-visible/reduced-motion 与可滚动内容保留。指针标题本身不是语义化键盘拖动 sensor，文档准确声明替代按钮及完整读屏公告未测。提案包含按钮 Enter 与锁定拒绝，不声称等同拿起/放下公告模型。
- 清理：应用无自建 timer/全局 listener，useContainerWidth 实装 cleanup 确有 cancelAnimationFrame、clearTimeout、disconnect。react-resizable 卸载 resetData，react-draggable 卸载自有事件；这仅支持相应源码路径，不等于对所有 SDK 内部活跃资源完成普查，见风险项。

## 复用证据与剩余

本轮只读查看作者 `validation/sdk.txt`（3 PASS）、`policy.txt`（6 PASS）、入口/提案类型与格式/metadata日志，并重算记录 hash；**未重新执行这些套件**。检查阶段没有运行浏览器、全目录类型/构建/生成或新网络抓取；复用固定成功来源，避免重复同一请求。

剩余交主控：实际容器测量/DOM几何、真实拖缩/回写、键盘焦点与锁/宽窄恢复、P2-1迁移盒模型实测，以及上述活跃拖动卸载风险的定向裁决。完整 SDK listener/RO census、touch/OS、读屏公告、SSR hydration、大网格性能与后端持久化仍 NOT_RUN；源码里没有后端/存储实现，不计这些能力 PASS。

本报告写毕即停止全部写入，主控可收集稳定输入；只新增本文件，保留作者与主控的所有改动。


## 增量处置：真实活跃卸载失败与透明发行包补丁

UTC `2026-11-10T15:28:26.040825+00:00`，收到主控明确授权后只读审补丁，仅追加本段。上文“待运行裁决”保留为当时发现状态；**主控后来已真实复现该 SDK 缺陷**，不能继续视为仅假设风险或认定整库content_done。

直接读取主控原始 `docs/library-lab/evidence/quality-upgrade/candidate-14/b15-active-unmount-probe.txt`：实际 cwd=packages/library-lab、命令 `node .local-evidence/b15-active-unmount-probe.mjs`、exit1；真实 dragging=1，卸载前 activeRAF1，保持mousedown卸载后ticks56→80且active1，真实mouseup后仍active1/ticks89。这是主控匹配旧dist的真实回归失败，本复核没有重新执行或改写日志。

只读审 [react-grid-layout@2.3.0.patch](../examples/react-grid-layout@2.3.0.patch)：1201B，SHA256 `65db3074ef40503b9bfda2b68c12c7d39c1aa7e93efc1fade47fcd6298552940`。补丁仅含两个分发文件的对称4行新增：

- `dist/chunk-Z6CWRR74.mjs`：GridItemInner 的 edgeScrollRef 后增加原已导入的 `useEffect` 清理；原分发SHA256 `da7ffdc152affdf205cea64afcb6ffcccb6a1588f532c9d8d686c1f054e33ee3`。
- `dist/chunk-CUP5Y2ZG.js`：同一位置以已有 `React2.useEffect` 做完全同形清理；原分发SHA256 `5970c0d5470149b5183a71bb6b717eb1f82328a54142041ad99a8faea585288d`。

两处都是卸载时 `edgeScrollRef.current?.stop(); edgeScrollRef.current = null;`，空依赖且没有条件hook。真实controller.stop只置本controller.running=false、cancel自己的rafId并清自身id；cleanup再放空自有ref。正常onDragStop已stop/清空时安全幂等，StrictMode空ref setup/cleanup不制造资源。没有setState、dispatch/模拟mouseup/伪造SDK回调、全局RAF遍历或全局监听清理，不会把一次未结束拖动写成用户已drop。

实际package.json exports的`.`、`./react`、`./legacy`分别把ESM导向上述mjs chunk、CJS导向上述js chunk；两个包含controller的实际分发均覆盖，`./core`为纯几何、无需变更。安装包无src目录和source map，不需修改虚留的顶层index-dev.js或类型声明；上游源码对应 `src/react/components/GridItem.tsx` 的同ref位置。当前补丁准确局限发行包内部生命周期，没有碰几何/布局输出/API/CSS或README。

只读确认根 `pnpm-workspace.yaml` 的 `patchedDependencies` 已将精确 `react-grid-layout@2.3.0` 指向本条目该patch，由主控负责patch-commit/install及lock校验，本复核没有操作node_modules、workspace.yaml或lock。审查时安装仍由主控进行，**本段只确认补丁文本/入口覆盖和所有权，不能声称已安装或修后browser通过**。

迁移交付应携带这个固定版本patch及对应包管理器配置，明确“上游2.3.0 + 本地cleanup补丁”；更新必要sourceFiles/guide/agent/本地输入摘要，原4文件迁移说明不能静默遗漏这项运行前提。官方README与tag仍保留原始上游字节，不能改写成上游已经发布修复。patch内容、映射/锁与新SDK源码摘要均应作为新候选输入，不复用旧候选的运行收据。

**增量复核结论：静态补丁通过，真实修后回归待主控build。** 需重跑已失败的active-unmount探针并保留真实鼠标路径，同时定向检查正常drag stop和切断点/停止卸载；不靠模拟事件清理，不重复与此无关的数值/SSR3或policy6套件。正式收据仍NOT_RUN；完整活动资源普查等上文未测项保持原边界。

本段写毕再次停止全部B15写入；后续C06仅只读预审。
