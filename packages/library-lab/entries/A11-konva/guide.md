# A11 Konva 10.9.0：场景图、Transformer 和舞台销毁

Konva 是 Canvas 2D 场景图：Stage、Layer、Group、Shape、命中和拖拽。它不是 WebGL 引擎，也不是现成白板。要声明式 React 节点用 A12 的 react-konva，并且不要两个所有者同时管同一个 Stage。完整手绘产品评估 Excalidraw；无限画布评估 tldraw 的许可证；流程端口用 React Flow。

Library Lab 钉 `konva@10.9.0`，MIT。用户图片、字体和地图不因此变成 MIT。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。上限和宽度在 `examples/stage-policy.ts`。

已挂载：

- effect 创建 `Konva.Stage`，宽度来自 `stageWidth(clientWidth)`（1..4096），高度 280。一个 Layer，上面放 `Transformer`：禁止旋转和翻转，宽小于 85 或高小于 48 的 `boundBoxFunc` 退回旧盒子。`boundBoxFunc` 用的是绝对坐标。
- 业务卡片在 React state：`id`、标题、x、y、宽、高、颜色。两张初始卡片「RSS 收集」「内容审核」。换 level 会把 state 恢复成这两张，并重置缩放。
- 第二个 effect 按 id 增量同步：消失的 Group `destroy`，新的 Group 加 Rect 和 Text。basic 不可拖。`dragend` 把坐标写回 state。`transformend` 把 `rect.width * group.scaleX` 收成宽高，再把 scale 设回 1。拖拽过程中不把位置从 state 盖回去（`isDragging`）。
- advanced 才把选中 Group 交给 Transformer。滚轮以指针为锚缩放 0.6..2：先把指针反算到世界坐标，再改 stage scale 和 position。按钮「向右/向下 10px」不经过鼠标。
- 新增卡片最多 `MAX_SAMPLE_CARDS`（24），id 用递增的 `node-N`，重复 id 会被 `appendCard` 拒绝。
- `ResizeObserver` 加 rAF 改 `stage.width`。cleanup：断开观察者、取消 rAF、`stage.off('wheel')`、`stage.destroy()`，清空 layer、transformer 和节点 Map。`stage.remove()` 只摘 DOM，不等于销毁场景图，所以这里调用的是 `destroy`。
- 列表用按钮选择。画布 `role="img"`，精确操作在 DOM。

没有挂上：中文输入框、`stage.toBlob`、JSON schema、HTTP ETag、视口裁剪 1200 个矩形、`listening: false` 的背景层。Konva 8+ 会自己安排绘制；示例在同步后仍调用了一次 `batchDraw`。不要在每个 `x()` 后面再 `draw()`。`beginUpdateBatch` 是给 Transformer 同步用的，不是通用的逐帧 flush。[Batch Draw](https://konvajs.org/docs/performance/Batch_Draw.html)。

## 所有权

业务真相是卡片数组。Stage 是投影，在 effect 里创建一次。拖拽结束才写回不可变对象。世界坐标（Group x/y）和视口（Stage position/scale）分开。把 `getPointerPosition()` 直接存成卡片坐标，在缩放后会漂。Lab 的滚轮路径先除以缩放再写 stage position，卡片坐标仍来自 dragend 或按钮。[相对缩放](https://konvajs.org/docs/sandbox/Zooming_Relative_To_Pointer.html)。

Transformer 改的是 scale，不是 width/height。不把 scale 乘回去，下次从 state 画出的矩形会回到旧尺寸。[Transformer](https://konvajs.org/api/Konva.Transformer.html)。

## 三层

### 01 选择

两张卡片，不可拖。下拉和列表按钮写入 `selected`。点击 Group 同样 `setSelected`。没有 Transformer。

### 02 拖拽

business 打开 `draggable`。松手后列表里的 x/y 更新。拖动中 state 不跟每一帧走，避免和 Konva 的临时位置打架。

### 03 变换、缩放、新增

拉伸后宽高归一、scale 归 1。滚轮缩放显示在状态行。还原按钮把 scale 设为 1、position 设为 0。删除只改 React 数组，同步 effect 会 `destroy` 对应 Group。24 是示例帽，不是库的上限，也不是 FPS 结论。

生产里的双击编辑应把焦点交给 HTML `<input>`，用 `compositionstart/end` 和 `isComposing` 挡住拼音确认时的 Enter。不要在 `Konva.Text` 里自做输入法。触控要听 `tap`，并避免拖拽结束又触发一次选择。Lab 同时听了 `click tap`。

## 导出与序列化

`stage.toBlob({ pixelRatio })` 导出的是当前视口光栅。倍率翻倍，像素面积约四倍。先做像素预算，用 Blob 而不是巨型 data URL，并 `revokeObjectURL`。导出前拿开 Transformer，否则选框进图。跨域图片没有 CORS 会 taint。JSON 才是可编辑源。

`Konva.Node.create(JSON.parse(file))` 能还原节点，但不恢复事件和图片，也不是可信业务协议。不可信文件要版本、白名单、唯一 id 和大小上限，服务端再验一次。[overview](https://konvajs.org/docs/overview.html)。Lab 没有导入。

## 反例

```ts
// 错：render 中创建舞台，文档一变就再来一个
if (host.current) new Konva.Stage({ container: host.current, width: 600, height: 280 });

// 错：只存节点当前 width，忽略 Transformer 的 scale
apply(id, { width: rect.width(), height: rect.height() });

// 对：effect 创建一次；transformend 乘回 scale 并重置
const width = Math.max(85, Math.round(rect.width() * group.scaleX()));
group.scale({ x: 1, y: 1 });
apply(id, { width, height, x: Math.round(group.x()), y: Math.round(group.y()) });
```

| 错误 | 正确 |
|---|---|
| 每次数据变化销毁 Stage | 增量 Map 同步。Lab 的节点 effect 与舞台 effect 分开 |
| 每个 setter 后 `layer.draw()` | 交给自动批处理；外部像素变化才手动 |
| 只听 click 不听 tap | 触控用 tap；副作用不要在 dragend 后再触发 |
| 指针坐标当世界坐标 | 先除掉 stage scale。Lab 滚轮已做锚点 |
| 不可信 JSON 直接 Node.create | schema 与预算 |
| 一千个离屏节点仍 listening | 裁剪；静态层 `listening(false)` |
| `toDataURL({ pixelRatio: 4 })` 无上限 | `toBlob`、预算、捕获 SecurityError |
| 把 Canvas 当按钮和输入框 | HTML 列表。Lab 有选择按钮，没有文本框 |
| 用 `getElementById` 找 Shape | Shape 不在 DOM 里 |
| 只 `stage.remove()` | `destroy()`，并断开 ResizeObserver |

## 组合

**Konva + TanStack Query。** Query 管文档和 ETag，本地 state 管草稿，Konva 只投影。412/409 不要自动覆盖。Lab 没有请求。

**Konva + D3。** D3 算坐标和颜色，Konva 绘制和命中。不要让 D3 selection 去改 Canvas 节点。真地图不要在 Konva 里造瓦片引擎。

**Konva + pdf-lib。** PNG 进页面，JSON 留下一轮编辑。PDF 里的图不是可编辑图层。

## 生产清单

1. Stage 只在 effect 创建，cleanup `destroy`。
2. 宽度无效不改 stage。
3. id 稳定，增量创建和销毁 Group。
4. dragend / transformend 才写 state，拖拽中不回写位置。
5. scale 乘进宽高后归 1。
6. 视口变换和形状坐标分开。
7. 卡片数有预算。
8. 键盘路径在 DOM。
9. 中文编辑在 input，不在 Text。
10. 导出 PNG 与 JSON 分开，URL 释放。

## 升级与练习

从手写 `ctx.fillRect` 迁到 Layer/Rect/`draggable`/`dragend`。验收：刷新后坐标还在，`destroy` 后没有残留 canvas，StrictMode 双调用不叠舞台。

从 `stage.toJSON()` 迁到 `{ schema, revision, items }`。未知版本、重复 id、过大文件要拒绝。两标签用旧 ETag 保存应得到 412 而不是覆盖。

把这份命令式同步和 A12 的声明式 Stage 对照，不要预设哪一个更快。

## 故障排查

空白：宿主宽度、高度 280、是否在隐藏容器里创建。坐标漂移：又把 DPR 乘了一次，或把 stage 坐标当成 Group 坐标。Transformer 越拉越歪：scale 没重置，或 `boundBoxFunc` 用错了坐标系。导出黑屏：图层不可见或 canvas 被污染。路由切换后滚轮双倍：旧 stage 没 destroy。

## 官方链接

- [文档](https://konvajs.org/docs/index.html)
- [拖拽](https://konvajs.org/docs/drag_and_drop/Drag_and_Drop.html)
- [Transformer](https://konvajs.org/api/Konva.Transformer.html)
- [相对指针缩放](https://konvajs.org/docs/sandbox/Zooming_Relative_To_Pointer.html)
- [导出](https://konvajs.org/docs/posts/canvas-export-image.html)
- [Batch draw](https://konvajs.org/docs/performance/Batch_Draw.html)
- [仓库](https://github.com/konvajs/konva)

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`stage-policy` 只证明宽度夹取、24 张上限和重复 id。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A11 的 PASS，不要写入 `verification.json`。
