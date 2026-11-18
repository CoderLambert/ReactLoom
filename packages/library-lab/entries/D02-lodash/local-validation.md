# 2026-11-18 主控验收补充

当前六项质量均为本地 PASS。SDK4/4；独立consumer和单TSX类型检查通过；真实浏览器4项（集合、生命周期、自然trailing、官方来源）通过。独立复核与完整命令/退出码见 [逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D02.md)。candidate-22 typecheck/build/catalog exit0，相关输入稳定；正式收据仍NOT_RUN。下文为作者停写时检查点，浏览器待办已由此补充关闭，保留其历史记录。

# D02 本地验证 — 2026-11-18

范围仅本条目，两个独立实验：集合操作顺序、防抖生命周期。没有修改共享生成物、依赖或 e2e。正式 sdk/build/browser 在 verification.json 保持 NOT_RUN。

|维度|状态与层级|证据|
|---|---|---|
|技术准确|PASS 静态及真实 SDK|安装 lodash-es 4.18.1；源码 uniqBy/groupBy/orderBy/chunk/debounce 与四项真实 SDK 测试。cancel 新增跨等待断言与后续恢复|
|解释清楚|PASS 静态复核|guide 从何时选择、集合输入顺序、防抖实例所有权到迁移，明确 fixture 与 SDK|
|Demo 有用|NOT_RUN 浏览器待主控|两个独立目标均有控件和可观察输出；validation/browser.spec.ts 提案覆盖 flush/cancel/IME/外层保留卸载结果|
|源码可迁移|PASS 静态复核|example.tsx 包含全部组件和数据；无额外配置资源。父回调稳定性、两个组件 timer 清理均说明|
|官方来源可靠|PASS 来源核实|upstream-tree.json 为固定提交根目录原始响应，仅 README.md 无中文；official/readme.md 为 GitHub contents API base64 原文；library.json 保存 SHA256。homepage-headers.txt 的 SAMEORIGIN 明确阻止跨源嵌入|
|结果可复核|NOT_RUN 完整浏览器运行待执行|SDK 本地4/4通过；浏览器、全包类型/构建未由本工作者运行，不扩大为内容完成|

实际 cwd：/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab。
命令：`node --test entries/D02-lodash/tests/sdk.test.mjs`，exit 0，4 tests PASS，原始输出 validation/sdk.log。
格式化：仓库根 `pnpm exec biome format --write packages/library-lab/entries/D02-lodash/examples packages/library-lab/entries/D02-lodash/tests/sdk.test.mjs`，exit 0。

上游核对：`git ls-remote https://github.com/lodash/lodash.git refs/tags/4.18.1` 返回 454999199c880707789e941d14e5a62e0c7527fa。根目录 API 与 README content API 基于该提交；raw.githubusercontent.com 同一地址返回404，随后使用官方 API 获取完整原文，未改写。官网实际 GET 跟随重定向至 https://lodash.com/，HTTP200，X-Frame-Options SAMEORIGIN。

待主控将 validation/browser.spec.ts 复制到 e2e 运行 @D02；合成 composition 事件只证明事件策略，真实中文输入法候选操作仍需人工验收。没有干净 recorder 收据，不提升 verification.json。此文件不是正式 receipt。
