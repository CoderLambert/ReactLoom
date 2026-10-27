# GSAP：React 中管理 timeline、交互与生命周期

## 适用场景
跨多个元素的顺序动画、时间线、暂停/反向、精细微交互。与 Motion for React 的组件/布局动画、react-spring 物理模型并列选型；简单 CSS transition 不需要 GSAP。

## 安装与许可
生产示例需要 gsap@3.15.0：pnpm add gsap@3.15.0 。GSAP 使用 **Standard No Charge** 条款，不能写作 MIT，也不能把“免费使用”等同于任意分发/二次打包。官方：https://gsap.com/standard-license ，需针对产品模式单独审核。

## 三层场景
basic：fromTo + ease 对两个卡片实现入场；business：timeline + stagger 控制不同卡片的开始时序；advanced：播放、暂停、反转、重播，监听 prefers-reduced-motion 并提供无动画降级。三个层次调用同一真实示例 examples/example.tsx，examples/demo.tsx 只是导出适配。

## 机制与资源边界
GSAP 会修改元素 inline style；在 useEffect 中使用 gsap.context(callback, scopedRoot)，所有 selector 必须限定 scope，清理调用 context.revert()，而不是全局 gsap.killTweensOf('*')。每次 level/replay/reduced motion 变化先清理旧 context，再建立新时间线。React StrictMode 双挂载必须验证原样回退。

## 反模式和修复
1. **全局类选择器**：污染其他卡片 → 传入 scope ref；复杂组件优先使用元素 ref。
2. **不清理动画**：卸载后继续更新或样式残留 → context.revert + 移除事件监听。
3. **忽略系统减少动画**：用户可能出现晕动或认知负担 → matchMedia 检测并直接呈现内容。
4. **render 中创建 timeline**：每次重渲染都叠加动画 → 仅effect初始化并稳定清理。
5. **逐帧触发大树重绘**：进度状态可限频，复杂动画交给 GSAP 改真实DOM，不要每帧 setState 大组件。
6. **错将 React ref 复用为所有权全局对象**：timeline 必须局部拥有，与业务组件同生同灭。

## 业务适用与组合
新闻卡片入场只需要 CSS 或 Motion 即可；需要跨组件时间线时 GSAP 有意义。与 Embla Carousel 组合时慎重区分谁持有 transform，避免同一节点同时被两库控制。只作小范围容器内动画，不覆盖导航/焦点的交互能力。

## 验证与练习
调度真实依赖后检查 pause/play/reverse、replay 和 reduced-motion；StrictMode 切换Tab检查 context.revert 后 inline transform 不残留。无浏览器执行时 status 必须 NOT_RUN，代码能通过静态解析不意味着设备交互已验收。
参考：https://gsap.com/resources/React/ ; https://gsap.com/docs/v3/GSAP/gsap.context()/ 。


## 后台播放、手动暂停与初帧减动补丁（2026-10-27）
`timeline-policy.ts`统一判断：页面隐藏、用户暂停或系统开启reduced-motion，任一成立都不得播放。可恢复的`tl.pause()/resume()`使返回前台后继续原位置；手动暂停状态在visibility切换后保持。首屏读取reduced-motion，进度夹紧0–100。visibilitychange和matchMedia均卸载监听；GSAP/StrictMode需实际浏览器验收。
