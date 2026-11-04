# A10 tldraw — Agent 选型、集成和授权核对

## 何时采用

无限画布、可编辑形状数据库和复杂画笔交互。不是普通按钮/节点连线控件。对严格DAG优先评估A06 React Flow，对手绘头脑风暴可比A09 Excalidraw。

## 开发前必要核对

- SDK：`tldraw@5.5.2`。该库采用**定制许可证**，不属于常规 MIT；生产环境需要匹配使用场景的合法 key。不可模拟 key/绕过水印。
- 源文件：`examples/example.tsx` 与 `examples/styles.css`，`examples/demo.tsx` 仅指向同一真实实现。
- 集成范围：独立动态加载；导入 `tldraw/tldraw.css`，为容器分配非零尺寸；父应用负责独立宿主 z-index、键盘和路由。
- 状态：业务文档与 Editor 实例态分离，不默认向 Lab 共享 storage 里写 persistenceKey。

## 迁移步骤

1. 本地合规开发环境里加载编辑器；记录实际包版本和 license 条件。
2. 在 `onMount` 保存 Editor，监听 store 文档改变；回调返回 unsubscribe。
3. `Editor.createShape` 使用 `toRichText` 处理文字，批量创建用 `Editor.run`，避免手工操作 DOM 节点。
4. `Editor.updateInstanceState({isReadonly})` 仅处理客户端只读，真实后端仍须授权。
5. 快照只传输所需 `getSnapshot(editor.store).document`，导入应通过 SDK 校验和版本迁移且支持回滚；本演示不提供未审查的任意文件恢复。
6. 本例80形状限制仅适用于自带的程序化新增按钮，原生工具仍可手动绘图；如产品需要硬性总额，必须单独设计经过SDK支持的全局业务约束，服务端保存时也需校验。
7. 为上限、取消、错误和资源释放写定向检查；完整编译与 SDK 浏览器运行未通过前别宣称生产适用。

## 禁止的反模式

- 无授权推送公开/商业生产；
- 只有 readonly UI 而后端可修改；
- 全部编辑器实例复用一个 persistenceKey 或不受控清除 IndexedDB；
- 依赖截图重建可编辑图；
- 用 Canvas 冒充已覆盖屏幕阅读器的结构化业务信息；
- 无限创建节点后报告所谓毫秒性能数字。

## 关键验收

本机挂载成功、真实形状增删、画布缩放、只读拒绝修改、JSON文档结构含 shapes、再次挂载订阅无泄漏、键盘 Tab/Escape 不影响主应用、未授权非本机宿主显示合规提示。版本、执行命令、日志和源码指纹写 verification，缺测维持 NOT_RUN。

官方：https://tldraw.dev/sdk-features/license-key

### wave17 快照约束

同时迁移 `examples/snapshot-policy.ts`，保留UTF-8 3MB限制、URL/timeout实例级Set与卸载清理。不要把下载成功当服务器持久化或SDK完整验收；涉及blob/浏览器下载仍需真实Chromium验证。
