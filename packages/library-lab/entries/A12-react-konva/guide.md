# A12 react-konva 19.3.2：声明式 Stage 与逻辑坐标

react-konva 把 Konva 节点放进 React 树。业务坐标在 React state，Konva 负责命中和拖拽中的临时位置，DOM 负责键盘、表格和输入法。不要再对同一个容器 `new Konva.Stage`。不需要 React 时用 A11。完整白板看 A09 或 A10 的许可证。流程连线看 A06。3D 看 A13/A14。

Library Lab 钉 `react-konva@19.3.2` 和 `konva@10.9.0`，都是 MIT。19.3 线对齐 React 19.3。不要把 `^19.2.7` 放进 React 19.2 项目里让 semver 升到需要 19.3 的版本；该用精确版本。[兼容说明](https://github.com/konvajs/react-konva/blob/master/docs/react-compatibility.md)。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。坐标政策在 `examples/stage-policy.ts`。

已挂载：

- 世界坐标 620×260。`ResizeObserver` 把容器宽度收成 1..4096，`stageScale` 是 `min(1, width / 620)`。Stage 的像素高度是 `ceil(260 * scale)`，`scaleX/scaleY` 使用这个比例。节点的 x/y 始终是世界坐标，改窗口不改数据。
- 三张初始节点：采集 RSS、翻译、审核发布。换 level 会恢复这三张并取消锁定。
- 底层 Layer `listening={false}`，画背景和虚线。虚线按数组顺序连接前一个节点的右缘和后一个节点的左缘，**不是**用户编辑的端口边。交互层是 `Group`：`Rect` + `Text`。`Text` 设了 `listening={false}`，避免挡住拖拽。
- basic 不可拖。business / advanced 默认可拖，advanced 可以用复选框锁定。`onDragMove` 和 `onDragEnd` 都把位置夹进世界矩形：x 最大 `620 - 132`，y 最大 `260 - 52`，并四舍五入。
- 选中描边变深。下拉、表格按钮和「右移 12px」写同一个 id。新增上限 `MAX_NODES = 24`，位置用 `newNodePosition` 按行列夹取。删除后选中落到剩余的第一张。
- 观察者在 cleanup 里断开并取消 rAF。Stage 由 React 卸载，不要在每次 state 变化时手动 `destroy` 再指望声明式树继续工作。

没有挂上：Transformer、`toDataURL`、中文 `<input>`、localStorage、HTTP revision、视口裁剪几千个矩形、`react-konva-utils` 的 Portal。`_useStrictMode` 也没开。它是 props 与临时 attrs 的对齐开关，不是 React `StrictMode`。拖拽过程中若强制用旧 state 回写位置，节点会弹回。[拖拽](https://konvajs.org/docs/react/Drag_And_Drop.html)。

错误边界：Canvas 子树的异常要放在 `<Stage>` **内部** 才能被接住。DOM 上的 error boundary 不管 Konva 子节点。

## 三个所有者

1. React state：稳定 id、标题、世界坐标、颜色、选中、锁定。
2. react-konva：声明式节点。拖动时 Konva 先改实例，`onDragEnd` 再写回。
3. HTML：表格、下拉、按钮、`role="status"`。`<Text>` 是位图字形，不是输入框，也不在 Tab 顺序里。

## 坐标

容器变窄时整张世界被缩小，点击视觉上的点要经过 stage 变换才能回到世界坐标。`getPointerPosition()` 是舞台像素。逻辑点要用绝对变换的逆矩阵。Lab 没有自定义落点工具，拖拽夹取发生在 Konva 已经给出的位置上，再由 `clampNodePosition` 限制在卡片不越出 620×260。

练习里的比例：世界 960×540 缩到一半时，视觉 (120, 60) 对应逻辑 (240, 120)。当前世界是 620×260，不要把那组数字抄进这个文件。

## 三层

### 01 声明式节点

三张卡片和两条虚线。点击或表格选中。没有拖拽。宽度为 0 的瞬间 scale 计算仍走 `measuredStageWidth`，它把无效宽度收成 1，避免 0 尺寸舞台。

### 02 编排

可以拖。拖动中 `onDragMove` 就夹位置，防止拉出世界。松手再 `update`。虚线跟着节点坐标重算，因为它读的是 React state，不是一条独立的边模型。

### 03 增删和锁定

锁定去掉 `draggable`。新增在 24 张时按钮禁用，`canAddNode` 再挡一次。删除不留下悬空「边」，因为线只是相邻节点的装饰。没有缩放手柄。若加上 Transformer，必须把 scale 乘进宽高再归 1，否则 JSON 里的宽和看起来不一致。Lab 的节点宽高是写死的 132×52，没有这份变换。

## API

| API | Lab | 陷阱 |
|---|---|---|
| `<Stage width height scale>` | 按容器缩放世界 | 只改 CSS width 会拉像素 |
| `<Layer listening={false}>` | 背景和虚线 | 太多 Layer 会多几块 canvas |
| `<Group draggable>` | 非 basic 且未锁定 | drag 结束要写 state |
| `<Text>` | 标题 | 不是 input，也没有 IME |
| `Transformer` | 无 | scale 不是业务宽 |
| `toDataURL` | 无 | 跨域图片会 taint；像素成本按面积涨 |
| `ReactKonvaCore` | 未用 | 按需入口要自己注册形状。示例用全量入口 |

Portal 不能把 Konva 节点搬到另一个 Layer，官方另有 `react-konva-utils`。本条目不引入。[Canvas Portal](https://konvajs.org/docs/react/Canvas_Portal.html)。

## 反例

```tsx
// 错：声明式 Stage 之外再造一个命令式舞台
useEffect(() => { new Konva.Stage({ container: host.current!, width, height }); }, [width]);

// 错：拖完不写回，重渲染回到旧坐标
<Group draggable onDragEnd={() => undefined} />

// 对：夹取后写入不可变节点
onDragEnd={(event) => {
  const next = clampNodePosition(event.target.position());
  event.target.position(next);
  update(id, next);
}}
```

| 错误 | 正确 |
|---|---|
| 每个 render `new Konva.Stage` | 只留 `<Stage>` |
| 把 `scaleX` 存成宽度 | 乘回宽高再把 scale 设为 1。Lab 尚未做 Transformer |
| Stage 只有 `style={{width:'100%'}}` | ResizeObserver + width/height/scale。Lab 已做 |
| 指针点直接当 x/y | 逆变换 |
| 静态点各占一个监听 Layer | `listening={false}`，必要时裁剪 |
| 一万个节点就宣称比 DOM 快 | 视口裁剪后实测。Lab 最多 24 |
| `cache()` 从不清理 | 只给昂贵图形；变化时清缓存 |
| 用户 URL 当图片再导出 | CORS，否则 SecurityError |
| 把 `<Text>` 当可访问名称 | 表格和按钮。Lab 有表 |
| 保存 `stage.toJSON()` | 白名单 schema |
| 拖拽中途用旧 props 覆盖 Konva | 结束再提交；谨慎使用 `_useStrictMode` |
| Stage 外的 error boundary 以为能接住画布 | 边界放进 Stage |

## 生命周期

移除 `<Stage>` 时由 react-konva 拆 canvas。`useStageWidth` 在 cleanup 断开观察者，适配 StrictMode 的双调用。Blob URL 若以后导出，下载后要释放。Konva 是 Canvas 2D，浏览器可能用 GPU 合成，但这不是 Three 的几何体 dispose 模型。像素占用大约是宽×高×DPR²×4 再乘层数，这是估算，不是测量。

## 安全与输入

标题若来自网络，React 文本会转义；不要改成 HTML。图片跨域会使 `toDataURL` 失败，`crossOrigin="anonymous"` 不能代替服务端 CORS 头。中文重命名放在 DOM input，Enter 时看 `nativeEvent.isComposing`。拖拽后的 click 可能误触，有副作用的按钮要去重。Lab 没有这些输入框和图片。

## 组合

**react-konva + Zustand。** Store 存 `nodesById` 和选中 id，动作是 `moveNode`。不要把 Konva 实例放进 persist。

**react-konva + TanStack Query。** Query 持有服务端快照和 revision，界面持有脏草稿。409 进入合并，不要和 localStorage 各说各话。

**react-konva + React Hook Form。** 选中 id 后在 DOM 表单里改标题，Zod 查长度和坐标。截图仍从 Stage 来，不从表单反推像素。

## 生产清单

1. 一个 Stage 所有者。
2. 世界坐标和像素缩放分开。
3. 拖拽结束写回，并夹在卡片不越界。
4. 背景层关闭命中。
5. id 稳定，新增有上限。
6. 文本和键盘在 DOM。
7. ResizeObserver 必断开。
8. 装饰性折线不假装成边模型。
9. 导出另行加像素预算和 CORS 处理。
10. React 19.3 与 react-konva 19.3.2 一起升，不靠浮动范围。

## 升级与练习

对照 A11：把 Map 同步改成声明式 Group 之后，StrictMode 和事件还在不在。加上 Transformer 时写测试：宽 170 拉到 1.5 倍得到 255，scale 回到 1，越界被夹住。

两标签保存同一修订，旧的应 409。只用键盘改中文标题并右移，在 Safari 和 Android 上看组合态。高数量级用裁剪而不是一次挂 5000 个 Rect，并记录机器和堆快照。

## 故障排查

拉伸模糊：Stage 宽高没跟容器走。拖完回到原点：没 `setState`。位置偏一截：把舞台像素当世界坐标。命中不到：`listening={false}` 放错层。卸载后 canvas 还在：组件没从树里拿掉，或另有命令式 Stage。409 被覆盖：客户端校验当成了权限。

## 官方链接

- [React 绑定](https://konvajs.org/docs/react/index.html)
- [React 19 兼容](https://github.com/konvajs/react-konva/blob/master/docs/react-compatibility.md)
- [拖拽持久化](https://konvajs.org/docs/react/Drag_And_Drop.html)
- [Transformer](https://konvajs.org/docs/react/Transformer.html)
- [访问节点](https://konvajs.org/docs/react/Access_Konva_Nodes.html)
- [响应式画布](https://konvajs.org/docs/posts/responsive-canvas.html)
- [npm react-konva](https://www.npmjs.com/package/react-konva)

## 世界坐标夹取

`clampNodePosition` 把非有限数收成 0，再把 x 限制在 `0 .. 620-132`，y 限制在 `0 .. 260-52`，并四舍五入。`onDragMove` 与 `onDragEnd` 都调用它，所以拖出边界时节点停在内缘，松手后的 state 与实例一致。只在 `onDragEnd` 夹取的话，拖动预览仍会画出世界之外。

`newNodePosition` 按 4 列、3 行铺开，再走同一套夹取。第 24 个节点不会被 `canAddNode` 放行。删除时用剩余节点的 id 更新选中，避免选中指向已经不在数组里的 key。背景 Layer 的折线用相邻节点中心附近的点，不读取 Konva 的临时拖拽坐标；拖动过程中线要等 state 更新才跟上，这是声明式数据流，不是端口约束。

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`stage-policy` 只证明缩放、夹取和 24 节点上限。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A12 的 PASS，不要写入 `verification.json`。
