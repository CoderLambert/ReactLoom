# Motion for React：业务先改变，动画处理视觉过渡

任务归档后，业务数组应立即减少；用户又希望看见卡片退出、其余行移动。Motion把React目标状态与真实DOM动画连接起来，适合入场/退出和适量布局变化。简单hover先用CSS；完整拖放/键盘排序看B13/B14，焦点陷阱和弹窗语义看无头组件库。动画不是保存请求、任务队列或焦点管理器。

本例固定 `motion@14.6.0`，入口 `motion/react`；实际转出framer-motion14.6.0，底层motion-dom14.6.0，宿主React19.3.0满足peer。使用MIT核心API，没有Motion+资源、网络、持久化或服务端任务。原创任务数据只用于观察 **presence → 列表身份与焦点 → 布局重排与减动**。

## 一张状态图

```text
React visible / cards → 新的业务事实与DOM目标
                       ↓
              motion initial / animate
                       ↓
AnimatePresence保存退出子树 → exit完成 → 移除真实DOM

系统媒体偏好 → 本例实时策略 → 位移/时长/layout目标
归档时持焦检查 → React提交 → 仍存在的添加按钮
```

React管理事实；Motion处理视觉生命周期。onExitComplete是SDK报告退出结束，不是业务提交完成。本例计数只用于观察，不在回调里删除任务。

## 实验一：React没有它了，DOM为何还在

打开“进入和离开动画”。首次已显示提示卡，AnimatePresence initial=false抑制初次树挂载的入场，不等于以后新增也不动画。点击“隐藏提示卡片”，业务visible先变false，真实useIsPresent变false，卡片在退出阶段短暂显示exiting，约0.24秒后从DOM移除，SDK退出完成计数增加。

```tsx
<AnimatePresence initial={false} custom={reduced}>
  {visible && <Notice key="notice" />}
</AnimatePresence>
```

Notice内部是motion.article，正常进入从opacity0/y14到opacity1/y0，退出到opacity0/y-10。presence留在条件外；稳定key使SDK知道谁正在退出。快速隐藏/显示仍代表同一notice身份，不能把点击次数等同完成退出次数。

退出组件已离开React父级业务数组，普通旧props不能继续当实时输入。本例用custom/usePresenceData观察SDK传入值，实际实时减动由标准React上下文提供给包括退出子树在内的组件，不依赖冻结的旧props；useIsPresent只反映SDK存在性。退出DOM被aria-hidden/inert隔离，不伪造“业务还没归档”。

## 实验二：列表事实、DOM身份和焦点

打开“可维护的任务列表过渡”。添加任务得到新id，最多12项；归档后“当前任务”立即减少，退出行可暂留，但data-present=false、inert且归档按钮禁用。其余任务的id不变，Motion等待退出动画结束再移走退出DOM。

列表以card.id为key，不用位置下标。追加/归档/容量拒绝是 [card-policy](examples/card-policy.ts) 的纯逻辑，不依赖动画时长。新id在点击事件里分配，不在可能重放的React updater里分配。标题可以相同，业务id仍唯一。

用Tab到一行“归档”并Enter：若该按钮当时确实持焦，React提交后用layout effect把焦点交到添加按钮；被删除的按钮仍在退出DOM不应再收键盘。若外部代码或鼠标行为没有让被删按钮持焦，不抢别的控件焦点。归档到0项有明确空态，仍可添加。

committedCards ref记录已提交数组，退出旧行即使还持有旧回调也不能再次归档已不存在的id。Motion不负责这些业务与焦点规则。默认sync模式让进入/退出并行；本例没有popLayout、拖动排序或搜索筛选。

## 实验三：改变顺序，保留身份

打开“重排与减少动画偏好”，点“把第一项移到最后”。顺序1,2,3变为2,3,1，真实li仍是原来的DOM节点；layout测量新位置，用transform过渡到新布局，而不是重建任务。它不决定顺序，数组的moveFirstToEnd才决定顺序。

“恢复初始列表”恢复id1/2/3并清除待回焦标记；nextId保持单调，避免与退出中的新增行冲突。空/单项时禁用重排按钮。没有Reorder拖动、跨列碰撞、自动保存或layoutId共享元素，不把同一次数组轮转称作拖放系统。

系统开启减少动态后，位移目标为0、入场initial=false、时长0、父/子layout=false；功能和键盘操作仍可用。关闭偏好后恢复正常目标，不为偏好切换重建业务数组或更换任务key。退出移除仍经SDK生命周期，不能承诺同步零DOM暂留。快速切换、偏好变化时的在途动画细节需要真实浏览器验收。

## 14.6.0的减动实现差异

在线说明与安装hook注释声称useReducedMotion会主动更新，但实际14.6.0的实现只有useState(prefersReducedMotion.current)，没有状态更新setter，还留有自动更新TODO。实际VisualElement在挂载时计算自己的减动策略。因此不能仅用这个hook声称已经支持运行中系统设置变化。

本例 [reduced-motion.ts](examples/reduced-motion.ts) 自有matchMedia change监听，并在卸载removeEventListener。根MotionConfig reducedMotion=never表示**禁用SDK的静态自动决策，由本例完整拥有实时策略**；所有本例位移、layout与时长都显式读取这个策略，不是忽略系统偏好。复制代码时要整套保留，不能只复制never而丢掉门闩。

通常MotionConfig reducedMotion=user确实会关闭其管理的transform/layout，而opacity等仍可动画；旧稿“它对自定义x/rotate一概无效”不准确。这里选择自有策略是为核实到的固定版本动态更新限制，不是建议全站关闭自动减动。若升级版本，应重新检查源码并决定能否直接用SDK的响应式能力。

## 迁移、清理与限制

复制example.tsx、presence-items.tsx、reduced-motion.ts、card-policy.ts、workshop.css；demo.tsx仅Lab导出。MotionConfig包住本例，AnimatePresence保持挂载，业务key稳定。必要CSS包含列表grid、间距和焦点样式，无Lab alias/其他资源。

useIsPresent/usePresenceData只在presence内部调用。应用只管理自己的媒体监听和提交后回焦，没有自建timer/RAF；Motion负责自己的动画资源。停止/离开会卸载整棵presence，此时不等待内部退出动画，不能把“卡片退出”配方当作“整页卸载”效果。

不要在onAnimationComplete/onExitComplete里才提交业务删除，不让两个动画/定位引擎同时写一个DOM transform。layout需要真实测量，海量行会有成本；0.24秒是配置，不是实测帧率或合成线程保证。本例没有IME输入、HTTP、滚动叙事、弹窗、共享layoutId或Motion+，不用未挂载功能充当教程主体。

## 官方原文和验证边界

v14.6.0固定commit `3397236ea600094f09513fbb2bfb084dc95f5982`，packages/motion/package.json为14.6.0。完整递归tree无官方中文README，选择根 [英文原文](official/readme.md)，7475B，SHA-256 `08915bb5254a4bc1fd47e8d7ea8fff0dcb470461f6fd6b59fb6d2f0bef0400df`，[固定出处](https://github.com/motiondivision/motion/blob/3397236ea600094f09513fbb2bfb084dc95f5982/README.md)。版本/语言/日期/全部HTTP响应头见 [source-evidence](official/source-evidence.json)，没有改写为中文教程。

[presence](https://motion.dev/docs/react-animate-presence)、[layout](https://motion.dev/docs/react-layout-animations) 及安装14.6.0实际类型/源码共同核对；在线文档可能更新，冲突按上段明确处理。官网GET200完整头无XFO/CSP，未真实Lab iframe，所以unknown与直达，不能从200改allowed。

Node真实React SSR检查只证明Motion组件/上下文与initial=false静态目标；原4项策略只证明数组规则。两者都不证明退出动画、布局、偏好切换或键盘焦点。实际命令/日志与六项见 [local-validation](local-validation.md)，真实浏览器提案在validation/browser-proposal.txt；formal verification三项仍NOT_RUN。
