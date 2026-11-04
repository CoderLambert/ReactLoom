# B15 react-grid-layout：控制式网格与键盘替代

`react-grid-layout` 把仪表盘放在离散格子上：拖动、缩放、碰撞和压缩。它不拉取数据、不合并版本、不画图表，也不提供完整的键盘拖放规范。普通 CSS Grid 排版、自由画布和相邻分栏（B16）都不是它的工作。

Library Lab 固定 `react-grid-layout@2.3.0` 与 `react-resizable@4.0.2`，宿主 React 19.3.0。许可证 MIT。类型随包提供，不要再装 `@types/react-grid-layout`。样式：

```ts
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
```

原研究稿的基线是 2.2.4。**本条目以 2.3.0 为准。** v1 的 `WidthProvider`、`data-grid`、顶层 `isDraggable` 不要写进新代码。官方曾警告 2.2.0 有布局缺陷，不要退回那一版。2.3.0 仍是 v2 控制式接口：必须传入测得的 `width`。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。几何规则在 `examples/layout-policy.ts`。没有 `<Responsive>`、没有 `layouts.lg/md/...` 的服务端文档、没有 `If-Match`。

已挂载：

- `useContainerWidth()` 得到 `width`、`containerRef`、`mounted`。宽度未准备好时显示「正在测量」，不把 0 当成真实断点。
- 容器宽度 `< 640` 为 narrow（6 列），否则 wide（12 列）。**宽和窄各存一份布局**，`onLayoutChange` 只写当前断点。重置同时回到两份初始值。
- `GridLayout` 的 `key={breakpoint}`，避免列数变化时内部状态串档。`gridConfig={{cols, rowHeight: 78, margin: [10, 10]}}`。
- `basic`：`dragConfig.enabled` 与 `resizeConfig.enabled` 为 false，只展示投影后的格子。
- business / advanced：拖动手柄是 `.lab-grid-handle`，`bounded: true`。缩放只开 `se`。按钮带 `lab-grid-control`，不在手柄选择器里，因此点按钮不会开始拖。
- `verticalCompactor`。`onLayoutChange` 先与上一份几何比较，相同则不增加 `changes`。
- advanced：锁定「新闻总览」时该项 `static: true`，回调里再用上一帧坐标盖住库可能给出的位移。键盘函数同样拒绝 `frozen`。
- 宽屏键盘左右改 `x`，窄屏与相邻项交换 `y`。加减宽度受 `minW` / `maxW` 和剩余列数限制。
- 下方 `<pre>` 只序列化 `i,x,y,w,h,static`。没有 localStorage。

`projectCells` 把 `w` 夹进 min/max，并把 `x` 夹到 `cols - w`。`initialNarrowCells` 让窄布局每一块 `x: 0`、宽度等于列数、纵向堆叠，不从宽布局的 x 硬截。

未挂载：`Responsive` 的五个断点、拖动结束才 PUT、409 保留草稿、413/422、图表 `resize`、`fastVerticalCompactor`。`onLayoutChange` 在 Lab 里只改内存。生产上不要在这个回调里自动 POST，宽度变化也会触发它。

## 什么时候使用

适合几十个以内的可拖仪表盘、RSS 工作台、运营看板。不适合单列文章、上千卡片、需要旋转的无限画布、或只要左右分栏。键盘方面：库的指针拖动不是完整无障碍拖放；Lab 用按钮补左右/上下和宽度。这仍不是「拿起-移动-放下」的拖放公告模型。

## 模型

```text
容器像素宽度 → cols 与 breakpoint
  → projectCells 得到合法 x/w
  → GridLayout 绝对定位
  → onLayoutChange 写回该断点的内存副本
  → 键盘按钮调用 keyboardMove / keyboardResize
```

`i` 与子节点 `key` 相同，且不随标题变化。坐标是格子不是像素。`x + w` 不能超过列数。`static` 是交给库的锁；持久化时 Lab 的 pre 会带上它，但重置会清掉锁定勾选。

## 三层渐进

### Demo ① 只读（已挂载）

三块：新闻总览、订阅趋势、待审列表。拖动和缩放关闭。改变窗口或面板宽度时，列数跨越 640px 会换一份布局。changes 计数不应因为纯测量来回跳——若相同几何被写回，`sameGeometry` 会挡住。

### Demo ② 可编辑（已挂载）

拖标题栏，右下角缩放。按钮在宽屏上左右移动，在窄屏上与邻居交换纵向顺序。输出 JSON 是当前断点的投影，不是两份布局的合并。

### Demo ③ 锁定（已挂载）

勾选锁定后，总览块不能拖、不能改大小，键盘按钮禁用。其他块的移动若纯函数判定会跨过锁，也要停。Lab 的横向移动只改自己的 `x`，不自动交换邻居；窄屏路径会拒绝锁定邻居。

未挂载的保存协议：用户点保存才 PUT；`If-Match` 失败则 409，客户端留着草稿并显示服务器修订。无效坐标 422。拖动过程只标记 dirty。

## 反例

```tsx
// 错：v1
<WidthProvider><GridLayout isDraggable /></WidthProvider>
<div key="a" data-grid={{x: 0, y: 0, w: 2, h: 2}} />

// 对：v2 控制式，与示例一致
<GridLayout width={width} layout={layout} gridConfig={{cols, rowHeight: 78}}
  dragConfig={{enabled: true, handle: '.lab-grid-handle'}} />
```

```tsx
// 错：只保存当前 layout，窄屏把宽屏坐标覆盖掉
save(layout);

// 对：wide 与 narrow 分开。Lab 的 model 就是两份
```

```tsx
// 错：mounted 之前用 width 0 渲染网格
<GridLayout width={width} />

// 对：mounted && width > 0 才渲染
```

```tsx
// 错：key={index} 或把标题当 i
// 对：i: 'headline'，key={item.i}
```

```tsx
// 错：onLayoutChange 里每次 fetch
onLayoutChange={next => { void fetch('/api', {method: 'PUT', body: JSON.stringify(next)}); }}

// 对：内存更新；相等几何不 setState。保存按钮另做（本示例没有这个按钮）
```

```tsx
// 错：直接改库回调里的对象
next[0].x = 0;

// 对：映射出新对象。锁定项用上一份坐标写回
```

```tsx
// 错：输入框在拖动手柄里，拼音和选字被拖走
// 对：手柄只放标题；按钮使用另一个 class
```

`compactor` 不懂业务「这两块不能相邻」。需要这种规则时在写入前拒绝，而不是让压缩结果偷偷换位后再当用户意图。

## 组合

**网格 + Query**：布局文档和新闻数据分两个 key。拖动不失效新闻查询。保存布局用自己的 mutation。

**网格 + 图表**：图表在块内听自己的尺寸。不要在 `onLayoutChange` 里同步调用每个图表的 resize 到掉帧。拖完再量。

**网格 + antd**：筛选条放在网格外。Card 的点击不要包住手柄。

**不要**用本库做 B16 那种相邻百分比分栏，也不要用它做文件排序列表。

## 生产清单

- 子节点 key 与 `i` 一致。
- 宽度来自容器而不是 `window.innerWidth` 单独决定业务断点。Lab 用容器宽度切 6/12 列。
- 断点布局分开存。
- 拖动回调不打网络。
- 锁定同时体现在 `static` 和纯函数。
- 提供不依赖指针的移动和改宽。
- 缺少 CSS 时缩放手柄会不可见，所以必须引入两份样式。
- SSR：等客户端测量后再画出绝对定位，避免水合宽度不一致。
- 几十块以上再考虑 `/core` 或更快的 compactor，并用真实长任务验证，不写虚构 fps。

## 升级

从 v1 迁出时删除 `WidthProvider` 和 `data-grid`，改为 `width` + `layout` + `gridConfig` + `dragConfig` / `resizeConfig`。过渡期官方有 `react-grid-layout/legacy`，新代码不要依赖它。从 2.2.4 笔记迁到 2.3.0 时回归测量、整数宽度和 `onLayoutChange` 的触发次数。回调参数按只读使用。

## 验收

basic：三块可见，拖不动，JSON 与画面一致。business：拖标题后 changes 增加；点按钮不开始拖；窄宽两份互不覆盖（拉宽窗口仍能看到宽屏坐标）。advanced：锁定总览后指针和键盘都动不了它；重置清空锁定并回到初始几何。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成网格 PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B15 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B15-react-grid-layout/tests/layout-policy.test.mts
```

断言投影、窄布局堆叠、相同几何、锁定时键盘移动/改宽被拒绝。不证明指针拖动或压缩算法的像素结果。

## 官方资料

- https://github.com/react-grid-layout/react-grid-layout
- https://github.com/react-grid-layout/react-grid-layout/blob/master/README.md
- https://www.npmjs.com/package/react-grid-layout
- https://www.npmjs.com/package/react-resizable
