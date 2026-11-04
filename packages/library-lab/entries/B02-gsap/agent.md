# B02 GSAP — Agent 工程迁移指南

版本 gsap 3.15.0，许可证 GSAP Standard No Charge（不是 MIT），先核对授权：https://gsap.com/standard-license 。

**何时使用**：需要多元素时间线、反向播放、复杂同步编排时使用；简单组件显隐可以用 CSS/Motion。阅读 library.json、verification.json 后再迁移。
**源码真相**：examples/example.tsx 是可复用的真实实现；examples/demo.tsx 仅转发，网页源码展示由同一文件生成。
**不得删除的清理**：gsap.context(callback, ref) / context.revert，matchMedia 的 add/removeEventListener；effect重跑应清掉旧 timeline；所有 selector 受 ref scope 约束。
**可靠性**：尊重 prefers-reduced-motion、只让一方管理 transform、保证 DOM 当前挂载后才创建动画，业务导航/焦点不依赖动画完成。生产 SSR 动画只能从客户端生命周期开始。
**反例**：全局 gsap.to('.card')；render中创建 timeline；用一次 gsap.killTweensOf('*') 清整个页面；关闭 Tab 后仍设置 React state；在减少动画时隐藏真实内容。
**检查**：确认真实包 import、严格TS和生产构建、浏览器 replay/pause/reverse、StrictMode 双挂载、切 Tab 无遗留动画、键盘可读。当前三个验证维度均 NOT_RUN，不能将旧附件报告充当新SDK通过。
**组合**：B01 Motion替代，B03 spring替代，B19 Embla协作时隔离 transform 所有权。

**2026播放补充**：`timeline-policy.ts`区分用户手动暂停与后台自动暂停；visibility恢复仅在未手动暂停时续播。初次渲染读取reduced-motion并清理监听。勿在hidden页面强制play。

**第22轮进度限频**：逐帧style由GSAP负责，`shouldPublishProgress`限幅React状态（相差≥5%或0/100终点）；重建timeline时重置`displayedProgress`，避免沿用旧阶段进度。策略单测PASS不代表SDK和浏览器验收。
