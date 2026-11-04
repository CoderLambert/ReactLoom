# A04 uPlot — 工程手册

## 适用

`uplot@1.6.32` 画对齐的 Canvas 时序。React 持有采样点数、shift 和推流开关；`uPlot` 实例只在宿主 div 挂上之后创建。地图、桑基、自由标注不要放这里。X 严重不对齐时换数据模型或换库，不要造巨型 null 矩阵。

## 版本

钉 `uplot@1.6.32`。默认导入，CSS 用 `uplot/dist/uPlot.min.css`，类型用包内 `dist/uPlot.d.ts`。不要调用 master 上尚未出现在该 d.ts 的方法。X 用 Unix 秒，`scales.x.time: true`。

## 迁移

行对象先变成 `[x[], y1[], y2[]]`，列等长，缺测为 `null`。毫秒时间戳先换成秒，或显式改轴单位，禁止混用。结构（轴、series 数量）变化才销毁重建；推流只 `setData`。隐藏一条线用 `setSeries`，不要改 options 重建。用户框选之后用 `setData(data, false)` 并暂停自动 `setScale`。Lab 当前省略第二参，等于重置 scale，因为演示窗口在滑动。

## 不可删的清理

effect cleanup 要 `ResizeObserver.disconnect`、`cancelAnimationFrame`、`instance.destroy()`，并在 ref 仍指向该实例时置空。推流 interval、`visibilitychange`、`matchMedia('change')` 成对解除。已销毁的 plot 上禁止 `setData`。

## 反例

```ts
// 错
new uPlot(opts, [{ t: Date.now(), y: 0 }], host);
// 对
const data: uPlot.AlignedData = [[Math.floor(Date.now() / 1000)], [null]];
```

render 中构造、缺测填 0、`posToVal(event.clientX)`、用抽样列做账单，都不要做。

## 测试断言

`shouldRunStream` 只在 advanced、已请求、可见、且未减少动态（或显式覆盖）时为真。SDK 收据还要覆盖真实构造、`setData`、`setSize`、`destroy`、时间轴秒单位和 `null` 断线。没有 `docs/library-lab/evidence/runs/` 收据则为 NOT_RUN。

## 真实限制

窗口上限 100，推流 650ms，没有 HTTP、`setSeries`、`setScale` 策略、坐标往返或 PNG。`setData(data)` 会重置视窗。没有 FPS 或内存数字。减少动态默认停表，勾选覆盖才继续。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是本条目 PASS。策略测试和历史研究 PASS 不能写入 `verification.json`。
