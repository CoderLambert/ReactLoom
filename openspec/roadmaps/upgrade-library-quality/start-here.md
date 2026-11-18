# 新会话继续整改全部 Library Lab 库

当前已开始116库的批量整改；实际状态见 queue.json 和 results/。原有样板与 A06 未提交成果仍保留。先读 [roadmap.md](roadmap.md)，再读 [design.md](design.md) 和 [task-log.md](task-log.md)；[queue.json](queue.json) 是实际调度入口。

## 可以直接粘贴的启动指令

```text
请使用 $library-lab-quality，执行 openspec/roadmaps/upgrade-library-quality/start-here.md 中的续跑流程，按 queue.json 自动调度剩余全部库的整改。
先核对实际工作区、已有改动和活跃任务，保留 C20/D15/F18 样板与 A06 审批工作台成果。每库完成讲解、1–3 个真实 Demo、可迁移源码、官方 README 快照和官网预览/降级，并按六项标准复核。
允许按独占目录并行分派条目任务；公共文件、依赖、索引和状态由主控统一处理。完成一批继续下一批，遇到阻塞记录后推进独立项目，不逐库询问是否继续。按影响验证，状态和证据持续落盘；提交、推送、合并、发布仍需另行授权。
```

## 主控续跑流程

1. 以实际 `pwd` 定位仓库。读根 AGENTS、Lab AGENTS、COORDINATION/IMPLEMENTATION/REPAIR 和实际 Skill。读取 Git HEAD/status/diff；当前未提交成果是有效输入，不能从干净 HEAD 副本开始而遗漏它们。队列规划 SHA 与内容摘要用于探测变化，不用于复原文件。
2. 解析 queue.json；对照真实 entries 身份集合与三库样板，输出待处理、处理中、复核中、内容完成、阻塞五类数量。看 task-log 的计划 review 是否已处置；计划评审不等于条目复核。
3. 检查当前代理、服务与 owner。恢复旧任务时先找结果和 diff；没有活跃 owner 才重新认领。新出现或被删除的库先记录队列差异，不能静默漏掉或增改身份。
4. 从 queue.json 的 order 取最早可执行项。先核对该库的当前源码与官方来源，补齐 roadmap 对应阶段五节，确认其独立交付范围。近期两阶段已细化；远期行只给设计目标，不能照着摘要盲改。编号用于稳定追踪，独立阶段可并行。
5. 派发前保存 owner、startedAt、status=in_progress 和实际输入基线；记录工作者独占路径，明确保留他人修改。采用主控加最多3个子代理，按当前队列顺序领取；空闲槽在独占实现与非作者复核之间动态补位，不固定重领历史首批。工作者只写条目目录，主控统一公共任务和生成。
6. 工作者返回后保存结果为 results/<ID>.md，进入 review_pending；独立复核该库六项要求、关键事实与实际行为。全目录生成/typecheck/build及隐式build的浏览器检查前，按design决策3收齐所有在途写入者的稳定确认，冻结候选输入，验证后释放；只冻结单库实际输入即可执行的检查保持定向。修复意见只做直接影响检查。主控检查队列和人可读路线图一致，再写 content_done 或 blocked、result 路径及 task-log 阶段记录。
7. 本批结束继续取队列，复用仍有效的公共检查。不因会话换代理或修改维护文档全量重跑。正式收据按实际 recorder 命令与提交条件另行处理，持续显示“内容完成 / 正式收据待办”的区别。
8. 用户停止、资源不足或所有剩余项都有真实外部阻塞时保存断点：当前 owner、未完成步骤、原始错误、解除条件和下一条。输出实际完成数及可直接续跑的指令；不会自动创建下一会话。

## 工作者任务必须包含的上下文

- ID、独占 entry 路径、实际基线与已有差异、设计文档和本阶段目标。
- 当前 Skill 与质量 references；本条目 AGENTS/metadata/guide/agent/examples/verification 的阅读要求。
- 返回核心问题、Demo 目标、官方来源、变动文件、六项状态、实际命令/退出码/证据、公共依赖请求与剩余项。
- 你并非独自在仓库中；保留他人修改；共享目录、锁文件、根索引和队列由主控写；不得提交、推送、发布或修改任意执行宿主。

## 当前已知事项

已完成三份样板的[本地证据](../../../docs/library-lab/evidence/quality-c20-d15-f18-local-validation.md)可用于迁移思路，不能扩推其余库。A06 先读[本地验证](../../../docs/library-lab/evidence/a06-low-code-local-validation.md)。E19 资源许可条件独立处理。官网被拒绝嵌入是合法降级，有说明和入口可通过该展示要求；超时或无响应头只记录 unknown。

精确运行命令从当前 package.json 和 runner 参数发现。SDK runner 支持按 entry 选择，缺专用套件不能报 SDK PASS；Playwright 的 @ID 标签须与目标条目匹配。生成会影响共享 public/raw，统一串行安排。当前正式 committed 目录检查不能通过的原因是已有未提交改动，先保留该事实，工作区检查与正式检查分开报告。
