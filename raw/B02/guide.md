# GSAP：先看时间怎样映射成样式，再编排一组动画

摘要卡片需要按明确时序进入，并支持暂停、定位和倒放。GSAP负责把时间映射为对象属性；在浏览器里，包内CSSPlugin把这些值写到DOM的transform/opacity。它适合精确编排。单个简单过渡可先用CSS，React布局进出场可比较Motion。本例不提供发布接口或工作流状态机，视觉完成不代表业务成功。

固定 `gsap@3.15.0`，没有安装或调用 `@gsap/react`，也未使用ScrollTrigger等额外插件。许可证是Standard “No Charge”，不是MIT。官方条款对可视化动画搭建产品等使用另有限制，具体分发/嵌入应核对 [官方标准许可](https://gsap.com/standard-license/)，不能从“免费”推导无限制。本例只演示预设摘要卡片的局部动画，不把GSAP复制进ReactLoom模板。

## Tween是属性变化，Timeline是时间容器

Tween定义目标、起止值、时长与缓动；Timeline把多段Tween放进同一时间树。React保存文案、控制意图和少量进度，GSAP拥有目标样式。卡片本身是本地fixture，不是远程新闻响应。

```ts
const tween = gsap.fromTo(target,
  { x: 0, opacity: 0.35 },
  { x: 60, opacity: 1, duration: 1.2, ease: 'none', paused: true },
);
tween.progress(0.5, true); // 50%时间；true抑制此次定位的回调
// 真实返回：progress() = 0.5，线性x = 30，opacity = 0.675
```

x是transform的像素平移，不是left；duration单位是秒。progress是0..1的时间比例，不是已经走过的像素比例。`fromTo`明确给出两端，创建时会应用起点；内容最低opacity为0.35，控件始终位于动画目标之外，不借动画改变焦点或业务状态。

## 目标一：同一个50%，为何位置不同

打开“Tween的时间比例与缓动映射”。选择“线性 none”，用“手动时间进度”定位50，动画会暂停。展开“查看真实动画与样式”，点“读取真实动画状态”：预期progress0.5、duration1.2、x30，计算样式matrix的平移也对应30px。

改为power2.out后重新定位50：预期时间仍是0.5，x却是52.5。它将更多位移放在前半段；终点仍是60px，不是多走一段距离。缓动切换会revert旧动画并重建起点，保留用户暂停意图；再次定位才能比较同一时间。这个数值也由共享builder的真实Node SDK用例核对，DOM输出仍需要浏览器。

“重播动画”创建新一代局部动画；“暂停/继续”操作现有对象。手动滑块用实际pause/progress，不以React state逐帧驱动transform。自动播放时，原策略仅在至少5个百分点变化及端点更新进度；它不是“每个整数都更新”，更不是性能采样。手动定位即时显示用户选择。

## 目标二：标签、重叠与播放所有权

打开“时间编排、方向与局部所有权”。四张卡片每张0.6秒、相邻开始间隔0.14秒，卡片尾部在1.02秒完成；详情从detail标签0.7秒开始，持续0.4秒，所以Timeline总时长1.1秒。详情与卡片尾段重叠，不是等待卡片全部完成才开始。

```ts
gsap.timeline({ paused: true })
  .addLabel('cards', 0)
  .fromTo(cards, { y: 24, opacity: 0.35 },
    { y: 0, opacity: 1, duration: 0.6, stagger: 0.14 }, 'cards')
  .addLabel('detail', 0.7)
  .fromTo(detail, { y: 8, opacity: 0.35 },
    { y: 0, opacity: 1, duration: 0.4 }, 'detail');
```

这是编排结构，实际ease/onUpdate以同源motion.ts为准。“定位详情标签”调用pause().seek('detail', true)，读状态可见time0.7、labels和两个真实子Tween的开始/时长。手动定位75%后“反向播放”，progress应下降；回到起点会触发反向视觉完成。起点的反向按钮禁用，避免暗示还能向前面的负时间运动。暂停后“继续”保留当前反向方向；重播重建时回到正向。

页面进入后台时暂停。返回前台只有用户未手动暂停才resume；resume不会把reversed状态改成正向。系统减少动态时revert原context，不创建任何动画，内容恢复静态可见、进度显示100、运动控件禁用。偏好恢复会新建动画，但不会抹掉用户暂停意图。真实后台切换需要浏览器原生visibility，不伪造document.hidden。

## context负责范围与还原

```ts
const context = gsap.context(() => {
  // 本例在这里调用motion.ts；选择器只查host后代
  animation = createCardTween('.b02-card', ease, publish);
}, host);
// 卸载或重建：先阻止迟到UI回写
context.revert({ suppressEvents: true });
```

两个目标都在专属宿主context里创建动画；点击只控制已有对象，重播才由effect创建下一代。没有在context外裸建点击Tween，也不调用globalTimeline.clear/kill或全局ticker.sleep。revert还原原始内联样式并移除本context动画；GSAP共享ticker可能仍为其他动画运行，不承诺整个页面立即零rAF。

清理观察来自实际getTweensOf与目标样式，还原标记只是本例写入的检查点，不能单独当作原生资源验收。动画回调有disposed守卫；matchMedia和visibility监听成对移除。滚动叙事、布局动画、回弹物理、门户节点和网络取消不在当前能力中。

## 迁移

复制五个sourceFiles：demo.tsx、example.tsx、motion.ts、timeline-policy.ts、workshop.css。demo只重导出，其他文件不依赖Lab alias或公共CSS。React管理控件及文案，GSAP只写卡片和详情的transform/opacity，不要让React style或另一动画库同时写这些属性。没有额外图片、字体或插件资源。

需要浏览器DOM和gsap3.15.0；组件初始化读取matchMedia，因此SSR应用须让整个查看器client-only并禁用该子树SSR，单加客户端组件声明仍可能预渲染，不能保证hydration一致。替换为官方useGSAP时再处理scope/contextSafe/revertOnUpdate，不把未调用的封装说成当前依赖。

## 官方原文与结果边界

官方3.15.0提交 [`13e2b790`](https://github.com/greensock/GSAP/blob/13e2b790546426a1a2e0e9b409f3f8dc6d6611f2/README.md) 的根目录只有英文README.md，无官方中文候选。保存未改原文6199字节，精确版本/语言/时间/sha见official元数据；核心接口同时按安装源码/类型核实。[context原理](https://gsap.com/docs/v3/GSAP/gsap.context()/) 说明作用域与revert。

官网实际GET200含X-Frame-Options:sameorigin，明确限制跨源Lab嵌入，保留直达而非iframe；未运行实际Lab-origin预览，不宣称allowed。README中的远程素材由平台原文策略处理，不为它放宽公共权限。

真实Node SDK3项只在普通数值对象上运行共享Tween/Timeline、缓动、标签和revert，没有伪造DOM/CSS或自动时钟；纯策略6项另记。实际 DOM 动画、播放时钟、减少动态、visibility 和卸载样式还原的覆盖见本地浏览器证据。正式verification仍NOT_RUN，完整命令/日志/六项见local-validation.md。
