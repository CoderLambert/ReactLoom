# B03 react-spring

## 适用

目标会连续改写、需要可中断弹簧时用 `@react-spring/web`。静态 hover 用 CSS，layout/手势优先看 B01，排序拖放看 B13/B14。不要把本库当成拖拽或弹窗焦点系统。

## 版本

Lab 固定 `@react-spring/web@10.1.2`，React 19.3.0。v10 面向 React 19；React 18 留在 v9。不使用 11 beta，不使用 `@react-spring/three`。许可证 MIT。

## 迁移

从 v9 上来要核对 `useTransition` 的 import 来源、`SpringContext` 改名和 `onChange` 的 `AnimationResult`。把 CSS transition 换成弹簧时，稳定 id 和退场焦点留在业务层。`spring()` 旧描述对象（react-motion）不能塞进本库。

## 不可删的清理

减少动画用本地 `matchMedia` 订阅，cleanup 移除监听，把 `immediate` 传给 `useSpring` 和 `useTransition`。不要 `Globals.assign` 后忘记恢复。id 在点击里自增。焦点在 `useLayoutEffect` 里移动，满员时避开 disabled 的添加按钮。命令式 `api` 若以后加上，卸载时 `stop()`。

## 反例

从 `react` 导入 `useTransition` 来做列表动画。不传 `keys` 或用 index。`onChange` 每帧 `setState`。函数式 `useSpring` 拿到 api 却不 `start`。离场行仍可点击却没有 `aria-hidden`。`innerHTML` 写通知正文。React 18 硬装 v10。

复用时保留这些不变的约定：

- `useTransition` 的 import 来自 `@react-spring/web`。
- `keys` 使用 `item.id`，离场节点不等于仍在权威数组里。
- `immediate` 只从本地 matchMedia 传入，不调用 `Globals.assign`。
- 焦点目的地在纯函数里决定，满员时避开 disabled 按钮。
- 指针捕获和 Abort 通知中心是未挂载教学，不要写进当前 JSX。

## 测试断言

`tests/article-policy.test.mts` 断言追加唯一 id、满 12 条拒绝且不改原数组、未持焦返回 `none`、持焦且未满员返回 `add`、持焦且剩余仍达上限返回 `reset`。不证明 `animated` 宿主更新或浏览器焦点。

## 真实限制

已挂载：声明式 `useSpring`、带稳定 key 的 `useTransition`、本地减少动画、容量和焦点目的地。未挂载：指针捕获、AbortController 通知中心、离场按钮拆除、命令式 `api.start`。不要把未挂载路径写成示例已实现。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 在 `verification.json` 中为 NOT_RUN。没有 `docs/library-lab/evidence/runs/` 的匹配 receipt 就不能写成 SDK PASS。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://www.react-spring.dev/docs/getting-started
