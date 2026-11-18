# F15 Knip 隔离复用

固定6.41.0/ISC，Node ^20.19 || >=22.12（本机26.13.1）。适合解释静态unused；不是覆盖率/安全删代码证明。只--directory原创fixture，禁--fix/真实仓库根扫描。

完整迁入workspace package+三knip配置+src三文件+script+test（9份），verify.mjs/report-policy.mjs两helper；sourceFiles全列，policy.test可省。clsx2.1.1故意不import。独立项目安装准确Knip并满足fixture依赖；verify的Lab相对深度/fixture路径迁出需适配，直接CLI则使用自己--directory。无需React/服务/env。

Lab cwd `pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.basic.json --reporter json`，替business；advanced另--production。实际三exit1为预期发现3/3/5，不是失败无效也不是exit0。避免pnpm --filter捕获JSON，预期exit1时会附加文本；初次证据保留。wrapper verify实际启动三Knip进程，再用自建policy验证，符合才退出0。

basic unused.ts+clsx+unreachableHelper；business加script entry和tests project，但tests非entry仍报告孤立，只ignoreIssues压unused.ts的files，不删除/不改图/非ACL；advanced src!生产、未标脚本/测试不纳入，加includeEntryExports报告report/unusedPublic。公开入口可能外部使用，不盲删。

policy JSON结构/exit/2MB上限与fixture类别预期是自建逻辑；synthetic5测试不算SDK。真实CLI3次raw JSON另记；新policy对保存raw重放，不无关重跑CLI。检查函数不是任意项目通用结果断言。动态import/框架插件/公开API需人工/测试复核。

官方固定13d7f21…包README和LICENSE原字节en，无中文候选；包字段SHA见official。官网urllib403后curl200无阻止头仍unknown未iframe验。local-validation六维/命令/退出码/raw齐，正式NOT_RUN；browser仅命令/源码/来源展示。
