# A09 · Excalidraw — Agent 工程迁移卡

**任务定位**：自由草图、产品共创、RSS/流程可视化评审。**不适用**：超大关系图计算、严格节点业务拓扑、全自动流程执行。先比较 A06 React Flow 与 A08 Mermaid。

## 首先核对

- 版本：`@excalidraw/excalidraw@0.18.1`，与目标 React/Vite/SSR/浏览器能力核对 peer 和构建。
- 源码：`examples/example.tsx`、`examples/styles.css`；适配入口 `examples/demo.tsx`。网站代码面板来自同一文件。
- 验证：`verification.json`，无 SDK/浏览器 PASS 证据时，不能按生产可靠性引用。
- 资产：代码 MIT ≠ 图片、字体和品牌素材已授权；需要自托管时遵循官方字体目录说明。

## 迁移最小模式

1. 客户端懒加载 Excalidraw + CSS，父容器必须有尺寸。
2. 使用 `convertToExcalidrawElements` 形成初始场景，之后通过 `excalidrawAPI.updateScene` 更新。
3. `handleKeyboardGlobally={false}`、`autoFocus={false}` 避免嵌入组件抢占整个产品键盘和焦点。
4. 原始 scene 数据归业务文档层，编辑器渲染状态归 SDK；异步保存需分代校验，避免覆盖用户新编辑。
5. 文件导入限制体积、元素数、安全链接与附件；生产另审访问控制、存储 schema 和协作策略。
6. 导入/导出使用递增 operationId 隔离异步结果：重置场景、重新加载模板、显式忽略结果或卸载时使旧结果失效。底层 loadFromBlob/exportToBlob 未提供信号取消，不得声称已中止底层运算。
7. 卸载释放 Blob URL、回收计时器（包括延后URL释放任务）和本组件资源，不全局清缓存。

## 禁止的常见反模式

- 绘制每次改变就立刻同步保存全量大 JSON；
- 直接改变 `initialData` 期待挂载实例自动更新；
- 把 PNG 当唯一可编辑源文档；
- 不隔离本地 Excalidraw 快捷键、字体远程请求；
- 将静态源码完整性或旧归档 PASS 写成当前 SDK/浏览器 PASS。

## 必要断言

画布高度非零、真实绘图和编辑、API 更新、限制导入/阻止危险链接、PNG 下载、只读不允许修改、Escape/Tab 焦点不污染外部页面、切换 Tab 无旧回调/Blob URL 残留。按库版本跑真正类型检查与 Chromium，记录源码指纹和日志。

**官方**：https://docs.excalidraw.com/docs/@excalidraw/excalidraw/installation

### wave17 导入规则

迁移必须同时复制 `examples/scene-policy.ts`。所有不可信文件在 SDK 解码前检查后缀/字节，在恢复后检查元素/附件/HTTPS链接；用户点击链接同样走 `isSafeSceneLink`。不要把Node纯策略测试认作Excalidraw官方SDK/浏览器安全审计。
