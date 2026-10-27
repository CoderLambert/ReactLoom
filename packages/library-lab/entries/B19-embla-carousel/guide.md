# B19 Embla Carousel：触控轮播与生命周期实战

## 选型

Embla 为触控滑动、滚动惯性、对齐 snap、动态容器尺寸提供无样式引擎，配合 React hook 管理实例。它不负责图文内容、路由或权限，不适合任意元素拖拽排序。很多官方页面已显示 v9 RC 的新 API，本示例明确锁定稳定的 8.6.0。

## 安装与引入

    pnpm add embla-carousel-react@8.6.0
    import useEmblaCarousel from 'embla-carousel-react';

v8 API 是 scrollPrev()/scrollNext()/selectedScrollSnap()。v9 RC 文档出现 goToPrev()/goToNext()，不能原样混用。直接引用可迁移实现 examples/example.tsx，Lab 展示适配文件 examples/demo.tsx 只是重新导出。

## 三个真实 Demo

**basic**：原始四张学习卡片，hook 返回 viewport ref 和 API，通过原生按钮触发导航。卡片内容与滑动均为真实 UI。

**business**：根据 select/reInit 事件更新选中序号、上一张/下一张的禁用状态。SDK 负责计算边界，不在业务侧自己计数推断。

**advanced**：启用 loop，动态增删并 reInit。React 负责 slide 集合与 key，Embla 负责滑动快照；通过恢复按钮回到初始卡片。

## 关键生产实践

- DOM 三层：overflow hidden 视口、display flex 容器、flex:0 0 basis/min-width:0 的 slide。漏一层会破坏 snap 几何。
- 保留触摸纵向滚动：touch-action: pan-y pinch-zoom；导航按钮置于滑动区域外，避免按钮点击和拖拽冲突。
- 事件订阅：emblaApi.on(select, sync) 与 emblaApi.off(select, sync) 成对；监听 reInit 后更新边界状态。
- Hook 负责 destroy：不要在每次 re-render 手工调用 destroy；切换 Tab 卸载后 Hook 清理实例。
- 动态列表：React 更新卡片后让 Embla 重新计算布局；稳定业务 id 用作 React key，不能在动态排序/删除时依赖数组位置。
- A11y：操作按钮具清晰文本，当前页 aria-live 播报；支持键盘选择并防止自动播放抢走焦点。首版无自动播放。
- 性能：Embla 不会自动把上千张卡片虚拟化；需评估 DOM 数量、图片尺寸/延迟加载和页面预取预算。

## 五组典型反例

1. 使用 v9 RC goToNext 方法调用 v8，运行时报不存在：使用 scrollNext。
2. 改 slides 后不重算 snap，造成滚动到空白：触发 reInit 并订阅 reInit。
3. 每次渲染无条件 reInit，导致循环布局更新：仅监听尺寸/数据变化。
4. 把导航按钮嵌入拖动区域，触摸设备上误判 drag：在 viewport 外布局按钮。
5. 监听 select 但不解除：连续访问页面泄漏事件，必须 off 同一函数引用。

## 与其他库的关系

B01 Motion 可动画单张卡片内部的文字或按钮，但不能与 Embla 同时控制同一容器的 transform。B13 dnd-kit 处理任意拖放排序；不能把轮播等同通用 DnD。若只有两个简单横向卡片且无需拖动惯性，原生 CSS scroll-snap 更轻。

## 练习和验收

替换原创 fixture 为实际 NewsHub 频道列表：重排列表、动态插入/删除、触控左右滑和垂直滚动同时存在。检查 loading 结束之后 reInit 与选中索引。

现有 SDK、构建与真实 Chromium 为 NOT_RUN；必须由 PLATFORM 添加准确依赖、生成真实锁文件再做 typecheck/build。浏览器重点验证触摸、焦点、StrictMode 多次挂卸载、loop、移动宽度以及 aria-live。

一手资料：https://www.embla-carousel.com/docs/v8/get-started/react
许可证 MIT；不包含第三方图片。


## 动态DOM提交后重算与恢复（第10轮）

此前 `setSlides(originals); emblaApi.scrollTo(0)` 在同一事件执行：`scrollTo`可能读取旧DOM的snap，之后的 `reInit` 又使位置错乱。现在把重置请求记为 `resetEpoch`，在React DOM提交后的effect里 `reInit`，再 `scrollTo(0, true)`；每次重置只应用一次，不会在之后追加卡片时再次跳回首张。`slideSignature`基于稳定ID而不是仅看数组长度，重排/替换同长度内容也会重算。`allocateSlideId` 单调分配新ID（最多24张教学卡片），避免删除恢复后重复ID；`boundedSnap`将删除卡片后的过期索引限制为实际snap范围。导航在 API 初始化前禁用。Node策略测试不证明触控/scrollTo行为，必须在真实 Embla v8 和Chromium验证。
