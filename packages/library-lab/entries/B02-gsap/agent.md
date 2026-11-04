# B02 GSAP — 工程手册

## 适用

需要暂停、倒放、按时间点交错的命令式动画。单元素过渡用 CSS。布局进出场先看 Motion。角色动画用 Rive 或 dotLottie。拖拽不要用 GSAP 代替 dnd-kit。

## 版本

`gsap@3.15.0`。许可是 Standard No Charge，不是 MIT。不要把 `@gsap/react`、第三方 `react-gsap` 和本示例混成一个包。本示例没有 ScrollTrigger。

## 迁移

复制 `examples/example.tsx` 的 `gsap.context(fn, host)` 和 `examples/timeline-policy.ts`。选择器保持在宿主节点内。`demo.tsx` 留下。业务阶段放在 React，不要放进 `onComplete`。

## 不可删的清理

卸载和依赖变化时 `context.revert()`。减少动态时不要创建 timeline，内容保持可见。页面隐藏时 pause，回到前台只恢复用户没有手动暂停的时间线。不要 `kill` 全局时间线。

## 反例

- `gsap.to('.card')` 没有 scope。
- 在 click 里裸建 tween，卸载还原不到。
- `onUpdate` 每帧 `setState`。
- React 的 `style.transform` 和 GSAP 的 `x` 写同一个元素。
- 减少动态只把 duration 设为 0，元素仍是透明。
- 用动画结束回调当作接口成功。

## 测试断言

- 减少动态：无 timeline，进度为 100，按钮仍可聚焦。
- hidden：pause；visible 且未手动暂停：resume。
- 重播和 level 变化后旧的 inline 样式被 revert。
- 进度写入次数随整数百分比变化，而不是每一帧。
- 若另加 ScrollTrigger：registerPlugin、matchMedia、不在减少动态时 pin，布局稳定后才 refresh。

## 真实限制

示例没有滚动叙事，也没有工作流状态机。`shouldPublishProgress` 不是性能基准。许可条款以官方标准许可证为准，免费商用不等于可以做成动画编辑器再分发。

## 证据

没有 `docs/library-lab/evidence/runs/` 收据就不要写 sdk / build / browser PASS。策略单测不 import gsap。
