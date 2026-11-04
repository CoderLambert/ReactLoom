# A10 tldraw — 工程手册

## 适用

`tldraw@5.5.2` 做无限画布和形状模型。手绘嵌入且希望 MIT 包时看 A09；端口 DAG 看 A06。非本机没有合法 `VITE_TLDRAW_LICENSE_KEY` 就不要挂载，也不要伪造 key 或去掉水印。

## 版本

钉 `tldraw@5.5.2`。导入 `Tldraw`、`createShapeId`、`getSnapshot`、`toRichText` 和 `tldraw/tldraw.css`。许可证不是 MIT。`setCamera` 拒绝非有限数。不要使用已废弃的包入口 `@tldraw/tldraw` 作为新代码的默认导入。

## 迁移

外部创建形状改为 `editor.run` + `createShape`，文本用 `toRichText`。持久化从 `JSON.stringify(editor)` 改为 `getSnapshot` 的 document。若启用 `persistenceKey`，按文档隔离；Lab 故意不加，避免 IndexedDB 串数据。只读用 `updateInstanceState`，并在服务端再鉴权。

## 不可删的清理

`onMount` 返回的函数必须退订 `store.listen`。卸载时撤销 Blob URL 并清除定时器。程序化按钮在超过 80 个形状前返回。快照超过 3 MB 时在 `createObjectURL` 之前抛错。已卸载的 Editor 不再调用。

## 反例

```tsx
editor.createShape({ type: 'geo', x: 0, y: 0 }); // 错：放在组件 render
localStorage.setItem('doc', JSON.stringify(editor)); // 错
// 对：在按钮中 editor.run(() => editor.createShape({ id: createShapeId(), ... }))
```

高度为 0、拖动时 setState 全量形状、只读当成授权，都不要做。

## 测试断言

`serializeSnapshot` 拒绝无法序列化的值和超过 3 MB 的 UTF-8。SDK 收据还要看到真实 `Tldraw` 只在许可条件下挂载、`createShape`、`getSnapshot` 不含 session、卸载退订。没有 runs 收据则为 NOT_RUN。

## 真实限制

没有 `toImage`、`loadSnapshot`、协作同步或 HTTP 409。80 的上限不管手绘。`zoomToFit` 不读取减少动态偏好。level 变化不重挂载时，onMount 里的骨架不会自动重建。没有帧率数字。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A10 PASS。不要把快照字节测试或历史研究 PASS 写入 `verification.json`。
