# C05 Ajv 非作者独立复核

复核者quality_e05，作者root。实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`；Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。按library-lab-quality及三个references读取适用AGENTS、library/guide/agent/verification、六生产源、两测试、官方原文与audit/fetch、全部本地日志/metadata/输入摘要及entry与公共浏览器提案。仅新增本报告，未改源码/测试/公共文件/正式状态，没有重跑有效SDK、策略、类型或共享检查。

## 发现及处置

**P2（CLOSED，静态）：allErrors显示key缺少参数，多个同路径/同关键字问题重复。** 原 `examples/example.tsx:85` 只有instancePath/schemaPath/keyword。basic输入{}产生id/title/url三个required，共用根路径和#/required；合法Feed额外两个未知键产生两个同schemaPath的additionalProperties。因此原key会重复，后续错误列表更新有错误DOM复用风险，只有schemaPath还不够。

本复核已及时报root，root最小加入 `JSON.stringify(issue.params)`，保留原三部分；独立复读确认missingProperty/additionalProperty已区分，同条件分支仍由schemaPath区分。Ajv8.20.0实装required/allErrors循环和additionalProperties定义，确实把区别放在params中。root补公共basic真实输入{}三条required→两个未知键两条错误列表与console error观测，entry提案同步且逐字节一致。`review-key-format.txt`、`review-key-type.txt`实际exit0，未改变schema/helper/SDK测试，因而不重跑SDK。此项静态关闭；真实React列表运行仍NOT_RUN。

最终独立复读更新后的input-hashes **16/16一致、0差异**；原绑定已归档before-review，local-validation补充params处置及定向检查，没有覆盖原历史失败。当前无未关闭P1/P2，不把静态关闭当浏览器通过。

## 六项逐项结论

| 维度 | 状态/层级 | 独立依据与实际限制 |
| --- | --- | --- |
| 技术准确 | PASS（静态/匹配实装/有效SDK3） | 8.20.0 MIT实装manifest与固定官方manifest字节一致；UI和SDK直接共用schemas.ts/createValidators，无测试克隆。HTTPS前缀结构vs凭据业务、uniqueItems整对象vsURL身份、strict上下文、条件必填/公共范围、allErrors不修改输入均与源码/测试相符。 |
| 解释清楚 | PASS（独立静态） | guide先说明现有JSON Schema合同问题，再解释compile→bool/errors、分层策略及三个操作目标；明确不是DTO转换、URL键不回写、JSON元数据不是XML、HTTP前缀失败不能证明domain分支。接入位置/必要六源/异步与CSP取舍齐。 |
| Demo有用 | NOT_RUN（真实浏览器）；静态设计通过 | basic结构与凭据域分开；business整对象唯一与来源身份；advanced条件/错误聚合/数据不变，三个目标各有真实默认/反例/恢复。提案含原生输入/实际阶段/输出/错误列表/卸载，未mock Ajv；尚未运行DOM/ARIA/键盘/窄屏或列表回归。 |
| 源码可迁移 | PASS（静态/有效入口strict） | 六sourceFiles含schema/helper声明与必要CSS、正常排版、无Lab alias/网络/资产。模块一次编译，多次同步调用；错误立即复制成字符串/key，不保存下一次会覆盖的errors引用；useId/label/ARIA/scoped盒模型齐。没有timer/监听/异步资源需要虚构清理，React卸载状态即释放；SSR hydration未验。 |
| 官方来源可靠 | PASS（原文/版本/实际HTTP） | 主包README固定npm gitHead0fba0b8e649909613cfce0999b149cd08f4a4987，root manifest8.20.0正确。13781B/SHA38d92452…a27c3与安装README逐字节一致；五候选未截断无中文、en/日期/完整5GET头齐。官网GET200正文NOT_READ明确，头无XFO/CSP，仅unknown而非allowed。 |
| 结果可复核 | NOT_RUN（整体客户端）；局部日志/摘要PASS | 独立阅读真实SDK3pass/0skip、policy3pass/0skip、入口/增量UI/提案strict0、格式/metadata/scoped diff0原始记录，未以作者口头返回代替核对。缺共享schema的真实RED保留。16当前摘要与18项本报告绑定可复读，formal三项NOT_RUN；没有逐库browser/build收据。 |

## 核心代码与测试交叉核对

- **同一合同**：examples/schemas.ts定义feed/batch/window及createValidators；example.tsx与tests/sdk.test.mjs均直接导入它。new Ajv strict/allErrors为true，coerceTypes/useDefaults/removeAdditional为false，三个compile一次生成。SDK3实际执行这些共享函数，不是“同形状测试Schema”。
- **HTTPS结构/业务**：feedSchema是type/minLength和大小写兼容HTTPS前缀正则，不冒充完整URL语义。HTTP先结构失败；虚构reader:secret@的HTTPS满足结构但canonical helper拒绝，UI在结构通过之后才调用policy，domain阶段准确。helper trim本地字符串、创建URL、拒绝凭据/非HTTPS/剩余ASCII控制、移除fragment生成比较键，不回写输入；不声称SSRF授权/网络取数/净化HTML。
- **uniqueItems/身份**：batch的每项复用feedSchema、1–5项和uniqueItems。id/title不同、host/default443/fragment等价的URL由结构允许，由业务在/feeds/1/url报告。完整同对象clone由uniqueItems拒绝，路径/query大小写保留。SDK第二项实际同时证明两层边界，policy第二项证明后续重复精确路径；不把JSON对象等值误写成URL去重。
- **strict/条件**：window祖先有type object，if的enabled const与then required合法；then的maxConcurrent定义同公共范围。实装compile/validate/index.ts checkStrictTypes读取it.dataTypes上下文，无本层types时保留祖先上下文，guide不机械重复type的说明正确。enabled false不要求maxConcurrent，但一旦提供仍需整数1–8；字符串3不会coerce。SDK第三项对false缺字段、true缺字段/合法、false+0、true+9均有实际断言。
- **allErrors/不变性**：真实SDK用enabled true、maxConcurrent字符串3、unreviewed额外字段，断言type与additionalProperties同时存在，structuredClone前后深等；下次调用后已复制的错误仍保持。UI立刻把errors转显示值，success输出JSON.stringify原value，没有隐式trim/default/删除。多required/额外属性key现保留params，当前合同key不冲突。
- **状态/清理**：JSON.parse单独catch，语法阶段明确尚未调Ajv；schema失败不执行domain；任一失败清输出；编辑/切级/反例/恢复均清旧结果，页面状态与控制一致。没有后台保存、异步refine、请求取消或动态外来schema编译声明。

## 官方与实装依据

独立读取实际安装目录 `node_modules/.pnpm/ajv@8.20.0/node_modules/ajv` 的manifest、README、lib/compile/validate/index.ts、required.ts、additionalProperties.ts和uniqueItems.ts。安装manifest SHA `1f9033ee5a6515e7d76938b7072941862d1ed228a6879cc7fe10cdeb75107989`与audit原始manifest请求一致；主原README SHA `38d924524762b917dd9dd341ac28837df51a474bf198ac4c26ba69d8f59a27c3`与metadata/原始请求/安装一致。

[固定官方原README](https://github.com/ajv-validator/ajv/blob/0fba0b8e649909613cfce0999b149cd08f4a4987/README.md)、[官方strict模式](https://ajv.js.org/strict-mode.html)与[修改数据选项](https://ajv.js.org/guide/modifying-data.html)用于交叉核对，版本事实以实装8.20.0为准。root仓库就是目标ajv包，不存在另一个被忽略的包目录README；未截断tree五候选为root/docs/docs-news/docs-packages/spec-json，没有中文版本。

source-audit有npm/manifest/tree/原文/官网五实际GET200，完整最终头保留；官网正文未读取是主动记录而非抓取失败，不伪造body字节/摘要。raw与GitHub的XFO/CSP没有冒充官网策略。无Lab-origin浏览器确认，unknown与直达正确。官方Markdown未格式化/翻译，源码与本文没有执行上游README中的命令。

## 复用证据与剩余

实际已有命令cwd均仓库根：`node --test packages/library-lab/entries/C05-ajv/tests/sdk.test.mjs`→SDK3/0skip/exit0；`node --test .../tests/rss-policy.test.mjs`→纯policy3/0skip/0。入口strict初次及后续UI key改动类型0，提案类型0；本次params修正的review-key-type包含入口与公共提案，review-key-format处理UI/提案2文件，均exit0。精确command/stdout见各txt，已有数据合同通过继续有效。缺schema的red日志是模块未建立的真实失败，未删除或冒充语义red。

本次只读cat/rg/sed/nl/Python hashlib检查均exit0，没有运行SDK/政策/编译器或浏览器。主控修正产品，本复核者只复读并写报告。公共quality-remediation-ajv.spec.ts与entry提案相同，三个场景完整且包含P2回归，但文件存在/类型通过不等于浏览器已通过。

真实DOM列表由3→2、console error、编辑/恢复、输入ARIA/焦点、移动布局、卸载/新挂载、OS读屏/触摸、SSR hydration仍NOT_RUN；standalone/CSP构建、异步查重、XML、服务端授权/字节限额没有实现或没有验收。正式sdk/build/browser仍NOT_RUN，内容完成交root绑定真实候选决定，不自行content_done。

本报告绑定当前16作者输入及entry/public提案额外两项，以下是审查摘要，不是正式运行收据：

```json
{
  "AGENTS.md": "0b78412e6f6a637239aef6879ca73437df496b2f4e7b26fd5fba94a9e42a5bda",
  "agent.md": "d72ed32291a58e71ad599f3a72481218af99149bf65d971252249531ec9557b2",
  "examples/demo.tsx": "f2284fc30009ceaaf34ecc200ff988948d95eba2717c8cf3ec70a978a2dc4038",
  "examples/example.tsx": "e574c235646ea652481180ad2c3aa0ab56f264e30e0feb2af68064196e412d8c",
  "examples/rss-policy.d.mts": "e30c31e152a050f913f2f1b8bce57c7d94a5a0cdc33a823aee95a13b3686c4e7",
  "examples/rss-policy.mjs": "7d551fa3eff8a1d7197c704fafe276b628672e617e429c608e69bc640164e8c4",
  "examples/schemas.ts": "5e6e1cfb11fc90cf574cccf5639aed9a6b9ca8bc035fc702713de2ad26a07910",
  "examples/styles.css": "a61c10284a7fa93d7dec21ba60895495b865fb76dc6ec776ba2ec62e2095a530",
  "guide.md": "e1a79da808ece444f640e027b531be3e751829ad63ec306a9919f256f1ea4be3",
  "library.json": "dc7e8aa9c1a2eef508c85052ecd671884b83387387c5f240e3a8ae1ce3db5f4d",
  "local-validation.md": "88ff8e04173c1f2f89afc3a8479bc4f46ed844c08cdf43170ffbf07112caf6cc",
  "official/readme.md": "38d924524762b917dd9dd341ac28837df51a474bf198ac4c26ba69d8f59a27c3",
  "official/source-audit.json": "a364739dd6b11a1e021745c26cece442c1907b69b905649ec76ac299b7eccbfd",
  "tests/rss-policy.test.mjs": "543e645e0666e22cfaf285b053e51ab8f9a271d1fbbe1f5fa93d41ec0b9e882d",
  "tests/sdk.test.mjs": "1e7b21701da6a20a70f467af6456da2e8d012f21a3a1da070522341757aa12b8",
  "verification.json": "6a135573564b81cabf8dcc2adcd980768a98c884e7b0679f30d17d87b4c31729",
  "validation/browser-proposal.txt": "2fdd3631186e2c774e4b1377099a50fc3e1ecf7d48e1ce40b719bb171ec22982",
  "packages/library-lab/e2e/quality-remediation-ajv.spec.ts": "2fdd3631186e2c774e4b1377099a50fc3e1ecf7d48e1ce40b719bb171ec22982"
}
```

报告 FINAL STABLE：`2026-11-10T15:59:50.586230+00:00`。只写本报告，停止全部C05条目写入。
