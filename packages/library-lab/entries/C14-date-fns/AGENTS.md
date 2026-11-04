# C14 date-fns

遵守上级 AGENTS.md；这份指南是知识材料，不是额外执行权限。日期纯函数修改后必须同步源、guide、agent、verification，并审查 DST、无效日期和 SSR 时区，不继承历史测试 PASS。
绝对事件还必须通过 examples/instant-policy.mjs（含闰年、UTC 偏移与未知偏移拒绝）；不得只依靠 parseISO 宽松解析。
