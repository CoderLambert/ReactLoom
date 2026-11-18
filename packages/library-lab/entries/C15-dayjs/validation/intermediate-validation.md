# C15 Day.js：整改进行中

仅本条目独占，原10文件无diff，基线见validation/baseline.json。实际已装dayjs1.11.23/MIT，保留严格日期/UTC日历加日/IANA墙上时间与偏移往返；不把旧目录测试存在当PASS。

三个目标：严格日期/不可变/实例中文显示；真实每日中午窗口跨DST23/24/25小时；显式回拨instant与春季不存在时间拒绝。补模块化可迁移源、场景/重置与输入清理、固定官方中文优先原文/响应依据、真实SDK定向检查和完整浏览器提案。formal保持NOT_RUN，未改公共/依赖/锁/e2e，不install/全目录构建/提交。

当前非最终稳定点；后续以真实检查与local-runs补六项和剩余。

INTERMEDIATE STABLE `2026-11-10T17:03:53.905053+00:00`：当前仅保存原10文件clean基线与本记录，生产源码/metadata/SDK测试未变；沿用candidate17原目录已通过的共享编译，不因基线文档重复类型/SDK。暂停C15全部写入去只读复核C11，报告停写后按root授权直接恢复C15。

## candidate18前可编译中间点（2026-11-10T17:09:59.615593+00:00）

从C11只读review返回后按授权实现三个目标源：新增页面/SDK测试共用date-operations.mjs/.d.mts和scoped styles，sourceFiles三场景均7源。strictDate用真实UTC strict parse；basic展示add新对象/原对象前后与实例中文weekday，business重建两天中午窗口及真实instant，advanced保留NY显式偏移/墙上往返并增加秒/offset形状约束。原offset helper继续真实utc/timezone，语言用实例locale，不改全局默认。

level独立Session，显式reset恢复种子；输入/zone/preset改变清旧结果/error。advanced不再读取隐藏civil，避免从basic无效日期串入场景。保留旧region/输入与两preset按钮/运行按钮/dayjs-result。无timer/网络/存储/资源清理任务；不宣称OS IME验收。

实际Lab cwd检查已执行，完整argv/cwd/UTC/exit见local-runs：checkpoint-format为pnpm exec -- biome check --write examples/tests/library，仅本条目9文件exit0，8文件格式化并保留2条useTemplate信息；checkpoint-types为显式入口tsc --ignoreConfig/noEmit/strict/bundler/react-jsx，exit0；node --test entries/C15-dayjs/tests/sdk.test.mjs exit0，6PASS/0SKIP。前5组真实共享Day.js严格解析/不可变与locale/四窗口/转换/往返；第6组混合应用字符串guard与实际timezone往返，不声称每个早拒输入都运行SDK。没有独立纯policy套件，也没有Mock或浏览器执行。此后只有本段/摘要写入，不重复有效检查。

六项INTERMEDIATE：技术/三目标实现与7源迁移可编译；旧guide/agent尚待同步；官方匹配README/完整头、源码审计、metadata最终检查、三完整browser提案及六项终稿均未完成。正式verification三个status维持NOT_RUN。此处不能记content_done或完整质量STABLE。

**INTERMEDIATE STABLE：停止全部C15写入含源码/guide/logs/metadata，无后台任务，等待candidate18明确release。**
