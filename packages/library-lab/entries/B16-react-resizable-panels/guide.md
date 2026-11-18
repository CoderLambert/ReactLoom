# react-resizable-panels：可操作的双栏和三栏工作台

这个库把相邻窗格变成可调整的布局：用户拖动分割条或使用键盘，SDK 在最小/最大尺寸约束内重新分配空间。适合文件树、编辑器、检查器这样的线性工作区。固定列宽用 CSS；自由二维仪表盘考虑 B15，内容排序考虑 B13。本库不负责文章数据、窗口停靠或服务端保存。

本条目固定 **react-resizable-panels 4.14.1**，MIT，实际安装 React 19.3.0。该版本 React/React DOM peer 为 `^18.0.0 || ^19.0.0`。组件使用 v4 的 `Group`、`Panel`、`Separator` 和 `orientation`；不能把旧版 `PanelGroup`、`PanelResizeHandle`、`direction`、`autoSaveId` 原样迁入。

## 从输入到结果

`Group` 定义一个水平或垂直轴，`Panel` 提供默认值和约束，真实 `Separator` 提供指针、焦点、键盘和 ARIA。应用只持有 SDK 提交的布局快照及方向/复位状态，没有自行实现拖拽求解器。

```text
指针或分割条键盘输入
  → SDK 查找相邻面板、求解约束、更新实际尺寸
  → onLayoutChanged(layout, meta)
  → 应用复制 layout，显示同源尺寸表与原始映射
```

百分比按**扣除分割条后的可用轴空间**计算。横向量宽度，纵向量高度；不能把面板宽度除以包括分割条的容器宽度当作精确百分比。

两个容易混淆的数值契约：

- `Panel` 的 `defaultSize/minSize/maxSize` 数字是**像素**，`"25%"` 才是明确百分比。字符串无单位也按百分比解释，本例一律写 `%`，减少误读。
- `Layout` 是 `{ [panelId]: number }`，这些数字反而是 **0–100 的百分比**。`Group.defaultLayout`、`getLayout/setLayout` 与回调都使用此映射；不要把映射数字改为百分比字符串，也不要再把它当像素。

初次挂载、容器重新求解、程序操作同样可能触发 `onLayoutChanged`。`meta.isUserInteraction` 对指针/键盘输入为 true，初始化/命令式等其他来源为 false。页面显示“初始化或程序变更”或“用户输入（指针或键盘）”，不把初始化冒称用户已拖动。`meta.requestedLayout` 表示约束前的请求值，持久化时应按业务选择保存它还是当前有效布局；本例只显示有效布局，没有实现持久化。

## 目标一：双栏拖动、键盘和边界

选择“双栏：拖动与键盘约束”并运行。资源栏默认 35%，详情默认 65%；资源栏范围 16%–60%，主区至少 22%。

1. 展开“查看 SDK 原始布局映射”，确认初始映射含两个实例唯一 id，尺寸表约为 35/65，来源是初始化。
2. 拖动绿色分割条并松手。实际窗格和尺寸表一起变化，来源变成用户输入。`onLayoutChanged` 对指针等待释放；本例没有订阅拖动中的高频 `onLayoutChange`。
3. Tab 聚焦名为“调整项目资源和主编辑区域”的分割条，按左右键，每次请求约 5 个百分点；到约束时 SDK 会截断，不能永远加减 5。Home 到资源栏最小 16%，End 到最大 60%。

水平 Group 中分割条本身是竖线，SDK 的 `aria-orientation="vertical"` 正确；它不等于 Group 的 `orientation`。焦点轮廓是本例 CSS，键盘行为由 SDK 实现。无需自己给 div 写 `onMouseDown` 或 `onKeyDown`。

## 目标二：三栏身份与两个独立边界

选择“三栏：独立边界与稳定身份”。默认资源/主区/检查器为 25/45/30；检查器范围 15%–55%。两根分割条名称不同，各自调整邻接边界，必要时 SDK 会协调其他面板，以满足整组约束。

1. 聚焦第一根分割条按右键，观察资源栏增长，检查器仍保持约 30%，主区吸收变化。
2. 按 F6 聚焦第二根，再按右键，观察主区增长、检查器减少；Shift+F6 回到第一根。F6 是 4.14.1 的实际 SDK 行为，不是页面的全局快捷键。
3. 展开映射，将每个键与对应面板 DOM id 对照。拖动只改百分比，不改身份或 DOM 顺序。主区至少 22%，资源至少 16%，检查器至少 15%，总和约 100%。

面板 id 来自稳定 `useId` 前缀和业务后缀。真实业务可以使用稳定数据 id，不能在同组重复；SDK 的测试 id 也来自该 id，不要假设传入另一个 data-testid 会覆盖它。

## 目标三：纵向切换与默认布局复位

选择“方向切换与默认布局复位”。勾选“纵向排列”，Group 的轴改为高度，分割条变横线，`aria-orientation="horizontal"`，使用上下键。固定 320px 高的外框确保纵向有可分配空间；各窗格内容自行滚动。

1. 横向调整后勾选“纵向排列”。应用主动重新挂载 Group，以 25/45/30 默认比例开始，不把旧横向像素带入纵向。
2. 聚焦第一根分割条，按下键增加资源栏、上键减少；左右键不应调整纵向布局。
3. 点击“复位布局”。`generation` 改变 key，旧 Group 卸载，新 Group 重新报告默认布局，来源回到初始化/程序变更。**不是一直清空到下一次拖动**，挂载回调会立即填入真实尺寸。
4. 停止并卸载，面板和分割条离开 DOM；重新运行从默认状态开始。本例不写 localStorage/sessionStorage，不承诺刷新后恢复。

## 可迁移的文件和所有权

复制 `examples/example.tsx` 与必要的 `examples/panels.css` 到业务目录；`demo.tsx` 只是 Lab 出口，普通 React 页面直接渲染 `ResizableExample level="business"`。安装同一版本：

```sh
pnpm add react-resizable-panels@4.14.1
```

本例不使用 Lab alias、私有运行器、网络 fixture 或外部资产。CSS 以 `.b16-workshop` 限定；`className` 在 Panel 内层内容容器，不能靠它覆盖外层 SDK 的 flex 计算。Group/Panel/Separator 的结构和 flex 样式由 SDK 管理；应用设置外框高度、内容 padding/overflow 和可见分割条样式。`touch-action` 由 SDK 按轴设置，避免自己全局禁止页面触控。

复位/方向切换用 key **明确丢弃内部状态**，这是应用的产品选择，不是持久化 API。需要保留用户布局时可改用 `useGroupRef` 的 getLayout/setLayout 或官方 `useDefaultLayout`，但它们没有在本例接入。恢复前应校验精确 panel id 集合与有限百分比；网络写入还需要处理请求取消、修订冲突和服务端权限，不能用本地 status 代替保存成功。

应用没有自建 timer、全局监听、ResizeObserver 或存储。4.14.1 SDK 为挂载的轴注册观察器、键盘和文档指针监听；每个 Group 清理自己的轴/订阅，最后一个同 document 的 Group 卸载才移除共享文档监听。不要全局删监听、清 SDK 状态或销毁其他工作区。源码核对不等于已经完成动态卸载的浏览器验收。

SSR 可以输出结构，但容器测量和效果只在客户端发生，百分比初次 hydration 可能调整。Node SSR 通过仅证明组件/属性/静态结构匹配，不能证明拖动、焦点或约束计算。

## 常见错误

- 从 v3 示例复制旧组件名，或把 `defaultSize={35}` 当作 35%。
- 用装饰 div 替代 Separator，丢掉键盘、ARIA 与真实 SDK 事件链。
- 在 `onLayoutChange` 每次移动时写服务器，或把 `onLayoutChanged` 的每次调用都当用户修改。
- 将 `Layout` 数字和 Panel 尺寸 prop 混用；所有状态都写进“布局 JSON”导致正文和尺寸互相覆盖。
- 为了测试清空 SDK 全局状态，影响其他 Group；或把初始化表格出现当作真实拖拽 PASS。

## 官方原文与验证边界

[官方 README 原文](official/readme.md) 固定仓库 `bvaughn/react-resizable-panels`、tag `4.14.1` 对应 commit `0cd376c57a19900d22f33aa8eb46f417a7437c12`，根 README 为英文。完整未截断 tree 检查只有根和三个集成 README，无官方中文候选；没有把本地讲解塞回原文。

原文 27652 字节，SHA-256 `d27812bc8cf8a5e07f0a58bcf68a8f48cc3cac4d22f917777e62662ab61c231c`；npm gitHead、tag 和包 manifest 4.14.1 互相匹配。同步时间、完整响应头见 [source-evidence.json](official/source-evidence.json)。官网 GET200，未见 XFO/CSP，但未从 Lab origin 真实确认 iframe 内容，因此保留 **unknown**，直达官网仍可用。

本轮 Node SDK 静态 SSR、条目严格类型、metadata 检查和提案检查的真实命令/退出码见 [local-validation.md](local-validation.md)。三项目标的完整 Playwright 提案在 [browser-proposal.txt](validation/browser-proposal.txt)，实际指针、键盘、几何约束、窄屏和卸载由主控统一执行。正式 verification 的 sdk/build/browser 仍为 NOT_RUN；本地静态检查不构成运行收据。
