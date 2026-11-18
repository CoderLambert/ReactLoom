# B21 旧react-motion → 现代motion/react迁移

只运行motion14.6.0 / React19.3 / MIT，现代peer18/19；旧react-motion0.5.2 peer0.14/15/16，仅读固定官方资料、未安装/导入/运行。禁止绕peer安装旧库或把现代SDK通过冒充旧库通过。

## 三目标与API

basic旧Motion+独立spring描述迁为数字animate+transition及真实presence折叠；business旧TransitionMotion按稳定id迁为reducer即时提交+AnimatePresence popLayout；advanced单步undo恢复数组/选择、单调id/24容量、必要提交后回焦和实时系统减动。StaggeredMotion跟随不等于时间stagger；参数同名不保证轨迹等价。无HTTP/旧SDK对照运行/取消请求/持久化。

## 必须保留

open/数组先变，SDK退出DOM暂留时useIsPresent=false→inert/aria-hidden/buttons disabled，不能把aria-expanded=false解释为DOM必须立即不存在。Row额外guard与父级committedItems拒绝冻结旧回调；只有被删按钮当前持焦才在useLayoutEffect回存活邻居/添加，不等动画、不抢无关焦点。key永久业务id，恢复不会回退nextId。

TaskRow forwardRef到实际motion.li，popLayout依赖真实ref，ul position:relative。initial=false只压第一次入场；onExitComplete计数是视觉观测，不写业务事务。短时间undo可使同key重新进入，数据恢复不等动画完成。

实装14.6 useReducedMotion只有挂载快照。自有matchMedia change监听+cleanup，React ReducedMotionContext让退出子树也得到实时值。MotionConfig never关SDK静态策略，所有y/scale/layout/duration完整显式尊重实时OS；不能只抄never丢门闩。应用只清自己的media/ref/焦点意图，SDK拥有动画/测量，绝不全局stop。

## 迁移和精确操作

pnpm add motion@14.6.0；复制example/presence-items/reduced-motion/task-history/migration.css，demo.tsx仅出口。无宿主alias/运行资产。region“react-motion 现代迁移示例”，b21-workshop/data-level/data-reduced/data-order；basic“折叠卡片/展开卡片”、b21-open/details；列表按钮“添加任务（最多24）”、任务选择名/“删除 {任务名}”、advanced“撤销上一步”。data-task-id及data-present对应真实业务身份/SDK presence。b21-tasks-status、b21-state是真reducer读数，b21-exits是真现代SDK视觉回调计数。

## 验证边界

旧SDK始终NOT_RUN；现代SDK局部SSR2项只证明接口/标记，pure4项只证明业务事务。本地Chromium已完成三个目标及官方展示共4项：折叠退出/打断、列表身份/退出交互与必要回焦、原子undo/ID/实时减动/窄屏/卸载重挂载；完整断言见validation/browser-proposal.txt。真实OS读屏/触摸、SSR hydration、全局监听/RAF内存、多实例、旧runtime/跟随弹簧及HTTP/持久化/大列表性能仍未验收。formal sdk/build/browser三项NOT_RUN，实际命令与混合批次退出码见local-validation。

## 官方

现代主README固定npm gitHeadc624ce8e907d5668280b8c832f2ab93ba3462ab5，manifest14.6.0，英文8259B/hash3d53967ddaef8a5c37b6623ee07376aac9f9f1d2c52c894af3e521ba864fca3f。历史只读README固定8bd4f7223a8d79535586220f7173f078d4604e07，英文15446B/hashaffc2475f70368ce3f2c1bf02bd788f6967f1e73c1a7162806e3d04824b38b30，不把旧npm peer推断成已运行失败或成功。两tree实际无中文；完整日期/headers/来源在official/source-evidence.json。目标官网GET200无XFO/CSP未验Lab iframe→unknown。
