# Frappe Gantt：从表格草稿到可信的任务时间线

一个小项目有三项任务、日期和前后依赖，需要用图解释排程，也要让用户用键盘改日期和进度。Frappe Gantt 把任务数组画成 SVG 条块与箭头；本例把编辑保留在语义表格，校验通过后再更新真实图。它没有项目后端、关键路径计算、资源调度或权限系统。

实际运行 **frappe-gantt 1.2.2，MIT**，数据与覆盖样式为本地原创。少量任务、简单依赖和时间尺度切换适合本库；会议事件用 FullCalendar，复杂调度需另找业务引擎。库本身不是 React 组件，本例用 effect 适配它。

## 谁拥有哪一份数据

~~~text
表格 input：当前行未保存的草稿
     ↓ 保存 / 非合成期间 Enter
validatePlan(整份候选计划)
     ├─ 日期/进度/依赖不合法：拒绝，草稿仍留在输入框
     ├─ advanced 的 qa：模拟409，权威计划不变
     └─ 本地接受：更新 tasks + revision
                            ↓
          React语义表格 + 权威计划JSON快照
                            ↓ toChartTasks
          副本 + 图标签转义 → SDK refresh / change_view_mode
~~~

tasks 是当前会话已接受的内存计划，表格不是每次输入都回写。保存成功才更新 revision、快照与图；拒绝或模拟冲突时，输入框保留未保存草稿，方便修正，**不是自动恢复成旧输入值**。图和“当前权威计划”仍显示上一次接受的数据。重置/停止会话才丢弃全部内存状态。

任务形状是 id/name/start/end/progress/dependencies，依赖是逗号分隔的前驱 ID 字符串。传给库前复制每个 descriptor，因为 SDK 会加入 _start/_end/_index、把 dependencies 转成数组，并归一化 ID。不能把 React state 原对象直接传进去。

## 为什么图运行在独立文档

1.2.2 构造时绑定捕获实例的 document.mouseup，没有公开 destroy/dispose。删 SVG 或卸载 React 并不能解除该闭包。因此 Lab 在 4319 主页面之外，用既有 4321 loopback runner 的独立文档执行 C13；一个会话文档只构造一次。任务变化走 refresh(tasks)，尺度变化走 change_view_mode(view)，停止/重置/离开销毁整份 iframe 文档。

端口、UUID session、reactloom-gantt-v1、origin/source/session/方向校验、sandbox 和父级启停都属于 **Lab 自建隔离接线**，不是 Frappe Gantt API。父文档不 import 图表。共享 runner 不使用 StrictMode 重放这个缺乏 disposer 的构造路径，不能据此宣称 SDK 适合在任意 React 主树随挂随卸。

条目 effect 的 alive 标记阻止动态 import 晚到后再构造，清空自己 host 的 DOM/ref；最终资源边界是父级销毁 frame realm，不能把 replaceChildren 当完整清理。没有全局删事件、放宽宿主 CSP 或绕过会话校验。

## 目标一：隔离图、依赖与时间尺度

打开 basic，观察三条真实任务与 research → frontend → qa 箭头，以及下方三行语义表格。需求名称特意包含字面字符“需求评审 <草稿> & 确认”；图标签和表格应显示相同文本，不能变成 SVG 元素。切换时间尺度 Day / Week / Month，观察轴刻度变化；父页仍没有第二份 Gantt，同一子文档保持同一实例/一个 document mouseup 监听。

readonly:true 关闭图上编辑；popup:false 关闭弹层。但这两个选项**不会净化任务名**：SDK 的 bar label 独立使用 innerHTML。本例的 toChartTasks 只在图表副本中转义 &、尖括号及引号，把标签作为文本；权威计划与 React 表格仍保留原文。它不是 HTML 净化器，也不支持“保留一部分富文本”。

infinite_padding:false 关闭默认无限轴扩展，避免用户滚动把图轴越扩越大。数据跨度上限与轴留白是两回事；本例仅开放 Day/Week/Month，保留各视图有限 padding。

## 目标二：键盘保存与同源图表

打开 business，把“前端开发进度”改为 60，按 Enter 或点击该行“保存”。状态应显示已更新，权威计划 frontend.progress 变为 60、revision 增加，真实 SVG 进度条宽度占比变为约 0.6。这里是同源数组驱动真实 SDK，不是直接改 SVG 或预置成功结果。

把“过滤表格任务”填成“前端”，表格只剩一行，图仍有三条与全部依赖。过滤是应用表格的展示选择，不改变权威计划，也不会把缺少前驱的子集交给 SDK。

表单使用 noValidate，统一以 validatePlan 返回可解释的拒绝结果；min/max/required 是输入提示，不能代替领域校验。空进度明确转成 NaN，不是 Number('') 得到的 0。Enter 路径检查真实事件 isComposing；没有宣称已经验收所有操作系统输入法/移动键盘。

## 目标三：拒绝、冲突与会话销毁

advanced 把前端结束日改到开始前再保存：状态说明拒绝，输入草稿留着，权威快照与真实条宽/位置不变。空进度、101、超出日期范围也拒绝；改回合法值可以继续保存。

把“联调回归进度”改为 80 再保存，触发**本地模拟 HTTP 409 分支**。没有 HTTP 请求或服务端 revision，权威 qa.progress 仍为 10，图保持原状，输入草稿 80 留着供用户处理；本例没有自动重试/覆盖冲突。随后可编辑前端行验证其他合法保存仍可用。

点“模拟依赖闭环（不保存）”，只在候选副本中把 research 依赖改为 qa，Kahn 拓扑检测返回错误；权威依赖没有改变。停止、重置和切换场景会销毁旧文档并创建新 UUID 会话；重新运行恢复种子计划和 revision0。需要真实 frame/context 销毁证据，不能只数 SVG 为零。

## 有意受限的输入合同

plan-policy.mjs 是 UI 与 Node 策略唯一共享来源，拒绝重复 ID、自依赖、未知/重复依赖、环、非法日期区间及非有限/越界进度。

- ID 采用 1–64 位 ASCII 字母/数字/下划线/短横线，以字母或数字开头，排除 Object.prototype 保留名称。SDK 会把空格改成下划线且内部 dependency_map 是普通对象；外部 ID 不能归一化后撞名或进入 constructor 等原型键。演示不编辑 ID，迁入 API 时保持同一合同或先建立独立安全映射。
- 日期是四位 YYYY-MM-DD 日历日。本例取 **0101-01-01 至 9998-12-31**，整份计划最早开始到最晚结束相差不超过 **730 个 UTC 日**，包括任务间空档。SDK 的最终条显示按本地日历构造，不代表 UTC 时刻或跨时区排程。
- 比单纯拒绝 0000–0099 更严格，是因为 0100 年初的图轴 padding 会落入 0099；SDK 后续 numeric Date 加日又把 99 解释成 1999。真实 1.2.2 日期配方已复现。两端为 D/W/M 留白预留余量，实际 Node 配方分别得到本地年 100–101、9998–9999，不跨 0–99 或五位年。Node 配方不证明古代日期的真实浏览器渲染/时区体验。

这些是演示的保守输入合同，不是 SDK 对所有视图、语言或日期范围的官方保证。当前固定三任务不提供任意计划导入、资源调度或时区转换。

## 迁入业务的必要接线

携带六个 sourceFiles：example.tsx、demo.tsx（仅再导出）、plan-policy.mjs/.d.mts、frappe-gantt.d.ts 和 gantt.css。SDK 没有随包类型，.d.ts 是核对 1.2.2 源码后的有限本地声明；不能当官方全量类型。

还必须加载同版本 SDK 基础 CSS。包通过主入口的 style condition 暴露 CSS，未公开 dist 子路径；Lab 的专用 runner 用 Vite alias 定位实际发布文件：

~~~ts
// 自有文档的 vite.config.ts；该文档入口还要 import 'frappe-gantt-runner.css'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      'frappe-gantt-runner.css': fileURLToPath(
        new URL('./frappe-gantt.css', import.meta.resolve('frappe-gantt')),
      ),
    },
  },
})
~~~

这只是 CSS 解析配置，仍需要自有文档入口。条目六文件不包含 Lab 的父页/服务端 runner；迁移方需要明确的 frame 创建/销毁所有权和可信消息协议，不能把图直接塞进主文档后假装卸载已释放监听。现有接线是 runners/gantt/main.tsx、其 vite.config.ts 与平台 gantt-frame-session；它们由平台维护，条目不复制一套新宿主。

new Gantt 只发生在专用文档挂载 effect；后续更新先验证，再复制/转义。匹配 README 中的 tasks.append()/tasks.refresh() 片段不符合 1.2.2 实际数组与方法形状，原文照存，本例依据同版本源码调用实例 chart.refresh(tasks)。SDK 渲染失败显示 alert；领域校验通过不等同引擎必然绘制成功，必要时重启本会话。

## 官方与验证边界

[官方 README 原文](official/readme.md) 固定仓库 frappe/gantt、npm1.2.2 gitHead/同提交manifest **4c82fccce9bf4237ded41680869529cea4385a90**，路径 README.md；未截断树只有这一份 README，没有中文候选。英文原文 **15874B**，SHA-256 **6f8ef7a60672fbcdb9aafc9920cf64789e118d8f56d5ab1855a7d9553253fc46**，版本/语言/日期/请求完整头见 official/source-evidence.json 与 library.json。没有翻译覆盖上游文档。

官网 https://frappe.io/gantt 的实际最终 GET 响应含 X-Frame-Options SAMEORIGIN，无强制 frame-ancestors 覆盖，故 **blocked**；正文未读取，HTTP200不是 iframe 允许证明。官网直达入口保留。

真实 SDK Node 配方仅运行导出的类/实际原型中的任务预处理与日期计算，没有假 DOM、替换方法或伪造构造结果；策略测试单独检查业务合同。真实 SVG、键盘保存、frame 协议/销毁与监听由 root 的既有五个浏览器 case 和[完整提案](validation/browser-proposal.txt)验收。正式 verification 三项保持 NOT_RUN；实际失败/修正和六项见[本地记录](local-validation.md)。
