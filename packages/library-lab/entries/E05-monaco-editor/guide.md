# E05 · Monaco Editor 工程实践

## 定位、选型和许可

Monaco 是 VS Code 使用的编辑器核心之一，适合 SQL/JSON/TS 配置编辑、开发者控制台、规则编辑和 IDE 类工作台。它**不是完整 VS Code**，不能把桌面 VS Code 扩展直接装进浏览器。小型富文本、高性能移动端阅读或简单代码高亮不一定需要 Monaco；纯展示时优先静态高亮。该条目采用 `monaco-editor@0.57.0`（MIT），官方参考见相关资料。浏览器移动端支持需单独评估，不应默认承诺。

## 安装、入口与运行

```sh
pnpm add monaco-editor@0.57.0
pnpm --filter @reactloom/library-lab dev
```

真实业务代码在 `examples/example.tsx`；Vite Worker 映射在 `examples/workers.ts`；Lab 加载适配 `examples/demo.tsx`。进入 E05 的 Demo Tab 并点击“运行当前示例”时才会下载编辑器。主站首页不应直接请求 Monaco 的 worker chunk。

`installMonacoWorkers()` 在 `editor.create()` **之前**注册 `MonacoEnvironment.getWorker`，根据 JSON/TS/CSS/HTML 选择 Vite 的 `?worker` 构造器。官方 ESM 集成文档明确对 Vite 使用 `getWorker`。不能复制老旧 `getWorkerUrl` + 静态路径方式，避免构建路径错误。

## 可运行的三层场景

1. **basic**：TypeScript 代码可编辑，实时显示字符数。编辑内容由真实 Monaco model 维护，而非把 textarea 冒充编辑器。
2. **business**：在带类型的业务函数中编辑内容，点击保存后读取当前 model 的完整值，形成只存在当前组件中的草稿快照。
3. **advanced**：实际启用 JSON 模式，利用 JSON worker 诊断有意设置的语法错误；随手修复后观察标记变化。断言应等待 worker 结果，而非用固定延迟假设完成。

## 内部模型与正确生命周期

Monaco 区分 `model`、`editor`、`worker` 和语言服务：model 是带 URI 的文档，editor 是渲染视图，一个 model 可以由多个视图观察。不要把 model 和 editor 的身份混为一谈。示例每次挂载都创建带唯一 URI 的 model，避免多个 Tab 的 URI 冲突。

`useEffect` 创建 `createModel` / `editor.create`，注册内容和诊断订阅；`ResizeObserver` 触发布局调整；卸载依次断开 observer、dispose 订阅、editor 和 model。不能只调用 `setState(null)` 或移除 DOM，隐藏面板不等于清理。生产里若在多个应用共享同一页面使用 Monaco，全局 `MonacoEnvironment` 的所有权必须统一管理。

**重要限制**：这些示例卸载 editor/model，但 Monaco 的语言 Worker 可能被其内部缓存复用；不能声称上面的销毁代码会保证终止所有 Worker。彻底隔离或终止生命周期需要 PLATFORM 负责的独立运行容器/浏览器验证。

## 五种常见问题与修复

- Worker 404 或警告 “Could not create web worker”：检查 Vite worker 构造器、同源策略、构建 base、HTTP 响应 MIME 和 CSP 的 `worker-src`；不要无视回退到主线程的警告。
- 重复 model URI 抛错：URI 唯一且每次卸载 `model.dispose()`，不能无脑全局 `getModels().forEach(dispose)`。
- 隐藏容器初始高度为零：容器明确高度，并用 ResizeObserver 调整 `layout()`，观察器本身也要释放。
- 组件卸载后诊断还改写 UI：dispose `onDidChangeMarkers` / `onDidChangeModelContent` 的订阅。
- 误将用户代码 `eval` 或交给真实业务 Worker 执行：**编辑不等于执行**，只保存文本；若要提供执行必须另建严格沙箱，并设计权限和资源限制。

## 性能、安全与可访问性

按需导入 Monaco 和语言 Worker；复杂场景还应选择性引入语言贡献包，不在首页注册所有能力。编辑器可通过 `ariaLabel` 说明用途，须独立测试键盘导航、聚焦返回、读屏及 IME。代码录入不是可信代码，**不可**默认把内容发往外部远程语言服务。Workers 的 `worker-src` 和 iframe 的 origin/CSP 要在部署前真实确认；不能因 dev server 正常就推断生产正常。

## 组合与练习

- Monaco + 业务 schema：在配置保存前对字符串执行合法性校验，服务器仍需要独立校验。
- Monaco + Diff Editor：比较两个版本；注意额外的 model 也需要 dispose。
- 练习：保存草稿后切换 Tab、重新挂载，观察默认模型与已保存状态的所有权；使用 Network 面板确认仅点击启动后产生 Monaco 资源请求。
- 练习：生产预览下加载 JSON Worker，模拟错误/修复并观察 markers；运行卸载/重挂检查模型数量无净增长。

## 验证状态

源码使用真实 Monaco ESM API 和 Vite Worker 构造器，但当前本地环境无 npm 依赖，`sdk`、`build` 和 `browser` 均不能标 PASS。具体细项参见 `verification.json`；离线编译不代表 Worker 已工作。
