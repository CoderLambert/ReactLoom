# 2026-11-18 主控验收补充

当前六项质量均为本地 PASS。SDK完整6/6；独立consumer验证闰日、偏移时间点和秋季DST；真实浏览器4项（3个实验+官方来源）通过。独立复核与完整命令/退出码见 [逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/C22.md)。candidate-22 typecheck/build/catalog exit0，相关输入稳定；正式收据仍NOT_RUN。下文为作者停写时检查点，浏览器待办已由此补充关闭，保留其历史记录。

# C22 恢复检查点

范围：保留已有三实验和 dirty 成果，仅补齐接入说明与证据审计。运行包为 date-fns 4.4.0、@date-fns/tz 1.5.0、Day.js 1.11.23；Moment 2.30.1 只读取固定官方源码。

|质量维度|状态与证据层级|依据|
|---|---|---|
|技术准确|PASS，静态核对 + 真实 SDK|migration.mjs 的 UTC 日历载体、带偏移 parseISO、TZDate/in 上下文；6 项真实 SDK 断言通过。历史 Moment 行为来自 official/moment-source-evidence.json 对应源码，未执行 Moment。|
|解释清楚|PASS，静态内容复核|guide 的值含义表、最小接入、三个实验和旧行为核对；明确日期/时间点/地区/时长，格式令牌与返回值。|
|Demo 有用|NOT_RUN，浏览器待验收|三独立目标与 helper SDK 结果已验证；控件操作、页签卸载和重新挂载尚未做真实浏览器验收。|
|源码可迁移|PASS，静态 + 既有定向类型检查|完整四文件、固定安装命令、插件初始化/CSS/TS/Intl 前提已补齐；validation/typecheck-fixed.txt exit0 对应当前未改动的示例。|
|官方来源可靠|PASS，固定来源/摘要审计|四份原文均匹配既有固定提交清单摘要；validation/readme-digests-resumed.json。Day.js 官方中文优先；date-fns 英文为运行主原文，Moment 历史原文另存。官网依据仍 unknown，未冒称浏览器可嵌入。|
|结果可复核|NOT_RUN，运行链未闭合|SDK 完整本地 6/6 exit0；浏览器、候选构建和正式 recorder 尚待主控，不能从 Node 通过推出浏览器通过。|

本次命令 cwd：`packages/library-lab`；`pnpm test:sdk --entry=C22`，exit0，6 tests / 6 pass，原始输出 `validation/sdk-resumed.txt`，执行时间及源文件摘要 `validation/resumed-inputs.json`。旧 sdk.txt 的 5/6 失败保留；后续 sdk-affected.txt 只覆盖三项。本次完整重跑关闭遗漏，未重复已通过的定向类型检查。四份 README 的摘要与字节数重新匹配，原文未改。2026-11-18 续跑通过官方 Day.js string-format 与 utc 页面核对两项插件前提；固定版本真实性仍由保存的源码与实际安装包约束。

正式 verification.json 全部 NOT_RUN；本地日志没有 recorder 收据，不据此写正式 PASS。未运行全 Lab 生成、构建或 typecheck；无提交、推送或共享文件修改。

## 主控浏览器接线与验收

新增精确 `@C22` Playwright 场景；采用宿主现有路由与场景选择控件，避免猜造路由参数。进入 C22 的 Demo 页签后，以可访问名称选择对应场景。条目内部可直接使用以下定位器：

1. basic：`getByLabel('日历日期', {exact:true})`、`getByTestId('calendar-report')`。默认 Next 两项均为 2026-11-02；点击 `getByRole('button',{name:'试无效日期',exact:true})`，断言 alert 与 valid:false；点击“恢复有效日期”，断言两套 format 为 2026/11/01 且 originalAfterAdd 为 2026-11-01。手工填 2024-02-29 得 Next 2024-03-01。
2. business：`getByLabel('显示时区',{exact:true}).selectOption('Asia/Shanghai')`，`instant-report` 中 ISO 保持 2026-11-01T05:30:00.000Z，displayed 包含 13:30:00。切纽约，依次点击“回拨较早 01:30”/“回拨较晚 01:30”，断言 ISO 分别 05:30Z/06:30Z，显示均 01:30:00；“试缺少偏移”显示 alert。`getByLabel('带偏移 ISO 时间点',{exact:true}).fill('2026-02-30T05:30:00Z')` 同样拒绝。
3. advanced：`getByLabel('纽约排程样例',{exact:true})` 依次 selectOption spring/fall/ordinary，解析 `dst-report` JSON：calendarElapsedHours 为 23/25/24，elapsedHours 始终 24；calendarNext 保持 12:00，spring elapsedNext 为13:00，fall 为11:00；originalAfterBoth 等于 start。
4. 从 Demo 切 docs 后，`getByRole('region',{name:'Moment 日期迁移工作坊'})` 不存在；再回 Demo 输入回初始值。切场景后各自输入初始化。无定时器/请求/订阅，不做全局存储清空。
5. 源码面板能打开五个 sourceFiles，README 呈 date-fns 固定版本原文；官网显示 unknown 与直达入口。若确认 iframe 内容才可更新 allowed；load 事件不能作依据。检查控制台无未处理异常，完成键盘 Tab 访问表单与按钮。

共享请求仅主控新增 e2e @C22、统一生成目录和冻结候选构建；依赖已存在，无 package/lock 请求。当前交付为 STABLE，等待共享浏览器/独立复核；此点后作者停止写入。
