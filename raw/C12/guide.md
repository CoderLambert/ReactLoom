# FullCalendar：日历视图、事件数据与改期提议

RSS排程需要月、周和列表视图，还要创建全天任务、拖动复盘时段，并在业务拒绝改期时恢复。FullCalendar负责日历布局、导航和交互；React持有本例的权威事件数组，实际系统仍由服务端最终确认。只有日期计算或普通日期输入时无需加载完整日历，资源泳道/资源时间轴等Premium能力也不在本例范围。

固定 **@fullcalendar/react7.1.3 / temporal-polyfill1.0.4**，两者MIT；React包peer为React/DOM17–19与polyfill^1.0.1，当前宿主React19.3。v7是真实React组件，daygrid/timegrid/interaction/list、主题与locale都来自react包子路径，不补装v6的core/daygrid独立包。此刻官网文档示例已7.1.4，关键API以本地7.1.3类型/源码和固定原文为准。

## 先区分三份信息

```text
React事件数组 → FullCalendar解析/时区/当前视图 → 真实事件DOM
导航 → datesSet：当前可见日期范围
getApi().getEvents()：SDK事件模型的当前序列化观察
拖动/缩放 → SDK先提出新日期 → 应用接受并回写React，或调用revert
```

数组、API模型、DOM不是三个可随意修改的权威。本例只向events属性传稳定state数组；没有eventsSet回写环，也不直接用API新增/修改事件再同时维护另一份React数组。API按钮只导航或读取，不替应用保存。

全天值是YYYY-MM-DD，定时值是带Z或明确offset的instant。allDay=true时end不包含：种子“两天校对”[2026-11-03,2026-11-05)覆盖3、4日。界面语言与时区独立；中文locale默认周一，本例显式firstDay=0，以便同一周同时观察11月1日DST与11月2日复盘。

## 最小接入与插件

```tsx
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import classicTheme from '@fullcalendar/react/themes/classic';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';

<FullCalendar plugins={[dayGridPlugin, classicTheme]}
  initialView="dayGridMonth" events={events} />;
```

完整示例的calendar-contract.ts共享五个真实插件、中文locale、纽约时区与自制种子。theme也是插件，CSS三份与主题配套。polyfill是v7命名时区的运行peer，即使本例业务代码不直接调用Temporal，也不能漏掉。

## 目标一：视图、范围与事件模型

basic初始月视图，事件不可拖。点击事件，状态显示实际SDK事件ID；点工具栏“周”“日程”“月”切视图，展开“查看真实SDK范围、API事件和末次改期”，观察datesSet的view/start/end/timeZone。visible range可能包含月前后补齐日期，不等于业务查询只应取当月，也不是一条自动保存通知。

点“读取日历API事件”，看到真实getEvents的id/title/startStr/endStr/allDay映射。未点或业务事件已改变时显示null，需要重新读取；不是把React数组复制后冒充API结果。再与下方React数据和可读事件清单比较。种子两日跨度的end仍为5日，不能读作覆盖5日。

导航/切视图由SDK管理；本例没有范围HTTP取数。生产使用可见范围查询时，另定租户、zone、缓存key、AbortSignal与晚回包规则，不能从datesSet回调次数推请求成功。

## 目标二：创建全天事件与真实改期

business初始周视图，复盘在纽约11月2日09:00–10:00。填标题/日期点“创建本地事件”，严格日期和非空标题通过后分配local-N；原分配器跳过已占ID，安全整数耗尽抛错。标题仅创建时trim，不在每次onChange破坏选词。浏览器原生date可能拒绝不存在日期，策略测试另外验证2月30日；清空标题或日期再创建则不增加事件。

真实拖动“工程复盘”到另一天，或拖其结束缩放柄改变时长。eventDrop/eventResize里复制SDK的id、oldEvent.startStr、新startStr/endStr/allDay；只有通过当前ID/日期检查才生成新React数组。末次receipt的日期来自SDK，kind/decision与计数是应用观察，不是服务器响应。修改后API快照清为null，点按钮重新看真实模型。

```ts
if (businessRejects) {
  info.revert(); // SDK撤回刚提出的改期
  return;
}
// 接受后只更新React权威事件，SDK从events属性接收。
```

本例检查全天日期、定时值显式offset和ID归属，不实现revision、HTTP PATCH、异步事务或取消远程写入。其他事件的SDK默认时长/布局由库处理，事件数据变化不靠eventDidMount改DOM。eventContent返回JSX文本，标题不会当HTML执行。

## 目标三：纽约重复时刻与同步冲突回滚

advanced有fold-early和fold-late，两者都是2026-11-01的01:30，但-04:00对应05:30Z、-05:00对应06:30Z，相差一小时。上方日历是纽约显示，下方FOLD列表是自建严格解析对照，API按钮能另外观察真实SDK模型；不要把静态列表当SDK计算结果。

真实拖动或缩放fold-early，应用**同步模拟409拒绝**并调用真实revert，React原事件不变；receipt保存SDK提出的新日期与reverted决定，revert计数来自这条真实回调路径。它不是日历算出冲突、不是HTTP409、也不是异步请求示范。其他合法事件仍可接受修改。

calendar-policy的getUtcInstant只接受显式Z/数值offset、合法公历和时分秒，拒未知-00:00、超过±14:00的offset、无offset和进位日期。它不是完整TZDB墙上时间往返：固定-05:00不保证某纽约春季02:30存在；业务IANA zone一致性另设规则，不让Date宽松解析替代合同。

## 迁移和所有权

复制六个sourceFiles：example.tsx、calendar-contract.ts、calendar-policy.mjs及.d.mts、styles.css、demo.tsx（仅重导出）；依赖只有上述两个固定包，保留三份官方CSS和局部断行/宽度/焦点样式，不需要外部资产或Lab alias。

level切换创建独立Session，显式“重置本地日历”才增加本日历epoch并重挂SDK；清事件/序号/输入与本轮观察。普通标题输入不换日历key。alive/epoch只拒旧子树回调，不能称已实现远程请求取消。CalendarRef.getApi为真实SDK ref；应用不调用全局destroy或手动删除其他日历监听。

实装7.1.3 React组件effect在卸载时调用calendarDataManager.destroy；交互子树的监听/滚动由SDK自己的生命周期管理。该静态路径不等于完整活跃拖动/RAF/监听泄漏验收，必须真实浏览器。没有自建后台任务、存储、Worker或临时URL。

事件清单可在日历外阅读，原生标题/日期/按钮有标签，状态可见；不据此宣称已完成读屏排程、键盘改期或系统IME。SSR、移动触摸与真实焦点/滚动仍各自验收。

## 官方来源与验证边界

官方v7.1.3 annotated tag解引用commit6b890e803c66d1e6db2fb21c449936155b7e81fc；npm发布metadata未提供gitHead，固定同commit React manifest7.1.3核对版本，不伪造npm一致。对应packages/react/README.md英文原文2405B保存在official/readme.md，中文候选、SHA、完整8请求及时间/最终URL/头见official/source-evidence.json。

官网真实GET200，但XFO DENY与强制CSP frame-ancestors none限制跨源嵌入，标blocked并保留直达，不以HTTP成功或未实际浏览器推allowed。正文未读、不虚构网页正文hash。

Node SDK2为真实共享插件/locale与公开FullCalendar formatter（05:30/06:30）；原纯Date差值不再算SDK。策略4只验证时间/ID，均不证明Calendar DOM、拖/缩放/revert。完整三目标浏览器提案交主控匹配构建运行；正式verification三项NOT_RUN，命令/六项和实际剩余见local-validation.md。

三条完整提案在[validation/browser-proposal.txt](validation/browser-proposal.txt)：basic实际导航/SDK模型与只读/reset，business实际创建/跨日拖动/末端缩放，advanced实际DST模型与拖动拒绝/revert/停止重跑。固定版本导出的protected-styles仅用于定位真实mirror/resizer，升级须重新核对；不造隐藏日历、直调回调或伪造SDK输出。节点断开只证明本节点替换，不是所有SDK资源普查。

取证工具已采用完整获取/校验后双暂存再replace，失败另存且不覆盖旧成功对；三个受控传输场景验证该维护行为与重复头/匿名cookie处理，不是新的官方HTTP或SDK证据。原8次真实响应保留原字段映射；后续捕获另保留rawHeaders以保全重复同名字段，不倒推补造旧响应的重复数量。
