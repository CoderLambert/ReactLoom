# B03 react-spring — Agent 迁移手册

**什么时候选择**：React 应用里需要物理弹簧、状态动画和列表进出场时选 @react-spring/web；复杂编排选 GSAP，布局 shared layout 可比较 Motion。
版本基线 `@react-spring/web@10.1.2` / MIT。本目录没有真实浏览器 PASS，检查 verification.json 和 sourceFingerprint。

## 最小引用
读 examples/example.tsx 中 `useSpring`/`useTransition` 的实际实现。移植时复制业务状态/动画映射即可，不必携带演示固定数据和 Lab 容器样式。

## 不能省掉的规则
- `useSpring` 给已存在组件更新样式；数组增删用 `useTransition` + 稳定键。
- 系统 reduced-motion 用局部 per-hook immediate；不能在页面示例里全局修改 `Globals.skipAnimation`。
- 自定义 matchMedia change 监听必须卸载；删除聚焦元素后恢复逻辑焦点。
- 业务数据要先可靠更新，不能把 onRest 当成持久化唯一触发器。
- 不要在每帧动画过程中使整个 React 列表重渲染或发网络请求。

## 最小验收
真实依赖构建、basic 切换、business 新增/删除离场、advanced 快速切换和 reduce-motion、键盘焦点、卸载后不保留监听。未实际执行时保持 NOT_RUN。官方：https://www.react-spring.dev/docs/components/use-transition

**2026列表补充**：`article-policy.ts`将业务ID去重并限制12条；删除时仅被删按钮真正持有焦点才转到新增按钮。初次绘制前读取系统减动偏好，勿设置全局Globals。

**满额特例**：删除有焦点的行时，若新增入口因容量上限被禁用，转焦到可用的重置入口，不能focus()禁用按钮。

**第22轮焦点提交要求**：满额删除不能在 `setArticles` 后立即 `addRef.focus()`，因为React可能尚未提交，Add仍disabled。先记录焦点意图，`useLayoutEffect` 于数组提交后转至可用Add/Reset；传入剩余数量，重置清掉旧意图。离场动画与焦点交互需浏览器验收。
