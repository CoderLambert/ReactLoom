# B19 Embla Carousel：吸附点、键盘与动态卡片

Embla 是没有默认皮肤的轮播引擎：测量 DOM，计算 snap，处理拖动和循环。React 入口是 `useEmblaCarousel`，返回 `[viewportRef, api]`。样式、按钮、ARIA 和数据由应用负责。卸载时 hook 销毁引擎。业务自己的监听还要 `off`。

Library Lab 固定 `embla-carousel-react@8.6.0`，宿主 React 19.3.0。许可证 MIT。**只锁了 React 包装包。** 不要在本示例里加入未声明的 `embla-carousel-autoplay`，也不要照抄 v9 RC 的 `goToNext` / `goToPrev` / `goTo` / `snapList` / `reinit`。v8 的方法是 `scrollNext`、`scrollPrev`、`scrollTo`、`scrollSnapList`、`reInit`。官方文档站若默认打开 v9，读 v8 专页。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。索引和键盘规则在 `examples/slide-policy.ts`。没有 Mock RSS API，没有自动播放插件，没有圆点组件。

已挂载：

- 选项 `align: 'start'`、`containScroll: 'trimSnaps'`。只有 `advanced` 设 `loop: true`。
- ref 在 viewport 上，viewport `overflow: hidden`。轨道 `display: flex`，`touchAction: 'pan-y pinch-zoom'`，让纵向滚页面、横向交给轮播。
- 卡片 `flex: '0 0 82%'`，`minWidth: 0`，稳定 `key={item.id}`。
- `role="region"`，`aria-roledescription="轮播"`，viewport 可 Tab。每张 `role="group"` 并带「第 n 张，共 m 张」。
- `select` 与 `reInit` 同步：当前 snap、能否前后、snap 数量。effect cleanup `off` 同一个函数引用。
- 卡片 id 签名变化或复位代数变化时 `reInit()`。复位会 `scrollTo(0, true)` 立刻跳到开始。注释写明要等 React 提交新 slide 再量。
- 按钮调用 `scrollPrev` / `scrollNext`。减少动画时第二个参数为 `true`（jump）。`matchMedia` 的监听会移除。
- 键盘只在 viewport 自己持焦时处理左右箭头，并且还要 `canScrollPrev` / `canScrollNext`。焦点在按钮上时不重复处理。
- advanced：添加上限 24，`allocateSlideId` 永不复用已出现过的正 id。移除最后一张，至少留一张。恢复默认四张并增加 reset 代数。

`boundedSnap` 把选中下标夹进 `[0, snapCount - 1]`。**snap 数可以小于卡片数**，因为 `trimSnaps` 和一屏可见宽度会合并吸附点。status 同时报吸附位置和卡片张数，避免把 snap 序号说成记录下标。

未挂载：Autoplay、`slidesInView` 圆点、`watchDrag` 自定义、断点选项、HTTP 分页、插件的 `playOnInit`。自动播放若以后加上，默认应停止，并服从减少动画；当前不要写一个自己的 `setInterval` 去调 `scrollNext`。

## 什么时候使用

适合一小组可横滑的新闻或商品卡片，需要拖动和按钮并存。不适合万行虚拟表、无限画布、手写板、或一张静态图（CSS scroll-snap 就够）。Embla 不加载数据、不鉴权、不提供全套图库 UI。

## 模型

```text
slides[]（稳定 id）
  → viewport ref
  → 引擎按 CSS 尺寸算出 scrollSnapList
  → selectedScrollSnap 是吸附序号，不是 stories 下标
  → 按钮和键盘调用 scrollPrev/scrollNext
```

`watchResize` / `watchSlides` 默认会在尺寸和子节点变化后重新测量。手动 `reInit` 不会自动摘掉你额外加的监听。Lab 只注册了 `select` 和 `reInit`。原生 `destroy()` 由 hook 负责，不要再销毁一次。

## 三层渐进

### Demo ① 滑动（已挂载）

四张固定卡片。拖动或按钮。到头时对应按钮禁用（非 loop）。viewport 聚焦后左方向键向前。输出「第 n 个吸附位置，共 m 个」。

### Demo ② 推荐卡（已挂载）

与 basic 同一引擎，文案不同。循环仍关闭。没有第二套插件。业务上若要过滤卡片，过滤结果仍用稳定 id，并在提交后 `reInit`。Lab 的 business 层没有过滤控件，不要说有。

### Demo ③ 循环与增删（已挂载）

`loop: true` 时按钮的 can 状态由引擎决定，可能两端都可点。添加后 id 单调增加，即使删掉最后一张再添加也不会复用旧 id。恢复默认会跳回第一吸附点且不播放动画（`scrollTo(0, true)`）。减少动画时普通下一张也跳转。

未挂载的生产教学：服务端分页不要把「下一页 HTTP」和 `scrollNext` 绑成同一个按钮，除非产品就是这个意思。图片加载会改变宽度，需要允许引擎重测。圆点必须按 `scrollSnapList().length` 生成，不能 `slides.map` 每张一个点。

## 反例

```tsx
// 错：v9 方法用在 v8 实例上
emblaApi.goToNext();

// 对
emblaApi.scrollNext(reducedMotion);
```

```tsx
// 错：ref 挂在 flex 轨道上
<div ref={emblaRef} style={{display: 'flex'}} />

// 对：ref 在 overflow hidden 的 viewport，轨道在里面
```

```tsx
// 错：把 selectedScrollSnap 当卡片 id
const card = slides[emblaApi.selectedScrollSnap()];

// 对：snap 与卡片分开计数。需要卡片身份时用可见 slide 的 id，不要假设一一对应
```

```tsx
// 错：点导航按每张卡片生成
{slides.map((_, index) => <button onClick={() => emblaApi.scrollTo(index)} />)}

// 对：按 scrollSnapList() 的长度生成。Lab 没有点，status 用的是 snapCount
```

```tsx
// 错：监听不 off，或 off 了另一个函数
useEffect(() => {
  emblaApi.on('select', () => setSelected(emblaApi.selectedScrollSnap()));
}, [emblaApi]);

// 对：具名 sync，cleanup 里 off('select', sync)
```

```tsx
// 错：删卡片后复用 id
id: slides.length + 1

// 对：allocateSlideId(last, presentIds)
```

```tsx
// 错：方向键处理写在 window 上，按钮也被吃掉
window.addEventListener('keydown', ...)

// 对：carouselArrow 要求 target === currentTarget，即 viewport 持焦
```

```tsx
// 错：自动播放 setInterval 不管减少动画和隐藏页
// 对：本示例没有自动播放。若加官方 v8 插件，playOnInit: false，并在 reduce 时停
```

`containScroll: 'trimSnaps'` 会改变 snap 数量。改 CSS 百分比后要重新看 status，不要把旧的「四张四个点」写进验收。

## 组合

**Embla + Motion**：Motion 可以动卡片内部的文字。不要再给轨道加一个 translateX。Embla 拥有滑动 transform。

**Embla + Query**：数据数组换了就让 React 提交，然后 `reInit`。不要在拖动监听里发请求。

**Embla + 虚拟化**：窗口化的 slide 会让测量和索引更难。本示例最多 24 张真实 DOM，不是虚拟列表方案。

## 生产清单

- viewport 与轨道结构符合 v8 要求。
- key 稳定且不复用。
- 监听成对 off。
- 按钮和键盘遵守 canScroll。
- 减少动画用 jump。
- 纵向触摸滚动保留。
- 文案区分 snap 与卡片数。
- 循环只在明确的层级打开。
- 不混用 v9 方法名。
- 不把 Node 里的索引函数当成引擎已初始化。

## 升级

留在 8.6.0 直到准备好改所有方法名和选项。v9 RC 不是稳定替代。若包装包的传递依赖把 `embla-carousel` 核心带进来，类型导入仍要以实际导出为准，不要假设 pnpm 隔离下可以随意深导入未声明的路径。本应用代码只从 `embla-carousel-react` 导入 hook。

## 结构、插件和测量

v8 要求的 DOM 是三层，不是两层：

```tsx
<div ref={emblaRef} style={{overflow: 'hidden'}}>
  <div style={{display: 'flex', touchAction: 'pan-y pinch-zoom'}}>
    <article style={{flex: '0 0 82%', minWidth: 0}} />
  </div>
</div>
```

把 ref 挂到 flex 轨道上，引擎读到的可视宽度是错误的，snap 会挤在一起或完全不能滑。`minWidth: 0` 防止文章标题把卡片撑出百分比。改 `flex-basis` 之后必须 `reInit`，否则按钮仍按旧的 snap 列表禁用。

`selectedScrollSnap()` 与 `slides[index]` 只有在「一屏一张且没有 trim」时才碰巧相等。Lab 开了 `containScroll: 'trimSnaps'`，并且卡片只占 82% 宽，所以 status 同时打印吸附个数和卡片张数。点导航若要加，长度来自 `scrollSnapList()`，点击调用 `scrollTo(snapIndex, reducedMotion)`。不要 `slides.map`。

`slidesInView()` 返回的是滑块下标数组，适合懒加载图片，不适合当作业务 id。图片到来改变高度时，默认的 `watchResize` 会重测；若你关掉它，就要自己在 `onload` 里 `reInit`。

自动播放不在 `library.json`。官方 v8 插件的形状是 `Autoplay({playOnInit: false, delay: 4000})`，和 v9 选项不同。加上之前要在减少动画和 `document.hidden` 时停止，并在指针悬停时按产品决定暂停。用 `setInterval` 调 `scrollNext` 会和拖动手势抢滚动位置。

循环打开后，`canScrollNext` 可能在两端都为真。验收不要写死「最后一张时下一张禁用」。basic 和 business 没有 `loop`，那条禁用仍然成立。

监听泄漏的形式是每次 effect 新建箭头函数却不 `off`。Lab 把 `sync` 放在 effect 内部并在 cleanup 里摘掉同一引用。不要再调用 `destroy()`，hook 会销毁自己的引擎；业务 fetch 仍要自己 abort。

## 验收

basic：下一张改变 status；末尾下一张禁用；viewport 上的方向键有效，焦点在按钮上时方向键不劫持。business：四张 id 不变。advanced：添加到 24 停止；删除不把列表删空；新 id 大于曾经出现过的 id；恢复后回到第一吸附点；减少动画时切换不插值。loop 打开后端点是否可点以引擎 `canScrollNext` 为准。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成 Embla PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B19 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B19-embla-carousel/tests/slide-policy.test.mts
```

断言 snap 夹取、键盘只在 viewport、id 不复用。不证明拖动物理或 reInit 时机。

## 官方资料

- https://www.embla-carousel.com/docs/v8/get-started/react
- https://www.embla-carousel.com/docs/v8/api/methods
- https://www.embla-carousel.com/docs/v8/api/options
- https://www.embla-carousel.com/docs/v8/guides/required-setup
- https://www.embla-carousel.com/docs/v8/plugins/autoplay
- https://github.com/davidjerleke/embla-carousel
- https://www.npmjs.com/package/embla-carousel-react
