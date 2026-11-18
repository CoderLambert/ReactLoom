# 2026-11-18 主控闭环补充

六项本地质量PASS。真实独立 Storybook 10.6.1 build exit 0，同一 Chromium iframe 五次 Story play 均成功且 axe 报告均 0 violations/0 incomplete，含拒绝/重试与重复切换。四文件+新 CSF 严格迁入，本地 Lab 核对配方展示。候选37及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F14.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F14 本地质量证据

STABLE。仅本entry改动，未安装/改依赖/共享源码/队列/results/e2e或全局generate/build/typecheck。独立Storybook build是本条目必要CLI，输出自己/tmp目录。正式verification无recorder仍NOT_RUN。

| 门槛 | 状态/证据层级 |
| --- | --- |
| 技术准确 | PASS实际10.6.1 build+browser：四story CSF3/play真实执行；原a11y“只有runner才扫描”纠正，实装afterEach普通story也axe.run/report；CI exit需runner或本次assert harness。 |
| 解释清楚 | PASS guide/agent：组件状态/SDK/本地fn/真实服务分明，autodocs标签不等于启用Docs；dev/build/play/a11y分别解释。 |
| 实验有用 | PASS真实浏览器：Basic状态合同/Business交互/Advanced禁用+Recovery失败重试三个任务，4story。同iframe再返Business仍成功，非重载避mock隔离。 |
| 源码完整 | PASS隔离strict：组件、stories、main/preview四原件复制编译exit0；真实配置无staticDirs外部资源，依赖/命令/目录迁入清楚。 |
| 官方可靠 | PASS原字节：固定a17b725…code/core包README，根MIT LICENSE和三个package.json再次GET比对。installed三包10.6.1/MIT；官方树无包中文README。官网200无XFO/CSP但无Lab-origin嵌入，unknown。 |
| 可复核 | PASS本地CLI/browser：commands.json有cwd/argv/exit；build log、五次storyFinished/axe原报告、server log、manifest和strict日志；正式状态NOT_RUN。 |

## 实际执行与结果

cwd均repo root。真实command详见validation/commands.json。

- `pnpm --filter @reactloom/library-lab exec storybook build --config-dir entries/F14-storybook/examples/.storybook --output-dir /tmp/reactloom-f14-storybook-review --disable-telemetry` exit0，build-initial.log。当前fixture无代码缺陷阻塞，只有大chunk警告；未声称性能通过。实际build包含四stories、play-fn标签，index快照story-index.json。
- `python3 -m http.server 6037 --bind 127.0.0.1 --directory /tmp/reactloom-f14-storybook-review`独占临时端口；浏览器结束Ctrl-C停自己的server，未占4319/4320/4321。server.log原始请求保留。构建tmp已在manifest后清理，未残留服务或大产物。
- `node packages/library-lab/entries/F14-storybook/validation/browser-check.mjs` exit0。真实headless Chromium，同一个iframe通过Storybook channel切Basic→Business→Advanced→Recovery→Business。每次等待该story的官方storyFinished，断言play status success、a11y报告存在且passed/violations0，并断言真实状态和按钮禁用。browser-same-session.log五行均success/axe4.14.0/0violations/0incomplete。四个*-browser-report.json是官方完整report，不是自造通关事件；Business最后覆盖为重复轮。初次每story新页面的browser.log也保留，但最终结论用same-session。
- 复制四原件到自己tmp，strict ES2022/ESNext/Bundler/react-jsx/node noEmit/skipLibCheck，定向tsc exit0，portable-types.log空；不等于freshinstall或全仓检查。
- `node .../validation/official-check.mjs` exit0，五份固定原件MATCH且三包10.6.1 MIT。未把仓库根README代替storybook包原文；初次树已发现code/core/README后以包原文为最终snapshot，source-evidence记录对应SHA。
- Scoped Biome初次exit1因title/tone故意作为业务重置依赖，被静态规则视为多余；保留biome.log。增加准确suppression说明，不删除真实状态失效约束。最终见biome-final.log exit0。格式化/comment-only后不重复昂贵build/browser，无行为变化。

## a11y分层

实装 `@storybook/addon-a11y/dist/_browser-chunks/chunk-NYNS5KES.js` afterEach在story view且非manual/off时调用axe.run，reporting.addReport；test error决定report失败级别。只在getIsVitestStandaloneRun才expect抛断言。普通静态站构建本身不运行规则，也不会因之后规则失败自动exit1；本次harness显式检查report并将失败变成Node exit1。不声称运行addon-vitest/test-runner。0violations只覆盖当前story DOM与规则，不证明全WCAG/人工读屏/焦点序列。

## 剩余边界

未运行dev命令；用build静态站证明play。未测held异步回调后args变更/unmount的真实运行，generation/inFlight是源码审计，不物理取消Promise。未测视觉基线、真实网络、MSW或生产组件库MCP。main未引addon-docs，因此不承诺autodocs页。Lab配方显示由主控负责，本entry不改平台。所有官方下载与浏览器是本地原创fixture/上游公开元数据，无用户生产数据。

端口说明delta：guide/agent已精确区分Lab复制dev配方6029与本次独立build静态验收6037；仅文档，无行为变更不重跑。STABLE停写。
