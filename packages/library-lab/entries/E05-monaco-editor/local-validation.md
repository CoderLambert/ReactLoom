# E05 Monaco 本地质量整改记录

日期：2026-11-10。实施 owner：`/root/quality_e05`。只修改本条目，未提交、推送或部署；公共源码、脚本、测试、依赖、锁文件、根索引、队列及 results 均由主控维护。

## 对象、基线与本次改动

- 实际仓库 cwd：`/home/lambert/githubRepos/lambert/ReactLoom`；定向脚本 cwd 另列于命令表。
- Git HEAD：`1218066e706a90ba03fac8dff8c9b843dd2429c4`。
- 派单条目输入摘要：`beddc3cc77e46bf27c0846aacf75286ef1a30da205225003f1963afca02c26aa`，14 个文件；这是 queue 的条目内容 SHA-256，不是 Git commit。起始本条目没有已有 diff。
- 阅读根/本包/条目 AGENTS、COORDINATION / IMPLEMENTATION / REPAIR、质量路线图设计和阶段 1，以及 library-lab-quality Skill 和三个 references。未把历史研究与既有 CI 作为本轮执行证据。

解决的主要问题：旧讲解以清理历史起头，没先解释编辑机制；保存仅在组件 state，离开即失；JSON 只有计数；讲解错误地声称必须点击运行才载入，而当前宿主进入 Demo 会自动挂载。现在围绕 model / editor / 语言服务组织三场景，并同步正文、源码、迁移说明和元数据。

修改文件：`guide.md`、`agent.md`、`library.json`；`examples/example.tsx` 重写交互、诊断列表和草稿闭环；`demo.tsx`、`workers.ts`、`worker-lease.*`、`resource-cleanup.*` 用 Biome 正常排版（既有租约和回收语义保留，字符串改模板字符串）；新增 `draft-store.mjs` / `.d.mts` / `.test.mjs`、`workshop.css`；新增 `official/readme.md`、`official/homepage-response.json`、`official/source-evidence.json` 与本记录、`validation/` 日志。`AGENTS.md` 与 `verification.json` 保持原样，所有正式状态仍为 NOT_RUN。

## Demo 目标与 SDK / 业务分界

| 场景 | 工程问题 | 操作与预期可观察结果 | 真实实现 |
| --- | --- | --- | --- |
| basic | 外部操作怎样修改模型并支持撤销 | 编辑→模型预览变化；插入问候调用→撤销恢复前文 | Monaco createModel / create / onDidChangeContent / executeEdits / undo |
| business | 显式保存和重新挂载后找回草稿 | 保存→继续修改→未保存状态→恢复；刷新后发现草稿但不自动替换；清除只删本键 | Monaco 权威文本 + 本例自建 sessionStorage helper，非 SDK 持久化 API |
| advanced | 怎样定位和修复异步配置错误 | 初始 JSON 尾逗号→真实行列/消息；合法 JSON→0；撤销→错误恢复 | Monaco 内置 JSON Worker 与 marker API，未用手工 parser 或 setModelMarkers |

fixture 只有本地示例文本，没有模拟 Monaco。文本不执行、不上传。草稿只保存在当前标签页的 `reactloom-library:e05:typescript-draft:v1`；空文本有效，200000 字符上限，失败反馈，卸载不删除已明确保存的草稿。3 个目标对应不同机制，不靠换标题凑数。

## 官方来源与版本核实

- 已安装 `packages/library-lab/node_modules/monaco-editor/package.json`：版本 `0.57.0`、MIT、`monacoCommitId=d61824269f1377111d34306e4a47172327777083`。根目录不能 require.resolve 此包；包内直接 require package.json 也被 exports 重映射，故改读实际文件，未以这些解析失败推断依赖缺失。
- 官方 GitHub API 列出上述提交的根目录，只有英文 README.md，没有根目录中文版本；随后从固定提交下载原始 Markdown。发行提交信息和来源地址见 [source-evidence.json](official/source-evidence.json)。上游 package.json 也为 0.57.0。
- [官方固定 README](https://github.com/microsoft/monaco-editor/blob/d61824269f1377111d34306e4a47172327777083/README.md)，7730 bytes，SHA-256：`333e7215227199c4ba97ec927bb09cfcf69b297ba3be108e866aed735a312822`；原文字节保存在 `official/readme.md`，语言 `en`，同步时间见 library.json。
- 关键 API 查实际 `esm/vs/editor/editor.api.d.ts`；JSON 命名空间查 `esm/vs/index.d.ts`；异步诊断查 `esm/vs/languages/features/common/lspLanguageFeatures.js`；默认 JSON 配置查 `esm/vs/languages/features/json/register.js`。
- 版本冲突已处理：同提交 integrate-esm.md 仍含旧 `esm/vs/language/...` 目录，而实际 0.57.0 exports 把子路径映射到 `esm/vs/*`，语言实现在 `languages/features/`。示例保留匹配已安装版本的导入，指南解释冲突，不照抄旧片段。Vite `?worker` / getWorker 设计与官方仍一致。
- 官网 GET `https://microsoft.github.io/monaco-editor/` 返回 200，最终 URL 相同，无 X-Frame-Options / CSP frame-ancestors；完整返回头见 [homepage-response.json](official/homepage-response.json)。HTML 为官方脚本加载首页。尚未从 Lab origin 做 iframe 浏览器确认，`official.homepage.status=unknown`，不写 allowed。

## 实际命令、退出码与原始日志

| cwd | 实际命令 | 结果与边界 | 日志 |
| --- | --- | --- | --- |
| `.../ReactLoom/packages/library-lab` | `pnpm test:policy --entry=E05` | PASS，exit 0；3 文件 / 10 测试，0 fail / 0 skip；只有草稿与资源所有权策略，没有真 Monaco DOM / Worker | [policy.txt](validation/policy.txt) |
| `.../ReactLoom/packages/library-lab` | `pnpm exec tsc --ignoreConfig --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/E05-monaco-editor/examples/demo.tsx` | PASS，exit 0；仅 E05 入口依赖图，不生成目录、不跑全包 typecheck | [entry-typecheck.txt](validation/entry-typecheck.txt) |
| `.../ReactLoom` | `pnpm exec biome check packages/library-lab/entries/E05-monaco-editor/examples packages/library-lab/entries/E05-monaco-editor/library.json` | PASS，exit 0；14 个可识别源码/JSON 文件，未格式化上游 README | [biome.txt](validation/biome.txt) |
| `.../ReactLoom` | `node --input-type=module`，stdin 完整程序保存在日志 | PASS，exit 0；调用当前 validateEntry / entryCompletenessIssues，核实3场景、10个真实源码路径、README摘要与文档本地链接；无全目录 generate | [entry-metadata.txt](validation/entry-metadata.txt) |

首次独立 tsc 未加 TypeScript 7 要求的 `--ignoreConfig`，exit 1 / TS5112；保留 [initial-failed.txt](validation/entry-typecheck-initial-failed.txt)。仅修正该失败命令并重跑，未重复通过的 policy。包信息解析失败和官方文档旧路径是核实时发现的事实，不属于 SDK 执行失败。

## 六项复核

| 维度 | 状态与证据层级 | 证据、界限与后续 |
| --- | --- | --- |
| 技术准确 | PASS · 静态源码/官方版本核实 | 安装包、固定发行提交与类型/JSON适配器吻合；明确旧文档路径冲突、移动不支持、VS Code扩展边界、Worker缓存和sessionStorage业务归属 |
| 解释清楚 | PASS · 静态设计复核 | guide 先说明工程问题/选型，再讲5个对象与文本流向，逐场景给操作、结果、关键API和完整迁移文件；维护历史移到本记录 |
| Demo 有用 | NOT_RUN · 交互结果待浏览器 | 3目标静态对应实际 SDK 调用与可见输出；编辑、撤销、诊断、恢复的真实 DOM 结果需主控验证后裁定 |
| 源码可迁移 | PASS · 静态/入口类型/策略 | 正常格式、10必要源码文件、Vite类型/HTTP(S)/320px容器/Worker边界齐全；幂等/部分初始化/外部映射与存储拒绝分支通过10项策略；对应浏览器清理仍未验收 |
| 官方来源可靠 | PASS · 原文/固定来源/响应头 | 原文7730bytes摘要一致、版本/英文选择/固定提交/日期齐全；官网unknown与未浏览器核实一致，提供直达 |
| 结果可复核 | NOT_RUN · 局部检查有日志，核心浏览器待跑 | policy、entry tsc、Biome和元数据真实退出0已记录；不能凭这些标本条目 SDK / build / browser / isolation PASS |

内容状态不能因前四项局部静态检查晋级 content_done；主控补齐核心浏览器结果及独立复核后决定。正式收据另需获准的干净提交输入，不能在当前 dirty 并行工作树伪写。

## 交给主控的可操作验收

页面：`/libraries/monaco-editor?tab=demo&demo=basic`（实际选择方式以主控路由 helper 为准）。进入场景自动挂载；若先停止，点击“运行当前示例”。

1. basic：`monaco-editor-root` 下真实 `.monaco-editor` 可见；真实键盘编辑后 `monaco-model-text` 和 `monaco-model-status` 变化；“插入问候调用”出现 `console.txt(greet('Ada'))`；“撤销”恢复操作前文本。根 `data-model-uri` 在重挂后不同。
2. business：键盘编辑后点“保存本地草稿”，`monaco-saved-draft` 与模型一致；继续改后显示“有未保存改动”；“恢复本地草稿”还原；刷新后显示发现草稿但模型仍为初始值，再恢复。`monaco-draft-status` 给每步结果；“清除本例草稿”删除该键但保留当前代码及其它key。可附加空文本和存储拒绝断言。
3. advanced：`monaco-diagnostics` 初始尚未收到快照，最终非零个标记，错误列表有“第 N 行，第 M 列”和SDK消息；点击位置后焦点进入编辑区；“载入合法 JSON”最终0；“撤销”后最终非零。用 expect.poll / 自动等待，不能固定sleep或把等待态当0。
4. 挂载/切场景/停止/离开：没有 pageerror 或 Worker失败/主线程回退；真正语言Worker被创建；旧DOM卸载；最后租约释放只删除自有 MonacoEnvironment；可进一步观测旧 model 不再存在。线程可由Monaco缓存，不能要求所有Worker立刻归零。
5. README原文页签的固定来源/语言/版本正确；官网状态unknown与直达入口存在。iframe是否可用仍为NOT_RUN，不从load事件自动升级allowed。

主控已承接共享 E2E 和统一稳定输入屏障。本工作者未运行 generate / catalog:check / 全包typecheck / build / 会隐式build的Playwright；未启动或停止共享服务。当前没有新增公共依赖需求。


## 独立复核 P1 修复：marker 变化不等于校验完成

独立复核指出合法 JSON 再做合法编辑会永久显示等待。已核实已安装 0.57.0 的 `esm/vs/platform/markers/common/markerService.js` 第149–155行：空结果只有删除了已有 marker 时才发变化事件，空→空可以没有事件。旧实现每次 content-change 都 `setMarkers(null)`，错误地把变化事件当每次验证完成通知。

最小修复：删除每次编辑时清空 marker 快照的操作；首次没有快照仅显示“尚未收到 JSON 诊断快照”，后续显示最近收到的数量/位置/消息，明确新文本可能暂时对应旧结果，0标记不证明当前版本已验证。没有超时、轮询伪造0或手造marker。同步 guide、agent 和页面说明。控件名/testid未变。

只重跑受影响的 E05 入口 TypeScript 与 example.tsx Biome，均 exit 0，原始日志为 `validation/review-fix-typecheck.txt` 和 `validation/review-fix-biome.txt`。没有改动/重跑既有草稿与资源策略；此前10项PASS只复用于未变化的helpers。浏览器回归由主控添加：初始错误→合法JSON0→键入空格仍合法→不永久等待；撤销空格，再撤销合法替换，应恢复真实错误标记。核心浏览器仍为NOT_RUN，正式verification没有变化。
