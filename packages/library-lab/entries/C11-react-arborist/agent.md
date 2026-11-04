# C11 react-arborist — 工程手册

## 适用

受控的订阅目录：稳定 id、拖拽、重命名、按名称搜索。不要用它代替后端 ACL，也不要假设整棵树可以无限大。

## 版本

`react-arborist@3.16.0`，MIT。示例导入 `Tree` 和 `adjustMoveIndex`。研究笔记的 4.0.1、react-dnd 16 peer 和 ESM 深导入变更不是当前 pin。

## 迁移

带走 `examples/example.tsx` 的 `moveTree`、`renameTree`、`stripTree`。保持受控 `data`。升级到 4 之前不要改传递依赖。搜索继续用自定义 `searchMatch`。

## 不可删的清理

`onMove` 必须先 `adjustMoveIndex`。插入失败时返回原树。id 在重命名和移动中保持不变。组件不要改成 `initialData` 却留下写回调。恢复示例时同时清空搜索和选择。

## 反例

```tsx
<Tree initialData={nodes} onMove={mutateInPlace} />
siblings.splice(index, 0, dragged)
```

- id 用数组下标。
- 父节点拖进自己的后代仍保存。
- 父和子被各复制一份。
- `children: undefined` 表示未加载文件夹。
- 默认搜索命中整个对象。
- 组合输入的 Enter 直接改名。
- `disableDrag` 当成授权。

## 测试断言

- 同级下移使用 `adjustMoveIndex` 后的下标。
- 拖入自身子树时树不变。
- 重命名不改 id；空白名称有兜底。
- 搜索匹配函数只看 `name`。
- 还没有浏览器拖拽收据时，这些代码审查不能写成 PASS。

## 真实限制

没有服务端 revision，没有第二棵树，没有 v4 DnD provider。1,800 行不是性能数据。高度是写死的 340。中文输入只在搜索框上分了组合态。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
