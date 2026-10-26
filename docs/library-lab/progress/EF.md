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
