# B21 react-motion 迁移

## 适用

审计旧的 `Motion`、`TransitionMotion`、`StaggeredMotion` 和 `spring()`，并把新界面写到 `motion/react`。不要为了对照把 `react-motion@0.5.2` 装进 React 19。简单 CSS 不必上动画库。

## 版本

目标包 `motion@14.6.0`，React 19.3.0。两份许可证都是 MIT，但 Motion+ 另计。旧 peer 只有 React 16 及更早。入口是 `motion/react`。

## 迁移

`spring(n)` 改成数字目标加 `transition.type = 'spring'`。`willLeave` 改成先更新 reducer 再写 `exit`。列表 key 用永久 id。`StaggeredMotion` 的跟随不是 `staggerChildren`。`onRest` 不承担保存。参数相同不保证轨迹相同。

## 不可删的清理

不添加 `react-motion` 依赖。`AnimatePresence initial={false}`。列表用 `popLayout`，不要 `mode="wait"`。减少动画去掉位移和 scale。删除持焦按钮后在 `useLayoutEffect` 里把焦点交给邻居或添加按钮。撤销只恢复一份快照。id 单调增加，上限 24。

## 反例

`--legacy-peer-deps` 安装旧包。`animate={{x: spring(10)}}`。`setTimeout` 之后才删除。`key={index}`。动画回调里发请求。把完成回调当成事务成功。列表套 `mode="wait"`。宣称 stagger 已经复刻跟随链。

复用时保留这些不变的约定：

- 不把 `react-motion` 写进依赖或 import。
- `spring()` 描述对象不能放进 `animate`。
- 先 dispatch 再播 exit，不用 setTimeout 延迟删除。
- 列表 `popLayout`，单卡不要套到多子节点的 `mode="wait"`。
- `StaggeredMotion` 的跟随链未挂载，不要用 staggerChildren 宣称等价。

## 测试断言

`tests/task-history.test.mts` 断言添加上限、新 id、撤销、非法选择不变。不证明 `motion` 运行时或减少动画的视觉。

## 真实限制

已挂载：折叠卡片、列表进出、layout、一步撤销、焦点恢复。未挂载：旧包源码对照、跟随弹簧、HTTP、大列表虚拟化、IME 搜索。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://motion.dev/docs/react-installation
