# C16 Luxon工程接入

适用于需要显式IANA时区、日历单位、Interval和回拨消歧的预约/订阅窗口。简单格式化可先评估更小工具。实装luxon3.7.2/MIT，单独@types/luxon3.7.6；Luxon使用宿主Intl/ICU，不含完整TZDB。所有示例是本地fixture，不是任务队列或服务端保存。

## 最小迁移

复制examples全部9源：example/demo、calendar.mjs+d.mts、wall-time.mjs+d.mts、wall-time-policy.mjs+d.mts、styles.css。保留局部CSS和真实声明，安装pnpm add luxon@3.7.2；TS另装@types/luxon@3.7.6。无Lab alias/远程资产。runtime版本/API以实际源码为准，不用类型包版本替代SDK版本。

## 日期合同与不可删边界

- parseCalendarDay保留YYYY-MM-DD形状、指定zone中午、isValid及toISODate回查。它是中午锚点，不是自然日午夜范围；中午也不能避免整个被跳过的日期。日历实验保留Luxon四位ISO年含0000，预约语法另限0001–9999；生产统一年份政策。
- calendarDayView用普通setZone，保持epoch/instant；改source zone重新解释中午可以换instant。locale zh-CN只控制展示，不推导业务zone。不用keepLocalTime来“换个地方显示”。
- dailyWindow用plus({days:1})，Interval.fromDateTimes(start,next)半开[start,end)。length(hours)与日历diff(days)不同；NY样本23/25/24，after24Hours对照13/11/12点。
- wall-time-policy只是语法/公历检查，不能证明DST时刻存在。原resolveWallTime合同保留：语法→真实Luxon isValid→钟面回读→getPossibleOffsets→多候选必须明确offset且必须匹配。
- inspectWallTime仅列候选，不能代替resolve保存。默认回拨offset未选择；两候选可显示但不产resolved。缺口被规范化也必须拒绝，不能取candidates[0]静默消歧。
- 改输入/zone/offset/样本先清旧结果和错误。错误用本地role alert，恢复可重新运行；非浏览器alert弹窗。

## 三目标与真实断言

basic：纽约2026-03-07中午→上海2026-03-08 01:00，同epoch；改display到UTC不变instant，改source到UTC重新解释中午；02-30失败并恢复。

business：三预设23/25/24小时、calendarDays1，containsStart=true/containsEnd=false，after24Hours为13/11/12点；上海样本24小时。这里不是自然日午夜。

advanced：默认回拨01:30无offset失败但两候选可见；-04/-05分别05:30Z/06:30Z相差一小时；春季02:30不存在、秒/偏移语法拒绝、12月选-04拒绝，唯一候选无选择可成功；窄屏/卸载重挂清结果与选择留真实browser。

SDK8直接用页面calendar/wall-time共享函数和实际DateTime/Interval；纯policy2只证明语法。Node环境在sdk.txt记录；root固定candidate18的真实UTC browser三目标3PASS，不mock Intl/clock，不代表完整ICU矩阵。官方原文展示见 local-validation.md，iframe 可用性为 unknown。

## 资源与未实现

应用无timer/网络/Worker/全局监听/存储，DateTime不可变，无需destroy；组件卸载丢弃state。不修改Settings.defaultZone/defaultLocale/now，不为清理调用全局resetCaches影响其他应用。无服务端revision、任务调度、SSR hydration或系统时区矩阵承诺。真实保存另带instant/zone/wall/offset和规则变更策略。

官方固定moment/luxon@4262a38ded7762e22608a9feb9f117b40d338ced/README.md，npm3.7.2 gitHead及根manifest匹配。无根中文README，英文原文2052B/SHA5e57e6afc44eed949d850075c7e1a9206a757c058afa6b93aab83264f07cf622；官网真实200无XFO/CSP但无Lab-origin确认→unknown。历史headers字典在official/source-evidence.json，不保同名重复项，不称完整原始头；未来抓取另存rawHeaders列表，不能反填旧HTTP。抓取异常独立failed，全部成功才暂存replace，禁止finally覆盖旧成功对。

本地六项/命令/cwd/exit/来源见local-validation.md，完整browser-proposal在validation。formal verification三个status保持NOT_RUN，不用策略/类型/历史CI或本地日志伪造正式PASS。
