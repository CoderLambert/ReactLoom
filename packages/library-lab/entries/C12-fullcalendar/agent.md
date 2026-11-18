# C12 FullCalendar React7.1.3

事件排程的月/周/列表与拖动提议使用本库；单纯日期计算不必加载日历。@fullcalendar/react7.1.3与temporal-polyfill1.0.4均MIT，React/DOM peer17–19；v7插件/theme/locale在react子路径，三官方CSS配套。不装v6独立core/daygrid包、不导入Premium/license key。在线示例已7.1.4，本例固定版本不能混写。

三目标：basic真实datesSet范围/导航/getEvents与半开全天区间；business严格日期/唯一ID创建、真实drop/resize接受回写React；advancedNY两次01:30的不同instant与fold-early同步业务拒绝/真实revert。

React事件数组为权威，SDK负责临时交互/视图；不eventsSet反写成环、不同时API和state两处改事件。API快照需点击重新读取，datesSet不是保存；receipt日期从真实回调复制，decision/计数是应用观察。firstDay=0显式覆盖中文默认周一起始，显示整个DST周；locale不等于zone。

保留calendar-policy作为严格时间/ID唯一来源：全天日期回读拒进位；定时值必须Z/offset，拒-00:00/超±14:00/无offset；这不是完整IANA/TZDB一致性验证。allocateEventId跳过已占local-N且安全整数检查；普通标题onChange不trim。原生date可能先拒非法输入，policy证据与UI路径分开。

接受SDK改期才生成新events数组；未知ID/无效时间及advanced fold-early会真实revert，后者仅同步模拟409，无HTTP/revision/async任务。eventContent用JSX文本，eventClass仅给真实SDK事件DOM稳定定位，不创建影子日历。

迁移demo/example/calendar-contract/calendar-policy及.d.mts/styles六源；保留skeleton/classic theme/palette CSS与polyfill运行peer。level独立Session，显式reset才epoch重挂；alive/epoch拒旧SDK回调而非服务器取消。实装组件effect调用calendarDataManager.destroy，应用不全局清监听；活跃交互/资源普查和SSR hydration仍待浏览器，不夸称所有SDK资源已测。

区域“FullCalendar 真实演示”；标题/日期、创建本地事件、读取日历API事件、跳到 DST 回拨日、重置本地日历。c12-workshop/data-level、c12-range/api-events/receipt/callbacks/events/fold/status；事件真DOM含eventClass c12-event-<id>和content的data-c12-event-id。三目标完整Playwright提案见validation，root接公共。固定版本的protected-styles键只用于提案真实resizer定位，升级应重核。

官方原文固定fullcalendar/fullcalendar@6b890e803c66d1e6db2fb21c449936155b7e81fc/packages/react/README.md，v7.1.3/英文2405B；npm缺gitHead事实保留。中文候选、日期/SHA/8GET完整头在official。官网DENY/frame-ancestors none→blocked。真实Node SDK2是配置/formatter，policy4独立，非DOM/revert验收；formal三NOT_RUN，实际记录见local-validation。

取证维护失败只写source-fetch-failure.json，完整获取后双暂存/replace；受控传输3场景与SDK分开。原始官方响应字段映射不补造raw重复头，后续抓取保留rawHeaders。正式sdk/build/browser均NOT_RUN；官方展示与实测交互分别记录在 local-validation.md。

candidate17定位增量：SDK视图“月/周/日程”的原生button显式role=tab，按tab可访问角色定位。真实末端手柄可仅在720视口底部露出，测量前把实际handle.scrollIntoView({block:'center',inline:'nearest'})再读bbox，确保整个原生resize目标在视口内；不改变回调次数/end增加断言。原完整basic/business观察失败及局部诊断GREEN见local-validation；不是生产修复或完整case通过。
