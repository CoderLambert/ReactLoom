# A17 deck.gl：工程实战指南

> 本条目是依据官方资料重新编写的示例，不是历史研究附件的复制品。示例源码已接入；SDK、TypeScript、构建、浏览器验证需以 verification.json 的实际证据为准。

## 产品定位与边界
在大量地理点、线、网格、轨迹的可视化中，deck.gl使用GPU绘制数据层。它并非地图底图供应商。本演示依照官方Standalone模式，用 `@deck.gl/core` 的 Deck 和 `@deck.gl/layers` 的 ScatterplotLayer实现**纯地理数据叠层**；背景是纯色，故意不调用第三方瓦片。

## 安装与源码
```bash
pnpm add @deck.gl/core@9.4.0 @deck.gl/layers@9.4.0
```
```ts
import {Deck} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
const deck=new Deck({parent:container,initialViewState:{longitude:116.4,latitude:39.9,zoom:6},controller:true,layers:[new ScatterplotLayer({data:[]})]});
// unmount: deck.finalize()
```
完整可迁移源码在 `examples/example.tsx`。

## 三层实验
basic：两个经纬度点，真实GPU着色和Tooltip拾取。business：多站点健康状态、过滤与键盘可访问的HTML数据表。advanced：在本地生成确定性的1200点并调整半径，验证在改变数据时不会每次重建整个Deck。注意此样本不是基准测试，不对帧率作未实测承诺。

## 交互、性能与资源
Deck接受parent为当前示例DOM节点，ResizeObserver按容器大小setProps并借rAF合并 resize，不创建全屏或全局Canvas。数据变化创建新的ScatterplotLayer并复用相同id，触发器通过getRadius更新；内存峰值需真实GPU profiling而非简单猜测。WebGL2不可用时应显示语义等价表。离开Tab `deck.finalize()` 归还GPU/监听资源。地图底图、三方瓦片的Token和署名是额外授权问题，本示例不涉及。

## 反例与修复
1. 将MapLibre当成deck.gl依赖：Standalone层无需MapLibre；要底图时才组合。2. 每次React状态修改就new Deck：旧Canvas和WebGL上下文泄漏；使用setProps。3. 海量点位一次性放进全量DOM：可视化GPU绘制、DOM表格分页/抽样提供键盘替代。4. 忽略WebGL2条件：崩溃、Canvas空白；先能力检测并错误降级。5. 不执行finalize：资源不随React自动回收。

## 两种真实组合练习
将A16 MapLibre GL JS作为底图并核对坐标投影、控制器同步与瓦片许可；将D19 Fuse.js与地理点搜索结合，先在结构化数据中筛选，再生成图层，避免每次键入重建GPU引擎。

## 官方资料与版权
- [deck.gl standalone入门](https://deck.gl/docs/get-started/using-standalone)
- [Deck parent与finalize API](https://deck.gl/docs/api-reference/core/deck)
- [ScatterplotLayer属性](https://deck.gl/docs/api-reference/layers/scatterplot-layer)

本地数据与示例代码为原创。使用前核对依赖版本与当前许可证；不请求第三方付费 API。

## 第14轮：容器尺寸与 GPU 资源边界

新增 `examples/deck-size.ts`。ResizeObserver 的 0 宽/0 高、NaN/Infinity 测量不应更新 WebGL canvas；小数 CSS 像素取整、超过 4096 CSS px 时限幅，仅当实测尺寸变化才调用 `deck.setProps`。首帧未测得尺寸暂用 1×1，后续容器有正尺寸后自动恢复；释放仍严格通过 `deck.finalize()`。高分辨率产品还应核对 DPR 和真实设备支持的最大纹理/viewport，不把 4096 当通用硬件阈值。

图层选择使用稳定站点 ID，状态展示从当前筛选集求名称，因此过滤后不会显示已不可见站点的过期名称。GPU 初始化/运行错误在状态文本中优先展示，数据表继续可用于读屏与键盘。纯尺寸规则测试不代表 1200 点真实显卡帧率、WebGL2 或 context-loss 验收。
