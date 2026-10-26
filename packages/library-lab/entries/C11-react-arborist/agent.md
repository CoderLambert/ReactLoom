# C11 react-arborist — Agent 工程复用指南

**适用**：分组 RSS、文件树、可虚拟滚动+展开+拖拽的层级列表。**不适用**：只是几个无拖拽的扁平菜单，此时简单原生列表更小且更易维护。

## 核心迁移
`examples/example.tsx` 中的 `Tree`、`moveTree`、`renameTree` 和 `stripTree` 可提取；`examples/demo.tsx` 不需迁移。基线 react-arborist 3.16.0，MIT。业务树 ID 必须稳定、跨过滤排序不更换；给 Tree 明确 height/rowHeight。

## 关键不可删
同级 `onMove` index 必须先按当前目标兄弟列表计算 `adjustMoveIndex`。先 remove 后原位 splice 会偏移；移动到自身后代必须被拒绝。受控 data 模式要真正处理 onMove/onRename/onDelete，不要只更新 DOM。输入法候选阶段不提交搜索。

## 必要测试
真实 SDK adjustMoveIndex 断言；Playwright 拖动同级、跨组、筛选后拖动，验证节点不会丢/重复；键盘/屏幕阅读器、缩放和1800节点视区渲染；IME 候选词输入。单个 helper PASS 不能说明 DnD PASS。当前三项 SDK/build/browser 仍 NOT_RUN。

## 组合
TanStack Virtual 适合自定义虚拟化；dnd-kit适合其他交互；Virtuoso更适合列表。参考 https://github.com/jameskerr/react-arborist 。
