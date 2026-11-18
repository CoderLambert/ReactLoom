# 2026-11-18 主控闭环补充

六项本地质量PASS。实际Orval三配方各运行两次，6/6/7个生成文件哈希一致，19文件及配置严格编译，策略6/6。独立consumer使用新参数与错误分支。Chromium仅核对三CLI命令/源码和官方面板。候选36及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F10.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F10 本地质量记录

STABLE。仅此条目；未改共享/依赖/锁、未运行全局generate/build/typecheck/browser。正式verification仍NOT_RUN。

| 六门槛 | 状态与证据 |
| --- | --- |
| 技术准确 | PASS 真实CLI/静态：installed8.44.0 MIT；真实执行发现并修正config相对路径与tags-split父目录，生成TS需要allowImportingTsExtensions。生成≠HTTP≠运行时校验。 |
| 解释清楚 | PASS 文档：guide解释输入→三个client/mode→输出指纹→strict；原生fetch/QueryProvider/运行时模型限制分开。 |
| 实验有效 | PASS Node CLI：basic fetch、business Query hooks、advanced标签组织三目标均真实两次生成；6/6/7文件，sha见guide及raw。浏览器只展示命令，不当SDK。 |
| 源码可迁入 | PASS 定向tsc：完整配置/契约/入口/run/policy/生成tsconfig均列入sources；repo路径迁入适配明确。生成全部产物strict通过。 |
| 官方可靠 | PASS 原字节：固定f7c7af…packages/orval README1784bytes及LICENSE1075bytes与包version/license；官方树只有该包英文README。官网GET403真实headers保留，unknown不冒称frame阻止或允许。 |
| 结果可复核 | PASS 本地CLI/policy：commands.json完整cwd/argv/exit，原始日志与artifact-manifest可比。正式recorder无，sdk/build/browser仍NOT_RUN。 |

## 原始结果和真实缺陷

cwd均 `/home/lambert/githubRepos/lambert/ReactLoom`。全部命令/退出码见validation/commands.json。

- 首次三个入口均exit1：错误配置导致examples/entries/F10…ENOENT。三个*-cli.log保留；修input `./openapi/news.json`和output `./generated`后basic/business各真实两次exit0。
- advanced修路径后CLI本身exit0但策略exit1：实际tags-split在target父目录创建sources/，旧策略假定advanced/。设置target `generated/advanced/client.ts`后真实两次exit0，7文件。仅删除本次失败命令在自己generated根生成的sources/和index.ts，不动其他条目。此前basic/business不清理。
- 首次生成tsc exit1 TS5097；加noEmit允许allowImportingTsExtensions后exit0，strict/Bundler/ES2022/DOM。未手改生成代码。
- policy6/6 exit0及spec形状检查另记，都不是真实生成SDK。真实CLI为三项目×两次进程，不按生成文件数量声称测试数。
- official-check.mjs重新固定GET三个原件与保存字节相同，installed8.44.0 MIT一致，exit0。
- Scoped Biome exit0，格式化仅entry运行源/自有验证脚本，不格式化生成产物以免改变指纹。源码非阻断style建议保留，无错误。

raw：basic-cli-fixed.log、business-cli-fixed.log、advanced-cli-final.log；generated-types[-final].log；policy.log、spec.log、official.log、biome.log。artifact-manifest.json记录所有19个原始生成TS文件逐文件bytes/SHA，generated本身被gitignore，复现须运行CLI。双次聚合摘要见guide，不把源码展示里的预期输出当raw。

## 剩余边界

没有HTTP服务、React挂载、QueryClientProvider或API-client mutator；生成类型不能校验真实响应。官网403暂不能实测iframe。页面node-ci仅命令与源文件展示，不启动进程；主控如浏览器检查，只验证这点，不把静态终端当在线生成。生产引入新schema必须重跑实际生成与类型检查，不能复用本fixture结果。
