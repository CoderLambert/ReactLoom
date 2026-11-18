# react-spring：把状态目标变成连续运动

通知卡从强调到淡化、新闻从列表中退出时，业务状态先发生变化，视觉才追上目标。`@react-spring/web` 提供 `useSpring`、`useTransition` 与 `animated`：前两者计算 SpringValue，后者把活动值写入真实 DOM 样式，不需要应用每帧 setState。弹簧可在运动途中接收新目标，默认物理模型没有固定毫秒时长。

本例固定 **@react-spring/web 10.1.2 / React 19.3.0，MIT**。匹配版本安装包与固定提交的 peerDependencies 均支持 React / ReactDOM `^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`；不能把“v10 仅支持 React19”套在10.1.2上。本文不把 peer 声明当成所有 React 版本已回归。新闻是本地确定性 fixture，没有请求、订阅服务或模型调用。

适合目标频繁改写的局部视觉变化与列表进出场。静态 hover 可用 CSS；布局/手势组合可比较 B01 Motion；跨元素时间线可比较 B02 GSAP；拖拽排序由 B13 等库负责。动画库不管理焦点、业务容量或 HTML 安全。

## 三个可操作目标

### ① 状态目标与单元素弹簧

打开 basic，用键盘或鼠标点击“收起视觉强调”。目标文字立即变成“淡化”，卡片真实 `opacity` 收敛至0.45，`translateY` 至18px；再“展开视觉强调”回到1与0px。可以在运动中反复切换，不需要等待一次动画结束。卡片收起只是淡化，内容仍可读，按钮的 aria-pressed 表达当前目标。

```tsx
const style = useSpring({
  opacity: expanded ? 1 : 0.45,
  transform: expanded ? 'translateY(0px)' : 'translateY(18px)',
  immediate: reduced,
  config: { tension: 240, friction: 28 },
})
return <animated.div style={style}>今日开发精选</animated.div>
```

布尔值是输入目标，SpringValue 是当前视觉值；`animated.div` 是目标 DOM 的写入端。config 控制物理感受，不承诺恰好多少毫秒。不把样式转成 JSON 冒充动画结果，也不用每帧 onChange 回写业务 state。

### ② 权威数组、稳定身份与安全离场

business 初始两篇新闻。添加产生单调自增的 `rss-3` 等 ID，上限12条，添加按钮在满员时原生 disabled。移除后“当前业务 ID”和逻辑数量立即变化，useTransition 可能继续保留离场的视觉节点，动画结束才移除 DOM。

```tsx
const transitions = useTransition(articles, {
  keys: item => item.id,
  from: { opacity: 0, transform: 'translateX(22px)' },
  enter: { opacity: 1, transform: 'translateX(0px)' },
  leave: { opacity: 0, transform: 'translateX(-22px)' },
  immediate: reduced,
  config: { tension: 240, friction: 28 },
})
```

这里是 `@react-spring/web` 的 useTransition，和 React 并发 hook 同名但职责不同。回调第三参的 `transition.phase` 来自真实 SDK，写入行的 data-phase；它不是业务存在性的依据。

应用在同一次提交中按权威 `articles` 的 ID 判断 active：离场行立即 `aria-hidden`、`inert`，且不再渲染移除按钮。这样视觉离场不会继续承载可点击、可 Tab 或读屏的旧操作。CSS pointer-events 是补充，不代替 inert 或拆除按钮。恢复默认把数组回到两条种子，但不会把新增ID计数器重置；同一稳定ID在离场中回来由SDK接续，不用 index 当 key。

删除前若按钮实际持焦，layout effect 等 React 提交后再聚焦“添加”；删除后已从12降至11，添加已重新启用。未持焦的程序路径不抢焦点；策略保留“仍满员则去恢复默认”的兜底。焦点移动不等待动画结束。数组、容量和焦点属于本例业务逻辑，SDK负责插值与视觉节点生命周期。

### ③ 本例减少动画、系统同步与边界焦点

advanced 的“仅本例减少动画”让同页其它演示不受影响。本例有效策略为 `systemReduced || localReduced`，传给 spring 和 transition 的 immediate。打开本地开关后再切换卡片，直接抵达目标；取消本地开关恢复物理过渡。系统偏好为 reduce 时，即使本地开关未选也保持 immediate，不能用本地选择关闭系统偏好。

系统偏好通过本地 matchMedia 读取与 change 监听动态同步，卸载移除这一条监听。没有调用 Globals.assign。官方 useReducedMotion 会设置全局 skipAnimation；需要应用级统一策略时可在根使用，独立 Lab 示例选择局部 immediate 避免影响其它实例。

用键盘添加到12条，然后聚焦某篇“移除”并按Enter；逻辑数变11、旧操作立即撤下，焦点回到已启用的添加按钮。打开减少动画后快速添加、移除、恢复默认，仍然依靠业务数组和稳定ID，不能把“动画未结束”当作数据未删除。

## 迁入业务项目

1. 安装匹配 React peer 的 `@react-spring/web`，只使用 DOM target。本例已经真实导入，不依赖 `@react-spring/three` 或额外手势库。
2. 复制 `examples/example.tsx`、`article-policy.ts`、`styles.css`；`demo.tsx` 只是Lab默认重导出，可在项目路由中直接导入 SpringExample 并传 level，或抽取其中目标。保留 CSS import，布局不依赖宿主的 demo-controls。
3. 把本地 seed 替换为已有数据层的权威数组；不要在动画 onRest 再删除第二次。服务端数据可放 Query，动画只消费它，业务 id 要稳定且唯一。
4. 保留离场时的 aria-hidden/inert/按钮拆除与提交后焦点迁移。服务端渲染若复用 matchMedia 初始值，需要业务自行约定 hydration 策略；当前Lab只在浏览器挂载，不声称已验SSR。
5. effect 拥有 matchMedia 监听并对称移除。useSpring/useTransition hook 在卸载时停止各自 Controller，匹配10.1.2源码中 useSprings/useTransition 的 cleanup 已核对；不手工修改全局 skipAnimation 或停止其它实例。若未来加入自己创建的命令式 Controller，应自行 stop。

本例没有指针跟手、异步通知中心、请求取消或拖拽排序。不要复制不存在的 workshop 文件，也不要用 setTimeout 模拟网络后声称测试了请求竞态。

## 两个常见误用

| 误用 | 对应做法 |
| --- | --- |
| 离场仍留可点按钮，等 onRest 才移除权限/操作 | 业务数组先更新；离场立即撤操作和交互语义，视觉由SDK完成 |
| 用全局 skipAnimation 控制一个组件，或把系统偏好被本地关闭 | 局部 immediate；effective=系统偏好或本地 opt-in |

`mass/tension/friction` 影响收敛，`clamp` 可抑制过冲；`duration` 是另一种模式，本例没有启用。大量 Controller 仍有成本，长列表应先虚拟化。没有 FPS/性能跑分、触摸、读屏或 SSR 验收结果。

## 官方原文与可复核边界

匹配 `v10.1.2` 的不可变提交为 `59b1e5306402d3039120e2da464b66e10b1a1aa1`。完整 Git tree 的 README 候选已检查，未发现上游中文 README。主目标 `targets/web/README.md` 本身只有41字节的 DOM target 说明，原样保存到 official/readme.md；完整项目 README 3525字节另存 official/project-readme.md，不拼接冒充目标包原文。repo/path/version/lang/time/SHA-256 和候选见 library.json 与 official/source-audit.json。

官网实际 GET200 的完整响应头在 official/homepage-response.json，该次 XFO/CSP 均未出现；未从Lab origin实测iframe，所以unknown并保留直达，不能由200推定allowed。

Node真实SDK测试2项直接操作SpringValue并使用公开 advance 驱动真实物理积分，覆盖收敛、immediate和取消。它不挂载hook或animated DOM；5项策略只覆盖容量/身份/焦点目的地。真实 DOM 插值、离场隔离、键盘焦点、系统偏好更新与卸载由主控按 validation/browser-proposal.txt 在稳定候选验证。正式sdk/build/browser均NOT_RUN，实际命令、日志和六项结论在local-validation.md。

官方入口：[useSpring](https://www.react-spring.dev/docs/components/use-spring)、[useTransition](https://www.react-spring.dev/docs/components/use-transition)、[useReducedMotion](https://www.react-spring.dev/docs/utilities/use-reduced-motion)、[匹配包peer](https://github.com/pmndrs/react-spring/blob/59b1e5306402d3039120e2da464b66e10b1a1aa1/targets/web/package.json)。
