# C20、D15、F18 按质量 Skill 整改的本地验收

日期：2026-11-10。基线 HEAD `1218066`，候选为当前未提交工作区。已有 A06 React Flow 文件、测试和证据属于用户其他工作，本轮保留。此文件记录实际本地检查，独立于 verify:record 的正式逐库收据。

## 已交付内容

| 条目 | 讲解与 Demo | 官方资料 |
| --- | --- | --- |
| C20 clsx | 一个完整互动实验；组件状态、真实输入/返回值、full/lite 同输入对照；自有样式与迁移前提 | 2.1.1 官方英文 README 原文、固定提交及摘要；GitHub 禁止嵌入，显示说明和直达按钮 |
| D15 Dexie | 分组筛选与内存排序、原子回滚、真实 v1→v2 升级三场景；可读表格与原始数据；初始化失败可恢复 | 4.4.7 官方英文 README；官网预览可显式加载、关闭和离开卸载，实际外站状态保持 unknown |
| F18 visualizer | 真实 static/lazy 独立构建、模块归因、预算；界面可读实际产物摘要，缺产物有明确复现入口 | 7.1.1 官方英文 README；官方入口是 GitHub 仓库，按禁止嵌入展示 |

三个锁定版本的官方仓库树均已检查，未发现对应中文 README，保留英文原文而不自行翻译冒充。原文按固定提交获取并逐字节保存，生成与浏览器读取均检查摘要。官网响应头核对区分禁止与未知；iframe load 不被当成成功依据。

公共能力已支持六页签、默认讲解、1–3 个唯一且含 basic 的场景、README 按需读取及安全链接处理。其他 116 个库保留原内容与兼容行为，官方资料区域明确显示尚未整理。

## 实际验证结果

命令除另注外在仓库根执行，均无提交、推送或发布。

| 检查 | 命令或方式 | 结果 |
| --- | --- | --- |
| C20 SDK 与策略 | `pnpm exec node --test packages/library-lab/entries/C20-clsx/tests/sdk.test.mjs packages/library-lab/entries/C20-clsx/tests/class-policy.test.mjs` | exit 0，3 项通过；真实 clsx/lite |
| D15 SDK | `pnpm --filter @reactloom/library-lab test:sdk --entry=D15` | exit 0，6 项通过；真实 Dexie + fake-indexeddb |
| D15 策略 | Lab cwd 下 `pnpm exec node --test entries/D15-dexie/tests/rollback-policy.test.mjs` | exit 0，4 项通过 |
| F18 真实构建 | Lab cwd 下 `node entries/F18-rollup-plugin-visualizer/examples/verify.mjs --scenario=advanced` | exit 0；两次独立 Vite 构建和默认预算实际执行 |
| F18 预算失败路径 | Lab cwd 下 `node entries/F18-rollup-plugin-visualizer/examples/check-budget.mjs --max-initial-gzip=1` | 预期 exit 1，实际非零退出 |
| F18 摘要失效 | 修改实际产物后调用 readCurrentSummary，恢复原字节再读取 | 修改后拒绝旧摘要，恢复后 ready；试验产物已恢复 |
| 平台回归 | `pnpm --filter @reactloom/library-lab test` | exit 0，198 项通过 |
| README 标题与链接修复 | `node --test packages/library-lab/tests/official-sources.test.mjs packages/library-lab/tests/document-utils.test.mjs` | 先复现 #API 坏链；修复后 exit 0，14 项通过，含四级标题 |
| 类型 | `pnpm --filter @reactloom/library-lab typecheck` | exit 0；条目另有定向 strict 类型检查通过 |
| Biome | `pnpm --filter @reactloom/library-lab lint`；各条目 examples/tests 定向检查 | exit 0；公共目录有既有 warning/info，无错误 |
| 生产构建 | `pnpm --filter @reactloom/library-lab build` | exit 0；主站、MSW、Gantt 均构建；原有大型 SDK chunk 警告保留 |
| 目录与索引 | `node packages/library-lab/scripts/generate.mjs --check`、`node packages/library-lab/scripts/root-catalog.mjs` | exit 0，119 条目、316 个 React 场景入口，工作区索引匹配 |
| diff | `git diff --check` | exit 0 |

正式的 `catalog:index --committed` 先于生成运行，因已有 A06、当前三个条目和根索引未提交而退出 1。工作区索引随后按当前清单生成；未将 committed 检查改成通过，也未自动提交索引。

## 浏览器与运行环境

使用真实 Chromium，通过项目 Playwright。临时配置 `.local-evidence/quality-playwright.config.ts` 仅让用例连接已启动的本地服务，不修改项目默认生产预览策略。

先运行 `quality-upgrade.spec.ts scenario-authorization.spec.ts library.spec.ts`，开发态暴露 raw 目录重新生成后 Vite 返回 SPA HTML 的资源缓存问题。切换本次构建的生产预览后复验：34 项中 32 项通过；剩余两个是键盘焦点异步与错误文本在源码查看器重复造成的测试定位问题，已修正。

之后仅重跑直接受影响的四项：键盘手动激活、UUID 缺失恢复、官方 README 延迟读取/锚点、F18 缺产物状态，4 项全部通过（exit 0）。未因测试定位调整重复运行整套回归。

已实际覆盖：

- C20 状态、禁用语义、full/lite、重置/停止、旧场景链接回退和离开页签卸载。
- D15 真正 IndexedDB 的筛选顺序、完整事务回滚、迁移回填及既有 true 保留；UUID API 缺失后错误展示与按钮恢复。
- 官方 README 进入页签才请求、固定来源链接、篡改原文被拒绝、#API 与 #clsxlite 正确跳转。
- GitHub 禁止嵌入时无 iframe、有官网入口；Dexie iframe 生命周期使用明确的外站 fixture 验证，不冒称真实远端嵌入成功。
- F18 页面展示实际构建摘要；没有当前产物时显示真实复现命令，不执行网页 shell。

F18 的实际 lazy fixture 另外通过临时 loopback HTTP 服务和真实 Chromium 验证：初始汇总为 15，点击前 heavy 模块请求为 0，点击后请求为 1，计算结果 Fibonacci(12)=144。退出 0，临时服务 4333 已关闭。

实际构建对照：static 入口 2558 B / gzip 1473 B；lazy 入口 4024 B / gzip 2119 B，异步 heavy 98 B，总 JS 4122 B。入口 gzip 增加 646 B；教程如实解释这个小模块拆包不足以抵消加载辅助代码。数字来自本次产物，不写成普适优化收益。

## 六项内容复核

| 维度 | 本轮结果与范围 |
| --- | --- |
| 技术准确 | 本地内容复核通过；关键结论对照锁定版本来源，Dexie 许可、排序、升级与事务说明已纠正 |
| 解释清楚 | 工程问题、机制、输入输出与迁移路径已重写；用户最终阅读接受度仍待反馈 |
| Demo 有用 | 三库均有可观察的实际操作/产物；数量按知识目标确定 |
| 源码可迁移 | 目标库真实使用，必要声明、样式、配置、fixture 与入口列齐 |
| 官方来源可靠 | 三份固定原文与来源可追溯；受限官网降级，未知状态不冒称允许 |
| 结果可复核 | 本文件记录命令、退出状态和实际本地结果；平台与 SDK、浏览器证据范围分别说明 |

## 交付边界

- 运行中的预览为 `http://127.0.0.1:4319/`，保留 MSW/Gantt 独立端口；无需公开部署。
- verification.json 的正式 sdk/build/browser 状态仍为 NOT_RUN：当前工作区有未提交改动，未执行要求干净、已提交输入的正式 recorder。本地通过与正式收据保持独立。
- 其余 116 条目、跨浏览器、真实生产数据/权限、多标签复杂竞态和付费外部服务验收不属于本轮。
- ffmpeg 核心仍按既有许可门禁不复制，不影响这三个库和 Lab 构建，本轮没有改动该边界。
