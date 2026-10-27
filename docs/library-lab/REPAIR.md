# Library Lab 审核整改（2026-10-28）

本文件记录用户要求“全部修复”后的人工整改，取代继续扩充未经运行验收的条目。基线 `87ea2afe5957ba370f114f0acecb8cde1cd0c5eb`；唯一远端集成分支 `feat/library-lab`，主 PR #8 必须保持 Draft。**代码修复不是完整运行验收。** 不改 main、PR #3、模板、公开部署或计费配置。

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

`pnpm --filter @reactloom/library-lab dev` 同时监听 `http://127.0.0.1:4319`（主站）与 `http://127.0.0.1:4320`（MSW runner）。`build` 构建两个产物，`preview` 启动两个预览服务器；只监听 loopback，不进行部署。独立端口是不同 origin，不是任意代码沙箱。

F11 在原 Node 复现命令下增加“真实浏览器请求拦截”面板。每次显式启动生成 UUID scope `/lab-runners/msw/sessions/<uuid>/`。只有已注册 runner origin、对应 iframe Window、协议与 session 全匹配的消息才被接收。关闭先等待 stop/unregister ACK；超时标记“清理未确认”，不能当作卸载通过。`pagehide` 是尽力清理，不保证浏览器进程被强杀后立即删除 SW。不同会话不做全局存储/Worker 清空。

官方 `msw init` 产物只写 `runners/msw/public`，由专用 middleware 在每次会话脚本路径供应，限制 `Service-Worker-Allowed`。删除的仅是旧的主站生成物 `public/lab-runners/msw/mockServiceWorker.js`。原 `entries/F11-msw/examples/browser-worker.mjs` 保留为历史适配示例；新平台生命周期实现是 `runners/msw/main.mjs`，复用 `handlers.mjs`、`routes.mjs`。其他未注册 browser-frame 能力继续 fail closed，不伪称支持所有隔离执行类型。

## 锁文件与验收

现有根锁文件尚无可信的 Lab importer，本轮**没有手造锁文件或修改版本 pin**。CI 将“生成候选锁文件”与“接受构建”分开：候选 job 只能上传实际解析结果；runtime job 必须 `--frozen-lockfile`。没有锁文件时验收应失败，不可用 no-frozen 冒充恢复成功。

在能够访问 registry 的完整工作树、Node >=22.18 / pnpm10 环境中，运行既有受控入口：

```sh
# 仓库根目录；分支必须为 feat/library-lab，已有 lock 编辑必须先协调
pnpm verify:library --execute --resolve-lock --sdk --browser --setup-browser
```

审查真正生成的锁文件、依赖 peer/许可和日志后再提交。不能修改账单/权限来绕过授权，也不能删除原检查。这个命令是恢复入口，不是本轮已执行结果。

需记录逐库可接受证据时，在干净的已提交输入上运行：

```sh
pnpm --filter @reactloom/library-lab verify:record --entry=D03 --kind=sdk
pnpm --filter @reactloom/library-lab verify:record --entry=D03 --kind=sdk --execute
pnpm --filter @reactloom/library-lab verify:record --entry=F11 --kind=browser --execute
```

不带 `--execute` 只显示固定计划。真实运行保存到 `docs/library-lab/evidence/runs/`，输出可审查的 verification 元数据，不代写 worker 的记录。缺少专用 SDK 套件或浏览器 `@ID` 标签会明确失败；命令显示/Node 规则单测不替代 SDK。收据摘要是完整性检查，**不是数字签名，也不能阻止有仓库写权限的人伪造一整套文件**；审核仍需核对 CI/实际执行日志。

## 交付门槛和剩余队列

先完成可信锁文件、干净冻结安装、完整类型/构建，再验收 A01/B17/C01/D03/E05/F11 六个风险切片，之后才扩大运行验收范围。119 目录、原文审核、源码完整条目、浏览器成功演示、SDK 通过分别计数；不修改 117 份原资料的审核口径，不伪造 E11/F05 原件。

本次实际验证范围与原始命令在 `evidence/repair-validation.md`。运行基线、完整生产构建和真实浏览器仍缺证据。原 Gantt/#40 和 PDF 相关风险不能凭本轮公共修复关闭。旧自动轮数保留 23/24，不创建新的 24 轮循环；历史进度原样归档，后续只汇报可运行结果或明确权限需求。
