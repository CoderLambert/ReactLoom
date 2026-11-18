# Library Lab 讲解与 Demo 质量审查

审查日期：2026-11-10。基线：工作区 HEAD `1218066`，包括已有未提交的 A06 React Flow 改动。对象为当前指南、代表性示例源码和公共宿主逻辑；本次未执行逐库 SDK 或浏览器验收。

## 目标与读者

面向有经验的 React 工程师。读完一个条目，应能判断何时选用它、理解核心机制、运行并解释一个真实示例，并知道迁入业务项目需要处理哪些问题。术语准确、因果清楚，案例有可观察结果。

## 范围与事实

- 索引与实际目录均为 119 个条目。
- 内容抽查 17 个条目，覆盖六组；深入核对了 clsx、shadcn/ui、dnd-kit、Dexie、Monaco、Streamdown、tldraw、SheetJS、MSW、visualizer 等代表性源码。
- 按每篇前 20 行是否出现 `收据|Actions|NOT_RUN|BLOCKED|PLATFORM|旧笔记|历史原` 扫描，有 72 篇命中。这是维护信息进入开篇的信号，不能解释为 72 篇全部不合格。
- 完成门禁目前要求四份文件及恰好三个层次；文件齐全不能证明教学质量。见 [entry-gate.mjs](../../packages/library-lab/scripts/entry-gate.mjs)。
- 页面目前有 demo/docs/agent/related 四个页签，官方资料主要为链接。官网预览、README 快照和 1–3 个 Demo 协议仍待平台实施。
- A06 的指南、示例、元数据和相关索引已有用户工作。本报告只观察该版本，不改动这些文件，也不将其推定为已提交或验收通过。

## 抽查记录

以下问题均是整改目标；源码审查观察与运行结论分开。

| 条目与指南位置 | 观察到的问题 | 建议的具体改动 |
| --- | --- | --- |
| [A01 ECharts](../../packages/library-lab/entries/A01-echarts/guide.md#L5) | 开篇先讲收据和实例实现，选型结论到第 22 行；生命周期细节先于 option 如何表达数据 | 用同一组指标解释轴、系列和 option；先显示结果，再引出更新与 resize |
| [A06 React Flow](../../packages/library-lab/entries/A06-react-flow/guide.md#L7) | 当前工作区有可操作的发布、申请、审批步骤，是较好的体验入口；业务运行时也增加了源码规模 | 保留闭环；补最小图编辑路径，持续说明 React Flow、表单和自建执行器的职责 |
| [A10 tldraw](../../packages/library-lab/entries/A10-tldraw/guide.md#L7) | Editor、监听、清理和许可介绍较多；业务示例以增加形状和导出快照为主 | 用编辑、保存、恢复白板的需求解释文档状态与会话状态；新增能力应对应实际源码 |
| [B09 shadcn/ui](../../packages/library-lab/entries/B09-shadcn-ui/guide.md#L5) | 指南明确是手写教学实现；当前 Demo 主要演示 CVA、Slot 和归档状态，缺少官方组件获取、定制和维护过程 | 核实并标注源码来源；展示一处真实组件定制与上游差异，解释源码所有权的收益和成本 |
| [B13 dnd-kit](../../packages/library-lab/entries/B13-dnd-kit/guide.md#L49) | 入门与业务部分主要由三个频道扩展到六条；源码中锁定规则也作用于业务场景，层次描述需更精确 | 按拖拽交互、受约束排序与撤销组织；用同一操作观察数组和界面怎样同步 |
| [C01 React Hook Form](../../packages/library-lab/entries/C01-react-hook-form/guide.md#L7) | 自定义 URL、指纹、generation、IME 策略先于表单注册和订阅机制 | 先讲 register、错误和提交；动态字段再解释 field.id；异步错误与取消放在对应业务问题中 |
| [C07 TanStack Table](../../packages/library-lab/entries/C07-tanstack-table/guide.md#L7) | features、数据身份和竞态策略较密集，读者需要先看清数据、行模型与 DOM 的关系 | 展示原始行如何成为排序、分页后的行；对比客户端和服务端处理的实际差异 |
| [C20 clsx](../../packages/library-lab/entries/C20-clsx/guide.md#L23) | 指南 211 行，多个规则在反例、升级、故障中重复；example.tsx 只有 19 行，JSX 压在长行里 | 一个输入—结果实验讲清条件、数组、对象；合并重复说明；格式化可迁移源码，按需联系 tailwind-merge |
| [D03 p-limit](../../packages/library-lab/entries/D03-p-limit/guide.md#L7) | 开篇偏重取消、批次和队列清理，核心并发价值可更早呈现 | 用批任务对比不限并发与并发上限；展示排队、运行、结束和实际峰值，随后说明取消 |
| [D07 TanStack Query](../../packages/library-lab/entries/D07-tanstack-query/guide.md#L7) | 租户、rev、optimisticToken 等业务策略占据前部，缓存和订阅模型较晚出现 | 先观察相同键共享、fresh/stale 和后台刷新；再递进到分页与局部更新 |
| [D15 Dexie](../../packages/library-lab/entries/D15-dexie/guide.md#L11) | 旧 schema 声明要求被写成通用规则；第 129 行对 sortBy 的解释会误导索引和性能判断 | 依据官方规则纠正技术结论，并同步检查示例提示；对比内存排序、索引查询和内容升级 |
| [E05 Monaco](../../packages/library-lab/entries/E05-monaco-editor/guide.md#L7) | Worker 租约和清理占主导，业务层主要增加 state 保存；指南“点运行之前不加载”的说明与当前宿主自动挂载逻辑存在偏差 | 先讲 model、editor、语言服务的关系；展示编辑、诊断、保存需求；核对实际启动和卸载行为 |
| [E11 Streamdown](../../packages/library-lab/entries/E11-streamdown/guide.md#L6) | 36 行指南只有安装命令，缺少完整用法和效果解释；源码以本地字符追加驱动真实渲染器 | 显示 Markdown 输入和渲染结果，观察未闭合结构到完成的变化；解释累计正文与 delta 的关系 |
| [E19 ffmpeg.wasm](../../packages/library-lab/entries/E19-ffmpeg-wasm/guide.md#L3) | 核心资产默认不复制，首次操作可能无法运行；许可与部署过程占据大量正文 | 进入运行前展示资源前提和可操作的准备步骤；用输入、转换参数及实际输出讲解流程；保留资源与许可边界 |
| [F05 SheetJS](../../packages/library-lab/entries/F05-sheetjs/guide.md#L37) | 56 行指南混有“本批”“第23轮”等维护记录；表格数据到工作簿的机制解释不足 | 用行数据、sheet、workbook、字节及回读结果串联；历史记录迁入维护材料，运行边界保留 |
| [F11 MSW](../../packages/library-lab/entries/F11-msw/guide.md#L7) | 隔离宿主、预检和会话规则在核心请求处理机制之前 | 先跟踪一个真实客户端请求如何匹配 handler、返回响应；再演示 422 与恢复；单独说明 Lab 隔离接线 |
| [F18 visualizer](../../packages/library-lab/entries/F18-rollup-plugin-visualizer/guide.md#L47) | 三层主要对应 treemap、Markdown、raw-data 三种格式；缺少从报告作出优化决策的过程 | 真实构建、定位大模块、修改导入、比较两次报告；说明首包、异步 chunk 与总量各自表示什么 |

## 已核实的技术问题

### Dexie sortBy 与索引排序

指南第 129 行把 `sortBy('updatedAt')` 与索引字段联系，并据此要求新增排序键时改 schema。官方说明：`Collection.sortBy()` 先得到结果数组，再在数组上手动排序；`orderBy()` 才是需要区分的索引排序路径。为字段建立索引并不会把该次 sortBy 自动变成数据库端排序。

依据：[Collection.sortBy](https://dexie.org/docs/Collection/Collection.sortBy())。修订时需区分索引筛选的收益、结果集大小和内存排序成本，不能只替换一个术语。

### Dexie 旧版本声明

指南第 11、31、71 行起的反例将“保留旧 version 声明”泛化。官方区分 Dexie <3 与 >=3；>=3 可依据已安装 schema 进行差异升级，需要保留相关内容升级函数所在的版本。当前示例保留 version(1) 可作为教学选择，不能解释为所有 v1→v2 升级的必要条件。

依据：[Design / Database Versioning](https://dexie.org/docs/Tutorial/Design)。示例中的提示文字也需一并检查。

### Dexie 许可与事务说明

试用复核进一步发现：指南第 3 行写 MIT，而条目 `library.json` 的 license.spdx 为 Apache-2.0，与 [v4.4.7 官方包信息](https://github.com/dexie/Dexie.js/blob/v4.4.7/package.json) 相符。指南和元数据需统一。

事务失败取决于错误是否传播出事务范围；事务内部吞掉错误可能允许提交。事务里等待网络的关键问题包括 IndexedDB 自动提交及随后出现 TransactionInactiveError，不能只解释为锁持有太久。依据：[官方最佳实践](https://dexie.org/docs/Tutorial/Best-Practices)。

示例源码还在 try 之前设置 busy 并调用 crypto.randomUUID；该 API 缺失时会绕过 finally。这里记录为静态发现的失败路径，浏览器表现待实测，不扩写为已复现的运行故障。

## 共性问题与优先级

| 优先级 | 问题 | 可验收的改进结果 |
| --- | --- | --- |
| P1 | 技术断言错误、说明与实际行为不一致 | 指向匹配版本的官方依据；文档与源码描述一致 |
| P1 | 运行所需环境或资源前提不清楚 | 用户在操作前知道条件，失败后能采取具体措施 |
| P2 | 核心用途和机制被维护信息遮挡 | 首屏能回答用途、选择条件和本例结果；维护历史有独立归属 |
| P2 | 多个 Demo 的学习目标重复 | 每个 Demo 都有独立问题、操作、可观察结果和关键源码 |
| P2 | 源码难读、迁移步骤不完整 | 代码正常排版；必要文件、依赖和接入位置明确 |
| P2 | 缺少官方 README 与官网预览 | 来源、语言、快照版本可追溯；嵌入限制有实际处理 |
| P3 | 反例、升级和清单重复 | 同一概念在适当位置解释一次，必要时交叉引用 |

## 官方资料的可行性观察

2026-11-10 的响应头抽查：GitHub 页面返回 `X-Frame-Options: deny` 与 `frame-ancestors 'none'`；ECharts 中文首页返回 `sameorigin` 与 `frame-ancestors 'self'`。因此不能承诺所有官网都在 Lab 中成功嵌入。Dexie、React Flow、Streamdown 的本次响应未见这两类限制头，也不能仅凭这一点标记浏览器嵌入成功。shadcn 官网本次请求超时，状态属于未知。

官网区域应始终保留直达入口。已确认禁止时解释限制，未知或网络失败时允许重试。iframe 的 load 即使内容失败也可能触发，不能作为成功验收。依据：[MDN iframe 事件](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#error_and_load_event_behavior)。

官方 README 文件名需要实际发现：本次官方仓库目录核对，Ant Design 有 `README-zh_CN.md`，clsx 为 `readme.md`，ECharts 根目录有 `README.md`。不能按库名拼接 `README.zh-CN.md` 并假设存在；单仓库多包还需确认目标包自己的说明文件。

## 验证边界与后续

本报告的事实来自文档、源码、目录和官方资料核对。逐库交互、SDK 执行、性能测量均未在此次审查中完成；本报告不修改任何条目的 verification.json。整改执行依据 [修改方案](quality-upgrade-plan.md)，先解决公共依赖，再按用户指定范围逐库推进。
