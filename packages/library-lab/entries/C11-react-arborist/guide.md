# react-arborist 3.16.0｜受控树的 ID 不跟着拖拽变

Lab 锁定 `react-arborist@3.16.0`（MIT）。研究笔记讨论的是 4.0.1 的 peer、ESM 和深导入。那些是升级到 4 时要单独核对的事项。当前挂载的是 3.16.0 的 `Tree` 和 `adjustMoveIndex`，不要按 4.x 的安装说明去改本仓库依赖。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 渲染真实 `<Tree>`。`demo.tsx` 只做再导出。数据是组件 state，没有 Query，也没有 127.0.0.1 的树接口。

- **basic**：三个分组和若干 RSS 源。`data` 受控。`onMove`、`onRename`、`onDelete`、`onSelect` 都写回新数组。行高 34，高度 340，`overscanCount={3}`。
- **business**：搜索框在非组合时把草稿写进 `searchTerm`。`searchMatch` 只比较 `node.data.name`，不用默认的整对象字符串化。拖拽说明写在页脚：`onMove` 的 `index` 是删除前的槽位，`moveTree` 先 `adjustMoveIndex`。
- **advanced**：在技术分组下再放 1,800 个 `bulk-*` 节点，用来看虚拟行，不表示性能数字。搜索在 `compositionEnd` 才写入。恢复按钮回到不含这 1,800 条的 starter。

`moveTree` 先按父 id 找到兄弟列表，修正 index，再从整棵树摘下被拖节点，最后插入。插不进去就保持原树。摘取是按 id 整棵子树搬走，所以父节点被拖走时子节点不会再单独复制一份。拖进自己当前子树时，节点已经从 remaining 里消失，插入失败，树不变。

`renameTree` 只换 `name`，不换 `id`。空名称变成「未命名」。

## 什么时候用

目录、订阅分组、需要键盘和拖拽的中等树。几千个节点可以虚拟化行，但整棵数据仍在内存里建索引。百万级或要按需展开未加载文件夹时，先设计「未加载」状态，而不是把 `children: undefined` 当成文件夹。库用 children 是否为数组判断叶子。

拖拽不是授权。服务端仍要检查归属、环和 revision。

## 数据与模型

`initialData` 是非受控。刷新后回到初值，内部快照和你的数组会分叉。要持久化就用 `data` 加上三个回调，每次返回新树。就地 `node.name = 'x'` 不会让 React 可靠重绘。

| 回调 | 你必须做的事 |
| --- | --- |
| `onMove({ dragIds, parentId, index })` | 用 `adjustMoveIndex` 后再插入 |
| `onRename({ id, name })` | 按 id 改名，保持 id |
| `onDelete({ ids })` | 按 id 剪枝 |
| `onSelect` | 保存 id 列表，不保存下标 |

`searchTerm` 会留下匹配节点的祖先。默认匹配可能命中别的字段。Lab 只看名称，并用 `toLocaleLowerCase`。

虚拟化需要非零的 `height` 和 `width`。容器被折成 0 高度时一行都看不见。`rowHeight` 在本示例是常数 34。动态行高不是这个 Demo 的行为。

自定义 `renderRow` 没有使用。若以后换掉行，必须留下 `attrs`、`innerRef` 和 `role="treeitem"`。

## 三层示例

### 基本

展开分组，点选节点。状态行出现 `grp-tech` 或 `feed-react` 这种 id。拖到另一组，id 不变，只是父级变了。删除用库的默认操作时，节点从 state 消失。

### 业务

搜索「官方」。技术下的 React、Vite 应仍能通过祖先看见。搜索框在组合中：business 层 `onChange` 在 `composing` 为真时不更新 `searchTerm`。不要用默认 stringify，否则 id 里的字母也会命中。

同级向下拖一项。若不做 `adjustMoveIndex`，index 仍按删除前计算，结果会偏一格。本文件已经调用了官方修正。

### 进阶

1,800 个技术源只为虚拟窗口。滚动时 DOM 行数应远小于节点总数。中文搜索在组合结束时写入。恢复示例会丢掉 bulk 节点和当前选择。不要把 1,800 写成滚动帧率。

v4 的多树 `DndProvider`、触屏 backend 和 `dist/main` 深导入移除都没有在这个 level 里。升级前另开迁移，不要改当前 pin 的传递依赖来「提前对齐 4」。

## 反例

### 1. 用数组下标当 id

重排之后选中和展开落到别的源上。id 用稳定的 `feed-*` / `grp-*`。

### 2. initialData 加 onMove 却不改 data

界面松手弹回，或和内部快照不一致。受控模式每次 setState 新数组。

### 3. 把 index 当删除后的 splice 下标

```ts
siblings.splice(index, 0, node)
```

同级下移偏一。先 `adjustMoveIndex({ index, dragIds, siblingIds })`。

### 4. 只判断 dragId !== parentId

拖进后代仍会成环。Lab 在摘走之后再插入；插不进就保持原树。服务端还要再查一次环。

### 5. 父和子同时拖拽并各复制一份

会得到重复 id。按 id 整棵摘走，子树只存在于被摘下的节点里。

### 6. children: undefined 表示未加载

会被当成叶子。未加载文件夹用 `children: []` 加自己的 `loaded` 标志。本 Demo 的分组都有数组。

### 7. 默认搜索匹配整个对象

id 和别的键会误命中。`searchMatch` 只比较名称。

### 8. 编辑框每个 Enter 都提交

中文候选确认会截断。库的内建编辑不在我们自己的 input 里。自定义编辑要看 `isComposing`，Escape 取消。Lab 的搜索框已经把组合和 `searchTerm` 分开。

### 9. 多个 HTML5 backend

v4 把 `react-dnd@16` 做成 peer，多棵树要共享一个 manager。3.16.0 的这棵树没有第二个 Provider。不要为了笔记里的 v4 段落在本条目再装一套 backend。

### 10. 前端 disableDrag 当成拒绝越权

用户仍可直接改请求。后端校验 ACL 和 revision，冲突返回 409，而不是让旧树覆盖新树。

## 组合

**Query + Zod。** Query key 带 workspace 和 revision。树只接收已经校验过的节点。拖拽进行中不要用后台 invalidate 覆盖手中的草稿。乐观更新要能回滚。本 Demo 没有这两份库。

**nuqs。** URL 可以放选中 id 和搜索词。打开旧链接时先确认 id 还在，再选中。不要把私密文档 id 或 token 放进 query。

## 生产清单

- 受控 `data`，纯函数更新。
- id 全树唯一且稳定。
- `onMove` 使用 `adjustMoveIndex`。
- 搜索只匹配明确字段，组合期间不提交。
- 容器高度非零。
- 拖拽之外提供键盘可完成的移动，不能假设鼠标已经可访问。
- 文本用 React 子节点。RSS URL 不能在客户端校验通过后就由服务器去抓。
- 1,800 节点的全树拷贝是 O(n)。不要据此承诺百万节点。

## 升级

留在 3.16.0，直到有单独的升级说明：Node 引擎、ESM、`react-dnd` 与 `react-dnd-html5-backend` 的 peer、深导入是否还存在、多树是否必须共享 Provider。验收包括同级下移、拖进后代、多选父子、键盘和卸载。当前示例没有这些 v4 步骤。

## 练习

1. 同级向下拖一项，顺序只移动一格，id 不变。
2. 把分组拖进自己的子节点，树保持原样。
3. 搜索组合过程中，匹配结果不随每个拼音字母跳动（business 的 `composing` 分支）。
4. 重命名不改变 id。空名称成为「未命名」。

## 官方链接

- https://github.com/brimdata/react-arborist

升级到 4 之前再读该版本的安装说明和 peer。不要把 4.0.1 的要求写成 3.16.0 已经满足。

## 证据

本条目没有把拖拽或虚拟滚动写成已通过。sdk 要真实 import `react-arborist@3.16.0` 并在 `docs/library-lab/evidence/runs/` 留下收据。browser 看拖拽、键盘和 IME。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C11 的条目 PASS。不要改 `verification.json`。
