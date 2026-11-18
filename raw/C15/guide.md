# Day.js：分清日历标签、经过时间和时区中的瞬间

RSS后台要显示中文日期、生成“每天中午”的窗口，并处理纽约回拨日出现两次的01:30。Day.js提供链式日期对象与可选插件；应用仍要决定输入合同、业务时区和歧义处理。仅格式化普通日期时可以先用原生Intl；喜欢函数式操作可对照date-fns，需要现成区间/偏移候选API时可对照Luxon。

本例实际 **dayjs1.11.23/MIT**，自制数据，无远程资产、cron、后端、存储或请求。源码、类型和真实Node运算已核对；客户端交互覆盖另见 local-validation.md。

## 先看四种不同的值

| 值 | 本例 | 应如何处理 |
| --- | --- | --- |
| 日历标签 | 2026-03-07 | 没有时刻/时区；严格解析，UTC对象仅作稳定日历算术载体。 |
| 墙上时间+zone | 纽约3月7日12:00 | 用明确zone构造；次日中午重新构造，不能写死加24小时。 |
| instant | 2026-11-01T05:30:00Z | 一条绝对时间轴上的点；转换显示时保持同一instant。 |
| 展示文本 | 2026年3月7日/星期六 | 实例locale格式化；不能当排序键、数据库ID或无损往返载体。 |

Day.js默认不可变：add返回新对象，原对象不跟着改。本例显示调用前后和新值，并比较对象引用；不是手写一个“不可变成功”标志。badMutable插件会改变这项语义，本例不加载它。

## 插件和数据流

```text
输入草稿 → 点击计算 → 共用date-operations/offset-instant
  ├─ 形状/strict/zone往返拒绝 → alert，旧结果清空
  └─ 真实Day.js操作 → 当前输入对应的JSON结果
输入、zone或预设变化 → 旧结果/错误立即清空，等待重新计算
```

核心没有严格格式和IANA时区能力。offset-instant在模块顶层登记utc，再登记依赖它的timezone；date-operations登记customParseFormat并加载zh-cn词典。插件扩展同一个Day.js模块实例，不能随组件卸载“取消登记”；不要在render中反复extend，也不要在每个请求里改全局locale/tz默认值。

```js
// 两个共享模块一起被实际UI与SDK测试导入。
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
const date = dayjs.utc(input, 'YYYY-MM-DD', true)
const label = date.locale('zh-cn').format('dddd')
```

最后的true开启严格匹配；另有整串正则限制。UTC用于日历字符串的下一日计算，不代表用户“当天凌晨”必是UTC瞬间。语言使用实例locale，不调用全局dayjs.locale('zh-cn')。

## 目标一：严格日期、不可变与中文显示

basic输入2026-02-30再点“使用 Day.js 运行计算”，应alert且没有旧结果；改为2028-02-29，旧错误消失，再计算应得到中文2028年2月29日、星期二。immutable.before与after都是2月29日，next为3月1日，sameReference=false。

`strictDate`实际调用dayjs.utc(value, 'YYYY-MM-DD', true)，不是仅靠正则/Date宽松解析；`basicReport`调用真实add及实例locale。输入onChange不trim或格式化，避免打断编辑。计算按钮可用Tab/Enter原生激活；没有在输入框里伪造隐式提交或声称系统IME矩阵已通过。

注意四位输入合同不等于全历史历法保证：插件仍使用JS Date构造，低年别名与极限年另有边界。保留原0000事件拒绝；本例面向现代RSS排程，不承诺所有古代年份/历法。business的下一日也须保持严格四位标签，越出合同会拒绝。

## 目标二：IANA中午窗口与经过时间

business默认2026-03-07/纽约，窗口从7日12:00 -05:00到8日12:00 -04:00，真实elapsedHours=23；选UTC或上海为24。改成2026-10-31/纽约，窗口到11月1日12:00 -05:00，经过25小时。startInstant/endInstant是真实toISOString结果，elapsedMs由两个valueOf相减。

`civilWindow`先对UTC日历标签add一日得到nextCivil，再分别用dayjs.tz(label+' 12:00', format, zone)构造两天中午。不直接在纽约对象上add(1,'day')后假设offset已重新解析，也不把经过时间固定为86400000。中午是此纽约/上海/UTC案例的业务锚点，不是所有IANA历史规则都永远不存在歧义的通用承诺。

这是一次纯计算，无cron/系统调度。真正每天执行任务还需服务端调度、幂等、停机补偿、权限与实际TZDB版本策略；elapsedHours不叫“日历日数”。

## 目标三：回拨同名时间和春季缺口

advanced展示两条真实UTC→NY转换：05:30Z对应01:30 -04:00，06:30Z对应01:30 -05:00。点“选择回拨后的 -05:00”再运行，selectedEvent.instant应晚一小时，但wall相同。点“尝试春季不存在的 02:30”，再次运行应拒绝，不能把输入静默移到03:30后仍显示成功。

现有`resolveExplicitZonedInstant`保留IANA墙上时间与offset往返：

```js
const candidate = dayjs(input)       // 输入必须已有秒与Z/数值offset
const local = candidate.tz(zone)     // 转换已有instant，不重新猜墙上时间
// 同时比较完整YYYY-MM-DDTHH:mm:ss和format('Z')；Z按+00:00比较。
```

正则/应用guard先限制时分秒、offset不超过±14:00、拒未知-00:00和0000年；再调用真实库，按秒比较墙上时间和偏移。合法instant不代表它属于纽约的那段墙上时间：春季02:30 -05:00可表示一个绝对点，但转换回纽约是03:30，必须拒绝。helper可接其他合法IANA名；此UI固定纽约，business下拉仅允许三zone。无效zone可能由宿主Intl抛RangeError。

不要把无offset的01:30交给dayjs.tz猜earlier/later；也不要把带offset的instant再当无offset墙上字符串静态构造。`.tz(zone)`保留instant，`.tz(zone,true)`保留墙上读数而改变instant，本例不用后者。`tz.setDefault`不改变普通dayjs(value)的本地解析规则，本例始终显式传zone。

## 迁入业务与清理

携带三个场景同列的 **7个sourceFiles**：example.tsx、demo.tsx（重导出）、date-operations.mjs/.d.mts、offset-instant.mjs/.d.mts、styles.css。原example导出的strictDate/civilWindow/twoFallbackInstants仍可用；核心操作已与UI拆开供Node/服务端复用。`.d.mts`是本地函数合同，不冒充Day.js官方类型；实际插件API由包内声明核对。Node/Vite兼容的插件导入保留.js后缀。

level切换使用独立Session；“重置当前目标”恢复日期/zone/offset种子，清旧结果/error。advanced不读取隐藏civil输入，basic无效草稿不会污染advanced。普通编辑不卸载组件，仅使旧结果失效。样式仅c15范围，长offset/JSON断行，原生控件焦点可见。

Day.js对象没有组件式destroy；应用无timer、网络、Worker、监听注册或临时URL，卸载只销毁自己的React树和state，不删除全局插件/locale。timezone内部缓存Intl.DateTimeFormat，时区规则来自宿主Intl/TZDB，不由插件带一套独立数据；服务器和浏览器版本差异仍需验证，升级Day.js不等于升级TZDB。

## 官方与验证边界

主[官方中文README原文](official/readme.md)来自iamkun/dayjs固定commit **4549b8d03307891143e8a50d39fcdab1f16f77cf**，实际递归树发现docs/zh-cn/README.zh-CN.md，3882B/zh-CN，SHA256 **3f4c6e9edd42554b8c6a1e111daafb568b4eba3e8b9da31a9296abebb8aae2c5**；未改写/翻译。附[固定根英文原文](https://github.com/iamkun/dayjs/blob/4549b8d03307891143e8a50d39fcdab1f16f77cf/README.md)8229B，和安装README逐字节相同。

**npm1.11.23 gitHead与官方v1.11.23 tag都指向该commit；源码manifest写0.0.0-development，安装包写1.11.23。** 三者事实均保留，不把源码版本伪写成发布版本。API以安装1.11.23类型/源码和真实检查为准，在线文档另有更新节奏。

匹配中文原文直接链接[中文官网](https://day.js.org/zh-CN/)，实际GET200完整rawHeaders没有XFO/强制CSP；尚未从Lab origin确认iframe内容可用，故unknown，不推allowed。日期/最终URL/7次成功请求/重复头和匿名cookie脱敏在维护文件official/source-evidence.json。首次过强manifest断言失败保留，没有覆盖成功对。抓取仅全流程成功后暂存/replace，异常另存failed；受控传输维护检查不算新的官方HTTP。

[官方时区说明](https://day.js.org/docs/en/plugin/timezone)与[严格格式说明](https://day.js.org/docs/en/parse/string-format)用于解释API；固定安装源码审计/六项/实际命令见维护记录local-validation.md。SDK6含实际共享计算和一组混合guard+SDK往返，不证明React按钮/390px/卸载。完整三case提案交root，formal sdk/build/browser保持NOT_RUN；OS IME、读屏、touch、SSR、独立迁入与设备时区矩阵仍未验。
