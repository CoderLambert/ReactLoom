# A08 Mermaid 本地整改记录

owner=/root。实际工作区保留dirty成果；开始9文件，repo-relative摘要cc6f670a20db117b2810a38510fc7c820074c31a161eb21a26ebebd1c1951199，HEAD仍1218066e706a90ba03fac8dff8c9b843dd2429c4。没有提交、依赖或模板更改。

## 问题、目标与改动

原指南大量重复维护历史、未挂载HTTP/下载教学；三个常量中前两项不能操作，缺官方原文。保留有效全局串行队列、strict配置、唯一render id、过期结果不提交、失败清旧图及空sandbox。

新增diagram-source.ts：basic去重分支、business缓存时序，advanced继续真实失败/恢复；合法图补accTitle/accDescr，父页文本替代同步。源码正常格式化并补齐CSS和5文件sourceFiles。讲解以RSS处理为贯穿问题，明确消息图不执行HTTP，卸载不取消CPU布局。安装包实测default layout=elk、engines>=22.12，与旧文关键事实一致，删除重复与无依据扩张。

## 官方来源

真实git ls-remote tag mermaid@12.2.0先指ee1fdbcebe057cae346232efb6df066215565bec，再解引用1fb7869866dd619168d840291c9c54b4f129758b。GitHub固定root目录确有README.md与README.zh-CN.md；packages/mermaid无独立README，固定package version12.2.0与安装版本一致。

官方中文原文16991字节，SHA256 2713af51940f7d1df7de75fa0ad30ac5a46620913f1185f26b0408bfb4a81040，未改写。抓取脚本validation/fetch-official.py、目录/版本发现validation/source-discovery.json、完整HTTP响应official/source-evidence.json及实际输出validation/source-fetch.txt。README公开文档链接mermaid.js.org真实GET200；当前官方文档入口mermaid.ai/open-source/亦GET200，未取得Lab origin嵌入证据，unknown保留直达，未以load/timeout当成功。官方README没有声明官方中文文档主页，故采用官方文档入口。

实际核对安装dist/mermaid.core.mjs：parse suppressErrors返回false路径、render对document/临时SVG/DOMPurify/清理依赖及内部队列；config.type.d.ts安全配置/无障碍公开类型。在线官方用法现为12.3.0，只作辅助；固定12.2.0源码和安装版本优先。Context7查询真实返回Monthly quota exceeded，已改读官方网页和本地匹配源码，无私密key或付费调用。

## 六项复核（浏览器前）

| 项 | 状态 | 证据与限制 |
| --- | --- | --- |
| 技术准确 | PASS，静态版本/API核对 | 真实parse/render、全局config/队列、opaque显示与CPU取消边界；官方固定版本与安装一致 |
| 解释清楚 | PASS，静态自审 | 用途/选型→输入处理输出→去重→缓存消息→失败/生命周期→迁移，维护日志已移出正文 |
| Demo有用 | NOT_RUN，待真实browser | 3目标与可操作步骤齐全，节点/消息/错误/恢复/卸载需真实SVG验证 |
| 源码可迁移 | PASS，定向类型/格式 | 5必要运行文件、真实mermaid依赖、CSS与客户端前提；资源所有权说明对应源码 |
| 官方来源可靠 | PASS，固定HTTP原文 | 官方中文/commit/path/version/UTC/hash与完整官网响应，可追溯 |
| 结果可复核 | NOT_RUN，待整体验收 | 实际policy4仅自建队列，类型/格式/源文hash不能代替图；e2e已写真实frame/SVG观察 |

## 实际检查

所有命令cwd为/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab；完整argv、UTC、exit和日志hash见validation/local-runs.json。

- pnpm exec biome check --write：9文件exit0，正常排版。
- node --test entries/A08-mermaid/tests/render-queue.test.mts：4/4 exit0，纯策略，不是SDK绘图。
- pnpm exec tsc --ignoreConfig ... entries/A08-mermaid/examples/demo.tsx：exit0，完整参数见types.txt。
- 固定官方sourceFiles/hash/version/语言/formal状态断言exit0，metadata.txt。共享目录生成、typecheck/build及真实browser由主控收齐稳定输入后统一运行。

公开e2e/quality-remediation-mermaid.spec.ts真实观察：basic SVG节点/尺寸/title/opaque sandbox、开关同步；business实际消息变化；advanced真实parse失败/旧图移除/快速切换恢复/停止重进/SDK临时节点；官方原文和官网直达。没有SDK mock或手绘结果。

## 待办与边界

独立六项复核和匹配候选真实browser待执行。没有新增Node SDK套件：Node不具DOM，实际简式flow/sequence parse可运行而完整状态/标签依赖DOM，不能用简式通过替代真实场景。正式sdk/build/browser全部NOT_RUN，未来需获授权干净提交与recorder准确配方。屏幕阅读器/触控/长图/性能/非Chromium与任意DSL输入不在本次运行范围。


## 主控本地运行闭环

已由/root/quality_e05独立只读复核，无未处置阻断问题；candidate-07稳定构建/类型/目录通过且真实Chromium对应全部场景通过。本库content_done，正式sdk/build/browser仍NOT_RUN。实际命令、日志、首次FAIL及定位器处置与范围见[最终逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/A08.md)，独立审查见[报告](../../../../openspec/roadmaps/upgrade-library-quality/results/review/A08-independent.md)。未重复有效SDK/策略/浏览器检查。
