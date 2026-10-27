# E05 Monaco Editor — Agent 实施手册

## 先判断是否适用

用于有编辑、自动完成或语言诊断需求的开发者页面。不用于纯代码展示、轻量表单或移动端必须完整支持的文本编辑。目标包 `monaco-editor@0.57.0`，MIT；先核对目标 React/Vite/浏览器/Worker 约束。

## 文件与依赖

- `examples/example.tsx`：可复用的编辑器生命周期和业务行为。
- `examples/workers.ts`：**Vite 专属 Worker 适配层**；迁移到 Webpack/Next 必须重写，不要机械复制。
- `examples/demo.tsx`：Lab 导出适配，可省略。
- `verification.json`：真实结果，禁止借历史 PASS 标记已测。

从 `MonacoEnvironment.getWorker` 开始理解，确保环境注册先于 `monaco.editor.create`。每个文档 URI 唯一，持有者负责 `editor.dispose`、`model.dispose`、监听器与 ResizeObserver 清理。

## 不可删约束

1. Worker 被真正加载而非静默回退主线程，CSP 和路径必须在生产验证。
2. 编辑器容器具备非零尺寸；布局变化调用 `layout()`。
3. 异步 diagnostics 不得在旧实例销毁后操作新视图。
4. 不执行未受信任的编辑器文本，不向远程服务自动上传。
5. Monaco 可能复用内部语言 Worker；**只 dispose model/editor 不意味着 Worker 已全部终止**。若要求完全隔离，先向 PLATFORM 申请单独 runner。

## 测试断言

构建后访问 E05 basic，点击启动、输入内容、断言 model/字符反馈更新；切换业务层并保存草稿；advanced 等待 JSON 标记出现和修复后消失；卸载后 `monaco.editor.getModels()` 不应持续增加，Chrome console 不应出现 Worker 回退警告。检查 Network 在点击 Demo 前没有请求 Monaco chunk。当前未完成真正 SDK/浏览器验证，不得宣称 PASS。

## 参考

https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md

## MonacoEnvironment迁移约束（第12轮）

需要连同`workers.ts`复制`worker-lease.mjs`及TypeScript声明。调用`installMonacoWorkers()`保存release，必须先释放Monaco editor/model再release。共享页面已有MonacoEnvironment的场景应交由宿主统一配置，**不要**替换或删除其它编辑器的全局映射。引用计数**不保证**实际Worker线程销毁，必须实测生产`worker-src`及diagnostics。
