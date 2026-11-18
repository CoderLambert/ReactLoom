# react-arborist：让订阅目录的交互和业务数据各有归属

订阅管理页要展开分组、用键盘选中、改名和拖动源，难点不仅是把嵌套数组画成列表：选中、焦点、拖放位置和窗口化行还要保持一致。react-arborist 提供这些树控件机制，应用继续拥有订阅数据。需要完整目录交互时值得使用；只有一个可折叠列表时，普通 HTML 往往更轻。

本例使用实装 `react-arborist@3.16.0`（MIT），所有订阅是组件内的本地 fixture，没有真实 RSS 请求、后端或持久化。`Tree`、`NodeApi`、`TreeApi`、`adjustMoveIndex` 都来自实际 SDK；摘取/插入数组、空名称规则和移动按钮是应用代码。

## 从业务树到可见行

节点的 `id` 是全树唯一的业务身份，`name` 可以改，位置也可以改。`children: []` 表示分组，缺少 children 的节点是叶子；尚未加载的分组需要另外设计 loaded 状态，不能只省略 children。

`data` 是应用拥有的受控树，`onMove/onRename/onDelete` 只发出请求，必须回写新的数组。SDK 的展开、选择和焦点是另一份状态。本例没有传 `selection`，`onSelect` 只把实际选中 ID 镜像到页面，不能靠 `setSelected([])` 清 SDK 选择；恢复和删除要调用公开的 `tree.current?.deselectAll()`。

```tsx
const tree = useRef<TreeApi<Item> | undefined>(undefined)
const [nodes, setNodes] = useState(() => initialTree(false))

<Tree<Item>
  ref={tree}
  data={nodes}
  width="100%"
  height={340}
  rowHeight={34}
  onMove={({ dragIds, parentId, index }) => {
    setNodes((previous) => moveTree(previous, dragIds, parentId, index))
  }}
>
  {TreeNode}
</Tree>
```

这是关键接入片段；完整回调、观察和 CSS 见[运行源码](examples/example.tsx)。固定 340px 窗口、34px 行高、overscan 3 是本例配置，库的类型也允许行高 accessor，本例没有实现变高行。`TreeApi.visibleNodes` 是展开/搜索后整份模型；它的长度和当前挂载的 `role=treeitem` DOM 数量不同。

## 三个可操作目标

| 目标 | 操作 | 应观察的变化 | 关键源码 |
| --- | --- | --- | --- |
| basic：树的导航与选择 | 点 React 源，用方向键换焦点、Space 选中，折叠技术分组，再恢复 | 默认 SDK Row 的 ARIA/焦点改变；模型从 7 到 5 再到 7；恢复后实际 aria-selected 和镜像都清空 | [TreeNode](examples/tree-node.tsx)、[示例](examples/example.tsx) |
| business：业务更新 | 将 React 源拖入商业；恢复后用“同组下移一位”或“移到商业分组”；改名、Escape 取消、删除 | 父级/顺序改变，ID 和总数在移动时不变；last-move 明确 sdk 或 button；改名保留 ID，删除同时清 SDK 选择 | [moveTree](examples/move-tree.ts)、[共享模型](examples/tree-model.ts)、[输入法守卫](examples/ime-guard.ts) |
| advanced：模型与虚拟 DOM | 原生滚动或“定位最后技术源”；搜索“官方”和“bulk-1799”；恢复并缩窄窗口 | 初始总数 1807，但 DOM 只挂一小段；官方匹配两源并保留祖先，ID 字符串不命中名称；恢复仍为 1807 | [示例](examples/example.tsx)、[局部样式](examples/styles.css) |

这些目标已由主控在固定candidate18真实浏览器通过，原文与保守unknown展示另1项通过；Node模型/策略和客户端结果仍分别记录。真实系统输入法与全局泄漏普查没有验收，合成composition只证明本例事件守卫。

## 移动的输入与输出

`onMove({ dragIds, parentId, index })` 中的 index 是**删除前目标兄弟列表里的槽位**。技术组原来 `[React, Vite]`，把 React 放到 Vite 后面时输入 index=2。先删除 React，最终插入下标必须变成 1；页面共用的 `moveTree` 调用官方 `adjustMoveIndex` 来完成这一步。

随后应用按 ID 摘下整棵子树，再原子插回目标父级。如果同时选中父子，只摘一次父子树；目标父级随被拖子树一起摘走时，插入失败返回原树。SDK 正常拖放还会拒绝把父拖进后代。这是本地更新策略，不是服务端 ACL、任意恶意输入的验证器或并发控制。

拖放通过真实 react-dnd HTML5 backend 触发，记录 `source: sdk`。两个移动按钮给键盘用户一条应用路径，调用同一业务函数并记录 `source: button`，不冒充 SDK 键盘拖拽。SDK 筛选状态的 `canDrop()` 拒绝拖放；应用也在非空搜索时禁用移动，避免把筛选后的槽位套进完整树。

## 名称搜索和中文编辑

搜索框把草稿与已提交的 searchTerm 分开。组合期间只更新草稿，compositionend 提交最终名称；非组合输入即时提交。`searchMatch` 只检查 `node.data.name`，所以“bulk-1799”不能因为 ID 相同而命中。匹配子节点时 SDK 会保留祖先并展开相关分组，filteredMatches 只数真正命中的节点。

3.16.0 默认编辑框收到 Enter 就调用 submit。本例只定制 Node 内容中的编辑器：保留 `style` 和 `dragHandle`，默认 Row 继续拥有 `attrs/innerRef/treeitem`。编辑器在组合标志、原生 isComposing 或 keyCode 229 时不提交，也不 preventDefault 候选确认；真正用于确认的 Enter 保持到其 keyup。compositionend 本身不会无条件吞下后续普通 Enter，因此 Space/鼠标确认后仍能正常提交。Escape 调 `node.reset()`，普通 Enter 调 `node.submit(value)`，回焦由 SDK 处理。

重命名是本地策略：trim 后空名称变成“未命名”，ID 不变。编辑器自己的输入状态不会写入订阅对象，提交后才更新 data。合成 composition 测试只验证应用事件协议，真实系统输入法、触屏和读屏需要单独验收。

## 迁移与成本

复制每个场景 sourceFiles 中的全部 **7 个文件**：example.tsx、demo.tsx、tree-model.ts、move-tree.ts、tree-node.tsx、ime-guard.ts、styles.css。实际入口是 demo.tsx；业务中可直接导入 Workshop。安装精确版本 `pnpm add react-arborist@3.16.0`，保留 CSS 导入；`.ts` 扩展导入需要与本例相同的 TypeScript `allowImportingTsExtensions`/noEmit 配置或按目标构建方式改写。

实装声明 React/ReactDOM peer >=16.14；实际传递依赖是 react-dnd14.0.5、HTML5 backend14.1.0、react-window1.8.11（其实际 peer 包含 React19）。不要把当前仓库 main 的 4.x 安装说明套进这个 pin。这里是一个客户端树，不额外创建第二个 DndProvider、不依赖 Lab alias、远程资产或其他条目。

窗口化减少 DOM，整棵树和搜索索引仍在内存里；1807 是确定性数据规模，不是帧率或吞吐测量。更新算法会遍历/拷贝祖先路径；更大数据要评估按需加载和服务端校验。本例没有持久化/revision/乐观回滚，接真实服务时必须另加并发与权限规则。

应用没有网络、timer、全局监听或存储租约；节点编辑器只在挂载后 focus/select。离开 Demo 卸载整棵 Tree，SDK 自己管理虚拟列表/DnD 订阅。内部临时键盘任务由 SDK 所有，源码审查不等于内存泄漏普查，卸载和再挂载仍列真实浏览器提案。

## 官方资料

目标包目录没有 README，匹配提交的递归文件列表没有中文候选，故保存[官方根 README 原文](https://github.com/jameskerr/react-arborist/blob/d74c4ec696ba98c1a4e981075f6d60cdff3e290b/README.md)，没有自行翻译。来源 jameskerr/react-arborist，npm3.16.0 的 gitHead `d74c4ec696ba98c1a4e981075f6d60cdff3e290b`，路径 README.md，en，24954B，同步 UTC2026-11-10T16:53:37.522420+00:00，SHA256 `0c3ba42abd227ddce29578749b9765b5513797d446cb2d3d2b96281a429fa80a`。固定manifest与版本一致；候选和5次真实GET证据保留在条目维护记录。历史headers仅字典捕获，不保同名重复头列表，不能称完整原始头，未事后补造。

[官方演示首页](https://react-arborist.netlify.app)由同提交 README 指向；历史GET200的headers字典未捕获X-Frame-Options或CSP。没有从 Lab origin 验证 iframe 可用，所以官网状态 **unknown**，保留直达/重试，不标 allowed。原文快照和本地教学独立；官网可否嵌入也不代表 SDK 示例是否运行成功。
