# A11 Konva — 工程手册

## 适用

`konva@10.9.0` 用命令式场景图做二维拖拽和变换。已经用 React 描述图元时改用 A12，不要再 `new Konva.Stage` 包住同一容器。白板产品不要从零复刻，先看 A09/A10。

## 版本

钉 `konva@10.9.0`，MIT。Stage、Layer、Group、Rect、Text、Transformer 来自这个包。自动批绘制从 Konva 8 起就是默认行为；`beginUpdateBatch` 不是每帧都要调用的 API。

## 迁移

手写 canvas 循环改成 Group + `dragend`。持久化从 `stage.toJSON()` 改成带版本的卡片数组。Transformer 的 scale 在 `transformend` 乘进宽高并归 1。若改成 react-konva，删掉手动 `new Stage`，避免两个所有者。

## 不可删的清理

舞台 effect 必须 `observer.disconnect`、`cancelAnimationFrame`、`stage.off('wheel')`、`stage.destroy()`，并清空 Map。被过滤掉的卡片要 `group.destroy()`。宽度非有限或小于等于 0 时不调用 `stage.width`。

## 反例

```ts
rect.width(group.width()); // 错：忽略 scaleX
const width = Math.max(85, Math.round(rect.width() * group.scaleX()));
group.scale({ x: 1, y: 1 }); // 对
```

render 中构造 Stage、指针坐标直接当世界坐标、只 `remove()` 不 `destroy()`，都不要做。

## 测试断言

`canAddCard` / `appendCard` 在 24 张或重复 id 时不增长。`stageWidth` 夹在 1..4096。SDK 收据还要看到真实 Stage、拖拽写回、变换后 scale 为 1、卸载后 canvas 消失。没有 runs 收据则为 NOT_RUN。

## 真实限制

没有文本编辑、PNG、HTTP ETag 或视口裁剪。basic 不可拖，Transformer 只在 advanced。滚轮缩放未读取 `prefers-reduced-motion`。24 与 0.6..2 是示例边界，不是性能测量。`batchDraw` 在同步后调用了一次，不要在每个属性 setter 后再画。

## 断言边界

`tests/stage-policy.test.mts` 覆盖 24 张上限和宽度。SDK 用例要 `import Konva from 'konva'`，创建 Stage，在 `transformend` 语义下把 scale 乘进宽高并归 1，然后 `destroy`。不要用普通对象模拟 Transformer。缺收据时保持 NOT_RUN。滚轮缩放要保持指针下的世界坐标，卡片 x/y 与 stage 的 position/scale 分开存储。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A11 PASS。不要把策略测试或历史研究 PASS 写入 `verification.json`。

对照 `library.json` 的版本编写 import，不要升到条目未钉死的版本。
`tests/` 中的策略用例不能改写成 sdk 字段的 PASS。
浏览器与构建未留下收据时，对应字段维持 NOT_RUN。
