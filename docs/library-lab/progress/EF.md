# EF 通道持续开发进度

- 通道：EF，Issue #7；当前 wave4 分支 `feat/library-lab-ef-wave4`，Draft PR #20；PR base 为 `feat/library-lab`。
- runCount：4 / 24。
- 基线：`38ed2d247bd82e4f1422b0e8904973e16bca2972`。
- 本轮日期：2026-10-27（北京时间）。
- 状态：**累计21/37个库已经接入真实第三方SDK示例或CLI源码、Guide与Agent手册；其余16项待接入。SDK、构建、浏览器验证单独计数，目前不得宣称PASS。**
- 写入所有权：仅 `entries/E*`、`entries/F*` 和本进度文件，公共依赖/CI/runner 未触碰。

## 首轮交付（5库，详见PR #11；不等于SDK验收）

| 条目 | basic/business/advanced | 真实依赖与源码 | 验证与限制 |
| --- | --- | --- | --- |
| E05 Monaco Editor | TS 编辑/草稿保存/JSON 诊断 | `monaco-editor@0.57.0`；Vite 5 worker 构造器、模型生命周期、ResizeObserver | Worker/CSP/生产 bundle/模型销毁需浏览器确认；Monaco 内部共享 worker 不能仅凭 model.dispose 断言已停止 |
| F11 MSW | GET 200/验证码 200+422/一次 503 后恢复 | `msw@3.0.3`；同一 handlers.mjs 被 node-runner/browser-worker 复用；新增 `tests/node-scenarios.test.mjs` 真 SDK 测试 | Node/浏览器未运行；浏览器必须由 PLATFORM 提供独立 scoped iframe + 正式 worker |
| E06 react-markdown | 基础排版/GFM验收表格/恶意 Markdown | 真实 react-markdown/remark-gfm/rehype-sanitize，严格 URL/HTML 策略 | 需要 XSS/network 真浏览器验收；依赖已经在初版 package 声明 |
| E10 DOMPurify | 简单富文本/业务公告/攻击字符串 | `dompurify@3.4.17`；HTML profile 与禁止属性，展示净化前后 | 不将静态字符串判断冒充 XSS 实测；须查浏览器最终 DOM |
| F02 react-dropzone | 格式筛选/本地文本预览/体积拒绝+竞态 | `react-dropzone@20.1.4`，真实 useDropzone/getRootProps/getInputProps，generation 避免旧读取回写 | 需要 File API/拖放/键盘 E2E，示例不上传或存储文件 |

5 个条目共 15 个独立场景，E05/E06/E10/F02 是 React 宿主可按需 import 的真实代码，F11 为真实 Node/MSW CLI 和受限 Worker 配接源码；**MSW 目前没有站内可执行的浏览器 Demo**，不可计算成 React 可运行数。所有条目 `library.json`、`guide.md`、`agent.md`、`AGENTS.md`、`verification.json` 已增补。示例源码供平台生成器展示 SHA-256；不再重复维护展示副本。

## 真实验证状态

- GitHub Git Tree 创建成功，仅代表服务器存储了源码；**不是编译或测试通过**。
- 当前容器无法解析 registry.npmjs.org/api.github.com，未安装新的目标 SDK，无法运行依赖完整的 `typecheck`、`build`、真实 `node --test` 或浏览器。
- 因此新五条目标库 SDK 均 `NOT_RUN`，浏览器均 `NOT_RUN` 或 `BLOCKED`，缺依赖构建 `BLOCKED`。没有使用目标 SDK 的 Mock 冒充通过。
- 已添加 F11 `tests/node-scenarios.test.mjs`，必须在依赖安装后实际运行；运行前不记 PASS。
- 原研究包原件未被执行，也未将历史归档报告抬升为真实 SDK 结果。
- 版本/API 来源已参照 2026-10-27 可访问的 Monaco 官方 ESM 集成、MSW v3 官方 Quick Start/Vite、DOMPurify/npm、react-dropzone 官方使用说明，根锁文件仍需 PLATFORM 核验。

## dependencyRequests（PLATFORM 唯一安装 owner）

| 包 | 建议精确版本 | 使用原因 | 类型/兼容/许可 |
| --- | --- | --- | --- |
| `monaco-editor` | `0.57.0` | E05 编辑器和 `?worker` Vite Worker 打包 | 内建 TS，MIT，浏览器/Web Worker；不复制 VS Code 扩展 |
| `msw` | `3.0.3` | F11 Node fetch 真拦截、Worker 配接 | ESM-only，Node >=22、TS >=5.9，MIT；`msw/http`、`msw/node`、`msw/browser` |
| `dompurify` | `3.4.17` | E10 HTML-only XSS 学习实验 | 内建 TS，MPL-2.0 OR Apache-2.0；旧版存在安全公告 |
| `react-dropzone` | `20.1.4` | F02 文件拖入/选择与校验 | 内建 TS，React >=18，MIT |
| `react-markdown` / `remark-gfm` / `rehype-sanitize` | 原 package 已有 10.1.0/4.0.1/6.0.0 | E06 | 不另加依赖，先完成锁文件 |

请 PLATFORM 统一修改 `packages/library-lab/package.json`、`pnpm-lock.yaml` 与测试/runner 接线，优先真实解析安装，不手工伪造锁文件 integrity。新增依赖版本若与现有 React/Vite/TypeScript peer 冲突，确认兼容替代版本并通知本通道修改条目 manifest。

## 公共运行环境请求

1. F11 Node runner：支持 `node entries/F11-msw/examples/node-runner.mjs basic|business|advanced`，或 `node --test entries/F11-msw/tests/node-scenarios.test.mjs` 的独立 test:sdk 入口。runner 内使用 `library-lab.invalid` 固定伪域名，必须由 MSW 真正拦截；未匹配时应失败，不得连真实外网。
2. F11 browser runner：单独 `/lab-runners/msw/` 文档与官方 `mockServiceWorker.js`，限定 Worker scope，不允许控制全站 root；启用/停止后核查 registration，且生产构建实际包含 runner（官方 Vite dev 插件默认不生成生产 worker）。
3. E05：构建 worker chunk、JSON/TypeScript language diagnostics，审查 CSP 的 `worker-src`；在切换、卸载和重挂后检查 model URI 与 Worker 占用，内部 Worker 缓存仍可能持续存在。
4. E06/E10：XSS 和不安全 URL 网络检查；F02：拖拽/本地文件键盘交互。当前 Lab 公共 `DemoHost` 对 Node 类型只显示源码，这应明确展示复现命令，不要伪装在线 shell。

## 第一轮原定后续（本轮部分已经完成）

- E04 CodeMirror 6：模块化编辑器及 destroy，补与 Monaco 的选型比较。
- E09 Shiki：仅用户打开高亮或源码 Tab 时加载，AST 原始文本保持一致。
- F03 Papa Parse：CSV quoted/newline/编码、导出公式注入、流式大文件边界。
- F12 Vitest：真实 CLI 示例与 Scenario Matrix 断言，避免借 Mock 测试声称真 SDK 验证。
- 后续按重用价值处理 E07 remark/E08 rehype/F13 Playwright 等，并继续推进其余 E/F 条目。

不要因为某一项 npm 安装失败就在下一轮重复浪费资源；先在其他条目连续交付有依据源码与知识，再等待 PLATFORM 统一解决环境。


## 第二轮实际交付（2026-10-27，wave2）

新分支 `feat/library-lab-ef-wave2` 基于最新已集成 `feat/library-lab@df4674d501bac029f8529ff940ba9b8c8707347c`，避免已经合并的PR #11旧基线覆盖新平台代码。该轮**六条完整垂直源码、每库三层共18个场景**，累计本通道11库33场景源码（不等于所有场景可浏览器执行）。

| 条目 | 类型与三层源码 | 核心复用/边界 |
| --- | --- | --- |
| E04 CodeMirror 6 | React：EditorState/EditorView、会话草稿、Compartment动态只读 | effect挂载/卸载destroy、IME风险、局部sessionStorage，不模拟EditorView |
| E07 remark | React：mdast标题提取、GFM表格处理、危险URL/raw HTML审计 | 真remark+GFM processor，输出仍是Markdown文本，不称sanitize |
| E08 rehype | React：HAST/HTML parse、公告净化、恶意HTML隔离预览 | 真rehype+rehype-sanitize，iframe sandbox空许可+CSP独立约束 |
| E09 Shiki | React：真实tokens/语言切换、不可信代码安全展示 | 复用已声明shiki@4.5.0，React文本token，不用innerHTML，按需启动 |
| F03 Papa Parse | React：引号跨行解析、RSS CSV导入、错误行/公式注入 | 真Papa.parse/unparse，另有3个Node真实SDK断言文件，未执行 |
| F12 Vitest | Node-CI：纯函数、200/422/503场景矩阵、fake timers取消竞态 | 真Vitest测试文件 basic/business/advanced；不提供伪造网页命令执行 |

每条新增/更新 library.json、guide.md、agent.md、AGENTS.md、examples/、verification.json（均未写入无证据PASS）。F03另含 `tests/node-scenarios.test.mjs`，F12含三份 `*.test.ts` 实际Vitest入口。源码由平台生成器以相同文件展示并计算指纹，不维护第二份展示代码。

### 第二轮新增 dependencyRequests（PLATFORM 独占package/lockfile）

这些版本来自2026-10-23官方发行基线，已查阅2026-10-27可访问的官方API文档；**最终须由PLATFORM在CI解析包版本、peer、license及锁文件后确定**：

| 包 | 请求版本 | 目标条目 | 备注 |
| --- | --- | --- | --- |
| `codemirror` | 6.0.2 | E04 | 组合汇总包，提供basicSetup/EditorView；MIT |
| `@codemirror/state` | 6.7.6 | E04 | EditorState、Compartment；MIT |
| `@codemirror/lang-javascript` | 6.2.5 | E04 | javascript({typescript:true})；MIT |
| `remark` | 15.0.1 | E07 | Markdown parse/stringify；MIT；remark-gfm 4.0.1已有 |
| `rehype` | 13.0.2 | E08 | HTML parse/stringify；MIT；rehype-sanitize 6.0.0已有 |
| `papaparse` | 5.7.0 | F03 | CSV parse/unparse；MIT |
| `@types/papaparse` | 5.5.2 (dev) | F03 | DefinitelyTyped；实际TS解析确认 |
| `vitest` | 5.0.5 (dev) | F12 | 应与Vite8/Node22/现有Vitest版本协调；MIT |
| `shiki` | 4.5.0 | E09 | **已在当前PLATFORM包声明，无需重复添加** |

PLATFORM 接入后应追加F03 Node SDK定向测试：`node --test entries/F03-papaparse/tests/node-scenarios.test.mjs`；F12独立测试：`pnpm --filter @reactloom/library-lab exec vitest run entries/F12-vitest/examples/*.test.ts`，不能将单测源文件存在当作测试PASS。

### 本轮真实验证

仅 GitHub Git Object/API 提交成功；**没有在本执行环境实际运行以上6项的目标SDK、TypeScript构建或Chromium**。运行前SDK=NOT_RUN，build=BLOCKED（公共缺依赖），browser=NOT_RUN；不得继承旧研究包的领域单测PASS。E09虽然已在package声明，但尚无本轮SDK执行证据。后续优先检查版本安装和官方SDK运行，不反复尝试已知失败的DNS操作。

### 下一批队列

优先E03 Lexical、F13 Playwright（真实CLI）、F01 Uppy、F06 PDF.js；随后E01 Tiptap、E02 BlockNote、F07 react-pdf、F14 Storybook。依赖/授权复杂的库先完成指南、版本审查和独立隔离设计，再由平台统一接线。范围剩26个条目待完整处理；E11/F05原件仍缺失，应标recreated而不伪称恢复。

### 第二轮代码复核补丁（同批提交）

- F03：文件异步读取捕获稳定 input 引用，避免 await 后访问 React event.currentTarget；对 Papa Parse 多余/缺失列及 __parsed_extra 拒绝导入；高级案例使用有效 `=2+3` 输入实际演示 escapeFormulae，并保留列数错误行。
- E07：禁止将以 `//` 开头的协议相对 URL 误判为站内路径。
- E09：新输入触发高亮时先清空旧 token，防止错误把过期视觉内容当新数据。
- F12：使用稳定的 Vitest `toHaveBeenCalledTimes` + `toHaveBeenCalledWith` 断言，避免较新matcher版本差异。
- 另新增 E04/E07/E08/E09 各2条真实SDK Node `tests/node-scenarios.test.mjs` 断言源码。只是测试文件已创建；未安装/运行，**不能标 PASS**。PLATFORM 可定向 `node --test packages/library-lab/entries/{E04-codemirror6,E07-remark,E08-rehype,E09-shiki}/tests/node-scenarios.test.mjs`（请注意shell brace-expansion需显式匹配路径）。

## 第三轮实际交付（2026-10-27，wave3）

**分支**：`feat/library-lab-ef-wave3`，从当时最新集成 `feat/library-lab@2b244ef44cbf8e216a0f39e77b763acae8f50c04` 建立，避免旧 wave2 分支覆盖平台并发改动。此前 PR #11 与 PR #15 均已核实合入集成分支。

本轮新接入 **5 库，15 个basic/business/advanced场景源码**；累计 EF **16/37 条有真实第三方SDK或CLI配方及完整指南/Agent文档，剩余21条**。该计数仅代表源码/知识接入，不表示实际浏览器验收已经PASS。

|条目|场景与原始源码|安全及真实能力边界|
|---|---|---|
| E03 Lexical | 真 lexical/@lexical/react Composer + EditorState输入 / sessionStorage JSON草稿 / 选区格式命令与撤销 | 限制草稿100KB，parser失败不覆盖；真实浏览器IME/JSON兼容性未验证；v0.52 Extension Composer需后续选型 |
| F13 Playwright | 真 @playwright/test CLI：可访问名称定位与状态 / 200、422、503浏览器route场景 / AbortController旧新请求竞态 | 测试源为Node-CI运行型，不在站内运行任意shell，不冒充真实后端请求 |
| F01 Uppy | 真 @uppy/core：File选择拖入与限制 / 本地预览删除 / 超大文件拒绝与销毁 | **只有本地Core队列**，无上传插件，不画虚假进度，不请求Transloadit/S3 |
| F06 PDF.js | 真 pdfjs-dist + `?url`同版Worker：原创有效PDF Canvas / 分页提取 / HiDPI缩放与坏字节错误恢复 | 按需启动，局部文件≤3MB，取消renderTask和loadingTask，未加载外部PDF |
| F17 axe-core | 真 axe.run 当前子树：缺图片alt / 表单label / 空名按钮3规则修复对照 | **仅选取3条规则**，不能从零违规推断所有WCAG通过；故意失败DOM仅作教学 |

**新增源文件组织**：每条均含 `library.json`、`guide.md`、`agent.md`、`AGENTS.md`、`verification.json`，3个场景定义和真实复用源文件。React场景的 `examples/demo.tsx` 只导出 `example.tsx`；F13采用独立Playwright config与3个`*.spec.ts`，不用主应用假造终端。已有来源审计未改变E11/F05未恢复的事实。

### 静态与独立检查（非SDK验收）

- GitHub Git Tree 中检查5份库manifest可解析、每份3个唯一basic/business/advanced demo、实际入口列在sourceFiles且所有源码路径已提交、agent/guide/AGENTS/verification均存在：**5/5 PASS**。这不是TS类型检查，不是DOM/SDK已运行。
- F06原创PDF fixture算法另用 Python/PyMuPDF 复刻相同xref/stream构造逻辑，验证2页文本可被独立PDF解析器读取：**结构算法预检 PASS**。未在本轮使用真正的 pdfjs-dist Worker，因此F06 SDK仍 NOT_RUN。
- 对照2026-10-27官方文档核查：Lexical 0.52.0、pdfjs-dist 6.4.299、axe-core 4.14.0、Uppy Core API及许可，以及Playwright已存在的1.64.0依赖。包具体peer/lockfile尚需平台安装时再确认。
- 不可执行的项目门禁：`pnpm --filter @reactloom/library-lab typecheck`、`build`、真SDK导入/CLI和Chromium E2E均未完成（PLATFORM统一依赖/Runner仍待就绪）；所有库验证状态仍为NOT_RUN/BLOCKED，不能冒用研究包历史PASS。
- 最近集成GitHub workflow 40395555157仍见2个Job runner_id=0/steps=[]，在正式执行前失败；不重复猜测原因或循环重跑。

### 新增 dependencyRequests（只由PLATFORM统一安装）

|依赖|请求准确版本|许可及用途|适配注意|
|---|---|---|---|
| `lexical`、`@lexical/react` | `0.52.0` 均保持同版 | MIT；E03 文档编辑器 | React19、v0.52 Composer/Extension区别；运行时确认peer |
| `@uppy/core` | `6.1.0` | MIT；F01纯本地状态/限制/事件 | 不需要XHR/Tus或@uppy/react；不能误加收费服务 |
| `pdfjs-dist` | `6.4.299` | Apache-2.0；F06解析/Worker | Vite同版`pdf.worker.min.mjs?url`、CSP与单例Worker核对 |
| `axe-core` | `4.14.0` | MPL-2.0；F17规则审计 | 区分浏览器实际DOM与jsdom模拟 |
| `@playwright/test` | **已声明1.64.0，无需重复添加** | Apache-2.0；F13 Node-CI | 独立config位于`entries/F13-playwright/examples/playwright.config.ts`，需真Chromium |

请PLATFORM把准确版本及peer验证后写入本包package.json + **真实解析的**根pnpm-lock.yaml，优先运行定向命令和构建，不能手工编造lock integrity。F13可运行：
```bash
pnpm --filter @reactloom/library-lab exec playwright install chromium
pnpm --filter @reactloom/library-lab exec playwright test --config entries/F13-playwright/examples/playwright.config.ts
```
E03/F01/F06/F17需与公共DemoHost真实浏览器验证，尤其StrictMode重挂、Worker版本/CSP和清理、axe仅局部扫描。

### 下一批（EF剩21库）

优先 E01 Tiptap / E02 BlockNote / F07 react-pdf / F15 Knip / F14 Storybook，然后 F16 dependency-cruiser / F18 rollup-plugin-visualizer / E13 PhotoSwipe 等。大型WASM/视频/远程素材仅按显式加载与合法授权实施。E11 Streamdown/F05 SheetJS归档原件缺失，不得伪称已恢复。

当前runCount=3/24。worker只改自己entries/E、entries/F和本progress；没有修改公共依赖、CI、主分支或其他组。

## 第四轮实质代码交付（2026-10-27，北京时间，wave4）

**恢复与安全分支**：已读最新集成 `feat/library-lab@688a660272775b3399a18ae34630401a19ac556c`、根及应用AGENTS、协议、PR #11/#15/#17（已合入集成）和原进度；从当前集成分支创建 `feat/library-lab-ef-wave4`，没有复用已合并旧分支的祖先覆盖公共平台。此轮仅EF entries 与本进度文件，主PR #8保留Draft，PR base严格 `feat/library-lab`。

本轮**新增5条完整工程条目、15个basic/business/advanced场景**，包含直接来自真实库的源码或实际CLI配方，以及完整guide/agent/AGENTS与分项验证文件：

|库|执行类型与三层真实源码|可复用的工程重点|
|---|---|---|
|E01 Tiptap|React EditorContent：StarterKit工具栏/JSON会话草稿/结构限额和恢复|ProseMirror命令、编辑器生命周期、IME、外部富文本输出安全，Tiptap3.32.0|
|E02 BlockNote|React：useCreateBlockNote/Mantine块编辑/JSON保存恢复/真实insertBlocks|订阅清理、块schema、MPL许可与商业XL隔离、样式副作用，0.56.0|
|F07 react-pdf|React：原创两页PDF/分页与TextLayer/本地坏文件和恢复|react-pdf11 + pdfjs同版Worker，最多3MiB，文件竞态，离线运行|
|F14 Storybook|Node-CI：真实CSF3 Basic/Business/Advanced stories + play断言 + 独立Storybook配置|storybook10.6.1（已有SPA模板版本）；不是主站假终端，实际Storybook CLI验收待PLATFORM|
|F15 Knip|Node-CI：三套真实knip config +完整隔离fixture，unused文件/依赖、入口范围/production|knip6.41.0，报告不等同可自动删除，退出码可因故意未使用代码非零|

- **提交1**：`c05b6cd9c9dd45dc41b1b454958c090a2fcc6412`（E01/E02/F07，22个源码/资料文件）。
- **提交2**：本轮后续提交（F14/F15及持久进度、依赖请求）。
- **结构校验**：通过GitHub Git Tree/Blob实际读取5个 `library.json`，5份均为合法JSON，5×3 Demo声明具有唯一basic/business/advanced，entryPoint属于sourceFiles且仓库Blob存在，guide/agent/verification存在：**5/5结构PASS**。此检查不调用任何目标SDK，不能等同业务功能PASS。
- **F07 fixture 算法预检**：直接读取本批提交的 fixture.ts，仅剥离 TypeScript 类型注解后在 JS 沙箱执行，获得 925 字节/2页/7对象，全部对象 offset、xref、stream Length 均匹配：结构预检 PASS，**未运行 react-pdf/pdfjs SDK**。
- **实际运行**：本环境 registry.npmjs.org 仍返回 EAI_AGAIN；此前已有相同阻塞，本轮仅一次验证后不再循环安装。没有pnpm可执行/依赖的完整构建环境，E01/E02/F07 SDK NOT_RUN，F14/F15真正CLI NOT_RUN，TypeScript/Vite BLOCKED，Chromium/Storybook未运行。不会继承历史研究或其他条目PASS。
- **来源**：以2026-10-27核对的 Tiptap/BlockNote/react-pdf/Storybook/Knip 官方使用/发行页为基准重新实现，版本仍待PLATFORM实际pnpm解析及peer证实。所有示例输入是原创/本地，未引入第三方付费素材或服务。

### 第四轮新增 dependencyRequests（只由PLATFORM修改package与lockfile）

|包与版本|条目|正式接入注意|
|---|---|---|
|`@tiptap/react@3.32.0` + `@tiptap/pm@3.32.0` + `@tiptap/starter-kit@3.32.0`|E01|三包同版本，React19，Tiptap v3的StarterKit/useEditor API，MIT|
|`@blocknote/core@0.56.0` + `@blocknote/react@0.56.0` + `@blocknote/mantine@0.56.0`|E02|三个包同版；MPL-2.0；Mantine peers准确版本由平台解析，禁止XL未经许可|
|`@mantine/core` + `@mantine/hooks` + `@mantine/utils`|E02|直接官方安装要求；**精确版本未知，必须由PLATFORM依据@blocknote/mantine 0.56实际peer解析后填写**，不能伪造|
|`react-pdf@11.0.0`|F07|React19+ / Node22.13+ / MIT，生产Worker同模块配置|
|`pdfjs-dist` 与react-pdf 11解析到的兼容版本|F07|用于本地 `?url` Worker；避免与F06版本冲突，核对pnpm hoist及PDF.js主线程/worker严格同版；暂不编造版本|
|`storybook@10.6.1` + `@storybook/react-vite@10.6.1` + `@storybook/addon-a11y@10.6.1`（dev）|F14|和ReactLoom现有SPA模板对齐；Storybook应由独立CLI运行，不能打入SPA主包|
|`knip@6.41.0`（dev）|F15|ISC；Node CLI只读fixture，不调用 --fix，也不扫描或删除用户生产仓库|

公共环境请求：PLATFORM安装后运行针对E01/E02/F07的定向typecheck/build+Chromium，分别检查编辑器卸载/IME、Mantine CSS隔离、PDF Worker路径/CSP/分页。F14通过 `pnpm exec storybook dev -p 6029 --no-open --config-dir entries/F14-storybook/examples/.storybook` 与build进行真实play/组件测试；F15通过 `pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.basic.json` 及business/advanced（高级加 `--production`）检查报告类别。**node-ci 配方不允许在网页伪造执行结果。**

### 剩余计划（EF 21/37已接入，待完成16项）

优先 F16 dependency-cruiser、F18 rollup-plugin-visualizer、E13 PhotoSwipe、E14 react-easy-crop、E15 pica；随后F04 ExcelJS、F09 pdf-lib、F08 @react-pdf/renderer、E17 hls.js、E18 wavesurfer.js，最后评估E19 ffmpeg.wasm大资源隔离和E11/F05原件缺失重建。持续维护版本/许可/验收证据。用户不需要对每个小阶段重复批准。

## 第五轮：媒体本地处理与工程CLI实战（2026-10-27，北京时间）

- **新分支**：`feat/library-lab-ef-media-tools-20261027`，基于当轮最新集成 `feat/library-lab@53e6c93003b08f6aac14da9c375e210e6b12540a`。旧 `feat/library-lab-ef-wave5` 已存在但落后集成分支，因此不force更新、不覆盖既有提交，而新建独立分支。
- **前轮PR状态**：#11、#15、#17、#20 已确认合入 `feat/library-lab`；主PR #8仍为Draft。
- **本轮新增5库，15个basic/business/advanced真实SDK/CLI场景源码**；累计EF为 **26/37 库具有源码与指南，余11库**。不等于SDK/浏览器PASS。
- **仅EF授权文件**：`entries/E13`、`entries/E14`、`entries/E15`、`entries/F16`、`entries/F18` 和本进度文件；未修改根package、锁文件、公共src/CI、旧模板、main。

|条目|新增真实源码及交付|关键边界|
|---|---|---|
| E13 PhotoSwipe 5.4.4 | React中真正构造PhotoSwipeLightbox，原版灯箱延迟import、原创本地SVG画廊、动态追加缩略图、destroy；完整guide/agent | width/height元数据、键盘/触控/焦点、StrictMode重复挂载、CSS范围和无远程图像 |
| E14 react-easy-crop 6.2.4 | 真Cropper drag/zoom与onCropComplete、Canvas drawImage/toBlob产生本地PNG；高级选择本地文件、文件大小/解码像素验证、URL回收 | 裁剪坐标不等于导出文件；未实现rotation不能虚称旋转裁剪；切换/卸载通过generation防旧回写 |
| E15 pica 10.0.3 | 真pica()工厂、resize/toBlob、原创Canvas图像、本地格式/像素限制、与原生Canvas对照及cancelToken | v10 API迁移、Worker/WASM仅按条件使用，无法假定Worker自动释放；体积不等于画质 |
| F16 dependency-cruiser 18.5.0 | 完整隔离三层TS导入fixture、forbidden域层规则与circular规则、真实CLI node启动器和verify脚本 | basic预期CLI0，business/advanced故意违规非0；不扫描或删除生产仓库 |
| F18 rollup-plugin-visualizer 7.1.1 | 独立Vite8 fixture、treemap HTML / Markdown / raw-data JSON三模式、真实dynamic import代码、verify构建脚本 | 不写假构建尺寸；报告可能泄露私有源码路径，禁止公开自动上传；不修改主Vite构建 |

### 本轮验证范围和真实状态

- 通过GitHub Tree实际核对5/5 `library.json` 解析、5×3唯一场景声明、每个entryPoint和sourceFiles文件Blob存在、guide/agent/AGENTS/verification齐全，结构一致性 **PASS**。此验证不依赖目标SDK，也不等于TS类型或浏览器通过。
- E14源代码审查补丁：本地图片首先createImageBitmap做尺寸限制，在媒体替换时用requestId过滤过期解码；切换zoom时取消旧导出busy状态；本地文件仅PNG/JPEG/WebP≤4MiB且像素≤1600万。仍需真实浏览器内存/移动端验收。
- E15源代码审查补丁：真实resize完成后撤销本轮cancel回调，后续toBlob只做generation隔离，防止取消已结算token导致无关拒绝。
- **真实SDK与Node-CLI：NOT_RUN；TS/Vite完整构建：BLOCKED；Chromium：NOT_RUN**，因为公共依赖仍未装入完整可用锁文件，先前npm DNS与GitHub Runner阻塞未有成功恢复证据。本轮没有重复失败安装、也没有把结构检查虚称SDK测试。
- F16与F18含真正的 `examples/verify.mjs`，运行前不能把声明中的“期望退出0/非0”当成已出现的输出。EF不具有安装依赖或修改CI的写入所有权，相关请求交PLATFORM。

### 第五轮 dependencyRequests（PLATFORM 唯一owner）

|准确包名|官方/npm版本基线|用途、许可、兼容性|
|---|---|---|
| `photoswipe` | `5.4.4` | E13，MIT，`photoswipe/lightbox`、`photoswipe/style.css`、`import('photoswipe')`；须确认构建chunk、键盘与destroy。|
| `react-easy-crop` | `6.2.4` | E14，MIT，React19 peer和Cropper类型需真实锁文件解析；支持受控crop/zoom/onCropComplete。|
| `pica` | `10.0.3` | E15，MIT，v10工厂默认导出与cancelToken，Worker/CSP及Canvas能力浏览器检查。|
| `dependency-cruiser`（dev）| `18.5.0` | F16，MIT，Node CLI `depcruise`；检查Node22兼容与config解析；不引入web运行包。|
| `rollup-plugin-visualizer`（dev）| `7.1.1` | F18，MIT，与ReactLoom SPA模板当前使用的版本一致；独立Vite8 build fixture。|

PLATFORM统一变更 `packages/library-lab/package.json` 和真实生成的 `pnpm-lock.yaml`，确认同版peer后执行以下针对性命令（命令仅供真实运行，不可先记PASS）：

```sh
pnpm --filter @reactloom/library-lab typecheck
pnpm --filter @reactloom/library-lab build
node packages/library-lab/entries/F16-dependency-cruiser/examples/verify.mjs
node packages/library-lab/entries/F18-rollup-plugin-visualizer/examples/verify.mjs
pnpm --filter @reactloom/library-lab test:e2e
```

E13/E14/E15应在Chromium使用真正SDK手动/自动完成灯箱Esc与卸载、Canvas Blob解码/像素、pica cancelToken/旧批次不回写以及网络面板零外部图片上传，再更新对应verification.json。

### 下一轮（EF剩11库）

E11 Streamdown（历史仅摘要，必须标recreated）、E12 assistant-ui、E16 Video.js、E17 hls.js、E18 wavesurfer.js、E19 ffmpeg.wasm；F04 ExcelJS、F05 SheetJS（历史仅摘要，必须标recreated）、F08 @react-pdf/renderer、F09 pdf-lib、F10 Orval。优先F09/pdf-lib、F04/ExcelJS、F10/Orval等无需巨大浏览器资源的条目，再处理媒体/AI编辑和WASM隔离；依赖和许可证以官方一手资料重新核验，禁止生成占位Demo冒充真实SDK。

runCount=5/24。本次每项均完成多文件源码+文档的垂直交付；完成整批后由PLATFORM审查PR并集成，EF下一轮基于最新集成head建立新分支继续，不覆盖已合并的旧工作。

### 第五轮持久交付索引

- 代码提交：`0b77251f0e0f0f359d8ac090348430649c1e7897`。
- 独立Draft PR：[#25](https://github.com/CoderLambert/ReactLoom/pull/25)，base=`feat/library-lab`，不得合并main。
- GitHub Compare：基线 `53e6c93003b08f6aac14da9c375e210e6b12540a` →提交，ahead=1，50个新增/修改文件，全部属于EF entries或本progress，无越界修改。
- 平台接入待处理：统一依赖安装/真实锁文件、Node真实CLI验证、Vite typecheck/build、Chromium交互/资源回收。EF继续下一批，不重复本批已提交源码。


### Vite 8 Oxc兼容修复（同批）

官方Vite 8文档确认：`build.minify: 'esbuild'`已弃用且esbuild不再是默认依赖。F18真实构建fixture改为`minify: 'oxc'`，避免PLATFORM为该孤立测试额外安装esbuild；补丁提交`73905ca52eb1b64fc1c40c7c906cd3657b9cf0e8`。此修订仅为源代码与官方API兼容性修复，**并不代表真实Vite构建已经通过**。

## 第六轮：Office/PDF生成、Orval客户端及音频波形（2026-10-27，北京时间，wave6）

- **独立分支** `feat/library-lab-ef-wave6`，基于本轮实际集成分支 `feat/library-lab@a9441528ea68d2daa56f2c0bbbc0e4fbe7cf5ae1` 建立。EF第五轮 Draft PR #25 在本轮启动时仍开放，绝不重写/force其head；此分支仅包含另外5个待做条目和本progress。
- 本轮新增 **5个不同的EF库、15个basic/business/advanced示例声明**。合并前统计必须分开：已合入集成21条，PR #25独立待合5条，本PR独立待合5条；全部按次序合入后的代码接入目标 **31/37，剩余6条**。均不能作为真实SDK/浏览器验收PASS。
- 文件所有权：只写 `entries/F04`、`F08`、`F09`、`F10`、`entries/E18` 和本文。没有修改root、package.json、锁文件、公共代码、CI或生产部署。

| 条目 | 三层实战源码 | 应用、边界与复现 |
|---|---|---|
| F04 ExcelJS | 真实`ExcelJS.Workbook`表头格式、RSS阅读统计/冻结表头/公式缓存、恶意公式开头/错误数值/真实workbook往返 | `examples/core.mjs`和`basic.mjs/business.mjs/advanced.mjs/verify.mjs`，只用内存XLSX；公式并不由ExcelJS求值 |
| F09 pdf-lib | 真实PDFDocument.create/drawText、copyPages两份原创PDF、读取本地PDF并标注/损坏回退 | React内按需运行，`examples/document.ts`可脱离UI迁移，generation+objectURL释放，≤2MiB，标准字体暂不支持中文 |
| F10 Orval | 真实本地OpenAPI 3.0.3契约→Fetch单文件、TanStack Query hooks、按tags拆分客户端 | 使用`orval.config.ts`和`run.mjs`执行固定`--project`，不调用真实服务器；产物仅在`examples/generated/`，Node >=22.18不可忽略 |
| F08 @react-pdf/renderer | 真Document/Page/Text和Flexbox、React `pdf(...).toBlob()`生成单页/日报/100行自动分页 | 初始不构建；用户点击才生成，PDF URL撤销，100行/最大140行约束，无第三方字体和远程资源 |
| E18 wavesurfer.js | 真实WaveSurfer.create/load/playPause/setTime/setPlaybackRate/zoom，输入是原创8kHz/1.6秒PCM WAV | StrictMode event取消/销毁后重新create、BlobURL撤销、捕获AbortError、播放按钮用户手势；v8生命周期与v7有差异 |

每个条目均创建了`library.json`、中文`guide.md`、`agent.md`、简短`AGENTS.md`、`verification.json`和真实源码引用；源码面板将通过公共生成器从同一`sourceFiles`中按需提取，不另造演示副本。Node-CI类不在网页伪造命令执行。

### 本轮验证范围与限制

- GitHub树对象已存储新增源码、示例和文档，但Git对象创建不证明TS编译或SDK运行；平台源文件完整性可通过`catalog:check`在完整安装环境验证。
- SDK/CLI/F04 workbook实际往返/F10 Orval代码生成：**NOT_RUN**；React/TS/Vite完整构建：**BLOCKED**（公共依赖/根锁文件尚需PLATFORM实际解析）；Chromium/Worker/音频播放：**NOT_RUN**。不继承旧研究验收，也不模拟SDK后记录PASS。
- `F10/examples/spec-check.mjs`只断言本地OpenAPI JSON结构；即使跑通也只是fixture检查，不能记为Orval CLI已运行。F04 `advanced.mjs` 通过真实ExcelJS读取B5证明恶意公式前缀已经转成单元格文本，不硬编码虚假通过结果。
- 本轮不重复上轮已知DNS失败安装、未能分配runner的GitHub Actions；依赖和真正SDK复验由PLATFORM统一执行。

### 第六轮 dependencyRequests（由PLATFORM独占依赖与锁文件）

| 包/基线 | 条目 | 接线注意 |
|---|---|---|
| `exceljs@4.4.0` | F04 | MIT、Node/浏览器包差异，内存writeBuffer/load，验证公式结果类型/宏限制 |
| `pdf-lib@1.17.1` | F09 | MIT、真实PDF合并/修改，浏览器内Blob下载和对象URL释放 |
| `orval@8.44.0`（dev） | F10 | MIT，真实Node CLI要求 **Node >=22.18**；本地OpenAPI input、output schemas、React Query/Fetch配置需实际解析；不打进生产SPA bundle |
| `@react-pdf/renderer@4.9.0` | F08 | MIT、React19 peer、包Worker和PDF字体行为必须由构建及浏览器确认，不能与F07`react-pdf`混淆 |
| `wavesurfer.js@8.0.3` | E18 | BSD-3-Clause，v8 API、音频解码/权限、浏览器销毁和BlobURL作用域 |

建议PLATFORM安装上述依赖（确认实际npm registry/peer/许可证后由唯一owner提交完整锁文件）并定向运行以下命令，不可提前宣称PASS：

```sh
node packages/library-lab/entries/F04-exceljs/examples/verify.mjs
node packages/library-lab/entries/F04-exceljs/examples/basic.mjs
node packages/library-lab/entries/F04-exceljs/examples/business.mjs
node packages/library-lab/entries/F04-exceljs/examples/advanced.mjs
node packages/library-lab/entries/F10-orval/examples/spec-check.mjs
node packages/library-lab/entries/F10-orval/examples/basic.mjs
node packages/library-lab/entries/F10-orval/examples/business.mjs
node packages/library-lab/entries/F10-orval/examples/advanced.mjs
pnpm --filter @reactloom/library-lab catalog:check
pnpm --filter @reactloom/library-lab typecheck
pnpm --filter @reactloom/library-lab build
pnpm --filter @reactloom/library-lab test:e2e
```

### 后续队列

EF待完整接入6项：**E11 Streamdown（原件SUMMARY_ONLY，重建标recreated）、E12 assistant-ui、E16 Video.js、E17 hls.js、E19 ffmpeg.wasm、F05 SheetJS（原件SUMMARY_ONLY）**。优先E17/E16本地媒体和E12/E11安全流式UI；超大WASM需独立加载与安全隔离。分组PR必须全部对`feat/library-lab`，不得合入main；公共平台集成时先审查已有#25，再依次集成本轮独立PR并在真实依赖条件具备时验证。

runCount=6/24。本轮不把5库源代码和30+例子等同完整生产交付；记录真正可复现的源码、命令、依赖与未验证事实。


## 第七轮：EF 最后6条内容与源码接入（2026-10-27，北京时间）
- **分支** `feat/library-lab-ef-wave7` 从集成 `feat/library-lab@9340aa9d42cd0318a31eda8e5a1ee840dd2d5108` 建立；已有 EF PR #11/#15/#17/#20/#25/#27 经核对均已合入集成。主 PR #8 仍是 Draft。
- **本轮六条**：E11 Streamdown、E12 assistant-ui、E16 Video.js v10、E17 hls.js、E19 ffmpeg.wasm、F05 SheetJS CE。新增 **18 条基本/业务/进阶 Demo 声明**，全部真实 SDK 代码或明确的 Node CLI 配方；均附 `library.json`、`guide.md`、`agent.md`、`AGENTS.md`、`verification.json`。全程只写 E/F 条目及本进度。
- 集成前准确统计：**31/37 个 EF 库已在集成分支接入源码与指南**，本 PR 新增其余6库；PLATFORM 对本 PR 审查并合入后才是 **37/37 EF 内容与示例代码覆盖**，不等于真实运行验收。
- E11/F05 的历史独立原件均为 SUMMARY_ONLY，**本轮独立重建，明确标记 recreated**，不得引用历史测试 PASS。
- E11 演示增量累计 Markdown/未闭合语法/恶意链接；E12 用真实 LocalRuntime 和本地确定性Adapter（**没有AI模型、无付费调用**），完成流式与取消；E16 使用Video.js v10 `@videojs/react` 和用户手势录制的原创WebM，加入Abort清理；E17 使用Hls.js事件/质量/销毁，**外部公开示例 HLS 仅用户点击才请求**；E19 真实FFmpeg wrapper，核心WASM必须由PLATFORM同源提供，显式加载/转换/terminate；F05 Node CLI真实SheetJS XLSX往返、业务报表及公式注入预防。
- 核验范围：GitHub Git Tree对象已实际保存上述内容；6/6 manifest可解析、18/18声明均指向已写入的真实源码路径，6份指南、Agent手册、目录规范与验证文件齐全。这是结构/静态审计，不是SDK PASS。
- **运行诚实状态**：目标 SDK/Node CLI **NOT_RUN**；TypeScript/Vite完整构建 **BLOCKED**（公共依赖/真实锁文件没有本轮安装证据）；浏览器播放/安全/Worker **NOT_RUN**；E19 WASM核心资产部署 **BLOCKED**。GitHub Actions此前无Runner事实不能替代当前运行结果。不冒充由真实SDK执行过。
- **本次源码审查修正**：E11 代码围栏不额外反斜线转义；E16 MediaRecorder显式Abort并清理track/timer；E19处理 `file.arrayBuffer()` 拒绝和取消竞态，转换期间log与有效Engine绑定，而非初次load id。
- **dependencyRequests — PLATFORM单一 owner**：
  - `streamdown@2.6.0` — Apache-2.0，核对React19 peer、Tailwind v4扫描配置、不可信Markdown安全策略。
  - `@assistant-ui/react@0.15.21` — MIT，确认0.15.x当前`useLocalRuntime`、Thread/Message/Composer primitives、React19类型与AbortSignal，离线fixture不需付费模型。
  - `@videojs/react@10.2.0` — Video.js v10 React包，Apache-2.0；**不是npm `video.js` v8**，CSS分块与播放器卸载需生产浏览器验证。
  - `hls.js@1.7.3` — Apache-2.0，`enableWorker:false`的MSE加载、CORS与原生HLS回退验证；外部测试流不作为生产资源。
  - `@ffmpeg/ffmpeg@0.12.15` + `@ffmpeg/core@0.12.10` — wrapper MIT；核心 FFmpeg LGPL/GPL/codec 许可需逐项审查；PLATFORM必须安装并在同源 `/ffmpeg-core/` 提供匹配esm JS/WASM以及检查Vite Worker、CSP、MIME；此版本并非两个包都0.12.15。
  - SheetJS CE `xlsx@0.20.3` — 只能按官方独立发行渠道核验 `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`，**不能误用过时 npm registry `xlsx`**；锁文件需由平台实际解析/固定完整性，Apache-2.0。
- PLATFORM测试要求（**仅实际执行后填PASS**）：`node packages/library-lab/entries/F05-sheetjs/examples/verify.mjs`；`pnpm --filter @reactloom/library-lab catalog:check`、`typecheck`、`build`、`test:e2e`；播放/E19真实WASM和CSP/资源卸载的专项Chromium。
- 后续需要PLATFORM合并此PR并安装上述依赖；EF 可以继续修复已接入条目的源码/文档问题，但不能越权把未跑的浏览器/官方SDK记为已验收。**runCount=7/24**。

## 第八轮：EF 37条已覆盖后的跨库风险修正（2026-10-27）

- 本轮从最新集成 `feat/library-lab@dfbaf71f111bd9f938ff5c25c34577ddb792b34d` 新建 `feat/library-lab-ef-wave8-hardening`；EF 第七轮六库 PR #30 已在本轮恢复时实际完成合入（merge commit `4ef64d7560ab2ff9adcfa40e91c406a85d9eec2d`），**没有重复创建六个库**，改为对四个高风险条目做真实源码纠错。仅写入授权的 E12/E16/E17/F05 条目和本文件，不触碰公共源码/锁文件/CI/main。
- **E12 assistant-ui**：核对官方 Composer API 后发现 `ComposerPrimitive.Cancel` 取消的是撰写/编辑，不是正在生成的 thread run；改为 `useAui().thread.cancelRun()`，通过 `useAuiState(s=>s.thread.isRunning && s.thread.capabilities.cancel)` 管理停止按钮。保留离线 ChatModelAdapter 对 AbortSignal 的处理，未连接收费模型。
- **E16 Video.js**：上批 `setUrl(next)` 前立即 `URL.revokeObjectURL(old)` 可能令尚未被 React 提交卸载的旧播放器瞬间失效。将旧 URL 放入退休队列，在 URL 更新提交后的 Effect 中撤销，卸载时同时释放现用和排队 URL；新增指南解释该竞态。
- **E17 hls.js**：增加原生 HLS 分支对 `HTMLMediaElement.error` 的捕获（不假设原生播放产生 Hls.js ERROR）；fatal 后销毁 MSE 引擎并清理视频源、清单和码率。重新载入时解绑旧 onerror，generation 排除旧事件。外部 HLS 仍仅由点击触发。
- **F05 SheetJS**：将三列业务验证拆入框架无关 `examples/validation.mjs`，显式拒绝缺列/多列、非文本、非法整数、控制字符、重复频道；保护 =,+,-,@ 前缀且归一化幂等。解析工作簿采用有限 `sheetRows`、原始表范围/严格表头检查、检测并拒绝公式单元格；真实包 verify 脚本新增畸形表、额外列和公式负例。保留 `xlsx@0.20.3` 仅使用官方 SheetJS CE 发行包的要求，不修改 lock。
- **实际运行的测试**：Node v22.16.0 下 `node --test examples/validation.test.mjs` 共 **7 PASS / 0 FAIL**，仅覆盖不依赖 xlsx 的业务/安全边界。这一结果**不表示 SheetJS SDK PASS**。
- **未运行/阻塞**：需要真实依赖安装的 `examples/verify.mjs`、E12/E16/E17 React/真实 SDK、完整 TypeScript/Vite build、Chromium/WebKit/HLS、FFmpeg WASM 仍 `NOT_RUN/BLOCKED`，不继承先前静态审查或历史研究 PASS。此轮未重试已知无 Runner / npm DNS 问题。
- **PLATFORM 后续**：合入本修复 PR 后统一核实 package/peer、生成真实 pnpm 锁文件并运行真实构建；专测 E12 点击停止能实际触发 abort、E16 连续源切换不闪断/泄漏 Blob、E17 原生 HLS 错误与 fatal 后重载、F05 完整 `node packages/library-lab/entries/F05-sheetjs/examples/verify.mjs` 和恶意 XLSX/资源限额。压缩包2MiB限制不能代替 ZIP bomb 的进程/内存隔离。
- EF 内容接入仍为 **37/37**（仅库条目有代码/指南/Agent手册），目标 SDK 和浏览器验收**没有新增通过**。继续检查剩余条目而不是冒充已全部测试；`runCount=8/24`。


## 第九轮：F06/F07 PDF.js版本合同与Canvas串行渲染（2026-10-27）

- 恢复最新集成 `feat/library-lab@e7515a6e023b7e6528a8603aae46d6666ae3132f`，第八轮修复 PR #32 已于北京时间09:09合入集成分支。EF **37/37内容和三级示例源代码已接入**，本轮集中修复#22中的阻塞，不重复做目录。
- **F06+F07跨条目依赖一致性**：F06旧元数据 `pdfjs-dist@6.4.299` 与集成依赖 `6.3.289` 冲突；F07声明旧版本未知。根据react-pdf v11.0.0的上游精确依赖，两条目均固定为 `pdfjs-dist@6.3.289`，同步guide/agent/verification。只改EF目录，PLATFORM拥有根package和锁文件；**尚未证明真实pnpm安装成功**。Issue #22 保持开放直到 SDK/Worker 真实验证。
- **F06快速切页与缩放竞态**：PDF.js `RenderTask.cancel()` 异步结算，旧画布绘制未完全结束时立即对同Canvas调用 `page.render()` 会抛异常。新增可迁移 `examples/render-gate.mjs` 与类型声明，用串行Promise gate只保护canvas绘制；React effect cleanup仍取消旧RenderTask，active token跳过过期任务，文本抽取在锁外。源码、guide、agent同步说明。
- **已执行纯Node逻辑测试**：Node v22.16.0 `node --test render-gate.test.mjs` **3 PASS/0 FAIL**，覆盖同Canvas排他、取消拒绝后继续、过期排队操作跳过。新增`worker-version.test.mjs`为根依赖/F06/F07/Worker URL的静态合同，须在完整源码检出环境执行；不声称该测试或 SDK已通过。测试参考：PDF.js官方RenderTask文档与react-pdf的Worker配置指南。
- **真实运行状态**：PDF.js SDK、React-PDF SDK、TypeScript/Vite生产构建、Chromium/Worker/CSP皆 **NOT_RUN或BLOCKED**，公共锁文件仍由PLATFORM统一解析；不得从本轮纯逻辑测试生成SDK PASS。建议平台在真实环境执行 `node --test packages/library-lab/entries/F06-pdfjs/examples/{render-gate,worker-version}.test.mjs`、`pnpm --filter @reactloom/library-lab catalog:check`、`typecheck`、`build`，并在Chromium快速切页/缩放/反复F06-F07切换。
- 本轮范围只有 F06/F07 entries 与EF进度，无公共代码、包依赖、lock/CI/main或部署修改。runCount=9/24。完成集成后的剩余EF工作应围绕SDK真实证据/特殊资源协同PLATFORM完成，不应再发明新的占位条目。官方 https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-RenderTask.html 和 https://github.com/wojtekmaj/react-pdf 。

## 第十轮：F11 / E19 / F05 真实运行前安全合同修复（2026-10-27）

- 从最新集成 feat/library-lab@101315e3bdf299047f9c2a39aa670ed59570ec4a 建立独立分支；上轮PR #34已合入。仅涉及 E19/F05/F11 条目与本进度，不修改公共依赖、lockfile、CI或main。
- F11 MSW：保留Node .invalid端点，新增 scenarioEndpoints + createHandlers，让浏览器iframe的场景HTTP改为同源 /lab-runners/msw/api/ 路径；限定iframe与scope，并在启动后比对registration scope/scriptURL。真实browser runner仍由PLATFORM接线。
- E19 ffmpeg.wasm：在读取File字节前预检4MiB限制、后对照MIME与WAV/MP3/WebM/MP4文件头、转换后WAV输出限制2MiB；同步operation所有权阻止连续点击并发写同名虚拟FS文件，session+引擎身份拒绝取消后的回写。
- F05 SheetJS：XLSX.read前先校验ZIP中央目录的条目/总声明解压/压缩比/重复名/本地头/危险路径/宏；ZIP目录可伪造，不能代替隔离Worker、内存CPU超时硬限制。verify.mjs的PASS日志移到所有实际SDK负例完成后。
- Node v22.16.0已在本轮运行独立纯Node检查：F11 routes 3项、E19 input-policy 3项、F05 archive-policy 4项，共10 PASS/0 FAIL。没有导入真实第三方SDK，不得升级SDK或浏览器验证状态。
- MSW真实worker/fetch、FFmpeg核心加载与取消、SheetJS XLSX回读、TS/Vite构建、浏览器E2E仍 NOT_RUN/BLOCKED。无新增第三方依赖；PLATFORM统一核对已请求版本及锁文件。需要真实SDK环境确认SheetJS正常生产包能通过保守ZIP预检。
- 当前EF 37/37条已有源码与指南，本轮属于风险修正、不新增库。runCount=10/24。后续优先等待PLATFORM真实依赖编译反馈并继续剩余跨库安全修复，不能虚报验证通过。


## 第十一轮：F03 CSV 导入与 F04 Excel 报表双端安全合同（2026-10-27）

- 基线：集成 `feat/library-lab@0733f237ddfbc4ab3204c531255f386c46abec27`，前轮 #38 已集成且当时无开放 EF PR；独立工作分支 `feat/library-lab-ef-wave11-csv-xlsx`。仅修改 F03/F04 条目及本进度，不涉及公共 src、依赖、lockfile、CI、根索引或 main。
- F03 Papa Parse：真实 `Papa.parse`/`unparse` 被收敛到独立 `examples/report.mjs`，React UI与Node SDK集成测试共用同一解析路径；纯 `policy.mjs` 严格校验唯一/准确三列表头、业务字段类型长度/控制字符、无凭据HTTPS和规范化去重。可定位的字段数错误逐行拒绝，不可恢复解析错误整批拒绝。用户手工编辑、重置和点击解析使尚未完成的 File.text 失效，超大文件被拒绝后仍可重新选择同一文件。
- F04 ExcelJS：纯 `examples/row-policy.mjs` 校验空ID/空源/非字符串/控制字符、大小写及空格归一化重复ID、1–500行、计数及**聚合合计**必须是安全整数。`generateWorkbook` 在分配Workbook前调用，并保持真实ExcelJS IO；verify SDK脚本新增三个错误负例。三层示例的 sourceFiles 与文档、Agent指南已同步；无新SDK依赖需求。
- **本轮实际 Node 测试**：Node v22.16.0，隔离运行 `F03/tests/policy.test.mjs` 与 `F04/examples/row-policy.test.mjs` **7 PASS、0 FAIL**。两套纯策略均不导入第三方SDK，绝不计为 `papaparse` / `exceljs` SDK PASS。
- **尚待PLATFORM执行**：安装当前声明依赖后 `node --test packages/library-lab/entries/F03-papaparse/tests/node-scenarios.test.mjs`、`node packages/library-lab/entries/F04-exceljs/examples/verify.mjs`，随后 `catalog:check`、TypeScript/Vite build、Chromium 文件选择/卸载竞态。GitHub CI在先前无Runner；未重试已知DNS/无Runner故障。SDK/浏览器仍NOT_RUN，build仍BLOCKED。
- 新源代码被公共生成器读取前应检查 `sourceFiles` 的完整性与真实依赖解析，不能从静态路径检查升级PASS。37/37 EF 条目继续保持已有内容覆盖；本轮是纠错/强化而非新增库。`runCount=11/24`。下一步优先依据PLATFORM的真实构建反馈修复TypeScript/SDK兼容性，若环境依然不可用则检查其它高风险导入/资源生命周期条目。

### 第十一轮交付索引

- Draft PR [#43](https://github.com/CoderLambert/ReactLoom/pull/43)，目标 `feat/library-lab`；关键源码提交 `772139aae64dfdfde41bb86c187f9436ad75fd8f`。该提交修复了F03导入抽取时遗漏的演示fixtures；PR审查应采用最新head。
- `git compare` 对比集成 `0733f237ddfbc4ab3204c531255f386c46abec27`：18个变更文件均在EF授权范围。实际纯策略Node用例7 PASS；第三方SDK真实运行仍 NOT_RUN。
- Issue [#7](https://github.com/CoderLambert/ReactLoom/issues/7) 已留有本轮代码、验证和下步执行要求。PLATFORM集成后，若本分支需要下一轮代码修复，应从更新的集成head另建wave分支，不重写已合入PR。


## 第十二轮：Worker作用域/生命周期与本地PDF并发修复（2026-10-27）

- 基线：集成 `feat/library-lab@363009eb24230fee8c4e5103bcef950ed129a649`（#43已集成），工作分支 `feat/library-lab-ef-wave12-worker-lifecycle`，只写E05/F11/F09条目及本进度；不改公共src、依赖、lockfile、CI、main或既有PR。
- **E05 Monaco**：真正Vite Worker构造器不变。新增租约计数，拒绝覆盖外部`MonacoEnvironment`，多编辑器最后释放配置；创建model/editor失败也清理；不声称Monaco内部Worker已terminate。
- **F11 MSW**：先检查同scope已有注册的脚本所有权；启动后不仅核对registration，而且核对frame controller及真实scoped`fetch`结果。不成功立即stop；新建注册由本会话stop+unregister，已有注册只stop；PLATFORM仍须提供隔离iframe/Worker静态脚本及跨tab策略和CSP。
- **F09 pdf-lib**：同步single-flight避免连点并行解析，level切换使旧Promise结果及finally失效，React DOM commit后才回收旧Blob URL，unmount回收未提交URL。pdf-lib解析不可取消且字节预筛非恶意PDF沙箱。
- **真正执行的离线范围**：Node v22.16.0、`node --test`三组独立纯策略：E05 `worker-lease.test.mjs` 4 PASS、F11 `registration-policy.test.mjs` 4 PASS、F09 `operation-gate.test.mjs` 3 PASS，合计**11 PASS / 0 FAIL**。这些测试**没有加载monaco-editor、msw或pdf-lib**，绝不计目标SDK或Browser PASS。新增测试源码已随条目提交。
- **真实未跑**：Monaco Worker/JSON诊断、MSW真实SW intercept/CSP、pdf-lib实际SDK与浏览器下载交互、全量TypeScript/Vite生产构建，仍**NOT_RUN/BLOCKED**（公共pnpm锁文件/可运行Runner暂无本轮证据）。新文件目录结构检查不等于运行。
- **dependencyRequests**：无新增依赖；沿用`monaco-editor@0.57.0`(MIT)、`msw@3.0.3`(MIT，Node>=22/TS>=5.9)、`pdf-lib@1.17.1`(MIT)，由PLATFORM唯一维护package/lock与实际安装。请平台定向运行`catalog:check` / `typecheck` / `build`，再在Chromium验证三库的Worker/下载生命周期；若脚本/Worker失败，保持verification BLOCKED。
- **下一队列**：真实SDK/Runner具备时首先消除其TS/构建故障；随后检查E05多实例/StrictMode、F11预存SW/多tab重入、F09连续文件/Tab切换和Blob泄漏。EF内容覆盖**37/37**，不是生产验收完成；**runCount=12/24**。若所有可独立推进工作确实完成再按规定停用，不以37个目录存在冒充最终PASS。

### 第十二轮交付索引

- Draft PR [#46](https://github.com/CoderLambert/ReactLoom/pull/46)，base=`feat/library-lab`、head=`feat/library-lab-ef-wave12-worker-lifecycle`。最新代码/文档提交 `ef66a81d100a9978c245858c45558fd0e463151b`，之前两个提交 `32335aeacec70aa23a3aa3430d22b050af7488d6`、`9cfedb8c8629e979dd871f61e992a5ef8fa2634a`，均只针对EF条目。
- 对比当轮集成基线：3 commits、25个变更文件，全部满足EF授权目录规则；11项Node纯策略PASS，不等同SDK/浏览器PASS。下一轮应在#46被PLATFORM集成后，从最新集成分支继续创建新wave，不重写合入后的旧分支。

## 第十三轮：富文本边界、文件预览与FFmpeg场景隔离（2026-10-27）

- 当前集成基线 `feat/library-lab@e9cc2100e1fc4dfeb6a929534c60aab87c700326`，独立 EF 工作分支 `feat/library-lab-ef-wave13-render-file-boundaries`，上一轮 #46 已合入。只写 E06/E10/F02/E19 与本进度；不编辑PLATFORM包、锁文件、CI、索引或main。
- **E06 react-markdown**：共享 `render-policy.mjs` URL和a/img组件策略，拒绝危险协议、控制字符、HTTPS凭据和图片追踪请求。新增 `tests/sdk.test.mjs`：真实 `react-markdown` + `remark-gfm` + `rehype-sanitize` + React SSR负例，必须待完整依赖安装后**实际执行**才能记 SDK PASS。复用组件切换level会重设旧草稿。
- **E10 DOMPurify**：改为显式允许标签与href/title属性，HTTPS-only URI，消除宽泛HTML profile；`html-policy.test.mjs`只验证纯策略常量，不执行DOMPurify。真正XSS、DOM/CSP/网络验收仍 NOT_RUN。
- **F02 react-dropzone**：Blob.slice(0,8192).text() 避免预览1600字符却解码整个256KiB准入文件；场景切换也废弃旧Promise。新增 `preview.test.mjs` 的原生Node Blob预算测试，不等于 useDropzone SDK或浏览器测试。
- **E19 ffmpeg.wasm**：FFmpeg构造异常也经过catch/finally释放operation；切level终止引擎、撤销URL和session失效；不在后台加载核心资产。真实WASM core、Worker/CSP和编码器许可证仍待PLATFORM。
- 三层源文件清单已扩展E06/E10/F02新辅助/测试文件；保留 verification.json 原来的 SDK/browser NOT_RUN、build BLOCKED，不将提交或策略测试当运行通过。需公共平台实际执行 `catalog:check`、`typecheck`、`build` 和Chromium目标回归。
- dependencyRequests：**无新增包**。现有 `react-markdown@10.1.0` + `remark-gfm@4.0.1` + `rehype-sanitize@6.0.0`，`dompurify@3.4.17` (MPL-2.0 OR Apache-2.0)，`react-dropzone@20.1.4` (MIT)，`@ffmpeg/ffmpeg@0.12.15` + `@ffmpeg/core@0.12.10` (wrapper MIT、核心编解码许可另核)；PLATFORM独占根依赖和锁文件且需确认API/peer/许可。
- 本轮执行命令和结果须以真实Node工具输出及远端CI为准；`node --test packages/library-lab/entries/{E10-dompurify,F02-react-dropzone}/examples/*.test.mjs` 属于纯策略、`node --test packages/library-lab/entries/E06-react-markdown/tests/sdk.test.mjs` 属于实际SDK。两者不能混算。
- 下一队列：真实SDK/TS/Vite安装反馈；Chromium E06出站图像与恶意HTML、E10 DOM净化、F02选择器与竞态、E19构造故障/WASM取消和切换；后续按平台反馈修复。EF仍 **37/37内容覆盖**，绝非37/37已验收。

runCount=13/24。

### 第十三轮真实定向验证补记

- 使用 Node v22.16.0 在独立工作目录实际执行两组源码同字节的原生测试：`node --test E10/html-policy.test.mjs F02/preview.test.mjs`，共 **6 PASS / 0 FAIL**，耗时约 106 ms（TAP，E10 3 + F02 3）。通过 `git hash-object` 对比 GitHub 当前 wave13 blob SHA：E10 policy `7a724d46`、test `41935d26`，F02 preview `4fbaae47`、test `c100e284`，确认本次本地执行文件与实际提交字节一致。两套都**没有import目标DOMPurify/react-dropzone**，故不计 SDK PASS。
- GitHub compare 基线 `e9cc2100` 至开发head `e0a6c41c`：4个提交、28个变更文件，全部位于 EF 条目或本进度文件。E06/E10/F02 的3×3层 sourceFiles 已逐项读取 GitHub 树并确认 9/9 路径组无缺失，属于静态完整性检查。
- 由于工作容器无项目 React、DOMPurify、react-dropzone、FFmpeg 真实 node_modules，本轮 **E06实际SDK SSR、E10 DOMPurify、F02 useDropzone、E19 WASM、整包 TypeScript/Vite构建与Chromium E2E均没有执行**；verified字段仍按各库原有NOT_RUN/BLOCKED保留，未伪造日志或通过状态。

### 第十三轮集成索引

- [EF Draft PR #49](https://github.com/CoderLambert/ReactLoom/pull/49)，head `feat/library-lab-ef-wave13-render-file-boundaries`，base 固定 `feat/library-lab`，本轮预PR代码head `0a19aa65a17a7d0c02695a10bcffd13b53ac8722`；仅提交至EF允许路径，无部署或main更改。
- 后续由PLATFORM检查真实SDK版本/peer/lock、类型/构建以及浏览器隔离，再决定合入。Issue #7记录本轮证据；本轮 **runCount=13/24**。


## 第十四轮：Markdown/HTML AST 安全迁移与取消竞态真实源码修复（2026-10-27）

- 基于实际集成 `feat/library-lab@0b98b4ef4accd16ab3d7278d8181568c77dc6476`，上轮 EF PR #49 已合入；独立分支 `feat/library-lab-ef-wave14-ast-sanitization-tests`，PR 固定 base=`feat/library-lab`。仅改 E07/E08/E09/F12 目录和本进度；公共依赖/lock/CI/全局源码/main 均未修改。
- **E07 remark**：从 React 示例抽取唯一的 `examples/audit-policy.mjs`（含 TS 声明），真正 remark AST 与纯策略测试共用。修正嵌套 strong/link 的标题文本提取，加入 HTTPS 凭据/危险协议/控制字符与路径审计、24KiB UTF-8 输入/4096节点限制，`processor.stringify(ast)` 复用已经解析的 AST；复用 React 实例切换 level 时清理旧输入、错误与结果。新增真实 remark SDK 负例，尚未执行。
- **E08 rehype**：官方 default sanitizer 允许 `img src`，而仅靠 iframe CSP 限制远端资源会给复制示例到业务项目留下跟踪风险。引入单源 `strictHtmlSchema` 且现有真实 SDK 测试共用：纯文本/有限文章标签，禁止 `href`、`src`、form、image、iframe、script/style、SVG。父页需要链接时独立授权；sandbox 和 CSP 只是防御纵深。切换 level 清除旧预览。
- **E09 Shiki**：同一 React 实例从 basic/business/advanced 切换，明确重置 code/lang/rows/status；保留异步过期结果拒绝逻辑。增加真实 Shiki Unicode 多行 token 保真 SDK 案例（未执行）。
- **F12 Vitest**：`verifyCode` 增加调用 HTTP 前、收到 Response 后、200/422 JSON 解析结束后的 AbortSignal 再检查；活动失败显式抛出，generation 拦截过期请求。真实 Vitest 测试源码补充取消在解析中、已经取消不请求、活动错误不吞掉等边界；尚未运行 Vitest CLI。
- **真实独立 Node 检查**：Node v22.16.0，`node --test /tmp/reactloom-wave14/audit-policy.test.mjs` **3 PASS/0 FAIL**；`node --test /tmp/reactloom-wave14/domain-policy.test.mjs` **6 PASS/0 FAIL**。两者均是对应 GitHub blob 原字节（E07 policy `53c04604`、test `9f3655f0`、F12 domain `eacc64e5` 的 `git hash-object` 全 SHA 核对）；后者仅以本机 TypeScript 全局编译器 transpile domain.ts 并使用额外原生 Node 断言，**不是运行 Vitest SDK**。合计 **9个纯逻辑 PASS**，不提升任何 verification.json 的 SDK/browser/build 状态。
- **仍 NOT_RUN/BLOCKED**：真正 remark/rehype/Shiki/Vitest SDK tests、完整 TypeScript 类型检查、Vite 构建、Chromium XSS/网络/资源清理测试。PLATFORM 包已声明 `remark@15.0.1`、`remark-gfm@4.0.1`、`rehype@13.0.2`、`rehype-sanitize@6.0.0`、`shiki@4.5.0`、`vitest@5.0.5`，**无新增 dependencyRequests**；根 pnpm 锁文件和真实 runner 仍由 PLATFORM 独占验证。
- **定向验收命令（依赖具备时执行，未执行不能宣称PASS）**：`node --test packages/library-lab/entries/E07-remark/tests/node-scenarios.test.mjs packages/library-lab/entries/E08-rehype/tests/node-scenarios.test.mjs packages/library-lab/entries/E09-shiki/tests/node-scenarios.test.mjs`；`pnpm --filter @reactloom/library-lab test:vitest`、`catalog:check`、`typecheck`、`build`、关键 Chromium E2E。应重点核查非法 URL、iframe 无网络、Shiki 场景快速切换和 HTTP body parse 取消。
- **下一队列**：依据 PLATFORM 真实安装/构建和浏览器反馈修复具体 SDK 类型与资源问题；保留 E05 Worker/F11 Service Worker 独立 runner、F06/F07 PDF Worker 配对、E19 WASM 真实加载的明确环境阻塞。EF **37/37 内容覆盖**不等于 37/37 可运行验收。只有完整范围和门禁真正结束才停通道。

runCount=14/24。


## 第十五轮：富文本与代码编辑器的持久化边界（2026-10-27）

- **实际代码与PR**：从当轮最新集成 `feat/library-lab@66479e8a2d3e27d65c3c581093822cb4baf6c00d` 创建 `feat/library-lab-ef-wave15-editor-persistence`，提交 `eab922e84d4f85bf34bdb144eb347434b76a2c17`（E01/E02）、`b3f58ba3b2dd07ba501073139ebe4011d135360c`（E03/E04）；Draft [PR #55](https://github.com/CoderLambert/ReactLoom/pull/55)，base固定 `feat/library-lab`，绝不合main/修改PLATFORM/公开部署。
- **E01 Tiptap**：修复sessionStorage恢复只验证顶层type就执行setContent的问题；新纯策略限制20K UTF-16字符/500节点/12层、StarterKit节点与marks、属性与HTTPS凭据边界，然后真实Tiptap命令使用官方v3 `setContent(json,{errorOnInvalidContent:true})` 要求抛错而不是静默忽略非法节点；level切换通过带key子组件重新初始化编辑器/撤销历史。
- **E02 BlockNote**：sessionStorage读取也纳入try/catch；文本块、内联字段、外链、嵌套、总100块和60K字符串配额检查；保存的运行时块ID不重新注入；拒绝未授权媒体/附件，按level重新挂载实例。此纯校验不等于SDK schema/事务回滚，若replaceBlocks抛错不保证修改已自动撤销。
- **E03 Lexical**：有限原生节点快照校验；阻止空根、未知node、过深结构和恶意style。实际恢复使用 `parseEditorState` 后再检查 `isEmpty()` 才 `setEditorState`（官方文档明确空state会异常/不同恢复行为）；keyed Composer隔离三个场景的内容、历史和选区。
- **E04 CodeMirror6**：初始业务草稿、保存、手动恢复三条路径统一执行50K UTF-16字符/NUL限制；非法存储值不覆盖当前EditorView，保留已有Compartment、view.destroy和IME提醒。此限额不是代码执行沙箱。
- 四库各新增唯一纯MJS策略源、`.d.mts`声明、Node负例测试；所有三层demo源码清单同步，guide/agent/AGENTS/verification与源码一致。4库×3层=**12 sourceFiles manifest**，对GitHub提交树逐文件检验**0缺失**。此前内容覆盖EF **37/37**保持，**不等于实际运行验收**。

### 本批真实验证及保真边界

- 在Node **v22.16.0** 逐项从仓库同字节源码执行：`node --test /mnt/data/reactloom-ef-wave15/{E01-tiptap,E02-blocknote,E03-lexical,E04-codemirror6}/tests/policy.test.mjs`，共**14 PASS / 0 FAIL**（E01 4、E02 4、E03 3、E04 3）。8份MJS通过 `node --check`；均通过本地 `git hash-object` 对照GitHub已提交blob的**完整 SHA-1**，不是改写的简化测试：
  - E01策略 `349dd404908b3e7b4c59a04c75daa57682a91a93`；测试 `a216e2719018c6dc3d5af4b9039e0d3467ea8ed1`。
  - E02策略 `2eefb693a1543eac701958d9052a35d43a82d189`；测试 `88e044e6e1ac195ee6c6d7cb71b29107417ea952`。
  - E03策略 `63d6a80e0d257d9549307e4f1e2a67c14d55324d`；测试 `12dc794f1e9294ca38e022a875fe67c402da90f2`。
  - E04策略 `60793434c4eef2027db6aa3e51ade8a72d62c544`；测试 `b9cd16168dc55b3927abbd2d9d143475fa98deb0`。
- **这些仅是离线业务策略测试**：未import真实Tiptap/BlockNote/Lexical/CodeMirror、未挂载EditorContent/BlockNoteView/EditorView/Composer，不能为sdk/build/browser填写PASS。仓库内verification.json继续 `SDK NOT_RUN`、`build BLOCKED`、`browser NOT_RUN`；实际SDK、TypeScript、Vite/Chromium、Mantine CSS、中文IME/多实例及Tiptap/BlockNote Schema兼容仍必须真实运行。
- 仅做Github静态结构检查与版本/API官方文档抽样复核；未安装/锁定pnpm依赖、无真正浏览器证据，也没有伪造SDK运行日志。GitHub compare基线到本轮第二提交 **2 commits / 36 files**，全部在EF授权 E*/F*；第三提交只新增本progress文件。

### dependencyRequests / 下一批队列

- **无新增依赖请求**；沿用当前元数据 E01 `@tiptap/react,@tiptap/pm,@tiptap/starter-kit@3.32.0`（MIT）、E02 `@blocknote/{core,react,mantine}@0.56.0`（MPL-2.0；Mantine peers和非自由XL扩展仍由PLATFORM准确复核）、E03 `lexical,@lexical/react@0.52.0`（MIT）、E04 `codemirror@6.0.2,@codemirror/state@6.7.6,@codemirror/lang-javascript@6.2.5`（MIT）。不是声称这些依赖在本轮安装成功或全部peer已通过。
- PLATFORM独占真实pnpm lock、`catalog:check`、`typecheck`、`build`、跨库runner/Chromium。待可运行时先定向测试E01/E02恢复合法与非法文档/焦点/IME/重挂、E03空state/输入法、E04超长sessionStorage且内容不丢；并继续E05 Worker、F11 MSW ServiceWorker作用域/CSP、F06/F07 PDF.js配对、E19 FFmpeg WASM许可与真实启动。收集实际版本/日志后解决错误，不循环重试既知 npm/DNS 阻塞。
- EF仍37/37个内容目录，**业务策略14 PASS不代表37个SDK通过**。下轮基于最新已合入集成分支继续修复高价值风险，待PLATFORM合入本PR前不对同一目录重叠push。若真实验收全通过才停止通道；否则继续直到24轮上限，明确列出缺口。

runCount=15/24。

## 第十六轮：媒体隔离、Uppy文本预览与PDF导出边界（2026-10-27）

- 源码基线 `feat/library-lab@9a5778a97970119a4d811e139d81038f66042ec2`，上轮 EF #55 已合入；工作分支 `feat/library-lab-ef-wave16-media-queue-pdf`，代码提交 `5a58eef9e72ff4126033b6f8c81129268cc5e361`。只改E17/E18/F01/F08与progress，未动共享源码、依赖、lockfile、CI或main。
- **E17 hls.js**：level键隔离HLS会话，fatal后旧generation失效，旧video.onerror销毁清空；仅允许实际manifest的画质index或-1。
- **E18 wavesurfer.js**：level切换重建波形和原创本地WAV URL，切换时销毁旧播放器、重置播放状态；异步playPause失败不能回写已卸载实例。
- **F01 Uppy**：真实Uppy队列仍在；预览改为同源 `preview-policy.mjs`，依据真实Blob.size拒绝>12KB、fatal UTF-8解码及控制字符检查，只展示4000字符；keyed实例隔离旧File引用。附.d.mts与Node测试。
- **F08 react-pdf/renderer**：唯一 `report-policy.mjs` 校验报告数据，阻止无效ID、大小写重复、非ASCII、数字越界、额外字段泄漏；同步running ref防止重复序列化，keyed实例让旧下载链接卸载。
- **实际执行**：Node环境执行 `node --test /mnt/data/reactloom-ef-wave16/F01/tests/policy.test.mjs /mnt/data/reactloom-ef-wave16/F08/tests/policy.test.mjs`，**9 PASS、0 FAIL**；4份MJS均经过`node --check`。执行文件与已提交GitHub原字节blob SHA-1一致：F01 policy `56b698c79f939ec5b69eff2f62f495c0c4a7e04e` / test `4ec5391bab3bb0718c52d26c81216e5225e80120`；F08 policy `cd01539f39694f72055b34539d29c01fe0602f7d` / test `33afa1b2630c35b229c1bc16b14f7ac24146afa3`。**仅纯业务策略，不导入真实Uppy或react-pdf SDK，E17/E18亦无SDK证据。**
- **未运行/阻塞**：实际hls.js/wavesurfer.js/Uppy/react-pdf运行、TypeScript/Vite完整构建、Chromium/Worker/CSP、真实媒体网络、PDF Blob/PDF.js互操作，全部`NOT_RUN/BLOCKED`，不许将策略测试当SDK PASS。PLATFORM保有真实依赖/lockfile/runner控制权。
- **dependencyRequests**：无新增。现有声明hls.js@1.7.3 Apache-2.0、wavesurfer.js@8.0.3 BSD-3-Clause、@uppy/core@6.1.0 MIT、@react-pdf/renderer@4.9.0 MIT，PLATFORM需真实核实版本/peer/许可、安装与锁文件；复核Uppy addFiles/getFiles/destroy与react-pdf pdf().toBlob官方文档但不等于安装验收。
- **下一队列**：F13 Playwright CLI、F14 Storybook、F17 axe-core；待PLATFORM反馈定向SDK/types/build/Chromium与E05 Worker/F11 SW/E19 WASM、F06/F07 PDF.js。
- EF **37/37已有源码和指南**，不代表已完成真实运行验收，PR保持Draft，base固定feat/library-lab；不合main或公开部署。

runCount=16/24。

### 第十六轮GitHub提交与客观结构验收

- [EF Draft PR #57](https://github.com/CoderLambert/ReactLoom/pull/57)，head `feat/library-lab-ef-wave16-media-queue-pdf`，base严格 `feat/library-lab`。提交序列：`5a58eef9e72ff4126033b6f8c81129268cc5e361` 源码、`b3460a85f7c46d4a02882b32e906e02a5a7656e7` 指南/进度、`089c2b48c47e69840303c55766c3b9d56ac8cb0b` AGENTS与诚实verification。
- GitHub compare与当前tree实际核对：3 commits、30 changed files，全部 `entries/E*`/`entries/F*` 或本进度文档，**0越权**。F01与F08六份basic/business/advanced场景sourceFiles清单 **6/6含entryPoint且均存在**；四份独立Node原件blob SHA与执行字节完全匹配。
- 当前PR保持Draft；真正SDK、TypeScript/Vite全包、真实媒体、Chromium/PDF Worker验收仍 `NOT_RUN/BLOCKED`，等待PLATFORM真实依赖/runner反馈，不合main，不部署。
