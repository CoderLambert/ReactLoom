# Luxon：同一个“明天中午”，可能只经过23小时

订阅系统要按纽约当地时间安排每天的汇总。日期、时区、显示语言和实际瞬间不是同一个输入：纽约回拨日的01:30会发生两次，春季的02:30可能根本不存在。Luxon适合需要显式时区、日历计算和区间的业务；如果只做简单日期格式化，可先评估更小的工具。它不负责保存任务或执行排程。

本例锁定 `luxon@3.7.2`（MIT），运算真实调用 `DateTime`、`Interval` 和 `getPossibleOffsets()`。输入语法、缺口拒绝、回拨必须选偏移是应用策略；样例都是本地确定性数据，没有队列或后端。Luxon使用宿主Intl/ICU的时区规则，不附完整TZDB，服务器与浏览器仍须分别核样本。

## 先区分四种值

| 值 | 例子 | 在本例中的职责 |
| --- | --- | --- |
| 日历日期 | 2026-03-07 | 没有时区或时刻；示例用所选zone的中午作为运算锚点 |
| 墙上时间 + IANA zone | 2026-11-01T01:30 + America/New_York | 本地预约，可能没有或有两个实际瞬间 |
| UTC偏移 | -04:00、-05:00 | 描述某个候选与UTC的差，不能替代完整zone规则 |
| instant | 2026-11-01T05:30:00.000Z | 明确的实际瞬间，可用于存储和比较 |

`DateTime`不可变，包含时刻及其zone/locale信息。普通 `setZone('Asia/Shanghai')` 保持毫秒值，只换钟面；`keepLocalTime: true` 会保持钟面并改变瞬间，本例不用它。重新用另一个zone解释“同日中午”则是另一次构造，瞬间可以改变。`locale: 'zh-CN'`只控制展示，不代表上海时区。

## 三个独立实验

| 目标 | 操作 | 应观察的结果 | 关键源码 |
| --- | --- | --- | --- |
| basic：解释日期与换显示时区 | 用默认纽约日期运行，切换“显示时区”，再切换源“时区”；输入2026-02-30后恢复 | 同一source换display仍同epoch；重新解释中午可改变epoch；非法日期不产生结果 | [calendar.mjs](examples/calendar.mjs)、[示例](examples/example.tsx) |
| business：日历排程与经过时长 | 依次选纽约春季/秋季/普通窗口并运行；再换上海 | 中午到次日中午分别23/25/24小时，日历天数为1；containsStart=true、containsEnd=false | [dailyWindow](examples/calendar.mjs) |
| advanced：预约消歧 | 未选偏移运行回拨01:30，再分别选-04/-05；试春季02:30、不匹配偏移并恢复 | 回拨列两候选但未选择不产出resolved；两选择对应05:30Z/06:30Z；缺口和不匹配偏移被拒绝 | [wall-time.mjs](examples/wall-time.mjs)、[纯语法策略](examples/wall-time-policy.mjs) |

这组数值已在当前Node/ICU上真实运行，主控也已在固定candidate18的UTC浏览器上下文通过三个客户端目标。维护记录分别保存SDK、策略和浏览器证据；官方元数据与原文页面的新构建展示尚未验收。输入改变立即清旧结果/错误，避免把上次计算误认为当前输入的输出。

## 日期解析与区间的最小接入

```js
import { dailyWindow } from './calendar.mjs'

const window = dailyWindow('2026-03-07', 'America/New_York')
// start: 2026-03-07T12:00:00.000-05:00
// end:   2026-03-08T12:00:00.000-04:00
// elapsedHours: 23, calendarDays: 1
```

共享 `parseCalendarDay` 先约束YYYY-MM-DD形状，用指定zone构造中午，检查 `isValid`，再要求 `toISODate()` 等于输入。中午是本例的日历锚点，不是自然日的午夜边界；不能因为选中午就跳过回读，例如部分地区曾整日跳过一个日历日期。当前Node也验证了Pacific/Apia的2011-12-30被拒绝。

`dailyWindow`把这份DateTime加 `days: 1`，再用 `Interval.fromDateTimes(start, next)`得到 `[start, end)`。`length('hours')`数实际经过小时；`diff(start, 'days')`按日历单位表达差异。额外的 `after24Hours`用 `plus({ hours: 24 })`对照：纽约春季变成次日13点，秋季变成11点。普通日两者相同，不表示它们语义相同。

区间包含起点、不含终点，输出的lastIncluded只是end减1毫秒的可观察样本。不要把本例中午窗口直接当业务自然日范围；午夜边界要另定规则并测试。不要用本地化字符串作排序键，保留UTC instant或epoch以及原zone。

## 墙上时间必须先判断是否存在

```js
import { inspectWallTime, resolveWallTime } from './wall-time.mjs'

const candidates = inspectWallTime('2026-11-01T01:30', 'America/New_York')
const chosen = resolveWallTime('2026-11-01T01:30', 'America/New_York', '-05:00')
// chosen.instant: 2026-11-01T06:30:00.000Z
```

这两个入口共用同一段Luxon解析与回读。纯语法层只接受YYYY-MM-DDTHH:mm，按公历检查月日/小时/分钟，拒绝秒、偏移和宽松Date.parse格式。它接受“形状正确”的春季02:30，但不证明时区里真有这个钟面。预约语法额外限定公元0001–9999；日历日期实验保留Luxon四位ISO年（含0000）的原解析能力，生产接入应明确统一自己的年份政策。

`fromISO(wall, { zone, setZone: true })`在无偏移输入上使用zone解释钟面。`isValid`仍不够：Luxon可以把缺口02:30规范化为03:30。本例再用 `toFormat("yyyy-MM-dd'T'HH:mm")` 回查，不等于原输入就拒绝，不把规范化当成功预约。

通过回读后才调用 `getPossibleOffsets()`。`inspectWallTime`只列候选，允许UI在错误提示旁解释为什么必须选择；它不会替应用保存。`resolveWallTime`遇到多个候选却没有selectedOffset就抛错，提供的offset也必须匹配候选的 `ZZ`。唯一候选可不选；在12月纽约硬选-04则失败。不能静默使用数组第一项来决定回拨预约。

## 迁移文件与运行前提

复制sourceFiles全部9个文件：example.tsx、demo.tsx、calendar.mjs与calendar.d.mts、wall-time.mjs与声明、wall-time-policy.mjs与声明、styles.css。SDK和纯策略模块直接供页面与测试共用；demo.tsx仅适配出口，不依赖Lab内部alias。局部CSS处理换行、控件尺寸和焦点，没有图片或时区数据资源。

安装 `pnpm add luxon@3.7.2`，TypeScript项目另装 `pnpm add -D @types/luxon@3.7.6`。Luxon包本身是JavaScript，类型来自实装的独立DefinitelyTyped包，类型版本不等于运行时版本；本例用到的API已在运行时源码核对。需要宿主支持Intl与目标IANA zone；已测宿主不代表旧浏览器或其他ICU版本也一致。

本例不修改全局 `Settings.defaultZone/defaultLocale/now`，也不创建timer、网络、Worker、监听或本地存储。结果和错误都在组件state，卸载即丢弃；没有需要应用手工销毁的SDK实例。用户重新打开示例要重新运行，不能把这当持久化。SSR hydration、读屏、移动原生输入和跨环境时区矩阵没有验收。

真实系统保存预约时至少带UTC instant、IANA zone、原wall及所选offset，并决定将来规则变化如何处理。Luxon不能代替服务端权限、并发版本或任务调度。未来升版要保留同一组gap/overlap/日历样本，宿主TZ数据升级也可能影响结果。

## 官方原文与官网

[官方README原文](https://github.com/moment/luxon/blob/4262a38ded7762e22608a9feb9f117b40d338ced/README.md)来自moment/luxon的npm3.7.2 gitHead `4262a38ded7762e22608a9feb9f117b40d338ced`，根package.json也确认为3.7.2。实际未截断tree只发现根README、docker和scripts的readme，没有根中文候选，所以保留英文README.md，未自行翻译。2052B、SHA256 `5e57e6afc44eed949d850075c7e1a9206a757c058afa6b93aab83264f07cf622`，同步UTC2026-11-10T17:08:12.781404+00:00。

[官方首页](https://moment.github.io/luxon/)由同一README指向。历史GET最终200，字典捕获中未发现XFO/CSP，但没有从Lab origin确认iframe可用，所以状态unknown，保留直达和重试；不是allowed。固定原文、版本、候选和5次真实GET证据保留在条目维护记录；这些历史headers只有字典，不能证明同名重复头完整，未事后补造原始列表。官网能否嵌入、日期计算正确和正式验收收据是三种不同证据。
