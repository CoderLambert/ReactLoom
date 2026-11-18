# C14 安装源码与类型审计

这是安装源码/类型只读核对，不是新 SDK 或浏览器执行。25 个实际文件的 realPath、SHA-256、字节数、版本与 candidate18 六运行源绑定见 sdk-source-audit.json。

- date-fns 4.4.0，@date-fns/tz 1.5.0，两包 MIT。固定 monorepo v4.4.0 commit 的 core/tz manifests 均匹配；两个安装 README 与保存原文逐字节相同。没有拿旧独立 date-fns/tz 仓库1.4.1当1.5.0证明。
- TZDate 类型 date/index.d.ts 的 static tz(tz, timestamp)公开；date/index.js委托new TZDate(...args,tz)。本例timestamp0、setFullYear/setHours调用公开Date兼容API，未读写internal私有字段。
- date/mini.js以external epoch与internal wall fields同步，公开setter经syncFromInternal/adjustToSystemTZ；tzOffset/index.js由Intl longOffset解析分钟（可能含秒的小数）。历史秒级setter漂移由原真实probe证明，审计不猜测修复其内部。实际现代合同回读年月日时分秒毫秒，未满足则拒绝。
- date-fns types.d.ts ContextOptions.in为ContextFn；tz/index.js通过TZDate.tz(zone,+new Date(value))提供该上下文。addDays.js先toDate(date,options?.in)得到新实例，再setDate；不是固定24h，也不修改start。SDK测试实际检查引用与epoch不变。
- differenceInCalendarDays.js先按上下文normalizeDates，取startOfDay并扣实际offset再按日历日跨度取整。differenceInHours.js取epoch差/毫秒每小时，getRoundingMethod.js默认Math.trunc。二者问题不同，不把默认小时整数当精确小数时长。
- format.js调用toDate(date,options?.in)。constructFrom.js优先context函数，再constructDateFrom symbol，再Date构造器；TZDate实现symbol保持timeZone。因此format(TZDate)无in仍可保持目标区，旧“必用设备区”的断言已修；普通Date无in依赖host。真实新增SDK项核对NY12:00与显式UTC17:00。
- parseISO.js支持部分ISO；有timezone分支最终按timestamp+time+offset构造Date，无timezone分支按本地字段构造。因此应用先assertExplicitInstant是独立领域规则。实际parseISO正例覆盖0001/0096/9999、0096显式+08，以及秋季两个offset；不能用年份guard拒绝当SDK低年支持。
- TZDate.toISOString()由SDK覆写、保留本地区与分钟offset。basic特意new Date(+date).toISOString()以得到原生UTC epoch表示；parseInstant返回原生Date。历史分钟显示不保证秒级offset无损往返，文档已说明。
- UI仅useId/useState；calculate同步，编辑清结果/错误，reset恢复默认，level key换session。没有自有timer/listener/request/SDK实例需destroy。模块级Intl/offset缓存属于SDK，未操作其全局缓存。
- 三host TZ子进程只证明固定NY2026配方和UTC1901一致，不证明任意历史时区、任意ICU/TZDB、SSR hydration与浏览器全平台一致。

有效执行分别在sdk-modern-contract.txt（4/4）、sdk-instant-boundaries.txt（仅新增1/1）、policy.txt（纯规则3/3）；原sdk-checkpoint.txt的低年1FAIL保持。候选18真实React三目标和官方case由root完成，shared-evidence.json记录实际命令与输入SHA，未重复SDK或浏览器。
