# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK4+调度策略3及非作者新token/SSR/控制调度/迁入编译通过；浏览器4项含来源，三个目标实际token文本/颜色、语言重置、标签无执行/请求；暂停时钟后观察真实160ms timer pending1→clear1，推进200ms后pending0/fired0，不称终止已开始token化。候选30及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E09.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E09 本地整改证据

只E09目录，保留他人工作。真实shiki4.5.0；无shared/依赖锁/生成/build/fulltypecheck/e2e/commit变更。业务标题已从不存在的主题选择改为语言选择；主题固定github-light，fontStyle暂存不绘制明确。UI与SDK共用highlight.mjs；应用调度另抽highlight-session.mjs。

| 六项 | 状态 / 层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS：实装SDK/源码与policy | SDK4/4真实web bundle/WASM token保留TS/HTML/JSON/中文原文和颜色。实装bundle-web.mjs确为createSingletonShorthands，纠正旧“每次不复用”错误；本地动态import语言/主题/shiki/wasm事实写清。调度policy3独立验证pending cancel/late-success/late-error不回写。 |
| 解释清楚 | PASS：静态自检 | 需求选型→真实token/主题→完整5文件迁入→三目标→singleton/资源/清理限制；固定主题/未绘制fontStyle不冒充功能。 |
| Demo有用 | NOT_RUN：DOM待主控 | basic原文保真/颜色；business真实语言切换与最后输入；advanced不可信源码只文本。browser提案覆盖3层/重置/语言/DOM标签/无害标记/图片请求和外层timer清理，未执行。 |
| 源码可迁移 | PASS：静态+同源SDK | example/highlight及声明/highlight-session及声明齐全列sourceFiles；精确pnpm依赖/React TSX ESM动态import/WASM前提，无Provider/env/CSS/Worker。共享singleton不由示例dispose。 |
| 官方来源可靠 | PASS：固定原文与实装许可 | shiki4.5.0 package字段MIT；v4.5.0→commitf7d0167873fd676fe4e190bc9b53832fba9ee01d的packages/shiki/README.md与LICENSE原字节；无中文README，en回退；官网GET200未Lab嵌入确认unknown。 |
| 结果可复核 | NOT_RUN：Node已记证，DOM未跑 | commands.json真实argv/cwd/exit/time/log；SDK4与policy3分列，Biome/official合同日志；正式verification保持NOT_RUN，不由token测试推无请求/无执行。 |

## 实际检查

cwd `/home/lambert/githubRepos/lambert/ReactLoom`：

- `node --test packages/library-lab/entries/E09-shiki/tests/node-scenarios.test.mjs` exit0，4项真实SDK，validation/sdk.log。直接调用UI同源highlightSource；不是mock。
- `node --test packages/library-lab/entries/E09-shiki/tests/session-policy.test.mjs` exit0，3项纯应用调度，validation/policy.log。受控Promise用于证明清理分支，不计SDK。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/E09-shiki/examples entries/E09-shiki/tests entries/E09-shiki/validation/browser.spec.ts entries/E09-shiki/library.json entries/E09-shiki/verification.json` 首次exit1，原有line/token index key规则；静态无状态span使用不可变行快照，添加两处有理由的局部ignore；最终exit0，biome-final.log。未全局关规则。
- 官方tag→peeled commit/tree→package README/LICENSE与homepage实际GET原始字节/响应头见official；官网200无明确嵌入限制头，但浏览器未知不标allowed。实际MIT字段和固定LICENSE核对，语法/主题/引擎资产仍需各自许可。

## 清理与浏览器交棒

160ms pending timer可被清理；已启动Promise/token化不物理取消，只抑制晚成功/失败回写。UI每次代码/语言变化先清旧预览，不用token更新textarea。level重置与重置按钮恢复原层fixture。没有Worker、存储或独立外部订阅；共享库highlighter不是本例拥有的私有资源。

Browser提案从外部包装160ms timer（其余timer原行为），等待完成后编辑并卸载，观测pending清空/clear调用；只证明本次pending调度清理，不能证明在途WASM停止或单例销毁。文本安全提案检查script/img/onerror不存在、无害window标记不变、只监测自己example.invalid/e09-probe图片，无危险导航/真实账户。未运行共享browser，不给这些预期PASS。

最大3000仅textarea UTF16约束，不是生产解析API预算；原生textarea组合时可能重新调度，真实IME未验。web bundle可能产生本地语言/主题/WASM相关加载，不能写“零网络资源”。错误路径主动清行并显示失败，重置可恢复受控输入；不依赖外部网络服务来制造错误。

作者STABLE停写，交独立复核/主控browser。正式sdk/build/browser无receipt仍NOT_RUN。
