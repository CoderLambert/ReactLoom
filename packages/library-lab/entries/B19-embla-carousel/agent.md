# B19 Embla Carousel

## 适用

小规模横向卡片需要拖动和按钮时用 v8 `useEmblaCarousel`。万行列表、画布和单张静态图不要用。引擎不提供皮肤、数据和自动的圆点。

## 版本

`embla-carousel-react@8.6.0`，React 19.3.0。许可证 MIT。方法名保持 `scrollNext` / `scrollPrev` / `scrollTo` / `reInit` / `scrollSnapList`。不要写入 v9 的 `goToNext`。不要添加未在 `library.json` 声明的 autoplay 包。

## 迁移

从 v9 示例回退到本锁时替换方法名，并把 ref 放回 viewport。自建 `setInterval` 不要代替官方插件。圆点按 snap 列表生成，不按卡片数组。

## 不可删的清理

`select` 与 `reInit` 用同一函数 `off`。卡片变化后 `reInit`。复位用代数触发 `scrollTo(0, true)`。减少动画时 jump。键盘只在 viewport 持焦且 canScroll 允许时触发。id 经 `allocateSlideId`，不复用。`touch-action` 保留纵向平移。

## 反例

ref 挂在轨道上。把 snap 序号当卡片下标。监听不解除。删除后复用 id。window 级方向键。v9 API。未声明的自动播放定时器。和 Motion 同时平移轨道。

复用时保留这些不变的约定：

- 只用 v8：`scrollNext`、`scrollPrev`、`reInit`、`scrollSnapList`。
- ref 在 overflow hidden 的 viewport 上。
- snap 序号不等于卡片下标；`trimSnaps` 已打开。
- 监听用同一函数引用 `off`；id 不复用。
- 不添加未声明的 autoplay 包，也不写 setInterval。

## 测试断言

`tests/slide-policy.test.mts` 断言 `boundedSnap`、`carouselArrow` 的焦点条件、id 单调且不复用。不证明引擎测量或循环拖动。

## 真实限制

已挂载：start 对齐、trimSnaps、advanced 循环、增删上限 24、按钮和 viewport 键盘、减少动画跳转。未挂载：Autoplay、圆点、slidesInView、HTTP、断点配置。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://www.embla-carousel.com/docs/v8/get-started/react
