# Library Lab 审核整改（2026-10-28）

本文件记录合并前的审核整改，并说明这些修复在 main 上的位置。PR #8 已合并。**仓库级 CI 通过不是逐库收据。** 不要把 Library Lab 放进模板、公开部署或计费配置。

## 已实现的改动

|审核问题|实现与回归|仍需真实环境验证|
|---|---|---|
|HTML 源码被当作 SPA 回退拒绝|所有展示源码发布为 `<original>.txt`，保留原始文件名、内容摘要；生成器、源码面板、Markdown 链接统一接线；原始 `.html` 不再发布|Vite 生产响应 MIME、F18 页面复制与不执行 HTML|
|生成后检查索引会掩盖旧提交|`root-catalog.mjs --committed` 同时核对工作树、HEAD 中的两个索引及 Git diff；CI 在生成前执行；真实临时 Git 仓库测试覆盖“自修复后仍失败”|完整集成树的目录检查|
|假证据路径可保留 PASS|校验有界、非符号链接的真实收据与日志；绑定 SHA-256、目标 ID、固定命令、退出码、状态、时间和源码输入；不存在或不一致即 NOT_RUN|真实 SDK/build/browser 生成的收据，不使用合成测试结果代替|
|指纹遗漏公共变化|指纹包含根锁文件/依赖声明、公共宿主、运行配置、脚本/测试/runner、条目未展示的 helper 与测试；生成文件/日志不参与，避免自失效|新增锁文件后全部旧证据必须重跑|
|没有可操作的隔离 MSW 演示|新独立端口 runner、逐会话 SW scope、受限消息协议，F11 页面可显式运行三个真实请求场景、停止并注销本次注册；复用条目 canonical handlers，不改 worker 所有权文件|真实 MSW3 SDK、Chromium、双会话/离开 Tab 清理；源码已写，不声称已运行通过|
|CI 文档改动也全跑|真实 Git 差分选择：文档只走目录/平台检查；条目 SDK/browser 定向；公共/依赖变化完整运行；无法比较则完整检查|完整类型/生产构建仍按集成包执行，不宣称逐条目分包已完成|
|缺失类型声明与过期回归|补 `verifySourceIndexDigest` 导出；摘要回归保持长度、大小回归只改正文而非先破坏索引摘要；主站不再供应 SW；CI 预构建后 E2E 不重复 build|完整 TypeScript 和 Playwright|

## 本地运行入口和安全边界

`pnpm --filter @reactloom/library-lab dev` 同时监听 `http://127.0.0.1:4319`（主站）、`http://127.0.0.1:4320`（MSW runner）和 `http://127.0.0.1:4321`（C13 Gantt runner）。`build` 与 `preview` 一起提供这些 loopback 服务，不进行部署。独立端口是不同 origin，不是任意代码沙箱。

F11 在原 Node 复现命令下增加“真实浏览器请求拦截”面板。每次显式启动生成 UUID scope `/lab-runners/msw/sessions/<uuid>/`。只有已注册 runner origin、对应 iframe Window、协议与 session 全匹配的消息才被接收。关闭先等待 stop/unregister ACK；超时标记“清理未确认”，不能当作卸载通过。`pagehide` 是尽力清理，不保证浏览器进程被强杀后立即删除 SW。不同会话不做全局存储/Worker 清空。

官方 `msw init` 产物只写 `runners/msw/public`，由专用 middleware 在每次会话脚本路径供应，限制 `Service-Worker-Allowed`。删除的仅是旧的主站生成物 `public/lab-runners/msw/mockServiceWorker.js`。原 `entries/F11-msw/examples/browser-worker.mjs` 保留为历史适配示例；新平台生命周期实现是 `runners/msw/main.mjs`，复用 `handlers.mjs`、`routes.mjs`。其他未注册 browser-frame 能力继续 fail closed，不伪称支持所有隔离执行类型。

## 锁文件与验收

main 的根 `pnpm-lock.yaml` 已有 `packages/library-lab` importer。Actions run [41779873259](https://github.com/CoderLambert/ReactLoom/actions/runs/41779873259) 用 `--frozen-lockfile` 完成安装，并跑过 typecheck、生产构建、52 个 SDK 文件（153 项）和 45 项 Playwright。`lock-candidate` 因锁已就绪而跳过。候选 job 仍然不能代替 runtime，也不许用 no-frozen 冒充验收。

这次通过覆盖的是当时存在的套件，不是 119 个库。68 个条目没有 `sdk.test.mjs` 或 `node-scenarios.test.mjs`。Playwright 的 `@ID` 只覆盖少数条目。

`create-reactloom` 不复制 Library Lab，模板清单里也没有它。根工作区的 `pnpm install` 仍会下载本包依赖。其中 `@ffmpeg/core@0.12.10` 是 GPL-2.0-or-later：`prepare-ffmpeg-core.mjs` 默认删除生成的 `public/ffmpeg-core/`，除非 `LIBRARY_LAB_FFMPEG_CORE_LICENSE_REVIEWED=true`。`xlsx` 解析到 `cdn.sheetjs.com` 上带 integrity 的 0.20.3 tarball；CDN 不可用时失败的是根安装，不只是 Lab。本 PR 不把包移出工作区。

在 Node >=22.18 / pnpm 10 的完整工作树中，既有受控入口是：

```sh
# 仓库根目录。锁文件已在 main 上，不要为了重跑而手改 integrity。
pnpm verify:library --execute --sdk --browser --setup-browser
```

`--resolve-lock` 只在确实要更新锁的分支上使用。审查 peer、许可和日志后再提交。不能修改账单或权限来绕过检查。上面的 Actions 运行是仓库级结果，不是这个命令在每个条目上的收据。

需记录逐库可接受证据时，在干净的已提交输入上运行：

```sh
pnpm --filter @reactloom/library-lab verify:record --entry=D03 --kind=sdk
pnpm --filter @reactloom/library-lab verify:record --entry=D03 --kind=sdk --execute
pnpm --filter @reactloom/library-lab verify:record --entry=F11 --kind=browser --execute
```

不带 `--execute` 只显示固定计划。真实运行保存到 `docs/library-lab/evidence/runs/`，输出可审查的 verification 元数据，不代写 worker 的记录。缺少专用 SDK 套件或浏览器 `@ID` 标签会明确失败；命令显示/Node 规则单测不替代 SDK。收据摘要是完整性检查，**不是数字签名，也不能阻止有仓库写权限的人伪造一整套文件**；审核仍需核对 CI/实际执行日志。

## 交付门槛和剩余队列

锁文件、冻结安装、类型检查和生产构建已经在上述 Actions 运行里发生过。下一步是给 A01、B17、C01、D03、E05、F11 写逐库收据，而不是再宣布环境不存在。119 个目录、源码完整、可挂载、Node 命令、浏览器收据和 SDK PASS 仍然分开计数。不伪造 E11/F05 的研究原件。

`evidence/repair-validation.md` 记录的是整改当时的定向测试，不是这 119 条的收据。Gantt 和 PDF 的产品风险不能凭公共修复或仓库级 Playwright 关闭。进度档案里的 23/24 轮是历史，不要再开一轮去重复同一句「CI 还没跑」。
