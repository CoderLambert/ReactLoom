# B19 Embla Carousel — Agent 工程接入指引

## 场景判断

需要可滑动的连续卡片、惯性和 snap 时选择 Embla；若只是静态横向列表可考虑原生 scroll-snap。拖放排序应使用 B13 dnd-kit。版本固定 embla-carousel-react 8.6.0；v9 RC 的 goToNext/goToPrev 不能套到 v8。

## 最小迁移路径

先读 library.json、examples/example.tsx、guide.md、verification.json。引用 viewport ref、flex container/slide 结构和 useEmblaCarousel。替换 originals 为目标业务的稳定 ID 数据；保留按内容更新的 reInit 和事件对称解绑。

## 不能删除的机制

- useEffect(on select/reInit) 和返回 cleanup off，同函数引用。
- Hook 拥有创建与销毁；卸载时不用手动 destroy。
- 父 viewport overflow:hidden，slide min-width:0，手势允许 pan-y。
- 导航按钮放在拖动容器外，disabled 取自 SDK canScrollPrev/Next。
- 不做默认自动播放；新增自动播放时提供暂停、reduced-motion/可访问性策略。

## 必测

真实 v8 API 安装与编译；滚动选中索引、增删后 snap 边界、loop 重置、触摸与页面纵向滚动、键盘导航、卸载释放 observer 与监听。当前SDK/build/browser NOT_RUN；不能仅凭源码生成标记 PASS。

官方：https://www.embla-carousel.com/docs/v8/get-started/react


### 第10轮异步渲染与身份

`setSlides` 后不能立即依据旧DOM调用 `scrollTo`；通过一次性resetEpoch在布局提交后 `reInit + scrollTo`。动态列表变化用ID签名而非仅数组长度；新ID采用单调分配，snap index使用真实 `scrollSnapList().length` clamp。卸载释放真实 Embla instance 和事件订阅。检查同长度替换、删除末尾选中项、重置、之后再次追加卡片以及窄屏loop，不得将Node纯逻辑测试误认为触控SDK通过。

## wave21 迁移断言

保留carouselArrow键盘边界策略、聚焦region和每张slide的group/幻灯片信息。只在viewport自身收到左右箭头时调`emblaApi.scrollPrev(reducedMotion)`或`scrollNext(reducedMotion)`；禁止捕获嵌套控件的事件。真实snap数量和卡片数量分别显示。系统减少动画监听要在卸载时解除，SDK/浏览器仍NOT_RUN。
