# C14 date-fns：工程复用

**选用条件。** 领域模型已有 Date，需要函数式日历加减、明确时区格式化和严格 instant 输入。不是 cron、数据库或日期选择器。date-fns 4.4.0 + @date-fns/tz 1.5.0，MIT。React UI 与 SDK 测试同源调用 [date-contract.ts](examples/date-contract.ts)。

**三目标。** basic 仅 civil/zone，返回当地中午与 UTC；business 再消费 count，返回日历差/整数小时差；advanced 仅消费明确 instant，固定纽约春秋 23/25 小时，秋季两个 01:30 是不同 UTC。不得恢复“无关 civil 草稿使 advanced 失败”的旧耦合。

**迁移文件。** 携带 examples 下 demo.tsx、example.tsx、date-contract.ts、instant-policy.mjs/.d.mts、styles.css。无 Lab alias、runner、宿主配置和网络依赖。React 持有草稿/结果/错误；编辑和失败清旧结果，重置恢复默认，level key 隔离 session。同步计算无 effect/timer/request，无异步取消资源。

**领域边界。** 三时区白名单纽约/上海/UTC，日历1901–9999，中午完整字段回读，count安全整数1–14，结果也限制该日历范围。1901不是SDK全球下界：实际tz1.5.0历史秒级offset setter导致0096/1900中午回读漂移，原FAIL保留；不接私有逆算。真实SDK正例仍含三个区1901/2024/9999，不以guard拒绝冒充支持。

独立 instant 输入年份0001–9999真实parseISO已验证0001/0096/9999；先应用 instant-policy 再 SDK。要求完整秒与明确offset，拒绝-00:00、非法日期、24点/闰秒、超过±14:00和超过3小数。输入四位年份不保证UTC结果仍四位，极值offset可跨年。分钟精度本地显示不无损保存历史秒级偏移；存UTC/epoch，不反解析钟面。

**API核对。** addDays 的 in 上下文通过 tz(zone)构造TZDate再setDate，保留原start；differenceInCalendarDays回答日期格子，differenceInHours默认截断整数小时。format(TZDate)未传in也可能保留其区，不能声称总按设备区；普通Date无in才依赖环境。示例显式in。Intl/TZDB来自运行环境，不保证每部署平台同版本，不代表任意历史中午安全。

**验证。** tests/sdk.test.mjs导入UI共享合同和真实SDK：现代边界/DST/immutable/advanced独立输入/三host TZ子进程/低高年明确instant。原4项后补1项按影响执行，不重复有效路径；instant-policy.test.mjs不调用SDK，只有policy证据。完整React浏览器提案在validation/browser-proposal.txt，与主控公共测试字节相同；candidate18实际三目标+原文/官网4PASS，六运行源一致，未重复浏览器。正式verification仍NOT_RUN。命令cwd/exit/失败历史/未测见local-validation和validation/local-runs.json。

**官方。** date-fns/date-fns固定v4.4.0提交cd53d2538cfa318404eff7ade6449b49bf34562e，pkgs/core4.4.0和pkgs/tz1.5.0匹配；旧date-fns/tz仓库不是本轮版本源。主README1814B、tz包README9377B，完整tree无匹配中文；原文/版本/语言/时间/SHA与rawHeaders在official。官网GET200但XFO/CSP null、Lab origin iframe NOT_RUN，unknown合理。抓取工具完整成功后暂存替换三文件，失败独立failed；不是跨文件崩溃事务，不覆盖旧成功对。

**不得夸大。** 没有locale/周规则/工作日/相对时间、任意IANA范围、后台触发器、OS IME、持久化、服务端浏览器同TZDB或上线验收。不引用仓库历史Actions当本条目PASS，不安装/升级依赖掩盖API差异。
