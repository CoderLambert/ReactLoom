# E05 Monaco：工程复用指南

## 适用条件与模型

桌面网页需要 IDE 风格的可编辑 TypeScript / JSON、补全、撤销和定位诊断时使用。只读代码优先静态高亮；需要精细扩展组合时比较 CodeMirror。锁定 `monaco-editor@0.57.0`（MIT）；官方不支持移动浏览器，VS Code 扩展不能直接复用。

Model 管文本、语言和编辑历史；Editor 是视图；语言 Provider / Worker 异步产生诊断。React state 只显示文本副本，不在 effect 中每次 setValue。独立模型具有唯一 URI，业务多文件项目应使用稳定文件 URI。保存/恢复/sessionStorage 是示例业务逻辑，不是 Monaco 自带持久化。

## 最小迁移路径

在 Vite React TS 工程执行 `pnpm add monaco-editor@0.57.0`，复制 `examples/example.tsx`、`workshop.css`、`workers.ts`、`worker-lease.mjs` / `.d.mts`、`resource-cleanup.mjs` / `.d.mts`、`draft-store.mjs` / `.d.mts`。调用 `<MonacoExample level="basic" />`，按需切为 business / advanced。TS 包含 `vite/client`，通过 HTTP(S) 运行，给编辑器容器非零尺寸。

Worker 子路径以当前安装包 exports 为准：0.57.0 使用 `monaco-editor/editor/editor.worker.js?worker`、`monaco-editor/languages/features/json/json.worker.js?worker` 与对应 typescript/css/html 路径。该版官方 integrate-esm.md 仍保留旧目录片段，不能据此改回 `esm/vs/language/...`。`?worker` 属于 Vite；Webpack/Next/SSR 需另做客户端适配。0.57.0 JSON 顶层命名空间为 `monaco.json`，不要照搬旧版 `monaco.languages.json`。

## 三个目标和关键实现

- basic：输入→`model.onDidChangeContent`→文本预览；`executeEdits` + `pushUndoStop` 使按钮替换可撤销。代码不执行。
- business：点击保存时从 `editor.getValue()` 读当前文本，写 `sessionStorage` 中的 `reactloom-library:e05:typescript-draft:v1`。200000 字符上限、版本/语言/时间校验、存储异常反馈；空文本有效。重挂/刷新不自动覆盖模型，恢复明确触发；清除只删本键，卸载不删用户已保存草稿。
- advanced：初始 JSON 尾逗号→内置 Worker→真实 marker 的行列、严重程度和消息；定位按钮使用 `setPosition/revealLineInCenter`。载入合法 JSON 后等待 marker 变为 0。只读当前 model URI，页面始终展示最近诊断快照，不声称当前版本已验证完成。`onDidChangeMarkers` 不是每次验证完成事件，尤其空→空可能不触发；编辑时保留最近快照，不能清空后永久等待，也不能超时伪造0。没有自建 parser 或手造 marker，没有全局修改 jsonDefaults。

## 不可删的资源所有权

所有初始化资源先写入 owned，再继续下一步。正常卸载与初始化失败共用 `createOwnedResourceCleanup`：observer → marker listener → content listener → editor → model → Worker 租约。幂等释放；中间 disposer 抛错也继续。`active.current` 清空后不再布局旧 editor。

`acquireWorkerEnvironment` 多实例引用计数，只删除自己安装的映射，拒绝外部占用/替换。此 helper 必须由同一模块实例共享；微前端各带一份时应由宿主统一安装。Monaco 缓存语言 Worker，释放环境映射/model 不证明线程立即结束。不要终止别人的 Worker。

## 禁止的简化

render 期间 create；固定 URI 创建多个 model；只销毁 editor；覆盖全局 MonacoEnvironment；同时启用 automaticLayout 与自建 observer；marker 不按 URI 过滤；setValue 反馈循环；把 sessionStorage 写入失败显示为成功；清空整个 storage；执行/自动上传用户文本；把 JSON 语法通过说成业务校验通过；把策略测试或旧 CI 绿灯写成逐库 SDK/browser PASS。

## 定向验证与断言

在 `packages/library-lab` 运行 `pnpm test:policy --entry=E05`，验证当前真实清理 helper 与草稿策略；没有 Node SDK 套件，不能改名充数。

浏览器在实际 Lab Demo 中验证：

1. basic 真实 Monaco 可输入；model-text 与字符数变化；插入问候调用后撤销恢复原文，重挂 URI 唯一。
2. business 保存→改动→未保存状态→恢复，刷新后手动恢复；空文本可保存；清除草稿不改当前文本或其他 key；存储拒绝/不兼容时有明确失败且不覆写模型。
3. advanced 启动真正 JSON Worker；初始非零 marker 有行列/消息；合法 JSON→0；合法JSON再输入空格仍保留最近快照、不永久等待；撤销恢复错误文本→标记恢复；定位后焦点进入编辑区。
4. 切换场景、停止、离开页签：旧 DOM/监听消失；反复进入不遗留本例 model；最后租约释放自己的环境映射；无 Worker 回退/初始化错误。线程缓存和映射释放分别观察，不能断言所有线程立刻退出。
5. 讲解页不请求 Monaco 编辑器资源；进入 Demo 自动挂载，停止后才需“运行当前示例”重开。

真实浏览器与生产 CSP 独立于 Node 策略；正式状态遵循 verification.json 和匹配收据。来源、元数据及本次本地检查见 library.json / local-validation.md。
