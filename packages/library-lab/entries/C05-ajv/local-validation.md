# C05 Ajv 本地质量整改

Owner=root。实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`；定向入口类型命令用 `pnpm --dir packages/library-lab exec ...`。保留原HTTPS结构约束、strict条件和URL身份业务规则；把Schema抽成实际共享文件，移除测试的相似副本。guide/agent围绕订阅导入的三个独立目标重写，修正HTTP例子与strictTypes解释。

| 六项标准 | 状态 / 证据 |
| --- | --- |
| 技术准确 | PASS（限定本地）；SDK3直接导入实际schemas.ts/createValidators，验证HTTPS结构vs凭据业务、整对象唯一vsURL身份、条件/范围/不改输入；policy3仅helper。 |
| 解释清楚 | PASS（静态）；输入→编译函数→分层结果，明确bool结果不是DTO转换、URL键不回写、JSON描述不是XML解析，去除历史CI/未接功能堆砌。 |
| Demo有用 | PASS（candidate16真实浏览器，限定三目标）；实际共享合同/分层/恢复、整对象唯一vsURL身份、条件聚合/不改数据三个case均通过，日志及输入绑定见文末。 |
| 源码可迁移 | PASS（限定strict入口）；六源齐、共享真实合同、无Lab alias/网络/资产；实例useId/ARIA与scoped盒模型/焦点；无外部订阅/定时器。 |
| 官方来源可靠 | PASS（固定原文与HTTP）；npm gitHead0fba0b8e649909613cfce0999b149cd08f4a4987并核root manifest8.20.0，五README候选无中文，13781B原文sha38d92452…a27c3；官网完整GET200无禁止头但Lab-origin未测unknown。 |
| 结果可复核 | PASS（本地六项闭环）；非作者独立复核P2已关闭，candidate16本条目三目标+原文/官网状态4PASS，局部命令/log/exit与SHA齐；正式三项仍NOT_RUN，无固定记录器收据。 |

## 实际命令与原始记录

| 命令（完整argv在日志） | exit / 范围 | 日志 |
| --- | --- | --- |
| `node --test packages/library-lab/entries/C05-ajv/tests/sdk.test.mjs`（共享合同尚未建立） | 1，实际缺模块RED | [sdk-shared-red.txt](validation/sdk-shared-red.txt) |
| 同上，真实共享合同已建立 | 0，SDK3/3，0skip | [sdk.txt](validation/sdk.txt) |
| `node --test packages/library-lab/entries/C05-ajv/tests/rss-policy.test.mjs` | 0，policy3/3 | [policy.txt](validation/policy.txt) |
| `pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit ... entries/C05-ajv/examples/demo.tsx` | 0；后续错误项key模型优化后定向再0 | [typecheck.txt](validation/typecheck.txt)、[ui-typecheck.txt](validation/ui-typecheck.txt) |
| `pnpm exec biome check --write ...` | 0；源码/测试/metadata，后续仅受影响UI0 | [biome.txt](validation/biome.txt)、[ui-format.txt](validation/ui-format.txt) |
| `python packages/library-lab/.local-evidence/c05-fetch.py` | 0；五个实际GET，脚本完整后保存validation/fetch-official.py，无重复拉取 | [official-fetch.txt](validation/official-fetch.txt) |
| `pnpm exec biome check --write ...quality-remediation-ajv.spec.ts` | 0；提案仅格式，未browser | [browser-format.txt](validation/browser-format.txt) |

当前source不再改变时复用已过SDK/策略；格式调整和错误显示key模型没有改变Schema/helper语义。错误key含schemaPath及params以区分条件分支和同根的不同必填/未知字段错误，避免allErrors重复文案导致React重复key；原始数据不被修改。JSON错误不会伪称已调用SDK。

## 边界与后续

官网unknown基于完整实际响应头，不根据iframe load/超时升级；官方原文未经格式化，完整npm/manifest/tree/原文/首页（body NOT_READ）来源在official/source-audit.json。fetch脚本使用固定版本和该npm真实gitHead，不把文档站最新行为当成本地API事实。

本例同步、内存、客户端JSON，不实现远端schema编译、异步去重、XML、持久化或CSP预编译；没有对应功能就不宣称验收。运行时编译需动态函数，严格CSP应另做standalone构建，不通过弱化策略运行此页。本地独立复核与candidate16浏览器现已闭环；根结果/队列由root汇总，不自行修改content_done。

独立复核P2已修：同一#/required或#/additionalProperties可产生多个issue，key新增params，保留path/schemaPath/keyword；basic真实提案增加三必填到两未知字段列表更新断言与console观测。UI+提案类型/格式exit0见review-key-{type,format}.txt，未改变Schema/helper，SDK3/policy3有效复用。旧作者输入归档before-review，新16项最终输入已重绑。

## candidate16真实浏览器与本地六项闭环

主控固定候选输入SHA `e951352e1bbb43925c1af2fef1d6b59f6d2dad1bfcfaa1daccfc1d138aa2b8cd`，原始日志[docs/library-lab/evidence/quality-upgrade/candidate-16/browser.txt](../../../../docs/library-lab/evidence/quality-upgrade/candidate-16/browser.txt)。本记录已实际读取原始日志：整批20case为13PASS/7FAIL；**C05三个真实目标和固定原文/有依据的官网unknown共4PASS，C05无失败**，不把其它条目失败隐藏或宣称全批通过。

本条目三目标实际验证结构/JSON/凭据分层与恢复、多required到多unknown字段错误列表、uniqueItems与URL身份/输出不变、strict条件/聚合/草稿不变和卸载新挂载；原文case验证匹配快照与官网unknown展示，不是Lab-origin iframe允许证据。官网仍unknown，不升级allowed。非作者六项报告见validation/independent-review.md，params key P2静态关闭且对应browser已执行。

六项本地完成层级现为：技术/讲解/迁移/来源按独立静态和有效局部检查，Demo/结果按此匹配候选真实浏览器。SDK3/policy3与源合同未变继续复用，没有重跑或源码改动。屏幕阅读器/触摸/OS输入法、SSR hydration、严格CSP standalone、异步/远程规则等原未实现或未验范围保留；正式sdk/build/browser仍NOT_RUN，局部通过不替代正式收据。

本次只更新local-validation与verification.note，并归档/刷新受影响输入摘要；不改业务源码、正式status或根results。记录 FINAL STABLE：`2026-11-10T16:15:34.460574+00:00`，停止全部C05写入，后续由root汇总。
