# A09 Excalidraw — 工程手册

## 适用

`@excalidraw/excalidraw@0.18.1` 做手绘白板。可执行节点用 A06，文本流程用 A08，可编程无限画布先核对 A10 的许可证。不要把箭头当成工作流引擎，也不要用 0.18.0。

## 版本

钉 0.18.1，MIT 嵌入包。必须导入 `index.css`。容器高度非零。`langCode="zh-CN"`，`autoFocus={false}`，`handleKeyboardGlobally={false}`。字体自托管不是当前示例的实现，生产要在模块加载前设置 `EXCALIDRAW_ASSET_PATH`。

## 迁移

删掉 `readyPromise` 和把 API 当作 ref 的写法，只留 `excalidrawAPI`。`initialData` 只在挂载时生效；换场景用 `updateScene` 或更换组件 key。远程更新选择 `captureUpdate`，避免全部进入本地撤销栈。安全补丁低于 0.18.1 的版本不要留。

## 不可删的清理

卸载时递增 `operationId`、清空 API ref、撤销 Blob URL、清除下载和防抖定时器。导入和导出完成时比对代数、挂载标志和 API 身份，不一致就丢弃结果。`onLinkOpen` 拒绝非 https 或带凭据的链接。

## 反例

```tsx
<Excalidraw initialData={{ elements }} onChange={setElements} /> // 错：把初始值当受控源
// 对：onChange 只更新 ref 或防抖计数；更换场景调用 updateScene
```

高度为 0、持久化整份 appState、每个指针事件 PUT、导入不限制大小，都不要做。

## 测试断言

`sceneImportError` 拒绝错误扩展名、空文件、超过 1.5 MB、超过 200 元素、不安全链接和任何附件。`isSafeSceneLink` 只接受无用户信息的 https。SDK 收据还要看到真实 `Excalidraw`、`convertToExcalidrawElements`、`exportToBlob` 和 `loadFromBlob`。没有 runs 收据则为 NOT_RUN。

## 真实限制

没有服务器 revision。只读只是 `viewModeEnabled`。教学导入不接受图片附件。宿主若不重挂载，`initialData` 不会随 level 更新。PNG 上限 2048，不是视口保证。没有协作和 FPS 数字。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A09 PASS。不要把导入策略测试或历史研究 PASS 写入 `verification.json`。
