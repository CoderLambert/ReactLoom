# 从 react-motion 迁到现代 Motion：先迁业务，再迁视觉

旧项目用 `Motion`、`spring`、`TransitionMotion` 表达物理插值，现在要在 React 19 中继续维护折叠、列表进出和撤销。迁移重点是保留业务状态、身份和可访问交互，再用现代动画组件表达目标；不是把旧配置逐项改名后宣称轨迹完全一致。

本条目**只安装并运行 `motion@14.6.0` 的 `motion/react`**，宿主 React19.3.0。历史 `react-motion@0.5.2` 只读取固定官方资料，未安装、未导入、未执行。旧包 peer `^0.14.9 || ^15.3.0 || ^16.0.0` 不覆盖当前宿主；现代包 peer React/DOM18或19。两者均MIT，Motion+收费资产不属于这里。不能把现代SDK通过写成旧SDK已兼容或已运行。

## 先分开四件事

| 对象 | 所属模型 | 迁移时要保留或重做 |
| --- | --- | --- |
| 旧 `Motion` + 独立导出的 `spring(target, config)` | render prop接收每帧数值，spring返回目标描述 | 业务目标仍是数字；现代写animate数字目标+transition，不是`Motion.spring`静态方法，也不能把旧描述对象塞进animate |
| 旧 `TransitionMotion`、willEnter/willLeave | 按稳定key编排进入/退出 | 先提交数组事务，现代AnimatePresence保留退出DOM；key仍是业务身份 |
| 旧 `StaggeredMotion` | 后项可跟随前项瞬时值 | 时间错开的stagger不等于物理跟随链；本例没有复制这条能力 |
| 现代 `motion/react` | motion元素、AnimatePresence、layout等 | 本页真正执行的目标SDK；不是旧react-motion，也不是react-spring |

旧stiffness/damping可作为调参起点，参数同名不保证两套求解器有相同轨迹；旧precision也不直接等价于新restDelta。迁移验收先看业务结果、打断和焦点，再调视觉。旧onRest或现代onAnimationComplete都不应该决定保存/删除是否提交。

## 目标一：Motion + spring 改为状态驱动折叠

选择“Motion + spring 到状态目标”。卡片默认展开，按钮aria-expanded对应业务open。点击“折叠卡片”后open立即false；真正的useIsPresent变false，退出DOM短暂保留，再由SDK移除。**aria-expanded不要求与退出期DOM存在性相同**；离场卡片立即aria-hidden/inert，不再作为展开内容交互。

```tsx
// 旧资料形状，仅解释，未执行：Motion和spring是两个导出
// <Motion style={{y: spring(0, config)}}>{values => render(values)}</Motion>

// 新目标形状：数字目标 + transition
<motion.div animate={{opacity: 1, y: 0}}
  exit={{opacity: 0, y: -12}}
  transition={{type: 'spring', stiffness: 260, damping: 25}} />
```

AnimatePresence保持在条件外，子项有稳定key。`initial={false}`表示第一次树挂载不播入场，以后新增/恢复仍可动画；不是“禁用全部动画”。页面的现代SDK onExitComplete计数是实际回调观测，不是业务提交计数。折叠后立即展开可以打断退出，SDK负责回到当前目标，不能另写固定setTimeout才重新出现。

## 目标二：TransitionMotion 列表迁为稳定身份事务

选择“TransitionMotion 到稳定身份列表”。默认RSS订阅源、AI模型设置、技术阅读笔记，添加产生local-1等新id，最多24项。选择按钮用aria-pressed表达选中，删除先由reducer立即更新数组/选中状态和数量，视觉退出随后发生。

1. 选中AI模型设置，再删除它：业务选择立即变无，列表数量立即减少。
2. 观察旧li退出期的data-present=false、inert、aria-hidden和disabled按钮，随后DOM消失。已经退出的旧按钮不能再次删除或选择；父级也用已提交成员ref拒绝冻结旧props中的回调。
3. 原删除按钮持焦时，在React提交后把焦点移到下一个存活任务，最后一项则前一个；没有存活邻居时回到添加按钮。不是在动画完成时回焦，未持焦的变更也不抢焦点。
4. 添加和删除其他任务时，未变身份的卡片沿用同一DOM，不能用数组index作key。空列表有明确提示且仍能添加。

本例使用 `mode="popLayout"`。直接子项TaskRow是forwardRef组件，把ref传到真实motion.li供SDK测量；ul有position:relative作为离场绝对定位的参考。`mode="wait"`只支持一个直接子项，不适合这个列表。popLayout改变视觉布局，不延迟业务提交。

## 目标三：原子撤销、单调ID与实时减少动画

选择“原子撤销、焦点与实时减动”。删除已选任务后点“撤销上一步”，同一reducer快照恢复items和selected，然后清undo，只能退一步。添加后撤销再添加会跳过已用id：local-1撤销后下次是local-2，不复用旧动画身份。选择与未知id操作不覆盖有效撤销快照；容量检查在reducer内再次执行，快速点击也不越过24。

系统运行中打开减少动画偏好，状态应立即显示已启用；本例去掉y/scale变化、关闭layout动画并设duration0，折叠/删除/添加/撤销仍可完成。切回后恢复本例正常spring。**14.6.0实际useReducedMotion实现只有挂载useState快照，没有更新setter**，与在线/注释的实时承诺不同，不能仅调用它就说已支持运行中系统变化。

因此 `reduced-motion.ts` 自有matchMedia change监听并成对清理，React上下文把实时策略送到包括退出中组件在内的子树，避免冻结的退出props保留旧策略。根 `MotionConfig reducedMotion="never"` 禁用SDK的静态自动判断，由本例完整显式控制所有位移、缩放、layout和时长；**不是忽略OS偏好**。迁移时必须整套复制，不能只留下never配置。

退出期间快速撤销可让同key重新进入；业务恢复由reducer立即决定，不能等onExitComplete再恢复数据。整页停止/离开直接卸载子树并清自有media监听，不等待内部退出动画。这里没有网络、定时业务任务或“取消请求”按钮。

## 可迁移文件与所有权

```sh
pnpm add motion@14.6.0
```

复制 `example.tsx`、`presence-items.tsx`、`reduced-motion.ts`、`task-history.ts` 和 `migration.css`；demo.tsx只是Lab出口。没有Lab alias、HTTP、外部图片、旧库依赖或动画完成后写业务的回调。level选择要展示的目标，新挂载从初始状态开始；业务状态不借localStorage持久化。

应用拥有open/reducer、实时媒体监听、提交后的焦点意图和按钮ref映射；Motion拥有presence、布局测量和动画资源。Row的useIsPresent是真SDK状态，disabled/inert/aria-hidden是应用退出交互策略。解除自己监听、卸载自己React子树即可，不能stop全局动画或删除其他页面资源。

SSR可输出现代SDK标记，客户端测量、focus和presence退出并不会在Node SSR里执行。读取原文或检查peer也不等于执行过旧SDK；局部SSR、纯reducer与真实Chromium交互的范围分别记录在[本地验证](local-validation.md)。

## 常见迁移错误

- 在React19中绕过peer安装旧包，或元数据写“实际react-motion接口”而示例只运行motion/react。
- 把旧spring描述放进现代animate；把同名数值参数或stagger当作动力学等价。
- 300ms后才删除，或在动画完成回调里才写业务；减少动画时事务就会失效。
- 退出DOM仍可Tab/点击、旧回调污染撤销，或删除后让焦点落到body。
- 自定义popLayout子项不转发真实ref，或父容器没有正确定位上下文。
- 只复制MotionConfig never而丢掉本例实时媒体/全部目标门闩。

## 官方原文与验收边界

[现代原README](official/readme.md)固定 `motiondivision/motion@c624ce8e907d5668280b8c832f2ab93ba3462ab5/packages/motion/README.md`，npm gitHead与包manifest14.6.0匹配；英文8259B，SHA-256 `3d53967ddaef8a5c37b6623ee07376aac9f9f1d2c52c894af3e521ba864fca3f`。未截断tree检查无官方中文候选，原文不翻译改写。它是运行目标SDK的主原文。

[历史原README](official/legacy-readme.md)固定 `chenglou/react-motion@8bd4f7223a8d79535586220f7173f078d4604e07/README.md`，npm0.5.2的gitHead，英文15446B，SHA-256 `affc2475f70368ce3f2c1bf02bd788f6967f1e73c1a7162806e3d04824b38b30`。旧manifest实际版本0.5.2，无中文候选；仅供API迁移对照，旧SDK运行明确NOT_RUN。完整请求/manifest/候选/同步日期在[source-evidence.json](official/source-evidence.json)。

运行目标官网https://motion.dev/实际GET200完整头未见XFO/CSP，Lab-origin iframe未实际验证，因此unknown，不能据缺头标allowed。历史仓库不是运行目标官网，也不冒充新SDK来源。

本地Chromium已覆盖三个目标中的真实退出与打断、退出期不可交互、必要回焦、布局、原子撤销与ID、运行中减动切换、窄屏和卸载重挂载，并核对固定原文及官网unknown展示。官网iframe是否可用、旧runtime与新旧轨迹等价、跟随弹簧、真实OS读屏/触摸、SSR hydration、HTTP/持久化和大列表性能仍需在相应环境验证。原始命令、退出码及各类验证范围见[本地验证](local-validation.md)。
