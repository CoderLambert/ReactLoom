# Monaco Editor：把编辑、语言诊断和本地草稿接成闭环

产品需要让用户修改一段 TypeScript 规则或 JSON 配置时，普通 `textarea` 很快就缺少语法着色、补全、撤销和错误位置。Monaco 把这些编辑能力带进浏览器。本例让用户修改新闻摘要函数、保存本标签页草稿，再修复 JSON 配置错误；文本只参与编辑与诊断，不会执行，也不会上传。

本条目使用 `monaco-editor@0.57.0`，MIT。适合桌面开发者工具、规则配置和 IDE 风格界面；仅展示代码时可选 Shiki，需要精细组合较小的编辑扩展时可比较 CodeMirror。Monaco 的成本包括编辑器与语言资源、Worker 打包和生命周期管理。官方明确不支持移动浏览器，也不能直接运行 VS Code 扩展，不能把它当完整 VS Code。

## 先分清文本、视图和语言服务

| 对象 | 本例中的职责 | 可见变化 |
| --- | --- | --- |
| Model（文本模型） | 保存文本、语言 ID、编辑历史，以 URI 标识文档 | 输入后“模型文本”和字符数同步变化 |
| Editor（编辑视图） | 把 model 显示到 DOM，处理光标、滚动和编辑命令 | 插入、撤销、定位诊断发生在编辑区 |
| 语言服务 / Worker | 在后台分析模型，提供补全与诊断 | JSON 尾逗号产生带行列位置的 marker |
| React state | 为字符数、预览和草稿状态提供界面快照 | 不作为每次渲染回写 model 的受控值 |
| sessionStorage（示例自建） | 仅在点击保存时记录当前 model 文本 | 刷新后发现草稿，点击恢复才替换编辑内容 |

一个 model 可以交给不同视图显示；销毁视图不会自动销毁独立创建的 model。URI 还参与 TypeScript 导入解析、JSON schema 关联。本例为每次挂载创建 `inmemory://reactloom-library/e05/<uuid>.ts` 或 `.json`，避免第二个实例抢占同一文档身份。实际文件项目应使用稳定、与业务文件对应的 URI，而不是给每次输入生成新模型。

文本流向是：**用户编辑 → model 改变 → `onDidChangeContent` 更新预览；JSON 语言服务异步验证 → marker 事件 → 当前 URI 的错误列表**。保存按钮从 `editor.getValue()` 读取权威文本，再调用本地存储 helper；React state 不承担自动保存，也不执行这段代码。

## 三个可独立操作的场景

进入 Demo 页签或切换学习场景时，当前宿主会自动挂载该场景；停止后可用“运行当前示例”重开。阅读讲解页不加载交互编辑器。切换场景、离开 Demo 页签或停止示例都会卸载旧视图和模型，未保存文本随之丢弃。

### 入门：模型编辑与撤销

工程问题：外部按钮怎样修改编辑器，同时保留用户的撤销能力？

1. 打开“文本模型与编辑操作”，在 TypeScript 编辑区修改 `greet` 的返回值；下方模型文本和字符数随输入变化。
2. 点击“插入问候调用”，模型替换为示例函数和 `console.log(greet('Ada'))`；它只是文本，没有执行输出。
3. 点击“撤销”，回到按钮操作前的文本。“重置示例文本”也作为可撤销的一次模型编辑。
4. 展开“当前模型身份”查看本次 URI。重新挂载会得到新 URI。

[`example.tsx`](examples/example.tsx) 的 `replaceText` 用 `executeEdits` 和两侧 `pushUndoStop()` 建立独立撤销边界。不要为了同步 React 预览而在每次渲染执行 `setValue()`，那会覆盖输入并重置编辑历史。

### 业务：显式保存、修改、恢复

工程问题：页面重新挂载后，用户怎样找回自己确认保存过的函数草稿？

1. 切换“显式保存与恢复函数草稿”，把 `return article.title.trim()` 改为自己的文本；点击“保存本地草稿”。已存快照应与模型相同，状态显示“与已存草稿一致”。
2. 再改一处文本，模型状态应显示“有未保存改动”，已存快照保持不变。
3. 点击“恢复本地草稿”，模型回到保存版本。此替换也可撤销。
4. 刷新当前标签页，再进入同一场景：先显示初始示例，并提示发现草稿；点击恢复后才读入已存内容，避免静默覆盖当前编辑。
5. 点击“清除本例草稿”，只移除本例的存储键，当前编辑内容保留。

[`draft-store.mjs`](examples/draft-store.mjs) 是本例业务逻辑，不是 Monaco 的持久化 API。它使用 `sessionStorage`，同一标签页刷新后保留，标签页会话结束后不保留；不跨设备，不提供服务器备份或协作。键为 `reactloom-library:e05:typescript-draft:v1`，包含版本、语言、文本和保存时间。空文本也是有效草稿；超过 200000 字符、格式不兼容或存储被浏览器拒绝时显示失败，不能冒称已保存。卸载编辑器不删除已明确保存的草稿，只有清除按钮删除这一个键。

### 边界：真实 JSON 诊断与修复

工程问题：怎样把后台语言诊断变成可定位、可恢复的配置编辑反馈？

1. 切换“JSON 语言服务诊断与修复”。初始 `features` 数组带尾逗号；先显示尚未收到快照，再显示真实 marker 的数量、严重程度、消息和行列位置。
2. 点击错误位置按钮，光标和视图定位到相应行列。消息保留 SDK 原文，页面其他说明是中文。
3. 手动删掉尾逗号，或点击“载入合法 JSON”。等待语言服务返回后，应显示 `0 个 Monaco 诊断标记`。
4. 在合法 JSON 末尾输入一个空格，仍显示最近收到的 0 标记快照，而不会永久退回等待。先撤销空格，再撤销“载入合法 JSON”的替换回到错误文本，诊断随后恢复。

这里使用 Monaco 内置 JSON 服务，未用 `JSON.parse` 伪造 marker，也未手工调用 `setModelMarkers`。`onDidChangeMarkers` 是全局事件，因此示例比较 URI，再用 `getModelMarkers({ resource: model.uri })` 只读本文件的标记。0.57.0 的 JSON 适配器在修改后以约 500ms 防抖发起验证，Worker 启动还会增加延迟；自动化断言应等待结果，而不是固定休眠。

页面显示的是**最近收到的诊断快照**，不是当前文本版本的校验完成状态。Monaco 在空标记结果仍为空时可以不发变化事件；因此不能每次编辑都清空快照、等待一个不保证到来的事件。首次没有快照时仅说明“尚未收到”，不声称验证正在运行；后续编辑保留最近结果直到它发生变化，不会通过超时伪造 0。

本例保留默认语法诊断，不修改页面共享的 `jsonDefaults`，没有外部 schema 请求。`0` 个标记表示最近快照为空，不能证明刚改动的文本已经完成校验，也不能说明业务字段完整。需要字段校验时显式配置 schema，并说明页面级配置的所有权；提交时仍需业务层和服务端校验。

## 最小接入与迁移

运行源码是 [`example.tsx`](examples/example.tsx)，[`demo.tsx`](examples/demo.tsx) 只负责导出。迁入已有 Vite React TypeScript 项目：

1. 在项目目录执行 `pnpm add monaco-editor@0.57.0`。
2. 复制 `example.tsx`、`workshop.css`、`workers.ts`、`worker-lease.mjs` / `.d.mts`、`resource-cleanup.mjs` / `.d.mts`、`draft-store.mjs` / `.d.mts`，保持相对导入。入口渲染 `<MonacoExample level="basic" />`；业务和诊断分别传 `business`、`advanced`。
3. 确保 TS 项目含 `vite/client` 类型，以识别 `?worker`。用 HTTP(S) 服务运行，不通过 `file://` 打开。编辑器容器需要非零尺寸，本例 CSS 设为 320px 高。
4. 应用已有 Monaco 时，统一管理一次 Worker 映射和语言服务配置；不要在多个模块各自覆盖全局对象。若只迁移基础编辑，可以删去业务草稿 UI 及对应 helper，但需同步移除导入。

创建核心与实际源码相同：

```ts
const model = monaco.editor.createModel(text, 'typescript', uniqueUri)
const editor = monaco.editor.create(container, {
  model,
  automaticLayout: false,
  minimap: { enabled: false },
})
const listener = model.onDidChangeContent(() => setCode(model.getValue()))
```

实际示例还包裹了失败清理，并由 `ResizeObserver` 调用 `editor.layout()`。不能只复制这段而丢掉下节的资源释放。

### 0.57.0 的 Worker 路径须按安装包核实

[`workers.ts`](examples/workers.ts) 是 **Vite 专用**适配。`getWorker` 按语言标签创建对应构造器；本例 TypeScript 和 JSON 都运行真实语言服务 Worker，fallback 对应编辑器基础 Worker。

```ts
import JsonWorker from 'monaco-editor/languages/features/json/json.worker.js?worker'
```

0.57.0 安装包的 `exports` 已把此子路径映射到 `esm/vs/languages/features/json/json.worker.js`。该版上游 `integrate-esm.md` 仍保留旧目录片段，不能照抄 `monaco-editor/esm/vs/language/json/...`；本条目以匹配版本实际导出与文件为准。官方集成说明仍支持 Vite 的 `?worker` / `getWorker` 思路。换 Next.js、Webpack 或 SSR 时要改对应打包器配置，并只在客户端初始化；本例不提供这些平台的已验收适配。

## 资源与生产边界

[`worker-lease.mjs`](examples/worker-lease.mjs) 是示例自建的引用计数租约，只管理本模块安装的 `MonacoEnvironment`：多个实例共享映射，最后一个释放时才删除；页面已有外部映射或中途被替换时拒绝抢占。它不会关闭别人创建的 Worker，也不会修改其他应用配置。

[`resource-cleanup.mjs`](examples/resource-cleanup.mjs) 顺序释放 ResizeObserver、marker 监听、文本监听、editor、model、Worker 环境租约。每取得一个资源就写入 `owned`；后续创建失败和正常卸载都使用相同的幂等清理，单个 disposer 抛错也继续释放后续资源。

- 只销毁 editor 会遗留独立 model；只销毁 model 则视图仍引用旧对象。两者都要释放。
- Monaco 自己管理语言 Worker 的缓存与空闲回收；`model.dispose()` 或释放 `getWorker` 映射不等于线程立即退出。不要对 Monaco 缓存线程擅自执行全局终止。
- `automaticLayout` 关闭是因为本例自己使用 ResizeObserver，不要再加第二套自动布局。容器必须有尺寸。
- 生产 CSP、Worker 请求地址和跨域策略在业务部署环境中单独验证。检查网络实际返回和控制台的 Worker 失败/主线程回退，不把“界面出现了”当语言服务通过。
- 不使用 `eval`、`new Function` 或自动上传编辑内容；真正执行用户代码需要另行设计隔离运行环境。

## 官方资料与验证边界

“官方 README”页签展示微软仓库的原文快照，不是这份中文讲解。核对固定提交的根目录只有英文 README，没有官方中文版本；快照对应 0.57.0，来源、同步日期和 SHA-256 见 `library.json`。官网保留直达入口，响应头检查不等于从 Lab origin 完成 iframe 浏览器验收，状态仍按实际证据记录。

- [0.57.0 固定源码与 README](https://github.com/microsoft/monaco-editor/tree/d61824269f1377111d34306e4a47172327777083)
- [该提交官方 ESM 集成说明](https://github.com/microsoft/monaco-editor/blob/d61824269f1377111d34306e4a47172327777083/docs/integrate-esm.md)
- [官方 API 文档](https://microsoft.github.io/monaco-editor/typedoc/)
- [该提交 JSON 诊断适配器源码](https://github.com/microsoft/monaco-editor/blob/d61824269f1377111d34306e4a47172327777083/src/languages/features/common/lspLanguageFeatures.ts)

上文操作结果是浏览器验收目标；本轮实际命令、日志和剩余项在条目维护材料 `local-validation.md`。纯 Node 测试只证明草稿策略和清理所有权，不能证明 DOM 编辑、语言 Worker、CSP 或卸载后的线程状态。正式 `verification.json` 没有本条目的匹配收据，继续保留 NOT_RUN。
