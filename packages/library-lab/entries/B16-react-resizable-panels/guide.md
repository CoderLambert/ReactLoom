# B16 react-resizable-panels：v4 分组与百分比字符串

`react-resizable-panels` 让用户拖动相邻窗格的边界，并求解最小/最大尺寸。它不做数据请求、虚拟列表、二维卡片拖放、停靠窗口或鉴权。固定的两列 CSS、自由画布和 B15 的网格都不是同一件事。

Library Lab 固定 `react-resizable-panels@4.14.1`，宿主 React 19.3.0。许可证 MIT。**API 是 v4：`Group`、`Panel`、`Separator`。** 不要复制 v1–v3 的 `PanelGroup`、`PanelResizeHandle`、`direction` 或 `autoSaveId`。

原研究稿讨论的是 4.14.8 的 pointermove 修复。**本锁是 4.14.1。** 指南不把 4.14.8 的修复说成当前包已经包含，也不把未升级的包写成有那次修复。升级必须改 `library.json` 和锁文件后再谈那条 changelog。

v4 里数字尺寸是像素。百分比必须是字符串，例如 `"25%"`。旧博客里的 `defaultSize={30}` 会变成 30px 侧栏。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。没有 `usePanelRef`、没有折叠、没有 `useDefaultLayout`、没有服务器 PUT。

已挂载：

- `useId()` 生成 Group、Panel、Separator 的 id，避免页面上另一份示例串布局。
- basic：两块，默认 `"35%"` 与 `"65%"`。资源栏 `minSize="16%"` `maxSize="60%"`，主区 `minSize="22%"`。
- business / advanced：第三块检查器 `"30%"`，`minSize="15%"` `maxSize="55%"`，两根分割条。
- `Separator` 有 `aria-label`。水平时宽 12、`col-resize`；垂直时高 12、`row-resize`。`touch-action: none` 在分割条上。
- advanced：复选框把 `orientation` 改成 `vertical`。复位增加 `generation` 并清空 status。`key` 含 level、方向和 generation，使 Group 按默认尺寸重新挂载。
- `onLayoutChanged` 把库给出的布局 `JSON.stringify` 到 `role="status"`。这是提交后的结构展示，不是网络保存。拖动过程中的高频 `onLayoutChange`（少一个 d）没有绑定，避免在文档里鼓励每个中间像素都 setState 以外的副作用。示例只在结束提交时写字符串。

外层高度 300，`minWidth: 0`，`overflow: hidden`。窗格内容 `overflow: auto`。没有高度时分割条无法拖。

未挂载：`collapse` / `expand` / `resize('30%')`、`useGroupRef` 的 `setLayout`、嵌套 Group、`resizePreviewMode="separator"`、`If-Match` 保存、`meta.isUserInteraction` 分支。这些是生产教学。

## 什么时候使用

适合 IDE 式的两到四块相邻区域：文件树和编辑器、列表和预览。不适合：用户并不调整大小（CSS Grid 即可）、浮动停靠、二维仪表盘（B15）、单个 textarea 的原生 `resize`。

## 模型

```text
Group orientation
  Panel defaultSize/min/max（百分比字符串或明确像素）
  Separator（指针与键盘）
  Panel
onLayoutChanged(layout) → 本地状态文案
```

约束求解在库内。面板 id 是身份，不要用数组下标当长期主键。嵌套时内外 Group 的 id 必须不同，轴也可以不同。Lab 只有一个 Group。

拖动中的回调会很密。持久化应放在结束提交，并且先标脏，再由按钮 PUT。409 时重新 GET，不要用本地拖动结果覆盖服务器。abort 不等于服务器没写上。Lab 不发请求，status 只证明回调收到了布局对象。

`resizePreviewMode="panel"` 会在拖动中实时改内容布局；`"separator"` 先移动预览条，松手再生效。重内容（编辑器、图表）更适合后者。示例用默认行为，没有切换这个模式。

## 三层渐进

### Demo ① 双栏（已挂载）

拖中间分割条。资源栏不能小于 16% 或大于 60%。Tab 到分割条后用方向键调整——这是 Separator 的键盘语义，需要浏览器确认。纯函数测试不存在，因为本目录没有单独的 policy 文件。

### Demo ② 三栏（已挂载）

项目资源、代码工作区、属性检查器。两根分割条的 aria-label 不同。主区只有 `minSize`，没有 max，避免三栏互相把 max 设死到无解。若约束无解，库会按实现分配；不要在未测量的情况下写死像素和百分比的矛盾组合。

### Demo ③ 方向与复位（已挂载）

纵向排列后分割条变成行方向，方向键的轴跟着变。复位通过改 `key` 丢弃内部尺寸，而不是调用未挂载的 `setLayout`。status 清空，直到下一次提交。

未挂载：`collapsible` 与 `collapsedSize="0%"`、命令式 `usePanelRef()`。ref 应在组件生命周期内稳定，不要每次渲染新建一套命令对象。若从服务器恢复布局，要校验 id 集合和单位，再 `setLayout`。未知 id 不能直接灌进去。

## 反例

```tsx
// 错：v3 名字和 direction
<PanelGroup direction="horizontal">
  <PanelResizeHandle />
</PanelGroup>

// 对
<Group orientation="horizontal">
  <Panel defaultSize="25%" minSize="16%" />
  <Separator />
  <Panel defaultSize="75%" minSize="22%" />
</Group>
```

```tsx
// 错：30 被当成 30px
<Panel defaultSize={30} minSize={16} />

// 对：Lab 的字符串
<Panel defaultSize="25%" minSize="16%" maxSize="60%" />
```

```tsx
// 错：装饰 div 当分割条，没有键盘和名字
<div className="gutter" onMouseDown={drag} />

// 对：Separator 带 aria-label
```

```tsx
// 错：onLayoutChange 里 PUT
onLayoutChange={layout => save(layout)}

// 对：结束时 onLayoutChanged；网络保存还要防抖或显式按钮。Lab 只 setSizes
```

```tsx
// 错：两个演示共用固定 id "main"
<Group id="main">

// 对：useId 前缀，示例之间隔离
```

```tsx
// 错：面板里的编辑器 min-width 为 auto，把 Group 撑出屏幕
// 对：容器 minWidth: 0，内容 overflow auto
```

```tsx
// 错：把文章正文和布局 JSON 存在同一个对象里当权威
// 对：布局是尺寸映射；正文属于数据层
```

v4.14.8 修过「pointermove 时目标已卸载」和「ResizeObserver 之前用了旧像素」。1 这个补丁不在 4.14.1 的说明里就不要写成已修复。动态卸载面板仍是浏览器回归项。

## 组合

**面板 + Query**：文章列表用 Query。拖动不 refetch。保存布局用另一条 mutation，带预期修订号。

**面板 + 编辑器**：预览模式考虑 `separator`，避免拖动时编辑器连续布局。Lab 的主区只有一段 `<pre>`。

**面板 + 网格**：外层用面板分出「库和画布」，画布里再用 B15。不要用网格模拟分割条的键盘语义，也不要用分割条模拟二维拖卡片。

**持久化**：`useDefaultLayout` 与服务器布局只能有一个主人。两套同时写会来回覆盖。示例两者都没用，刷新即丢失尺寸，这是故意的。

## 生产清单

- 百分比写字符串，像素才用数字。
- 每个 Separator 有名字。
- id 稳定且实例唯一。
- 容器有高度，子级能收缩。
- 高频回调不打网络。
- 方向切换时明确重置或转换已有尺寸。Lab 用 key 重挂默认值，不尝试把横向百分比解释成纵向。
- 触控 `touch-action: none` 只在分割条。
- 折叠到 0 时要保证有键盘办法展开。示例没有折叠，不要在文档里声称有。
- SSR：布局像素依赖容器，服务端不要输出一套和客户端测量矛盾的内联宽度。

## 升级

从 v3 重命名组件和 `direction` → `orientation`，检查每一个数字尺寸。从 4.14.1 到更新的 4.14.x 时阅读对应 release，再改锁。不要只改指南版本号。`resetServerContext` 一类其他库的 SSR API 与这个包无关。

## 命令式 API（未挂载）

生产里折叠和恢复常用稳定的 panel ref，而不是每次渲染新建回调：

```tsx
import {Group, Panel, Separator, usePanelRef} from 'react-resizable-panels';

function Collapsible() {
  const left = usePanelRef();
  return <Group orientation="horizontal">
    <Panel panelRef={left} collapsible collapsedSize="0%" defaultSize="30%" minSize="160px" />
    <Separator />
    <Panel defaultSize="70%" minSize="200px" />
    <button type="button" onClick={() => left.current?.resize('30%')}>恢复 30%</button>
  </Group>;
}
```

`30%` 必须是字符串。`resize(30)` 会按像素理解。Lab 没有 `usePanelRef`，复位靠改变 `key` 让默认百分比重新生效。折叠到 0 之后必须仍有键盘办法展开，不能只留一条 1px 的热区。

`useDefaultLayout` 和服务器 `setLayout` 只能有一个写主人。两边都在 `onLayoutChanged` 里保存，会来回覆盖。远程快照要先核对 panel id 集合，再灌进去。未知 id 会让约束求解偏离用户看见的窗格。

拖动重内容时把 `resizePreviewMode` 设为 `"separator"`：先移动预览条，松手再改面板。默认的面板实时预览会让编辑器或图表连续回流。Lab 的主区只有一段短文本，所以留着默认模式。

`onLayoutChange`（拖动中）和 `onLayoutChanged`（提交）差一个字母。网络 PUT 放在后者，并且只在 `meta.isUserInteraction` 时标记脏。宽度被父级改掉时也会提交，那不是用户拖动，不应立刻打服务器。Lab 只把提交结果显示在 status 里。

4.14.1 没有把 4.14.8 的「事件目标已卸载仍收到 pointermove」写进本锁。动态卸掉面板、同时拖动分割条，仍是浏览器回归，不是纯函数能代替的。嵌套 Group 要使用不同 id，外层水平、内层垂直时两套约束互不换算。Lab 只有一个 Group。

## 验收

basic：拖动改变 status 里的布局 JSON；资源栏停在最小/最大附近不再无限缩小。business：三栏都有内容，两根分割条都能聚焦。advanced：切换纵向后轴改变；复位后 status 清空且比例回到默认，直到再次拖动。键盘在分割条上可用，按钮和复选框不充当分割条。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成面板库 PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B16 的 PASS。本目录没有独立 policy 测试；不要把 status 字符串当成已记录的 SDK 证据。

## 官方资料

- https://github.com/bvaughn/react-resizable-panels
- https://github.com/bvaughn/react-resizable-panels/blob/main/LICENSE
- https://www.npmjs.com/package/react-resizable-panels
