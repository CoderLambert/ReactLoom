# Frappe Gantt 1.2.2｜图在独立文档里，计划在策略函数里

Lab 锁定 `frappe-gantt@1.2.2`（MIT）。甘特图只画条。日期是否存在、依赖有没有环、进度是不是有限数字，由 [`plan-policy.mjs`](examples/plan-policy.mjs) 决定。保存按钮在语义表格上，不在条块上。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

这不是主应用里的普通 React 挂载。主 Lab 在 `4319`。C13 的规范入口由专用 loopback 文档提供，地址是 `http://127.0.0.1:4321`（测试里也会出现 `localhost:4321`）。父页面只放 iframe。用户明确启动后，runner 才在那份文档里加载 [`examples/example.tsx`](examples/example.tsx)。离开、停止或重置会销毁整个 frame。

已检查的 1.2.2 发布包会注册捕获实例的 `document` `mouseup` 监听，没有公开的 `destroy` 或 `dispose`。`replaceChildren` 卸掉 SVG 并不能证明监听器已经释放。因此一个专用文档里只 `new Gantt` 一次，之后用 `refresh` 和 `change_view_mode`。runner 不用 StrictMode 把构造跑两遍。不要把这个示例改回主文档里的普通 `react` 挂载，再把卸载当成清理完成。

构造时复制任务对象。库会改它拿到的 descriptor。`readonly: true`，`popup: false`，避免条上的 HTML 弹层。

- **basic**：三项任务，依赖是 `research → frontend → qa`。表格只读。视图可在 Day / Week / Month 之间切换。
- **business**：表格可改开始、结束和进度。过滤只作用于表格。交给图表的仍是完整 `tasks`，否则缺依赖的子集会把拓扑弄断。
- **advanced**：结束早于开始会被 `validatePlan` 拒绝，state 不变。保存「联调回归」返回模拟 409，客户端权威数据不动。按钮「模拟依赖闭环」把 research 的依赖改成 qa，只预览错误，不写入。

`validatePlan` 拒绝重复 id、非法区间、进度不是 0–100 的有限数、自己依赖自己、未知依赖、重复依赖和环。计划跨度超过 `MAX_PLAN_SPAN_DAYS`（730 个 UTC 日）也拒绝。年份小于 `0100-01-01` 拒绝，因为上游用 `new Date(year, …)` 时会把 0000–0099 当成 1900–1999。

包的 `exports` 只公开主入口。不要在业务代码里 `import 'frappe-gantt/dist/frappe-gantt.css'`。专用 runner 用构建配置去找这份固定版本的 CSS，再叠 `examples/gantt.css`。

## 什么时候用

少量任务、依赖字符串和三种视图就够用的排程说明图。要拖拽资源、关键路径服务端计算或企业权限时，不要把这张图当成项目系统。日历视图用 C12。日期运算用 C14–C16。

图的筛选和表的筛选不是一回事。表可以只显示一行，图必须看到它的前驱。

## 数据与模型

任务是 `{ id, name, start, end, progress, dependencies }`。`dependencies` 是逗号分隔的 id 字符串，不是对象图。空字符串表示没有前驱。

所有权：

```text
表格提交 → validatePlan(整份计划)
              ├─ 有错误：不 setState
              ├─ advanced 且 id 为 qa：假装 409，不 setState
              └─ 否则 setState
图表 effect 再 validatePlan
              ├─ 有错误：不构造、不 refresh
              └─ 否则 refresh / change_view_mode
```

`GanttCanvas` 的第一次 effect 只构造。后续 effect 看 `applied` 引用：任务数组变了才 `refresh`，视图变了才 `change_view_mode`。校验失败时图表停在上一份合法计划，状态行说明拒绝原因。

环检测是 Kahn 拓扑。处理完的节点数小于任务数就拒绝。这是客户端门闩。服务端要有自己的图约束。

IME：表格里按 Enter 时，若目标是 input 且 `isComposing`，不保存。组合结束后的短窗口没有另做 80ms。迁到中文环境要再看一次。

## 三层示例

在主应用打开 frappe-gantt 的 demo，启动后再看 4321 子文档里的条和下面的表。不要在父文档的 DOM 里找 SVG 当作库已经在主树挂载。

### 基本

三条条块和箭头。切换 Week 和 Month，构造次数不增加（同一文档、同一实例）。表格没有输入框。

### 业务

把前端开发的结束日改到开始日之前再保存。状态行以「已拒绝保存」开头，图不跳。过滤「联调」，表只剩一行，图上三条都还在。

### 进阶

保存联调回归，得到模拟 409。点闭环预览，状态是拒绝文案，research 的依赖仍是空字符串。把进度改成空或 101，同样拒绝。把开始年改成 `0099`，被年份下限拒绝，避免 SDK 把它画到 1999。

## 反例

### 1. 在主 React 树里随挂随卸

```tsx
useEffect(() => {
  const chart = new Gantt(el, tasks)
  return () => el.replaceChildren()
}, [tasks])
```

每次 tasks 变化都多一个 `mouseup` 监听。改为一个文档一次构造，用 `refresh`。离开时销毁 iframe，而不是只卸 React。

### 2. 把 React 任务对象直接交进去

库会改 descriptor。`tasks.map(t => ({ ...t }))` 再传入。

### 3. 打开 popup 渲染任务名

`popup: false`。名称里的字符不应变成弹层 HTML。表格用文本节点。

### 4. 把过滤后的行交给 Gantt

缺了 `research` 的子集会让 `frontend` 的依赖悬空。过滤只影响 `<table>`。

### 5. 图表内部改日期当保存

本示例 `readonly`。日期从带 label 的输入进入 `validatePlan`。只看条块动画不能证明数据变了。

### 6. 结束早于开始仍 refresh

策略函数先返回错误字符串。`setTasks` 不调用，图表 effect 看到错误也不 `refresh`。

### 7. 进度用 NaN

空输入变成 `Number('')` 之前，代码把空串收成 `NaN`，`Number.isFinite` 失败。不要把空进度当成 0。

### 8. 依赖写成环还保存

预览按钮故意不 `setTasks`。保存路径必须同样调用 `validatePlan`。

### 9. 年份 0099 交给 SDK 碰运气

策略层直接拒绝小于 0100 的年份。不要依赖库的 Date 构造「碰巧能画」。

### 10. import 未导出的 CSS 路径

构建会失败或跟发布包结构绑死。CSS 由 runner 配置定位。

### 11. 把 409 写进图表颜色

冲突时权威 state 不变。颜色不能代替「未修改」。

### 12. 跨度不设上限

730 个 UTC 日是演示上限。更长的计划会让 SVG 和日期循环变重。产品上限另定，但要有上限。

## 组合

**date-fns 或 Luxon。** `validatePlan` 只比较 `YYYY-MM-DD` 字符串和 UTC 日跨度。它不做纽约夏令时。若任务要带时刻，先在 C14/C16 变成明确的 instant，再决定甘特图上画哪一个日历日。

**Query。** 服务端计划是权威。409 保留用户表格里的未保存草稿，但不要把它画成已接受。本 Demo 的 409 直接丢弃这次编辑。

## 生产清单

- 专用文档，一次构造，`refresh` / `change_view_mode`。
- 复制任务再交给库。
- `readonly` 与 `popup: false`，除非另有净化过的弹层。
- 任何写入前 `validatePlan` 整份计划。
- 过滤不作用于图表数据。
- 表格有关联 label。图用 `role="img"` 加说明，不把它当成唯一可编辑界面。
- 离开页面时销毁 frame，并在浏览器里确认子文档的 `mouseup` 监听不再增长。
- 不把演示跨度上限当成业务合同。

## 升级

1.2.2 的监听器行为若在后续版本提供 `destroy`，仍要在 4321 文档里数监听器，再决定能不能回到普通卸载。升级时重测：环、`0099` 年、730 日跨度、过滤不进图、409 不改 state。

## 练习

1. 启动 demo，确认图表文档在 4321，父页面本身没有第二份 Gantt。
2. 结束日早于开始日，表和条都保持原值。
3. 过滤表格后，图上的依赖仍然完整。
4. 预览闭环不写入；保存 qa 得到 409 且进度不变。
5. 连续切换视图，不新增构造。

## 官方链接

- https://github.com/frappe/gantt

## 证据

`plan-policy` 单测不加载甘特图，也不打开 4321。sdk 要真实 import `frappe-gantt@1.2.2` 并在 `docs/library-lab/evidence/runs/` 留下收据。browser 要包括子文档监听器数量、旧 frame 销毁，以及表格拒绝非法区间。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C13 的条目 PASS。不要改 `verification.json`。
