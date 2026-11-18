# 2026-11-18 主控闭环补充

六项本地质量PASS。真实Core SDK5与预览policy6分列，非作者完整迁入/新Core输入通过。浏览器3项含来源：实际File选择与DataTransfer重复同File、3个上限/超大/非法类型、混合批新增1未新增1限制1、移除清空和文本安全显示；12001bytes读前拒绝、真实NUL/非法UTF8拒绝、8000字符截4000；外层真实Blob读取持有后移除/新预览/卸载再release不回写旧结果。无外部上传请求。候选33及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F01.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F01 作者本地证据（2026-11-18，STABLE）

仅本目录；真实浏览器/生产build未由作者运行。正式verification sdk/build/browser均NOT_RUN，不将以下有限Node执行升格为正式收据。

| 六门槛 | 状态 | 证据/限制 |
| --- | --- | --- |
| 技术准确性 | PASS | 实装Core6.1.0；同源真实NodeSDK5/5，addFiles部分接收/整体数量拒绝/hook异常、remove与clear差异、off再destroy清文件；无DOM |
| 教学清晰度 | PASS | guide/agent给选择、模型、三个目标、批次事件数与文件数区别；1MiB与12,000字节/4,000码点单位明确 |
| Demo目标 | NOT_RUN | 实际React源码齐全；input/drop/超限与迟到读取需主控真实浏览器，提案validation/browser.spec.ts |
| 可观察结果 | NOT_RUN | Node真实队列与纯策略输出有原始日志；浏览器文本/控件/外层迟到抑制尚待验收；没有Uploader成功宣称 |
| 可迁入性 | PASS | 复制实际五份源码/声明到独立临时目录及新consumer，strict tsc exit0；复用现有node_modules，不称fresh-install |
| 官方材料 | PASS | 固定commit原始Core README SHA吻合、全tree无中文候选、MIT LICENSE；官网200无frame拒绝头仍unknown，无iframe成功宣称 |

## 原始执行

所有命令cwd `/home/lambert/githubRepos/lambert/ReactLoom`，完整argv/cwd/exit在validation/*-command.json，stdout/stderr在同名.log。

- sdk：`node --test packages/library-lab/entries/F01-uppy/tests/sdk.test.mjs` exit0，5tests/5pass/0fail，实际@uppy/core，无DOM/模拟Core。
- policy：`node --test packages/library-lab/entries/F01-uppy/tests/policy.test.mjs` exit0，6tests/6pass/0fail；纯Blob解码/策略不算SDK。
- migration：`pnpm exec tsc -p /tmp/f01-consumer-…/tsconfig.json` exit0，无输出。五份example/local-queue(.mjs/.d.mts)/preview-policy(.mjs/.d.mts)，新consumer与strict配置原字节见migration-fixture.txt；仅清理本次owned临时目录。
- biome：`pnpm exec biome check <本entry examples/tests/library.json/verification.json/validation/browser.spec.ts>` exit0，11files，无修改。初次--write exit1因group应为fieldset与模板字符串；原始initial日志保留，最终已修复。
- official：Node实际validateOfficialSources与SHA256及installed version/license核对，exit0：errors[]，hash2ce52890c65c3b27618a991c62a90907e692b05d8523c0da81b8b16ee807e01e，6.1.0/MIT。sourceUrl实际路径@编码%40契合协议。

官方来源抓取：固定tag @uppy/core@6.1.0→41edd0f96a450616431cec1e57c2cb70e7c1a9e7；GitHub tree完整原JSON与候选列表在official/tree.json、source-evidence.json；README与LICENSE保存原字节。官网实际curl响应头official/homepage-headers.txt返回HTTP/2 200，CORS不是frame允许证据，保留unknown。抓取只证明材料取得，不证明运行。

## 边界与主控接线

保持region `Uppy 真实文件队列`、group `拖拽文件加入本地队列`（现为原生fieldset）、input[type=file]、按钮`本地查看文本`/`移除`/`清空当前队列`、pre[data-testid=uppy-preview]、p[role=status]。basic无预览，business/advanced有预览。最终批次状态包含新增/未新增/限制事件，不再覆盖真实拒绝为全成功。

Node5SDK最后一项观察真实File引用进入Core后清空及自有回调off；不声称浏览器destroy事件、GC或全部内部timer已取消。浏览器方案持有真实arrayBuffer结果再release，分别remove/新preview/unmount检查无迟到显示；它观察epoch而非物理取消读取。保持无debug全局和无网络。
