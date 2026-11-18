# C06 IMask 质量整改：INTERMEDIATE

稳定时间 UTC `2026-11-10T15:34:59.725647+00:00`；实际 cwd `/home/lambert/githubRepos/lambert/ReactLoom`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。原11文件干净，逐项SHA与状态见[baseline](validation/baseline.json)。主控已认领owner=/root/quality_f05并授权独占本条目；保留其他工作者，未改公共src/scripts/e2e/依赖锁/索引/queue/results，未install/提交/推送，未全目录生成/类型/构建或运行浏览器。

这是主控candidate15收集输入前的**可编译中间检查点，不是整库完成**。本段与agent追加后停止全部C06写入（含guide/log/metadata），等待明确release。正式verification的sdk/build/browser均仍NOT_RUN。

## 已实现与真实所有权

- 保留原编号Pattern、Number金额、日期Pattern/公历helper与普通中文备注三个独立目标；现有SDK3（纯createMask模型）与calendar policy3原算法未改，尚未在本整改执行。
- SDK拥有masked输入DOM/光标，IMaskInput没有value属性，React只观察onAccept业务值，不用onChange改masked输入或直接写input.value。真实onAccept/onComplete回调给出的maskRef读取value/unmaskedValue/typedValue/masked.isComplete；初始null，无伪造预置快照。
- MaskSession key=level隔离场景，避免新空DOM配旧raw/计数；显式reset才增加generation，清快照/计数/备注/组合观察。普通按键不换key。reset会更换DOM、不承诺保焦点。
- type=text与numeric/decimal inputMode显式声明。中文备注普通受控文本不套mask，无提交快捷键；composition事件只观察状态，blur清观察，未声称系统IME已测。
- scoped styles含局部border-box、焦点/换行/最大宽度；5必要sourceFiles包含原mjs/.d.mts/新CSS/入口。原calendar用setUTCFullYear保留0–99年规则，没有Date.UTC重映射。
- 日期不完整允许继续输入；10字符再区分真实公历，并aria-invalid/description；complete是SDK模型状态，不是业务日期/财务有效性。Number typedValue仍是JS number。

## 六项当前状态

| 项 | 中间结论 | 现有依据/未完成 |
| --- | --- | --- |
| 技术准确 | NOT_RUN（整库）；静态匹配/入口类型有效 | 实装imask/react-imask7.6.1/MIT；wrapper onAccept(value,maskRef,e)、unmask三值、componentWillUnmount→destroyMask与实际源码匹配；模型/React真实验证待后续定向执行。 |
| 解释清楚 | NOT_RUN（尚在整改） | 原guide/agent追加实际非受控owner与迁移增量；完整重写及重复维护历史清理待release。 |
| Demo有用 | NOT_RUN | 三目标保持且增加真实SDK观察，输入/光标/complete/金额commit/公历/IME/生命周期未浏览器运行，完整三case提案待写。 |
| 源码可迁移 | NOT_RUN（完整验收）；静态/strict入口通过 | 正常排版、5文件/必要CSS/无Lab alias；完整迁移与运行产物待收尾。 |
| 官方来源可靠 | NOT_RUN（缺快照） | 已只读核安装manifest/README/源码和公开v7.6.1 React README、官网guide。尚未保存固定commit原文/中文候选tree/完整官网头，不伪造official元数据。 |
| 结果可复核 | NOT_RUN（整体运行）；限定类型/格式有日志 | 本轮仅源码格式/strict入口exit0，精确cwd/argv/UTC/exit见下；未运行SDK/policy/browser，不把共享candidate构建当正式收据。 |

## 实际命令与证据

两条均 cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；完整argv/start/end/exit保存在[local-runs](validation/local-runs.json)。

| 命令 | exit/产物 |
| --- | --- |
| `pnpm exec -- biome check --write entries/C06-imask/examples entries/C06-imask/library.json` | 0，6文件正常排版，[format-intermediate](validation/format-intermediate.txt)。 |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C06-imask/examples/demo.tsx` | 0，入口与真实React包装器类型，[types-intermediate](validation/types-intermediate.txt)。 |

实际源码核对但未运行：react-imask esm/mixin.js的getter按unmask选择value/unmaskedValue/typedValue；componentWillUnmount调用destroyMask，真正InputMask.destroy解绑view事件/清listeners与cursor任务。只读官方guide说type=text、模型/视图分层、mask类型不要原地互换；Node3原测试是model，不能证明React/浏览器光标或IME。

## 释放后剩余

保存与7.6.1匹配包的官方原README、完整tree中文候选/固定commit/version/lang/time/SHA、官网完整响应证据（无真实Lab浏览器只能unknown或明确blocked）；写完整中文/agent与SDK/React边界；准备三目标真实browser-proposal（无SDK mock），真实model与policy适度定向验证/原始日志；metadata/source审计与最终输入摘要/六项收尾。依赖安装与共享候选由root负责，本工作者不扩大范围。

INTERMEDIATE STABLE，停止全部写入，不能登记content_done。
