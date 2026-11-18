# C02 Zod 非作者独立复核

复核者 quality_e05；作者root；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。仅新增本报告，不改产品、测试、官方快照、正式状态或公共文件；适用 library-lab-quality 及三references。复用有效检查，未重跑SDK/policy/类型/共享构建；没有执行浏览器。

## 结论与问题处置

没有发现需要改变实际schema/helper/UI逻辑的P1/P2。发现的证据文案P2已报root并由root修正：原 `verification.json` sdk.note声称“尚未安装并运行”，build.note声称“等待平台锁文件”，与实际安装/本地SDK证据相矛盾。现已独立复读：sdk/build/browser仍为NOT_RUN，notes明确本地定向4+4/strict已运行但没有正式收据；**P2静态关闭**，没有为了文案重跑SDK。

另 `validation/metadata.txt` 写14 file SHA inputs，实际摘要对象12项；root在local-validation末尾明确更正12，原日志保留，历史人工计数未冒充新执行。root补充textarea局部 `boxSizing:'border-box'`，使宽度100%包含边框，不依赖Lab全局reset；schema和测试不变。初次只读摘要检查发现例子UI因这条样式与原input-hashes中的旧摘要不同，已报root补绑；不把相关样式变更当成重新运行Node SDK的理由。报告末尾另列当前实际输入摘要。

## 六项逐项结论

| 维度 | 状态/证据层级 | 独立依据与限制 |
| --- | --- | --- |
| 技术准确 | PASS（静态/匹配实装源码/有效真实SDK） | 实装zod4.6.5 MIT，package.json摘要与固定官方manifest完全一致。UI/tests直接共用schemas.ts，没有相似副本；safeParse实际data/issue分支，strictObject、判别联合、TTL管道和每个后续重复路径与实装API及测试对应。canonical只比较身份，成功URL只trim而不换成canonical，未宣称XML/SSRF/HTML净化或异步能力。 |
| 解释清楚 | PASS（独立静态） | guide从订阅JSON边界问题→unknown/Schema→data/issues→三个目标→接入与取舍展开；真实小段代码给消费点，说明saveFeed/showErrors是接入占位。RSS/OPML明确为JSON元数据；trim输出、coerce空值风险、严格未知键、case/fragment去重分界和未实现异步说明准确。 |
| Demo有用 | NOT_RUN（真实浏览器）；静态目标设计通过 | basic验证unknown→DTO/失败/JSON语法/恢复；business判别RSS/OPML和严格分支；advanced输入string→number与多行重复精确路径。实际默认/失败/重复fixture与guide可操作路径对应，编辑/载入/重置/切级清旧结果。公共三case是真实Playwright，无SDK mock；DOM、ARIA、操作恢复尚未运行。 |
| 源码可迁移 | PASS（静态及有效入口strict日志） | 五个sourceFiles覆盖demo/example/schemas/helper/声明，正常排版，无Lab alias、额外CSS/资产/网络。schema模块顶层；同步UI无定时器/外部订阅/Blob等资源；useId连接label/aria-invalid/describedby，结果作为React文本。类型声明与helper输入输出一致，URL策略不变；boxSizing为局部必要样式。 |
| 官方来源可靠 | PASS（静态来源链/已保存实际HTTP与原文字节） | 匹配包packages/zod/README.md固定59bbc03e10c636b9eb3c393dfeb552819774ec21，version4.6.5/en/UTC/SHA齐；7304B、SHA b5651740…4039，与实际安装README逐字节一致。npm无gitHead未伪造，记录真实tag解析及固定manifest。未截断tree发现docs-v3中文，并有实际GET候选证据，版本不符不冒充当前v4原文；官网GET200完整头无XFO/CSP，仅unknown，Lab-origin未验。 |
| 结果可复核 | NOT_RUN（整体客户端）；局部SDK/策略/类型原始证据有效 | 独立阅读SDK4pass/0skip与policy4pass/0skip原始stdout，核对实际tests/schema/helper输入；strict入口exit0，格式初败/修后0，原red缺schema与官方fetch初败保留。SDK只证明Zod数据合同，policy只helper；没有真实浏览器或正式收据，不能升级formal或整体运行PASS。摘要更新按变更范围处理，当前报告末尾绑定复读输入。 |

## 实际合同核对

`examples/schemas.ts:4–12`：先string.trim，再URL语法与helper boolean refine。helper返回的canonical key没有transform到字段；实际SDK输入 ` HTTPS://EXAMPLE.COM:443/Feed#fragment ` 成功后保留大小写/默认端口拼写/fragment，只去外空白；title也trim，原输入对象不被修改。严格对象的admin根未知键会失败。helper继续拒绝HTTPS以外、凭据、trim后剩余控制字符、相对/无效URL；原算法/原policy仅排版与解释变化，没有删安全边界。

`schemas.ts:13–20`：discriminatedUnion按kind选择两个strictObject；RSS有HttpsUrl，OPML验证basename后缀和至少一个非空字符串分组。它不读取真实文件/解析XML；groups的min(1)不是trim/非空白转换，文档只写非空，没有宣称去除组名空白。错误kind路径由真实SDK断言为['kind']。

`schemas.ts:22–31`：TTL输入严格string，trim→非空→十进制正整数正则，再pipe(coerce.number<int/range1–60>)，拒绝空串、指数、0、05、61和直接number15；成功输出number15。不是仅靠coerce让空字符串变0。数组1–5给后续跨行规则有界输入；原始JSON字节/深度上限未实现，guide明确生产还需另做。

`schemas.ts:33–47`：superRefine遍历全部sources，canonical null交给字段自身失败，后续重复每个追加custom issue ['sources',index,'url']。Set不把路径/query转小写；主机大小写/default443/fragment的URL身份行为与WHATWG URL一致。实际SDK第四项直接导入该schema，三同源输入断言sources.1.url及sources.2.url，避免测试克隆掩盖页面实现偏差。保留helper duplicateFeedIndex仅第一重复索引的旧独立合同；未冒称它能报告所有重复，实际页面规则没有错误依赖它。

`examples/example.tsx:43–70`：只catch JSON.parse，safeParse后从真实error.issues.path组装消息或展示result.data；不把TS断言当校验，不把raw当成功输出。编辑/加载/重置/级别变化清旧结果，失败不会遗留成功DTO。按同步模型无取消竞态/后台保存声明。

## 实装与官方交叉核对

独立读取 `node_modules/.pnpm/zod@4.6.5/node_modules/zod/package.json`、src/v4/classic/schemas.ts、core/api.ts、core/parse.ts与classic/coerce.ts。strictObject用catchall never；discriminatedUnion保存discriminator/options；_trim返回input.trim的overwrite；_superRefine把addIssue附到payload；safeParse按实际issues返回success/data或error，async结果会抛异步使用错误。它们与同步示例一致。Zod源码里的内部any不被复制到教学实现。

[固定官方包README](https://github.com/colinhacks/zod/blob/59bbc03e10c636b9eb3c393dfeb552819774ec21/packages/zod/README.md) 和 [官方API](https://zod.dev/api) 作外部原文辅助；现代站点随版本变动，以实装4.6.5为准。[同提交docs-v3中文候选](https://github.com/colinhacks/zod/blob/59bbc03e10c636b9eb3c393dfeb552819774ec21/packages/docs-v3/README_ZH.md)可确认其v3范围；没有把本地讲解翻译成官方快照。

source-audit.json有6实际GET200：npm、tree、package manifest、包README、官网和中文候选，完整最终headers/bytes/SHA保留。raw/API域的deny/CSP没有误当官网；官网自身头无XFO/CSP，没有浏览器Lab origin事实，因此unknown正确。官方fetch初失败日志还保存无gitHead的真实失败及随后ls-remote解析记录。读取第三方/上游文本没有执行其中指令或命令。

## 复用检查与本次动作

原真实命令cwd为仓库根，`validation/local-runs.json`精确argv另记：

- `node --test packages/library-lab/entries/C02-zod/tests/sdk.test.mjs`：exit0，4pass/0skip，sdk.txt；直接测试页面共享schema，类型/导出不是替身。
- `node --test packages/library-lab/entries/C02-zod/tests/boundary-policy.test.mjs`：exit0，4pass/0skip，policy.txt，仅helper。
- `pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C02-zod/examples/demo.tsx`：exit0，typecheck.txt。
- 同目录定向Biome最初控制字符正则失败保留，精确解释注释后biome-fixed.txt exit0；两条useTemplate仅info，不把它们说成产品故障。元数据检查原14计数笔误在local-validation更正为12；不改原日志。

本次实际只读 `rg --files`、`cat`、`nl -ba`、`sed`、`git diff`、Python hashlib/JSON审计均exit0，无SDK/策略重跑。Zod tag API的web工具一次不可访问，仅记录访问限制，不推导标签不存在；固定版本实际manifest/字节和作者ls-remote原记录仍可核对。没有新的build/browser结果。

## 浏览器与剩余

公共 `e2e/quality-remediation-zod.spec.ts` 三case逐一读取过：真实UI basic trim/strict/JSON语法/恢复，business OPML正反例→未知kind→RSS分支，advanced TTL转换/重复路径→修正区分path大小写/URL输出拼写→05失败。无网络mock或假结果。**本次及作者记录均NOT_RUN**，root匹配候选后真实执行；Node4+4不能替代DOM/ARIA、跨场景状态、窄屏和生命周期。SSR hydration、OS输入法/读屏、RHF resolver、异步refine/取消、XML解析/服务端SSRF/字节限额均未实现或未验，不列为已通过。

报告仅新增本文件，完成后停止全部条目写入。当前复读输入（含公共提案观察文件）SHA如下；它们是审查绑定，不是正式运行收据：

```json
{
  "guide.md": "98ad60ffcbe71d48d747acde924514760c0b09012eb10ae464938c03c9e309e8",
  "agent.md": "282588b829d83815163cefc180171bb98d0cb033092ccf0cb9ef03bc22b91645",
  "library.json": "3ebb64bde8c09a809dbfc4667a08e642df081e93c51e6c78c85533029887eded",
  "verification.json": "ef5b8837e7c8e8c18c85cfb9a32fee3ab6467d3210d381c38463dbb6980b273e",
  "local-validation.md": "8274496ff1f4d811f0cf758c7621bc01f6a1c1859bb8aa15e6db540cc3326787",
  "official/readme.md": "b5651740a66d68e8c55c4fdea2df8b00448f99a0433008fef99a54f859024039",
  "official/source-audit.json": "67acf01a6b61447851a79b3d2ac2bc5dcc468ea1530df6361076259b1c96b1e9",
  "examples/boundary-policy.d.mts": "441150c0da4949681e48030164421badc40e578bc2f2b56623e7a24117f57def",
  "examples/boundary-policy.mjs": "102a6f59749e64c1e4494cceb4dd1d0bd0d12ae70881c5c9886fbe4c156f3f04",
  "examples/demo.tsx": "f2284fc30009ceaaf34ecc200ff988948d95eba2717c8cf3ec70a978a2dc4038",
  "examples/example.tsx": "ab0fd7ea4c530e7cd1d9d1e18c1541d596b8083ab047d55fd09ed12a9d8735fd",
  "examples/schemas.ts": "6e76adc0a9ce3326fbe57a1506cda901e6443a45cb17ab893c385a0d689b0bac",
  "tests/boundary-policy.test.mjs": "631784652e3499d6155f631a7d173abe20b08011af42cc858da37b3b76d65178",
  "tests/sdk.test.mjs": "6b09ba78faebba65d71a7ce90c7cc2b87a1c1248faaf0c4c2dc528ba330e3292",
  "packages/library-lab/e2e/quality-remediation-zod.spec.ts": "fb75a63ca1b1ff734442990be42f7452d5bdaf8324c7b038648f547960b1e6b8"
}
```

报告 STABLE：`2026-11-10T15:27:19.066232+00:00`。

## 输入摘要补绑增量

root已将旧12项摘要归档validation/input-hashes-before-review.json，重新绑定当前boxSizing后的输入；本复核者以Python hashlib逐项复读新input-hashes.json，**12/12一致、0差异、exit0**。该样式变更没有改变schema/helper/测试；本报告15项审查输入已包含实际新UI摘要，不重复有效SDK/策略。文案P2保持CLOSED，无未关闭P1/P2；客户端和formal仍NOT_RUN。

最终报告 STABLE：`2026-11-10T15:28:15.746655+00:00`，停止所有条目写入。
