# ReactLoom 后续完善方向与验收路线

更新日期：2026-11-04（Asia/Shanghai）  
审查基线：[`main@8838380`](https://github.com/CoderLambert/ReactLoom/tree/883838087464b4a5577aa4ff4260c4847bfc12a4)  
范围：SPA、SSR、Mobile、API Client、CLI、Devtools、Library Lab、CI 与工程文档。

本文是下一阶段的工作建议。文中的“建议”“目标”“验收”均代表待办，不代表已经实现或已经授权发布；事实以本次核对的源码、PR 和 CI 为准。

## 1. 核心判断

ReactLoom 已具备可运行、可生成、可验证的工程基础。上一阶段完成的会话隔离、提交失败恢复、服务端边界和 Lab 隔离运行具有实际价值，后续应沿用现有结构。

下一阶段建议围绕两条产品主线推进：

- **模板与脚手架：**让开发者生成项目后，能够明确替换演示认证、接入真实数据，并完成对应平台验收。
- **Library Lab：**让开发者根据业务任务找到合适的库，理解取舍，运行真实示例，并将关键实现迁移到项目中。

当前优先级是：**收口尚未合并的基础修复 → 修正合并后的工程事实和 CI → 完成关键运行链路 → 扩大高价值示例的深度。** 保持两条主线独立分发；Lab 的大型 SDK、Worker/WASM 资源不进入生成模板。

考虑过三种方向：全面扩充库数量、同时重构三套模板、先补可靠性与真实使用链路。推荐第三种：已有目录和基础设施足够丰富，当前收益更高的是减少接入障碍、补齐运行证据和提高示例复用质量。暂不更换框架、状态管理或构建体系。

## 2. 当前状态：已具备什么，仍缺什么

| 模块 | 已核实的基础 | 下一项实质缺口 |
| --- | --- | --- |
| SPA | #91 已合并；会话过期、用户缓存隔离、提交防重、草稿保护和服务端 ID 回填已实现 | 把单测中的关键竞争与失败场景补到少量真实浏览器流程；验证后端接入说明 |
| SSR | #88 已合并；生产密钥约束、请求来源/JSON 校验、私有响应 no-store、提交恢复已实现 | `tasks.ts` 仍为进程内数据与固定演示账号，尚不能作为持久化业务后端 |
| Mobile | #92 已合并；完整 Session 持久化、过期/前台检查、Bearer HTTP 任务接口及会话缓存隔离已实现 | fixtures=false 的实际后端联调、SecureStore 和应用重启/前后台的原生验收 |
| API Client | main 已有错误类型、重试、超时和取消接口 | #89 中的非 JSON HTTP 错误分类、异步取 token 取消、请求初始 URL 来源约束仍未合入 main |
| CLI | 已能生成三套独立项目并安装、检查、测试和构建 | #94 的源文件符号链接防护待集成；对外分发方式尚未形成完整交付链路 |
| Devtools | 已有统一 Web 面板、源码跳转、诊断命令和生产构建裁剪 | #3 的编辑器配置传递及 socket 保护待集成；实际桌面激活仍需设备验证 |
| Library Lab | #8 已合并；119 条目录、四 Tab、源码同源、按需加载、证据校验和受控 runner 已存在 | 逐条目证据、部分生命周期断言、真实文件覆盖和高价值教学深度仍需补齐 |
| CI 与文档 | main 根 CI 已通过；Lab 有独立选择器和冻结安装门禁 | Lab push 仅监听 `feat/library-lab`；多个现行说明仍写旧分支/旧阻塞状态 |

### 已有验收证据的边界

- 合并后的 [main CI 41782118064](https://github.com/CoderLambert/ReactLoom/actions/runs/41782118064)：七项作业通过；SPA 40 项单测及 1 项浏览器用例、SSR 54 项单测及 6 项浏览器用例、Mobile 66 项单测与 Expo Web 导出通过。脚手架生成的三套独立项目检查也通过。
- 合并前 Lab 精确提交 `edf4178` 的 [Lab CI 41779873259](https://github.com/CoderLambert/ReactLoom/actions/runs/41779873259)：冻结安装、完整类型检查、三个生产构建、153 项 SDK 测试、16 项 Vitest 测试、45 项 Chromium 用例通过。
- 第二项是该 Lab 提交的执行证据，**不是 main 合并后重新运行的 Lab 专用 CI**。根 CI 与 Lab 专用运行应分别记录。
- 119 是目录条目数；153、16、45 是对应套件的测试数，不能换算为已验收的库数。Expo Web 导出也不等于 Android/iOS 真机通过。

## 3. 第一优先级：收口现有成果与工程事实

### R1 · API 与 CLI 的基础修复入主线

**优先级：#89 为 P0；#94、#3、#93 为 P1。** 先处理已有修复，避免另外实现同一逻辑。

| PR | 当前事实 | 建议动作与合入门槛 |
| --- | --- | --- |
| [#89](https://github.com/CoderLambert/ReactLoom/pull/89) | Draft；`efcc180e` 的 [CI](https://github.com/CoderLambert/ReactLoom/actions/runs/41775843187) 全通过，含 15 项 API 测试 | 对齐最新 main，复核错误、取消与初始 URL 来源三个契约；更新 Changeset 后通过组合验证 |
| [#94](https://github.com/CoderLambert/ReactLoom/pull/94) | Draft；`8f6b195d` 的 [CI](https://github.com/CoderLambert/ReactLoom/actions/runs/41775916771) 全通过，CLI 98 项测试 | 补齐/协调 CLI patch Changeset，复核符号链接文件、目录及祖先路径的拒绝行为，并重跑独立生成验证 |
| [#3](https://github.com/CoderLambert/ReactLoom/pull/3) | Draft；`61272458` 的 [CI](https://github.com/CoderLambert/ReactLoom/actions/runs/41773671342) 全通过 | 保留编辑器配置、socket 保护与 Git 初始化的独特修复；与 #94 顺序集成并检查 Changeset、生成产物 |
| [#93](https://github.com/CoderLambert/ReactLoom/pull/93) | Draft，仍指向 `feat/library-lab`；`a12088d7` 的 [Lab CI](https://github.com/CoderLambert/ReactLoom/actions/runs/41775429756) 与根 CI 通过 | 调整到新的集成基线，保留 D03 活跃取消后等待 allSettled、同组件立即重开的浏览器断言 |

其中 #89 优先级最高：main 的 `joinUrl()` 接受外部绝对 URL，后续会附加 token；如果调用方将外部 URL 传为 path，存在凭据发送到非预期来源的风险。这是条件性风险，不代表已经发生泄露，也不代表当前固定任务路径已被利用。验收应证明拒绝发生在读取 token、发出请求之前，同时保留同源请求。重定向链是另一项边界，不能由初始 URL 测试推导为已经覆盖。

#94 的风险来自实际源树中的符号链接，已合并的 manifest 字符串路径校验不能替代它。#94、#3 与 #93 属于 P1 的已有成果，可分别随 CLI、Lab 的集成批次处理，无需阻塞 #89 的独立修复。

上述 CI 都绑定各自 head，不能直接当作与最新 main 组合后的结果。本轮仅制定路线，不自动合并这四个 PR。

### R2 · 统一合并后的事实、分支规则与 CI

**优先级：P0；可与 R1 独立推进。**

已确认的漂移包括：

- `docs/library-lab/IMPLEMENTATION.md` 仍写完整生产预览未通过、Runner/registry 阻塞未解除。
- `COORDINATION.md`、本包 `AGENTS.md` 等仍要求保持 #8 Draft，开发合同仍围绕旧集成分支。
- Lab README、整改说明及 #12/#85 的 Issue 正文仍包含旧锁文件或旧执行状态。
- `.github/workflows/library-lab.yml` 的 push 分支只有 `feat/library-lab`，没有 main。
- `scripts/local-verify.mjs` 的 `--resolve-lock` 分支限制仍固定为旧集成分支。
- 根 README 写 Node 22.14 起，Lab 验证入口要求 Node 22.18 起；需要明确仓库整体与独立模板各自的最低版本，避免读者按较低版本安装后卡住。

建议统一采用“**最新 main → 模块工作分支 → PR → 用户确认合并**”。如继续保留 Lab 集成分支，则明确其与 main 的同步责任，避免同时存在两套当前基线。旧整改报告保留为有日期的历史材料，现行入口改指向最新状态；不删除旧失败记录或重置已有调度轮数。

修改范围：Lab 当前说明、协调合同、相关验证脚本、根/Lab CI，以及对应任务的现行执行说明。根配置与锁文件仍由一个集成人负责。更新自动任务或 Issue 时应按其实际授权执行，本文不代表已修改调度。

**完成标准：**

1. 新任务读取入口后能确定当前基线、开放 PR、写入范围和下一项；不会重新处理已恢复的安装/Runner 阻塞。
2. Lab 的受影响 main push 有实际运行记录；公共宿主、lock、依赖或 CI 变化触发完整 Lab 验证，不能跳过运行门禁。
3. 使用既有 `ci-scope.mjs`、`ci-targets.mjs` 和测试，覆盖“文档改动、单条目改动、公共改动、无法取得 diff”四类选择结果；不新建任务调度系统。
4. #12 按恢复证据处理；#40 区分已完成的 Gantt 隔离与尚待绑定的条目证据；#22 区分版本对齐与复杂 PDF 验收；#85 不再以旧缺失清单描述全部现状。

## 4. 第二优先级：补齐真实使用链路

### R3 · 把模板的后端替换路径做完整

**优先级：P1；先完成 R1 的共享 API 修复。**

推荐保留三套模板的运行方式，提供一个可选参考接入路径。SSR 的 httpOnly Cookie 与 Mobile 的 Bearer Session 各有边界，不应为了代码统一而强行共享浏览器 token 存储或直接复用登录响应。

首批交付应包含：

- 一份认证/任务接口契约：字段、错误、过期时间单位、401 语义、CORS、取消和 mutation 重试策略。
- 明确哪些模块是演示实现，哪些由业务后端替换。SSR 当前固定账号和进程内仓库不得被描述为生产身份与持久化方案。
- 一个可重置的参考后端或适配示例，证明两位用户的数据隔离、任务写入后重启仍存在，以及过期/无权限请求的行为。生产认证与存储选择独立于模板，不在三个模板中各复制一套后端。

**验收：**从脚手架生成的项目出发，按说明配置并走完登录、列表、创建、更新、退出；故障后重试不重复创建，旧用户响应不污染新用户，服务端按身份授权，客户端缓存清理不能替代服务端授权。

范围：`templates/*` 的接入点、SSR `src/server/` 的可替换边界与相关文档。是否引入数据库/身份服务属于此批次的具体方案选择，需结合参考部署环境确定；不预设新建独立后端框架或多租户平台。

### R4 · Mobile 从 Web 验证推进到原生验收

**优先级：P1；与 R3 共用接口契约，可先用受控测试后端推进。**

当前 `.maestro/login.yaml` 只覆盖登录后看见任务页，CI 不启动模拟器。建议先完成一个 Android 原生闭环，再扩展 iOS；平台状态分别记录。

最小验收矩阵：

| 场景 | 期望行为 |
| --- | --- |
| 登录后终止并重开应用 | SecureStore 恢复原用户及原过期时间，不生成新有效期 |
| 后台期间会话过期，再回前台 | 退出受保护页面，用户缓存按会话清理 |
| A 用户请求未完成时退出并登录 B | A 的成功或 401 结果均不覆盖/注销 B |
| 断网、超时、连续点击提交 | 草稿保留、错误可理解、手动重试，不产生重复写入 |
| fixtures=false，设备访问实际后端 | 登录和任务接口真正到达可达地址，服务端能验证 token |
| 原生存储读取/写入失败 | 不无限加载、不误报会话已持久化，允许用户恢复 |

使用既有控制器和 Maestro 流程扩展；设备与后端日志共同证明链路。iOS 未执行时明确保留 NOT_RUN，不以 Android 或 Web 结果替代。暂不为此引入离线数据库、后台同步和另一套认证状态机。

### R5 · Library Lab 完成“可以复用”的验收闭环

**优先级：P1；平台基线依赖 R2，D03 先复用 #93。**

第一批继续收口 A01/B17/C01/D03/E05/F11，补上 C13、F06/F07 的现有风险点；每批选择一个有独立验收价值的行为，不重新搭建宿主。

| 对象 | 已有证据能说明什么 | 下一步要证明什么 |
| --- | --- | --- |
| A01 ECharts | 真实 Canvas、减少动态行为和卸载 DOM 已覆盖 | 实例确实 dispose，相关更新源停止；仅 DOM 消失不足以证明资源释放 |
| B17 / C01 | 已有焦点/IME 和表单数组/reset 场景 | 核查三层示例是否各有明确行为差异，按缺口补定向断言 |
| D03 p-limit | main 覆盖卸载后重建；#93 补活跃取消/同组件重开 | 集成 #93 后确认队列 Promise 结算，运行/等待计数归零 |
| E05 Monaco | 实际编辑器、Worker 创建和环境 lease 释放已覆盖 | 核对 Worker/model 的所有权；分别验证组件拥有的资源释放与允许保留的共享资源，避免将合法共享缓存判为泄漏 |
| F11 MSW | 有独立 origin、会话 scope 和真实请求拦截验收 | 保留双会话与退出边界；未收到清理 ACK 时显示未确认，不声称强杀浏览器后必然同步清理 |
| C13 Gantt | 已有单文档实例、整 iframe 销毁、日期上限及五项真实浏览器用例 | 将已有运行结论与当前输入的条目收据衔接，避免重复改造隔离方案 |
| F06 / F07 PDF | F06 元数据已为 6.3.289，F07 使用本地 worker；F06 有待完成探测任务的 Worker 销毁回归 | 用真实多页/字体/损坏/大文件验证渲染、取消、换文件和 Worker 对齐；不继续把旧版本冲突当作未经修复的唯一问题 |

**证据交付：**复用 `verify:record`，在干净、已提交的输入上执行固定命令，保存日志/收据并检查 sourceFingerprint。每个条目分别记录 SDK、类型/构建、浏览器及适用限制；浏览器专用库使用真实浏览器断言。聚合 CI 通过不直接批量改写 `verification.json`。

**学习质量交付：**每个优先条目都应让读者回答五个问题：解决什么业务问题、何时不用它、最小代码怎样运行、实际项目增加了哪些处理、如何退出并清理。basic 展示最小调用；business 增加一条完整业务流程；advanced 增加一个真实复杂条件。三层若只是标题不同，应合并或补足行为，而非堆代码量。

验收以一次“从 Lab 复制到干净项目”的试用为准：依赖、样式、资源路径和清理逻辑齐全，示例不依赖 Lab 私有全局状态。先把常用库做深，再按实际使用需求扩大范围。

## 5. 第三优先级：使用体验、交付与维护成本

### R6 · SPA/SSR 的浏览器场景与可访问性

**优先级：P1/P2，按可复现问题选择。**

现有单测已覆盖多种会话和 mutation 竞争，无需把每个单测再复制成 E2E。优先选择少量跨层流程：过期时的路由跳转、账号切换与旧响应、失败后重试、延迟成功时保留新草稿，以及 Cookie 响应的 no-store。每个用例必须明确它覆盖的是组件、网络、路由中的哪条组合风险。

增加键盘导航、错误关联、焦点恢复、移动视口和长文本检查。Web E2E 目前关闭 `color-contrast` 扫描，应先检查实际页面和主题，再恢复适用门禁；不将现有 axe 通过解释为完整无障碍认证。

开发配置有一个可验证候选：SPA `vite.config.ts` 对源码跳转读取 `process.env.VITE_DEVTOOLS`，对 Lighthouse 读取 `loadEnv()`。应复现 `.env.local` 关闭开发工具时是否一致，再最小修复；此处是源码支持的待验证项，不是已完成的运行结论。

### R7 · CLI 与 Devtools 的真实交付范围

**优先级：P1 完成 #94/#3；P2 决定分发方式。**

当前 CLI 是 `private: true`，`files` 仅包含 `dist`，生成过程通过 `findRepoRoot()` 找模板和共享文件。已通过的验收证明仓库内生成项目可用，不能据此宣称 npm 包可在任意目录独立初始化。

近期优先把“克隆仓库后生成”流程写清楚并保持稳定。若决定对外分发，再选择随包携带版本化模板或受控下载模板；先做 pack 后离仓库运行的验收，再考虑发布。无需现在直接修改 private 标志或发布 npm。

Devtools 先完成 Omarchy/Neovim 的真实源码定位，再按需要验证 Windows 路径与桌面激活。诊断输出应能解释实际选中的编辑器、配置来源和失败原因，同时避免泄露环境中的敏感值。生产构建继续确认开发工具、mock 和调试入口被裁剪。

### R8 · CI 效率与依赖维护

**优先级：P2；R2 的覆盖正确性优先于提速。**

先从已有 Actions 日志统计安装、构建、浏览器、Lighthouse 和缓存上传的耗时，确定真正瓶颈，再调整路径选择和缓存。目标是文档小改动不触发无关重型检查、模块改动运行相关验证、共享依赖和 lock 改动保留跨模板验证。

保留一个总结果门禁，避免跳过的作业让必要检查长期 pending；“跳过”应能解释原因。重型浏览器覆盖按变更风险与定期完整回归互补，重复失败先分类为安装、构建、测试或基础设施问题，再决定是否重跑。

沿用 pnpm、Turbo、Biome、Vitest、Playwright、Changesets 和 Renovate。升级按相关依赖组进行，记录 frozen install、peer 变化和生成产物结果；不将升级到最新版本本身作为质量目标。

## 6. 推荐执行批次与完成标准

不按日期承诺完成，按可独立验收的批次推进。S/M/L 仅表示相对工作量，分别为局部收口、跨层流程、依赖设备或后端的交付。

| 批次 | 交付 | 依赖 / 大小 | 退出条件 |
| --- | --- | --- | --- |
| 1A | R1：#89 API 契约修复 | 独立，S | 当前 main 上复核、回归及三模板集成通过，完成评审 |
| 1B | R2：事实与 CI 同步 | 独立，M | 文档基线一致，main 上有实际 Lab 专用验证 |
| 2A | #94/#3：CLI 与编辑器收口 | 1A 后顺序集成，M | Changeset 完整；生成产物通过；设备级结论单独记录 |
| 2B | R5：#93 与首批生命周期/证据 | 1B，M | 每个完成项都有针对性行为断言与有效证据，无批量假 PASS |
| 3 | R3/R4：接口参考接入与 Android 原生闭环 | 1A，可与 2B 并行，L | fixtures=false 联调及原生会话/任务矩阵通过 |
| 4 | R6/R7/R8：体验、分发和效率 | 按前述实测问题选择，M | 以接入步骤、实际故障或耗时改善证明收益 |

建议每个实现 PR 聚焦一个用户可感知行为或一个明确工程风险；能够独立审查、合入和回滚。根 lock、公共 CI、生成索引保持单一写入责任；跨模块依赖先形成具体接口约定，不让多个任务分别实现同一公共能力。

### 用这些指标判断是否真的完善

- 生成项目：SPA、SSR、Mobile 三种产物从空目录完成安装、类型检查、测试、构建，并按各平台记录运行范围。
- 真实链路：Cookie 与 Bearer 接口的认证、隔离、过期、取消和失败恢复有明确结果。
- Lab：分别统计目录条目数、可运行示例数、当前指纹的有效证据数、完整生命周期验收数；报告没有隐藏的 FAIL/BLOCKED。
- 教学复用：优先条目通过干净项目迁移，读者能按 guide 完成一个业务目标。
- 工程维护：当前说明与实际 main/开放 PR 一致；CI 耗时和失败类型可从日志核对，不以 PR 数、测试总数或提交次数作为完成率。

## 7. 暂缓事项

- 全面扩充新的库目录、并行重写全部 119 个条目；先提高已收录常用库的可用性。
- 把三套模板合成一个运行时，或为统一代码替换现有框架/状态管理。
- 自研新的插件平台、任务 DAG、证据数据库或通用任意代码沙箱；现有执行器与收据机制优先复用。
- 为模板默认引入多租户、复杂 RBAC、离线同步或大量后台能力；这些应由真实业务需要驱动。
- 未确定分发形态就公开部署私有 Lab、发布 npm 或自动打包大体积媒体/WASM 资源。

## 8. 核对入口

以下源码链接固定到本次审查 SHA；PR、Issue 状态随后可能变化，开始实施前重新读取。

- [当前源码与根 CI](https://github.com/CoderLambert/ReactLoom/actions/runs/41782118064)
- [API Client 请求与 URL 处理](https://github.com/CoderLambert/ReactLoom/blob/883838087464b4a5577aa4ff4260c4847bfc12a4/packages/api-client/src/client.ts)
- [SSR 演示身份与进程内仓库](https://github.com/CoderLambert/ReactLoom/blob/883838087464b4a5577aa4ff4260c4847bfc12a4/templates/ssr/src/server/tasks.ts)
- [Mobile Session、Bearer 接口及设备边界](https://github.com/CoderLambert/ReactLoom/blob/883838087464b4a5577aa4ff4260c4847bfc12a4/templates/mobile/README.md)
- [Lab CI 触发与验收](https://github.com/CoderLambert/ReactLoom/blob/883838087464b4a5577aa4ff4260c4847bfc12a4/.github/workflows/library-lab.yml)
- [Lab 当前生命周期浏览器断言](https://github.com/CoderLambert/ReactLoom/blob/883838087464b4a5577aa4ff4260c4847bfc12a4/packages/library-lab/e2e/p0-risk-lifecycle.spec.ts)
- [Lab 当前状态说明](https://github.com/CoderLambert/ReactLoom/blob/883838087464b4a5577aa4ff4260c4847bfc12a4/docs/library-lab/IMPLEMENTATION.md) · [协调合同](https://github.com/CoderLambert/ReactLoom/blob/883838087464b4a5577aa4ff4260c4847bfc12a4/docs/library-lab/COORDINATION.md)
- [CLI 包与分发配置](https://github.com/CoderLambert/ReactLoom/blob/883838087464b4a5577aa4ff4260c4847bfc12a4/packages/create-reactloom/package.json)
- [跨模块看板 #86](https://github.com/CoderLambert/ReactLoom/issues/86) · [Lab 验收 #85](https://github.com/CoderLambert/ReactLoom/issues/85) · [历史环境阻塞 #12](https://github.com/CoderLambert/ReactLoom/issues/12) · [Gantt #40](https://github.com/CoderLambert/ReactLoom/issues/40) · [PDF #22](https://github.com/CoderLambert/ReactLoom/issues/22)
