# GSAP 3.15.0｜时间线、作用域和减少动态

Lab 只依赖 `gsap@3.15.0`。许可证在 `library.json` 里记为 **GSAP Standard No Charge**，不是 MIT，也不是 Apache-2.0。普通站点里的界面动画和「把 GSAP 做成可视化动画搭建器再分发」不是同一件事。发布前读 https://gsap.com/standard-license 。本仓库不把 GSAP 源码再打包进模板。

`@gsap/react` 的 `useGSAP` 是官方 React 封装，**当前示例没有安装也没有调用它**。示例用 `gsap.context(callback, host)`，清理时 `context.revert()`。这是同一套「作用域内创建的动画一起还原」的合同。若你改用 `useGSAP`，点击之后才创建的 tween 要用 `contextSafe`，依赖变化要重建时写 `revertOnUpdate: true`。不要把第三方包 `react-gsap` 或已废弃的 `gsap-react` 当成官方适配。

没有逐库收据时 sdk / build / browser 是 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 把 context 绑在 `<section ref={scope}>` 上。选择器是 `.gsap-lab-item` 和 `.gsap-lab-detail`，因为第二个参数是宿主节点，所以不会打到页面上别的同名类。[`examples/timeline-policy.ts`](examples/timeline-policy.ts) 决定何时播放、进度百分比是否值得写进 React。

实际行为：

- basic / business / advanced 都是一条 timeline：元素从 `autoAlpha: 0` 和一段 y 进入，stagger 只在非 basic 时为 0.12。随后细节段落重叠 0.12 秒（位置参数 `'-=.12'`）。
- 减少动态：不创建 timeline，内容直接可见，进度条显示 100。
- 页面 `visibilitychange` 到 hidden 时 `pause()`。回到前台只在用户没有手动暂停时 `resume()`。
- advanced 有暂停和 `reverse()`。重播按钮增加 `generation`，effect 清理会 `revert()` 再重建。
- `onUpdate` 里先算整数百分比，`shouldPublishProgress` 认为没变就不 `setProgress`。业务文案不跟着每一帧走。

没有 ScrollTrigger、没有 pin、没有 ScrollSmoother、没有工作流状态机。下面仍教这些，因为它们是用 GSAP 时最容易把业务状态写坏的地方。

## 1. 什么时候用

GSAP 是命令式时间树：Tween、Timeline、以及另外注册的 ScrollTrigger。它可以暂停、倒放、seek。它不保存你的草稿、审核或发布状态。

| 任务 | 是否先选 GSAP | 更合适的工具 |
| --- | --- | --- |
| 多个元素要按时间点交错，并且能暂停、倒放 | 优先 | 单元素 CSS 就够时不要引入 |
| 滚动讲故事、钉住一屏 | 可以，但先问 UX 是否真的要钉住 | 简单入场用 CSS 或 IntersectionObserver |
| 弹层和列表布局过渡 | 往往不必 | Motion（B01） |
| 设计师交来的角色动画 | 不优先 | Rive、dotLottie |
| 看板拖拽 | 不优先 | dnd-kit |
| 已有 CSS transition 已经达标 | 不引入 | CSS |

本仓库没有做过 GSAP 和 Motion 的性能对打，不要写「更快」。

SSR：使用 timeline 的组件放在客户端。服务端不要碰 `window` 或 `document`。

## 2. 模型

```text
React 拥有文案、阶段、是否暂停
        │
        ▼
已提交的 DOM（section ref）
        │
 gsap.context(fn, host)  或  useGSAP({ scope })
        │
 Timeline / Tween /（可选）ScrollTrigger
        │
 改的是 transform / autoAlpha，不是业务数据
        │
 revert()
```

`to` 走向终点，`from` 从给定值回到当前样式，`fromTo` 两端都写明。`x` / `y` 是 transform，不是 `left` / `top`。`autoAlpha` 同时处理 opacity 和 visibility。同一属性被两段动画抢，用 `overwrite: 'auto'` 或只留一个主人，不要 `killAll` 清掉别人的动画。

位置参数：`'<0.15'` 是相对上一段**起点**之后 0.15 秒；`'>'` 接在上一段结束；`'> -0.1'` 重叠。Lab 用的 `'-=.12'` 是相对插入点提前 0.12 秒。`addLabel` 适合 seek，卡片 hover 不必上时间线。

## 3. 三层教学

### 入门：一条可重播的时间线

Lab 的 basic 就是这个层次，只是没有单独的暂停按钮。重播靠拆掉 context 再创建。减少动态时三个（或四个）卡片仍在文档流里，键盘可以走到。

### 业务：视觉跟随状态，而不是动画决定状态

研究稿里的「草稿 → 审核 → 发布 → 归档」**没有**做进本示例。若你要做：阶段、按钮 disabled 和 aria-live 文案放在 React；GSAP 只动装饰条的 transform。`onComplete` 不能当作「发布接口成功」。接口成功后再改状态，状态变化再触发动画。终态不能被连点跳过。

### 进阶：滚动叙事（本 Demo 未挂载）

ScrollTrigger 要单独 `registerPlugin`。`start: 'top 88%'` 表示目标顶部到达视口 88% 处。`toggleActions` 是进入、离开、反向进入、反向离开四段。`scrub` 把进度绑到滚动。`pin` 会改布局，只在叙事真的需要固定时用。`ScrollTrigger.refresh()` 在布局稳定之后调用，不要每帧调用。容器内滚动要设 `scroller`，不能假设都是 window。

减少动态用 `gsap.matchMedia()`，查询不匹配时还原该分支，而不是把时长改成 0 仍把文字藏起来。Lab 的做法更直接：减少动态时根本不 `timeline()`。

## 4. 反例

### 反例 1：无作用域的类名

```tsx
useEffect(() => {
  gsap.to('.card', { x: 20 })
}, [])
```

页面上每张 `.card` 都会动。Lab 把 context 的宿主设成 section，选择器只匹配里面的节点。卸载必须 `revert()`。

### 反例 2：点击里新建的 tween 没有主人

```tsx
<button onClick={() => gsap.to('.badge', { x: 100 })}>点我</button>
```

这段动画发生在 context 回调之外，卸载不会还原它。用 `useGSAP` 时包一层 `contextSafe`。用现在的写法时，点击只调用已经放进 context 的 timeline（`pause` / `reverse` / 增加 generation），不要在事件里裸 `gsap.to`。

### 反例 3：依赖变了，旧时间线还在

`useGSAP(fn, { dependencies: [value] })` 默认不一定在更新时 revert。需要重建就写 `revertOnUpdate: true`。Lab 的 effect 依赖 `level`、`generation`、`reduce`，清理函数先 `revert()`。漏掉清理就会叠多条 timeline。

### 反例 4：每一帧 setState

```ts
gsap.to(node, {
  x: 100,
  onUpdate: () => setOffset(Number(gsap.getProperty(node, 'x'))),
})
```

视觉插值留给 GSAP。Lab 只在百分比整数变化时写进度，供 `<progress>` 读。不要用 React state 驱动 transform，同时又让 GSAP 写同一个 transform。

### 反例 5：减少动态只是把时长改成 0

时长为 0 仍可能把元素留在 `autoAlpha: 0`。正确做法是不创建动画，静态内容保持可聚焦。Lab 在 `reduce` 时直接 return，并显示说明。

### 反例 6：全局清理

`gsap.globalTimeline.clear()` 或无差别 `kill()` 会拆掉别的组件。只 `revert` 自己的 context。

### 反例 7：React style.transform 和 GSAP 一起写

一边 render 写 `style={{ transform }}`，一边 `gsap.to` 写 x，后写的把前写的盖掉。这条轴只留一个主人。

## 5. SSR、焦点、门户

Portal 里的节点不在 section 里面时，context 的选择器找不到它，滚动和定位也要单独测。动画不能拿走按钮的键盘焦点。中文输入法不是 GSAP 的责任；若时间线期间锁住了输入，那是你的 overlay 写错了。

移动端先问 pin 是否吃掉滚动。本示例没有 pin。

## 6. 组合

- 和 Motion：布局动画用 Motion，精确倒放的编排用 GSAP，不要两套同时改同一节点的 transform。
- 和 Query：请求结果写进 React，再由 effect 重建 timeline。不要在 `onComplete` 里发请求。
- 和图表：图表库自己有动画开关。GSAP 再去 tween 图表 DOM，resize 时两边打架。

## 7. 练习

1. 给 advanced 增加 `seek` 到 50%。减少动态时这个控件必须无效，内容仍可见。
2. 做四态工作流，但阶段只存在于 React。连点不能跳过归档。卸载后用 DevTools 确认没有残留 inline transform。
3. 若加上 ScrollTrigger：窄屏和减少动态两条 `matchMedia` 分支，都不 pin。布局变化后只 `refresh` 一次。

## 8. 证据

`timeline-policy` 是纯函数，不 import gsap。浏览器里要看：重播、暂停、倒放、隐藏标签、减少动态、StrictMode 双调用。没有收据就不要写 PASS。

## 9. 资料

- https://gsap.com/resources/React/
- https://gsap.com/docs/v3/GSAP/gsap.context()/
- https://gsap.com/standard-license
- https://www.npmjs.com/package/gsap
- ScrollTrigger：https://gsap.com/docs/v3/Plugins/ScrollTrigger/
