# B02 GSAP 3.15.0 工程入口

用于精确时间编排/seek/反向；单元素过渡先看CSS，React布局动画可比较Motion。本例只用GSAP核心和包内CSSPlugin，没有@gsap/react或额外滚动插件。Standard No Charge不是MIT，具体分发/可视化搭建产品按官方标准许可核对。

两目标：basic单卡fromTo的1.2秒/60px映射，50%时间none→x30、power2.out→x52.5；advanced四卡0.6秒、stagger0.14，detail标签0.7/时长0.4，真实Timeline总1.1秒。旧business只有卡片数差异，已合并，不保留重复目标。

React存文案/意图，GSAP独占transform/opacity。motion.ts是UI和真实数值SDK共用builder，timeline-policy是纯门禁/5个百分点发布规则。显式读取snapshot来自实际progress/time/labels/children/getProperty/计算样式，不是预填坐标。手动seek暂停且抑制事件，onComplete仅是视觉完成。

context作用域绑定host；新代重播/ease或偏好变化先revert旧context。事件只控制已有animation，不裸建Tween。dispose守卫回调、对称清理matchMedia/visibility；禁止全局kill/ticker.sleep。卸载看实际getTweensOf=0和原inline样式还原，不能单信app标记。共享ticker不是本组件私有，未承诺全局rAF立即为0。

RM直接静态可见/100/不建动画；恢复偏好新建起点，保留用户暂停。后台暂停，返回仅恢复未手动暂停者且保留反向；重播新代回正向。根真实visibility若不可触发须NOT_RUN，不改document.hidden造通过。

迁移五sourceFiles（含CSS），无Lab alias/媒体资源。组件初始化读浏览器偏好，因此整个查看器要client-only并禁子树SSR，仅use-client不足；不要React/GSAP共写目标样式。

SDK3只真实数值对象，不证明CSS/时钟/DOM；policy6不import GSAP。浏览器提案覆盖两个目标的实际样式、运行方向、RM、scope和revert；日志/六项见local-validation。formal SDK/build/browser全NOT_RUN。

固定官方英文原文6199B/3.15.0/commit13e2b790546426a1a2e0e9b409f3f8dc6d6611f2，只有根README候选；来源/完整头/sha在official。官网XFO sameorigin→blocked，保留直达，不把HTTP200或load当嵌入成功。
