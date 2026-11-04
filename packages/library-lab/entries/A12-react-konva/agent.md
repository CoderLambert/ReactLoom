# A12 react-konva — 工程手册

## 适用

`react-konva@19.3.2` 加 `konva@10.9.0` 用声明式 Stage 画二维节点。命令式场景图用 A11，不要两个 Stage 抢一个容器。`<Text>` 不是输入框。虚线只按数组顺序装饰，不是端口模型。

## 版本

与 React 19.3 对齐的 19.3.2。不要用会漂到不兼容版本的范围。全量入口即可；`ReactKonvaCore` 必须自行注册形状。`_useStrictMode` 不是 React StrictMode。

## 迁移

从 A11 的 Map 同步改为 `<Group draggable onDragEnd>`。世界坐标保持 620×260，显示缩放只改 Stage 的 width/height/scale。若加入 Transformer，scale 乘进宽高后归 1。持久化保存节点数组，不保存 `stage.toJSON()`。

## 不可删的清理

`ResizeObserver` 与 rAF 在 effect cleanup 里解除。不要在 state 变化时手动 destroy 声明式 Stage。拖拽位置经过 `clampNodePosition`。新增前看 `canAddNode`。锁定时 `draggable` 为 false。

## 反例

```tsx
useEffect(() => { new Konva.Stage({ container: host.current!, width: 100, height: 100 }); }, []);
// 错：与 <Stage> 双重所有
// 对：只渲染 <Stage width={width} height={height} scaleX={scale} scaleY={scale}>
```

把指针像素当世界坐标、把 Text 当可访问名称、拖拽中用旧坐标覆盖节点，都不要做。

## 测试断言

`stageScale` 在窄容器上小于 1，宽容器上不超过 1。`clampNodePosition` 把卡片限制在世界内。`canAddNode` 在 24 张时为 false。SDK 收据还要看到真实 Stage 拖拽写回和卸载后 canvas 消失。没有 runs 收据则为 NOT_RUN。

## 真实限制

没有 Transformer、PNG、IME 输入、HTTP 修订或大量裁剪。背景层 `listening={false}`。错误边界必须放在 Stage 内部才覆盖画布子树，本示例没有这种边界。没有内存测量。

## 断言边界

`tests/stage-policy.test.mts` 覆盖缩放、夹取和 24 节点。SDK 用例要 `import { Stage, Layer, Group } from 'react-konva'`，拖拽结束写入夹取后的世界坐标，卸载后不再留下第二块命令式 canvas。缺收据时保持 NOT_RUN。世界坐标保持 620×260，显示缩放只改 Stage 的尺寸和 scale。不要再 `new Konva.Stage`。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A12 PASS。不要把坐标测试或历史研究 PASS 写入 `verification.json`。

对照 `library.json` 的版本编写 import，不要升到条目未钉死的版本。
`tests/` 中的策略用例不能改写成 sdk 字段的 PASS。
浏览器与构建未留下收据时，对应字段维持 NOT_RUN。
