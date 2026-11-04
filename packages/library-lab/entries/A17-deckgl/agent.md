# A17 deck.gl — 工程手册

## 适用

`@deck.gl/core@9.4.0` 与 `@deck.gl/layers@9.4.0` 用命令式 Deck 画像素半径的散点。底图和街道不在本示例里。不要同时引入 `<DeckGL>` 再 `new Deck`。与 MapLibre 叠加时相机只能有一个所有者，且该路径当前没有挂载。

## 版本

钉 core 与 layers 9.4.0。图层 id 为 `library-sites`。`getPosition` 使用 `[longitude, latitude]`。`radiusUnits: 'pixels'`。生产保持 WebGL2；WebGPU 另做试验。未依赖 `@deck.gl/react` 或 `@deck.gl/maplibre`。

## 迁移

从 React 包装迁到独立 Deck 时，卸载改为 `finalize`。从米制半径迁到像素半径后重新检查缩放。随机 id 改成稳定 id。选中色若进入 accessor，补 `updateTriggers`。接 MapLibre 时去掉 Deck 的 `controller`，只在 `load` 之后添加一次 overlay。

## 不可删的清理

探测用的 WebGL2 上下文在创建 Deck 前 `loseContext`。cleanup 断开 ResizeObserver、取消 rAF、`deck.finalize()`。非正尺寸不 `setProps`，边长不超过 4096。tooltip 返回纯字符串或 null。

## 反例

```tsx
return () => { node.hidden = true; }; // 错：上下文还在
deck.finalize(); // 对
```

`[latitude, longitude]`、原地修改同一 data 引用、高密度却只提供 12 行还声称全量可访问，都不要做。

## 测试断言

`measuredDeckSize` 拒绝 0 和非有限值，并封顶 4096。`needsDeckResize` 在任一边变化时为真。SDK 收据还要看到真实 `Deck`、`ScatterplotLayer`、`setProps` 和 `finalize`。没有 runs 收据则为 NOT_RUN。

## 真实限制

没有底图、overlay、分页和网络取消。表格固定前 12 行，1200 点时其余点只在 GPU 层。picking 在高密度下仍然开启。极地投影没有样本。没有显存或 FPS 数字。`controller: true` 只适用于这块独立画布。

## 断言边界

`tests/deck-size.test.mts` 只夹尺寸。SDK 用例要 `import { Deck } from '@deck.gl/core'` 和 `ScatterplotLayer`，断言 layer id 稳定、`setProps` 不新增 Deck、卸载调用 `finalize`。探测上下文应先 lose。缺收据时保持 NOT_RUN。卸载调用 `finalize`。表格只有前 12 行，不能把它写成全量分页。半径单位是像素，不是米。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A17 PASS。不要把尺寸测试或历史研究 PASS 写入 `verification.json`。

对照 `library.json` 的版本编写 import，不要升到条目未钉死的版本。
`tests/` 中的策略用例不能改写成 sdk 字段的 PASS。
浏览器与构建未留下收据时，对应字段维持 NOT_RUN。
