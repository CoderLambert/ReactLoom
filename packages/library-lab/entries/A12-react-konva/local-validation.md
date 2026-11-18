# A12 react-konva 本地整改与稳定交接

日期2026-11-10，owner `/root/quality_e11`。实际repo cwd `/home/lambert/githubRepos/lambert/ReactLoom`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。进入9文件、本条目无初始dirty；排序相对路径NUL+bytesNUL摘要 `97f51788cd8c48240512f3a514e32b3423561f53a2998e102e2de650e4b3f9a2`。根/本包/条目AGENTS、协调/实施/整改、质量路线图及quality Skill三个references已读。主控明确释放独占A12后实施；中途按要求只读review A11，未写A11。

只改A12，保留他人修改；无公共src/scripts/tests/e2e/runners、依赖/锁、queue/index/results修改，无全目录generate/typecheck/build、真实浏览器、提交或推送。formal sdk/build/browser保持NOT_RUN，交review_pending而非content_done。

## 保留与整改

原代码已有三个有效目标，保留三节点、Stage两层、稳定key、拖拽实时夹取和结束state提交、同源DOM坐标表、24上限、仅锁拖拽及RO/rAF清理。没有引入Transformer/PNG/网络/白板服务或第二个命令式Stage。

本次正常排版，必要样式抽成styles.css并列入sourceFiles。添加根状态/Stage容器/DOM表行id与坐标，便于对照真实Canvas；表格增加row header与唯一动作名，空选择禁用删除。保留原level变化重置fixture语义，用针对性依赖注释说明。修正文档把“第24节点不放行”的错误：23可加到24，之后拒绝。

三个目标为basic选择/键盘DOM移动→React props→实际Canvas与同源表；business真实指针拖拽预览→受限世界坐标提交；advanced稳定增删、锁定仅拖拽、窄容器缩放世界投影及卸载。锁定不是只读，DOM操作仍可用。虚线来自相邻数组，松手后state提交才跟随，不冒充端口或执行边。

## 六项状态

| 维度 | 状态 | 实际证据层级与边界 |
| --- | --- | --- |
| 技术准确 | PASS | 已装19.3.2/10.9.0源码和类型核对；真实renderer2/2、政策5/5及入口类型通过；区分临时attrs/props、世界/屏幕、React/renderer StrictMode和Stage所有权。 |
| 解释清楚 | PASS | 从编辑草图的工程问题到三实验、坐标、迁移与资源，步骤和控件/数据一致；删重复未实施生产教程。静态复核。 |
| Demo有用 | NOT_RUN | 三目标实际调用目标库、Node renderer通过；Canvas绘制/命中/指针/缩放与卸载仍待主控browser，不从Node推出。 |
| 源码可迁移 | PASS | 4必要文件/样式/匹配依赖与浏览器前提完整，类型/格式通过；Stage由SDK拥有，RO/rAF由组件清理，动态资源需browser再验。 |
| 官方来源可靠 | PASS | 固定19.3.2原文/完整两候选无中文/commit/path/version/lang/date/hash；官网完整响应SAMEORIGIN，blocked理由正确。 |
| 结果可复核 | NOT_RUN | 本地命令/退出/日志与提案可复核；运行核心Canvas未由本工作者执行，不标正式PASS或content_done。 |

## 版本与来源

安装react-konva19.3.2、konva10.9.0；react-konva声明React/DOM ^19.3.0，本仓库19.3.0匹配。核对实际ReactKonvaCore的Stage独立root、props应用、destroy/effect重放、事件同步和types；makeUpdates/HostConfig处理事件替换与子节点卸载。Stage错误边界必须内部的说法与官方兼容文档一致；本例没有边界或Transformer。

官方tag v19.3.2 annotated `d4404cdd652cc204e26208d41fa22315b782a1dd`解引用 `c89132f5c9ac5a47db1c7c6b6fd1012452df2e01`。实际完整tree truncated=false，仅README.md与benchmarks/README.md，无上游中文README；固定package.json为19.3.2。原文5846字节/en，SHA-256 `d68e0efcca393b46e93a75b673d3a91e880b17f9de8760ba29fb65be93fbae7b`，同步 `2026-11-10T11:50:53.166158+00:00`。安装包README原始字节独立比对一致；候选/来源在source-audit.json和library.json，简要原始命令在validation/source-check.txt。

官网React入口GET200，最终 `https://konvajs.org/docs/react/index.html`，完整最终响应在official/homepage-response.json，XFO `SAMEORIGIN`。明确禁止Lab跨源嵌入，因此blocked并保留直达；没有把未browser检查当成必须unknown，也没有从200推定allowed。

## 实际检查命令

以下实际cwd均 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；validation/*.txt逐条记录command/cwd/exit/output，未用根忽略的*.log。

| 命令 | exit | 结果与日志 |
| --- | --- | --- |
| `node --test entries/A12-react-konva/tests/sdk.test.mjs` | 0 | 2/2真实react-konva renderer：稳定节点/props更新、事件替换和卸载解绑；普通Node自然退出，无force-exit。validation/sdk.txt。 |
| `node --test entries/A12-react-konva/tests/stage-policy.test.mts` | 0 | 5/5既有政策：测量、缩放、夹取、24上限、新节点布局；validation/policy.txt。 |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/A12-react-konva/examples/demo.tsx` | 0 | 当前入口/直接依赖；validation/typecheck.txt。 |
| `pnpm exec biome check --write entries/A12-react-konva/examples entries/A12-react-konva/tests entries/A12-react-konva/validation/check-entry.mjs entries/A12-react-konva/library.json entries/A12-react-konva/verification.json entries/A12-react-konva/official/source-audit.json entries/A12-react-konva/official/homepage-response.json` | 0 | 11文件，无诊断；validation/biome.txt。 |
| `node entries/A12-react-konva/validation/check-entry.mjs` | 0 | validateEntry/completeness、3目标4源文件、版本、原文hash；validation/metadata.txt。 |
| `pnpm exec biome format --stdin-file-path=entries/A12-react-konva/validation/browser-proposal.ts < entries/A12-react-konva/validation/browser-proposal.txt` | 0 | 提案正常格式；validation/proposal-format.txt。 |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node entries/A12-react-konva/validation/.browser-proposal-check.ts` | 0 | 相同源码临时.ts类型通过，检查后删除；validation/proposal-typecheck.txt。 |

SDK套件实际导入react-konva/Konva/React，调用公开KonvaRenderer把声明式Group/Rect协调到真实脱离Canvas的Konva.Group，核对同实例x/fill、事件替换与解绑。没有mock SDK或用普通对象冒充实例；没有创建Canvas/Stage，不证明绘图和命中。该测试专用根不是应用的另一套可执行Demo，不复制生产实现。

SDK/政策/入口类型在逻辑完成后通过，随后仅格式/文档/提案整理，不重复有效检查。初始独立Biome format调用退出1（npm无法确定执行命令）和随后的无匹配patch未改源码，记录tooling-initial.txt；最终check --write已正常格式化且exit0。没有为工具错误安装包或改全局配置。

## 真实浏览器提案与剩余

validation/browser-proposal.txt是完整3项准备好的真实Playwright源码，尚未执行；没有改公共e2e。

1. basic实际两层Canvas：DOM键盘右移使行x28→40，并读取真实前景Canvas像素，旧位置清空、新位置有填充；实际Canvas点击审核节点同步DOM选择。没有只检查state就声称绘图。
2. business实际指针拖动采集节点到(88,98)，表与真实像素对应；继续在舞台内将卡片尝试越界，最终夹到(488,208)。指针坐标按当前scale投影，业务坐标保持世界单位。
3. advanced锁定时实际拖动不改坐标，DOM右移仍可；新增step-1再删除，初始id保留；1200→600视口使Stage缩放，世界坐标不变且真实像素位置按scale正确；停止移除Canvas、重进两层/初始状态、离开页签无Konva容器。

像素取样读取实际2D context/getImageData，不注入图元或SDK测试API，不以截图替代结果。政策已覆盖24上限和非法数值，提案不重复24次点击。触控/IME/完整读屏、正常设备高DPR性能、SSR hydration均NOT_RUN。

根a12-workshop data-level/width/scale/selected/count/locked；a12-stage-host、a12-table tr data-node-id/x/y/selected、a12-status。控件原名保留；Canvas本身无DOM图元，表和原生控件是等价操作入口。无新增公共需求。

## 变动与交接

修改guide/agent/library/verification/example；stage-policy、原policy suite/demo正常排版。新增styles.css、tests/sdk.test.mjs、official原文/来源/完整头、validation提案/核对/日志及本记录。AGENTS与来源事实保留。完成STABLE后停止所有条目源码/文档/日志写入，等主控独立review、稳定候选共享构建和browser。


## 主控本地运行闭环

candidate-08稳定1870输入，类型/build/catalog及新e2e lint exit0；非作者独立复核无未处置P1/P2，真实Chromium本库全部选定目标通过。

最终状态content_done，实际命令/候选摘要/首轮FAIL与必要重跑/独立评论和范围见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/A12.md)。正式sdk/build/browser仍NOT_RUN；dev StrictMode重放、完整读屏/触控/跨浏览器/大规模性能未由生产预览通过推定。
