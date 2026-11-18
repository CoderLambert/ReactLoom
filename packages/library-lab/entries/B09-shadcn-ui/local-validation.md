# B09 shadcn/ui 本地整改与定向证据

时间：2026-11-10。实际仓库 cwd：`/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。认领输入为10文件、SHA-256 `623e37eb2fa1535f1cd6403ade7d1c5becef4c5320640d16bbe051dfe2fdc705`；开始时本条目无已有 dirty。owner `/root/quality_e11`，已读取适用根/本包/条目规则、当前事实文档和质量 Skill 三项 references。

只修改本条目，保留其他写入者；共享冻结时仅做只读调研，收到主控释放后实施。没有运行整目录 generate/typecheck/build 或浏览器；没有修改公共宿主、依赖锁、索引、队列/results，没有提交推送。`verification.json` 的正式 sdk/build/browser 均保留 NOT_RUN；本地检查不冒充 CLI 生成记录或正式收据。

## 问题与本次处理

旧材料混入未核实的默认基座和2026迁移推断；高级场景重复归档列表，业务只有成功定时器；源码密集排版，也缺乏让读者看见实际类生成的输入输出。本轮保留原创 Button、文章及已有效的归档 helper，将三个目标分开：

| 场景 | 目标、操作与可观察结果 | SDK 与 fixture 分界 |
| --- | --- | --- |
| basic | 改 variant/size；px-8 覆盖小尺寸 px-3；预览按钮与实际 class 输出对应；键盘/disabled操作计数 | 真 CVA/clsx/tailwind-merge 和原生 button；无模型/服务 |
| business | 选文章→模拟失败→保留选择/文章→关闭失败重试；取消/恢复示例让旧epoch失效 | 真本地 Button；250ms定时器及文章是业务fixture，无HTTP/持久化 |
| advanced | Slot的唯一a节点保留片段导航；无权限改无href span；原生disabled独立检查 | 真Radix Slot，浏览器提供链接/按钮原生语义 |

Button仍是原创教学源码，没有执行shadcn CLI或声称Registry原件。保留原CVA四变体/三尺寸与配色，只增加明确原生type=button默认值和可检查的data-variant/data-size；正常排版。页面样式限定在本条目；revert-layer适配Lab未分层的通用按钮规则，避免它盖住真实Tailwind类，不再复制一份变体CSS映射。

## 六项复核

| 维度 | 状态 | 证据层级与结论 |
| --- | --- | --- |
| 技术准确 | PASS | 静态版本/实际源码与真实依赖SSR：CVA0.7.1、Slot1.5.0、clsx2.1.1、tailwind-merge3.7.0匹配已安装包；4项SDK组合断言通过。明确源码归属、type/disabled、原生链接和应用权限语义。 |
| 解释清楚 | PASS | 静态教学复核：guide从问题/所有权到class生成→三场景→固定上游差异→迁移和资源边界，删除未经核实的默认基座推断及重复反例。 |
| Demo 有用 | NOT_RUN | 三目标对应真实实现和可观察成功/失败/恢复；Node SSR已执行，键盘、样式、实际异步控件/生命周期尚待主控浏览器。 |
| 源码可迁移 | PASS | 正常排版、单入口类型通过，7份显示源码含必要样式/策略/测试；源码只用相对导入与声明依赖，迁移的React19/Tailwind4前提清楚；定时器真实清理仍待浏览器。 |
| 官方来源可靠 | PASS | CLI包README原文固定commit、英文选择依据/版本/日期/sha齐全；官网完整头保存，未实际嵌入而记unknown。明确官方资料版本与原创Demo的不同来源。 |
| 结果可复核 | NOT_RUN | 下列本地SDK/策略/类型/metadata日志明确cwd/命令/exit；真实浏览器及共享构建没有由本工作者执行，不能晋级content_done。 |

## 官方资料与版本

固定仓库 `shadcn-ui/ui`，提交 `8ab27715521cbd4f87ae6886cd989cbb678f6de7`。实际读取该提交递归tree，根与目标CLI包README候选为 `.changeset/README.md`、`README.md`、`packages/shadcn/README.md`；没有目标包/根中文README。根README是平台概述，选择目标CLI包README作为原文快照，路径 `packages/shadcn/README.md`。

固定提交的 `packages/shadcn/package.json` version为 **4.23.0**，这是资料版本；未安装或执行该CLI。原文字节保存到 `official/readme.md`，1317bytes，SHA-256 `13d1235d1690dad504c4dd423d4f237a9a74eb8f2e49e7ee39f9c995ba7c0856`，匹配元数据；时间 `2026-11-10T09:40:38.845457+00:00`，来源及候选见 `official/source-audit.json`。

实际对照上游 `apps/v4/registry/new-york-v4/ui/button.tsx`：使用radix-ui与cn包、6变体/8尺寸，主题token；本例使用单包Slot、本地cn、4变体/3尺寸、原创颜色与type默认值。上游文件SHA `79dd6f75f8136394442202d6b8b922fb269eaad0a5dba579397c9d5b41f893bb`记录在source-audit，不把对照当逐字复制。

官网 `https://ui.shadcn.com` GET 200，最终URL相同；`official/homepage-response.json`保留完整响应头和显式XFO/CSP null。没有限制头不足以证明从Lab origin可嵌入，所以unknown且保留直达。浏览器嵌入检查NOT_RUN。

[官方概念](https://ui.shadcn.com/docs)、[Radix Button](https://ui.shadcn.com/docs/components/radix/button)、[固定Button源码](https://github.com/shadcn-ui/ui/blob/8ab27715521cbd4f87ae6886cd989cbb678f6de7/apps/v4/registry/new-york-v4/ui/button.tsx)、[Slot文档](https://www.radix-ui.com/primitives/docs/utilities/slot)作为主要资料；Slot官网页显示1.4.0，关键行为另核对已装1.5.0的dist/index.d.ts与dist/index.mjs，不把网站版本冒称完全匹配。Context7两次文档查询返回monthly quota exceeded，未尝试新增凭据；使用官方原文/已安装源码完成核对。

## 实际命令与日志

下表命令实际cwd均为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，原始输出均保存在本条目 `validation/*.txt`，不会被根gitignore的 `*.log` 吞掉。

| 命令 | exit | 实际结果/日志 |
| --- | --- | --- |
| `pnpm exec biome check --write entries/B09-shadcn-ui/examples entries/B09-shadcn-ui/tests entries/B09-shadcn-ui/validation/check-entry.mjs entries/B09-shadcn-ui/library.json entries/B09-shadcn-ui/verification.json entries/B09-shadcn-ui/official/source-audit.json entries/B09-shadcn-ui/official/homepage-response.json` | 0 | 12文件定向检查；`validation/biome.txt` |
| `pnpm exec biome check entries/B09-shadcn-ui/tests/sdk.test.mjs` | 0 | 测试转换配置最终小改后仅核对该文件；`validation/biome-sdk.txt` |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B09-shadcn-ui/examples/demo.tsx` | 0 | 本条目入口与直接依赖类型，无诊断；`validation/typecheck.txt` |
| `node --test entries/B09-shadcn-ui/tests/sdk.test.mjs` | 0 | 4/4：实际Button classes/原生disabled/type/Slot根节点/多子元素拒绝；`validation/sdk.txt` |
| `node --test entries/B09-shadcn-ui/tests/archive-policy.test.mts` | 0 | 4/4：有效ID快照、不可变归档、幂等和epoch；纯策略不计SDK；`validation/policy.txt` |
| `node entries/B09-shadcn-ui/validation/check-entry.mjs` | 0 | 现有validateEntry和entryCompletenessIssues只读B09；3场景、7源码路径、原文摘要通过；`validation/metadata.txt` |
| `git diff --check -- entries/B09-shadcn-ui` | 0 | 无空白问题；`validation/diff-check.txt` |

SDK suite用已安装Vite的transformWithOxc在**内存**中对当前真正button.tsx做automatic JSX语法转换，将其中npm导入解析为已安装模块再做React SSR；没有生成第二份源码、没有调用Vite build、没有启动服务。真实CVA/Slot等均执行，这一结果不证明CLI生成一致性或浏览器键盘事件。

首次Biome将片段链接的onclick计数识别为按钮动作，exit1保存在 `validation/biome-initial-failure.txt`；已移除该onclick，仅保留href的原生导航，按URL hash验收，无lint忽略。测试在源码正常排版后改用与Vite React项目一致的automatic JSX转换；随后的单文件Biome发现一处缩进，exit1在 `validation/biome-sdk-initial-failure.txt`，仅修正缩进并重跑失败检查。SDK最终4/4通过，其后只改缩进未改逻辑；未重跑有效策略或扩大全量检查。

## 给主控的真实浏览器断言（本工作者 NOT_RUN）

共同根：`data-testid=b09-workshop`、`data-level=basic|business|advanced`。当前宿主进入Demo自动挂载。

1. basic：label“变体”select取default/secondary/outline/destructive；“尺寸”取default/sm/lg。选outline+sm，预览的data属性和class对应。勾“用 px-8 覆盖间距”，`b09-class-output`和`b09-button-preview`实际class含px-8、无px-3；实际padding-left/right应为32px。键盘Tab焦点环；Enter/Space激活“预览按钮”，`b09-activation-count`增加；勾“禁用预览按钮”后不能激活。可检查默认/危险操作的computed颜色，验证宿主样式未盖住变体。
2. business：文章checkbox标签原样为“React 工程工具精选”(a1)、“开源项目趋势”(a2初始已归档/disabled)、“架构复盘周报”(a3)。选择a1，勾“模拟归档失败”，点“归档已选 1 项”；pending时名字“归档中…”，选择与开关disabled；250ms后`b09-archive-status[data-state=error]`，a1仍未归档、选择保留、`b09-archive-count`仍1/3。取消失败开关重试后success、a1归档、2/3、选择清空。
3. business：恢复后选择a1并开始，点“取消本次归档”，等超过250ms不归档且选择保留；再次开始并点“恢复示例文章”，旧结果不能写回，状态idle与1/3。播放中离开场景/Tab，对本例delay=250 timeout instrumentation确认清除；再次进入回初始。不要仅用空白UI证明清理。
4. advanced：`b09-slot-link`允许时为唯一a(data-slot=button)，无嵌套button，href=#b09-slot-target；focus+Enter后URL hash改变。取消“允许打开示例详情”后变span且aria-disabled=true、无href/tabindex，不作为link进入Tab。`b09-native-disabled`的disabled与触发计数恒0。链接不要求Space触发按钮动作。官方外链新页/rel正确。
5. 桌面与窄屏观察控制区换行、类输出不溢出、归档失败文本可见；README固定来源/英文/版本/原文入口与官网unknown一致。

## 改动文件与剩余项

修改guide.md、agent.md、library.json、verification.json、examples/example.tsx、examples/ui/button.tsx；example/demo、archive-policy与既有policy test正常排版。新增workshop.css、tests/sdk.test.mjs、official/readme.md、official/source-audit.json、official/homepage-response.json、本记录与validation日志/单条核对器。AGENTS.md保持原规则，既有原创Button来源事实与研究恢复属性保留。

待主控独立复核与真实浏览器，以及下批稳定输入后的共享构建；正式verify:record仍需将来获准且干净已提交的输入。当前交付review_pending候选，不标content_done。无新增依赖、公共API或宿主改造请求。
