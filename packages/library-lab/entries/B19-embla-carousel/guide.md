# 用 Embla 管理专题横滑，而不是手写位移

首页有一组可拖动的专题卡片，需要按钮与键盘导航，数据增删后还要重新计算边界。`embla-carousel-react` 把真实 DOM 交给轮播引擎测量和移动，应用负责内容、样式、导航按钮、可访问语义与数据状态。它适合小规模横向内容；只要原生吸附时可先用 CSS scroll-snap，拖拽排序、超长虚拟列表和画布则属于其它模型。

本例固定 React 包 **8.6.0**，它精确依赖的核心和 reactive-utils 也为 **8.6.0**，运行时 MIT，React peer覆盖16.8/17/18/19。Lab使用React19.3.0，四张文字卡片原创、无远程素材。代码只从已声明的React包导入hook，不深导入pnpm传递依赖，不加载自动播放插件。

## 先分清卡片、轨道和吸附点

```text
slides数组（稳定ID） → React提交卡片DOM
viewport ref → Embla测量CSS尺寸 → scrollSnapList
按钮/本例局部方向键 → scrollPrev/scrollNext → select事件 → 导航状态
卡片ID列表改变 → 本例reInit → reInit事件 → 重新读取边界
```

结构是“可视窗口→flex轨道→卡片”三层。ref放在overflow:hidden的窗口，不能放到轨道上；82%的flex-basis、边距和边框会直接影响实际测量。卡片显式border-box和minWidth:0，复制到没有Lab全局reset的项目仍保留这个尺寸模型。

`selectedScrollSnap()` 是吸附位置，`slidesInView()` 是可见卡片索引，二者不能当作同一个业务ID。一屏多张、trimSnaps或循环时，卡片数和snap数可能不同。下方导航文字和“读取真实引擎”分别展示自动同步状态及点击当次的SDK getter快照，没有另造一份计时进度。

## 最小接入

```tsx
import useEmblaCarousel from 'embla-carousel-react';
const [viewportRef, api] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });

<div ref={viewportRef} style={{ overflow: 'hidden' }}>
  <div style={{ display: 'flex', touchAction: 'pan-y pinch-zoom' }}>
    {cards.map(card => <article key={card.id} style={{ flex: '0 0 82%', minWidth: 0 }} />)}
  </div>
</div>
```

这是结构片段；完整布局、语义、监听与动态内容在实际sourceFiles中。复制demo.tsx、example.tsx、slide-policy.ts，保留组件内必要样式即可。v8使用scrollNext/scrollPrev/scrollTo/reInit这些方法，升级时先核目标版本导出，不把当前官网默认新版API直接套到8.6.0。

## 实验一：真实测量、拖动与导航

1. 基础实验默认非循环。先读引擎，观察四个DOM slideIds、snapPositions和selectedSnap。第一吸附位置的“上一张”不可用。把“卡片宽度”选成48%让同屏出现多张，再读引擎：卡片还是四张，但trimSnaps可合并吸附点。这个重新测量来自SDK真实ResizeObserver，不是手工设置snap数。
2. 用鼠标拖动卡片再松手，观察真实轨道移动并吸附；点“下一张”或将焦点放到“专题滑动区域”后按右箭头，结果走同一个引擎。到末端“下一张”禁用。
3. 再读引擎，比较selectedSnap与visibleSlideIndices；不要把前者直接索引为唯一“当前文章”。改变窗口宽度后，SDK的默认watchResize会重新测量。
4. 系统减少动态开启时，按钮和本例局部箭头导航使用jump即时跳转。手动拖动仍由SDK物理模型处理；本例没有自动播放，不承诺所有拖动回弹都变为零时长。

方向键只在窗口本身持焦时处理，焦点在其它控件上不劫持键盘。上一张/下一张是原生按钮，操作后保留焦点；窗口方向键是本例增强，不是Embla自动提供的完整可访问组件。外层轮播region同时包含卡片与控件，每张使用带名称的group语义，参照[W3C轮播模式](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)。真实读屏、触摸设备和完整WCAG验收另计。

## 实验二：动态卡片和循环的条件

高级实验请求loop:true，先向前/向后跨过边界，读取实际selectedSnap与可滚动状态。逐步移除到一张时，内容不足以循环，SDK会回退；实际按钮/读数可能同时不可滚动，不能把配置请求当成运行结果。

“添加卡片”最多24张，ID由lastAllocated和当前最大ID共同递增；删除或恢复默认后再添加也不复用曾经分配的ID。“恢复默认卡片”重新放入原始四项，并在提交后scrollTo(0,true)回到首个吸附位置。

这里的卡片完全由React控制，明确watchSlides:false，由一个effect在ID签名或reset代数变化后调用reInit，避免再让SDK的默认MutationObserver处理同一批数据变化。SDK仍负责真实容器resize；reInit事件与select事件都通过同一个sync读取API，不手写另一套边界计算。恢复的代数保证“数组已经是默认值”时仍能明确回首位。

不要把“下一张”绑定成“请求下一页”：这两个状态只有产品明确设计时才应该关联。真实异步数据应先提交新DOM再测量，图片等资源改变尺寸还需核对SDK resize观察及布局；本例没有HTTP或图片加载。

## 监听与销毁归属

应用用同一sync函数订阅/解除select与reInit，减少动态的媒体监听单独清理。React hook创建并销毁核心实例，应用不重复调用destroy。额外destroy观察器只在真实SDK事件发生时把旧窗口data-embla-destroyed设为true，便于卸载验收；它不触发销毁，应用cleanup同样off。

源码不在模块顶层读window；媒体偏好在effect同步。hook可输出静态结构，但完整SSR/hydration、触摸/读屏和性能没有由这次浏览器或规则测试自动证明。组件最多24个真实DOM卡片，不是虚拟化方案。

## 官方原文与运行证据

固定npm gitHead `0fe65834136f1aa35e4c1a4a477e5ccb4bb5ee54`，对应packages/embla-carousel-react/package.json为8.6.0；完整14个README候选无官方中文，保存该包README.md英文原文13872B。原文未翻译改写，仓库/commit/path/语言/版本/时间/SHA在library.json和official/source-audit.json。

官网按完整HTTP响应与Lab实际嵌入证据区分允许/禁止/未知，面板保留直达。规则测试只证明索引、键盘门禁和ID分配；真正引擎测量、原生拖动、循环回退、动态DOM和destroy需匹配构建的真实浏览器。实际命令与六项结论见local-validation.md，正式sdk/build/browser收据另记。
