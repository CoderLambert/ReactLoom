# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK4+预算策略2及非作者新多通道HTML/迁入编译通过；浏览器2项含来源，真实frame格式/父页contentDocument不可读、危险节点缺席/CSP/无探针请求与标记保持false、超预算清旧iframe、重置卸载通过。候选30及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E08.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E08 本地质量证据（2026-11-18）

STABLE：仅E08目录，保留他人/共享工作，未改宿主/锁/依赖/e2e/生成/队列，未build/fulltypecheck/browser/commit。真实rehype13.0.2与rehype-sanitize6.0.0；formal各项NOT_RUN。

|六项|状态与层级|依据|
|---|---|---|
|技术准确|PASS：真实SDK+静态|实际UI调用共享sanitizeHTML，真实HAST净化→stringify；SDK4项验证保留格式/剥离脚本事件导航媒体/畸形嵌套；25000 UTF8字节约24.4KiB、opaque origin均纠正|
|解释清楚|PASS：静态自检，独立待主控|guide从HTML公告选型→字节/HAST/schema/序列化→sandbox/CSP职责→三操作→迁移与内容损失/性能边界，不把隔离视为跨主机|
|Demo有用|NOT_RUN：browser待主控|basic保留结构、business公告去导航、advanced攻击通道与多字节错误清旧输出；真实frame/network/执行提案未跑|
|源码可迁移|PASS：静态+共享pipeline执行|example.tsx/sanitize-policy.mjs/.d.mts/input-policy.mjs/.d.mts全sourceFiles；exact依赖/ReactDOM/TS bundler/TextEncoder，sandbox/CSP/样式齐，无env/Provider/服务；无外部资源|
|官方来源可靠|PASS：固定原字节+实际HTTP|rehypejs/rehype13.0.2 commit06fd4dc9b13538ece27bce1999a85d396a646817的实际packages/rehype/readme.md，无中文package README，英文en原字节/SHA；两包安装与上游对应字段MIT；GitHub homepage XFOdeny/CSP frame-ancestors none→blocked|
|结果可复核|NOT_RUN：Node输出有证据，browser未跑|SDK4/纯预算policy2分列原日志；scope Biome与diff通过。Node不证明frame隔离、CSP、无请求/无执行，正式收据独立|

cwd `/home/lambert/githubRepos/lambert/ReactLoom`：

- `node --test packages/library-lab/entries/E08-rehype/tests/node-scenarios.test.mjs` exit0，4 actual SDK tests，validation/sdk.log；直接复用UI的sanitizeHTML/strictHtmlSchema，不另造parser/config。第一次开发通过后格式化完成最终保存日志。
- `node --test packages/library-lab/entries/E08-rehype/tests/policy.test.mjs` exit0，2纯策略，validation/policy.log；只导入input-policy，不加载SDK。25000 ASCII字节接受、25001拒绝；8333个“中”加x为25000字节接受，8334个“中”为25002拒绝，空文本接受/非字符串拒绝。最后等价模板字符串格式调整不重复运行未变语义。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/E08-rehype/examples entries/E08-rehype/tests entries/E08-rehype/validation/browser.spec.ts entries/E08-rehype/library.json entries/E08-rehype/official/source-evidence.json` exit0，validation/biome.log；初次11files，9格式修正及1条template信息。修正该信息后相同范围加verification.json，exit0/12files/no fixes，validation/biome-final.log。
- `git diff --check -- packages/library-lab/entries/E08-rehype` exit0。
- 官方tag API/固定tree/raw包README及对应package.json实际GET，Python urllib保存原字节、候选和摘要；homepage实际GET完整响应头与body SHA保留official/source-evidence.json。没有执行README指令。

浏览器validation/browser.spec.ts：最初无frame；成功pre和实际frame标题/strong；sandbox空、父页contentDocument===null；business源文字保留但a无href；advanced多通道script/event/link/image/iframe/style在frame无对应节点，parent无害标记false，唯一测试URL请求0；8334中文触发25002字节错误后pre/frame均删除，重置恢复、重新运行与卸载。保持opaque origin，没有新runner或放宽权限。所有浏览器观察目前NOT_RUN，真实IME不在本条目输入能力验收。

迁移/安全边界：schema直接去导航媒体，CSP与sandbox是附加限制，不等价也不单独保证任意HTML安全。previewDocument只接净化输出，不承诺传原始HTML也安全。同步主线程任务有CPU成本，字节预算不是性能证明。无临时URL/Worker/监听/连接，iframe上下文跟随错误/重置/卸载移除。

独立review重点：真实共享pipeline与严格schema；25k字节/textarea码元双限制可触发；error移除旧输出/frame；opaque origin非跨主机；固定包README/hash/MIT与官方homepage blocked头；SDK/policy/browser证据分层。
