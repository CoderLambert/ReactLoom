# Monaco Editor 0.57.0｜模型、Worker 租约和失败也要释放

Lab 锁定 `monaco-editor@0.57.0`（MIT）。它是代码编辑器，不是代码展示组件。只读高亮用更轻的方案。移动端要完整编辑时先确认虚拟键盘和 Worker，不要默认它适合手机。

包已经在根锁文件里。旧笔记里「先安装 monaco 才能谈构建」不再成立。Worker 是否真的加载、CSP 是否允许，仍然没有逐库收据，所以 browser 是 NOT_RUN。Actions 里的 `@E05` 也不能手抄成 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 调用 `monaco.editor.createModel` 和 `create`。[`examples/workers.ts`](examples/workers.ts) 是 **Vite 的 `?worker` 适配**。换 Webpack 或 Next 必须重写，不能原样复制。[`examples/worker-lease.mjs`](examples/worker-lease.mjs) 用引用计数安装 `MonacoEnvironment.getWorker`。[`examples/resource-cleanup.mjs`](examples/resource-cleanup.mjs) 按固定顺序释放，某一步抛错仍继续后面的步骤。

顺序是：ResizeObserver disconnect → markers dispose → content dispose → editor.dispose → model.dispose → `releaseWorkers()`。

- 每个模型使用 `inmemory://reactloom-library/e05/<uuid>`，避免两个 Demo 抢同一个 URI。
- basic / business 是 TypeScript 文本；advanced 是一份故意不合法的 JSON，用来看 marker。`automaticLayout` 关掉，改由 ResizeObserver 调用 `layout()`，并且只在 ref 仍指向这个 editor 时调用。
- 容器需要非零尺寸。minimap 关闭，避免演示页再挤一列。
- `installMonacoWorkers` 若发现全局 `MonacoEnvironment` 已经被别人占用，会失败并显示冲突，不覆盖对方的映射。
- 创建监听或 `layout()` 抛错时，已经放进 `owned` 的模型、编辑器和租约仍走同一个 cleanup。
- 卸载走同一 cleanup。Node 单测只检查这个顺序，不创建真编辑器。

`model.dispose()` **不能**保证 Monaco 内部缓存的语言 Worker 线程已经退出。租约释放的是我们安装的 `getWorker` 映射。生产 CSP 的 `worker-src` 要单独看网络面板里有没有主线程回退警告。

## 1. 四个对象

| 对象 | 谁拥有 | 卸载时 |
| --- | --- | --- |
| Model | 这份文档的文本和语言 | `model.dispose()` |
| Editor | 视图、光标、滚动 | `editor.dispose()` |
| Worker | 诊断和补全，可能被 Monaco 复用 | 不要假设 dispose 模型就停了线程 |
| MonacoEnvironment | 页面级 getWorker | 只释放自己加上的引用计数 |

React state 里的 `code` 是给表格或保存按钮看的副本。权威文本在 model 里，保存时读 `editor.getValue()`。

## 2. 三层

### 基本

创建 TypeScript 模型，输入能反映到页面上的文本状态。点运行之前，网络里不应出现 Monaco 的 chunk；Lab 的宿主是点击之后才加载 Demo。

### 业务

一份更接近源码的函数草稿，外加「保存」把当前值放进 state。这不是磁盘，也不是服务端。切换 level 会拆掉旧模型和编辑器再创建，草稿不会自动带过去。

### 进阶

JSON 文本带尾逗号，marker 监听只统计 **这个 model 的 URI**。别的编辑器的诊断不能把本页计数改掉。修掉语法后计数应下降。这要在浏览器里看；单测没有标记服务。

## 3. 反例

### 反例 1：在 render 里 create

每次渲染一个模型和一个 Worker 路径。放进 effect，清理函数调用同一个 `createOwnedResourceCleanup`。

### 反例 2：固定 URI

```ts
monaco.Uri.parse('file:///demo.ts')
```

第二个实例会碰到「模型已存在」。用唯一 URI，或在创建前检查并拒绝复用别人的模型。

### 反例 3：只 dispose editor

模型还在 `getModels()` 里，再进来就泄漏。两者都要释放。Lab 的清理表把 model 放在 editor 之后，避免视图还拿着已销毁的模型；若 editor.dispose 抛错，model 仍然会尝试释放。

### 反例 4：覆盖全局 MonacoEnvironment

页面上已有编辑器时，直接赋值 `globalThis.MonacoEnvironment` 会拆掉对方的 Worker。`acquireWorkerEnvironment` 拒绝抢占。宿主应用应该只安装一次，而不是每个微前端各装一次。

### 反例 5：automaticLayout 和自己的 observer 一起上

两套布局会互相触发。本示例关掉 automaticLayout，只用容器的 ResizeObserver。宽度为 0 时不要指望 `layout()` 变出编辑器；先给容器高度。

### 反例 6：诊断回调不看 URI

`onDidChangeMarkers` 是全局的。不比较 URI 就会把别的文件的问题显示在这里，卸载后还会 `setState`。

### 反例 7：把编辑器内容 eval 或上传

不可信文本不要执行。不要在 `onDidChangeModelContent` 里自动发到远程。保存按钮如果要提交，走你们的 API client，并可以取消。

### 反例 8：Webpack 项目复制 Vite worker 导入

`?worker` 是 Vite 语法。Next 或 Webpack 要用官方 ESM 集成文档里的那套插件。复制 `workers.ts` 而不改打包器，构建会在 Worker 路径上失败。

## 4. 组合

**Ajv**：JSON 结构错误用 Ajv，编辑器 marker 只表示语法。不要两套都往同一个状态数组里推、还不标明来源。

**Shiki**：只读展示用 Shiki，避免为了看一段代码加载 Monaco。两边不要包同一块 DOM。

**Yjs**：协同编辑是另一条路线。本示例没有 awareness，也没有销毁网络 provider。不要把 model.dispose 说成协同会话已结束。

## 5. 生产核对

- `worker-src` 和脚本源一致，控制台没有 Worker 回退。
- 多次进出 Demo，`getModels()` 不按次数增长。
- 容器从 0 变成有高度后调用过 `layout()`。
- JSON 标记只属于当前 URI。
- 初始化中途抛错后，映射和模型没有净增。
- 减少动态不是 Monaco 的内置开关；若你加了装饰动画，另做。

## 6. 练习

1. 打开 advanced，看标记数；删掉尾逗号，看计数变化。刷新网络面板确认 Worker 脚本的来源。
2. 连续挂载 10 次，记录 `monaco.editor.getModels().length`。
3. 在已有 `MonacoEnvironment` 的页面加载本示例，确认它失败提示而不是覆盖。

## 7. 证据

`resource-cleanup` 和 `worker-lease` 的 Node 测试使用假对象。它们不是 Monaco SDK，也不是 CSP。browser 保持 NOT_RUN，直到有收据。

## 8. 资料

- https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md
- https://www.npmjs.com/package/monaco-editor
- https://microsoft.github.io/monaco-editor/docs.html
