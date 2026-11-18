# C15 Day.js独立非作者六项复核

Reviewer quality_e05，UTC `2026-11-10T17:42:21.187807+00:00`；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD1218066e706a90ba03fac8dff8c9b843dd2429c4。作者quality_f05已FINAL停写，本次独占仅本报告；未改运行源/文档/元数据/测试/官方原文或公共文件，不重跑有效SDK/类型/浏览器/抓取维护套件，不安装或提交推送。

**结论：运行合同和三真实目标未见P1/P2；1处正文链接P2待原作者最小修正。** 已通知root/原作者并保持原作者停写，避免交叉修改。SDK6与root固定dist18三个实际浏览器目标有效；新官方元数据/原文页面仍待下一候选，不计第四个官网case，也不标iframe allowed。formal三个status继续NOT_RUN。

## 已读范围与独立绑定

独立读AGENTS/library/guide/agent/verification/local-validation、全部7源与同源SDK tests、双官方README与source-evidence、抓取脚本/受控传输fixture/初次失败与成功/SDK原日志、14文件源码类型审计、作者摘要/平台绑定、entry及公共完整Playwright提案，以及candidate18 browser-dayjs实际原始txt/json/inputs。原文和SDK事实没有只据作者自评。

实际只读Python SHA检查exit0：作者44文件目录中，input-hashes排除自身的43记录全部0差异；14安装运行入口/类型/可读ESM文件0差异；7源直接比对candidate18 inputs和platform-binding均0差异；主中文3882B和附英文8229B SHA正确，安装英文也相同。实际安装package.json1.11.23/MIT，源码manifest0.0.0-development没有被伪造为发布版。

- candidate18集合SHA：`7a8af9a5cb909275bbbbf4b33bd9008adbb5a2b841c2e46a372a0be8c647f52c`。
- entry/public完整提案同SHA：`f2fe1cd8e8166a2ae513653f95924ae303da16173343d9e6169f14381eb24d99`。
- root真实browser-dayjs.txt SHA：`5cbb1d58e405dec4bb5f7250868d3261e6ea4e668b79312f554bfea0fcbab819`；原始3条@C15均PASS，没有混入C11/C14或官方页面计数。

## P2-1：三个讲解链接不能由发布器打开

准确位置guide.md:82附“固定根英文原文”指向official/package-readme.md，:86“来源证据”指向official/source-evidence.json，:88“本地验证”指向local-validation.md。当前resolveDocumentUrl只支持声明主README alias及允许源/文档；磁盘存在不能证明前端可点。

审查在Lab以纯resolver只读执行（exit0，非SDK测试）：

```js
import { resolveDocumentUrl } from './src/lib/document-utils.mjs'
for (const value of ['official/readme.md', 'official/package-readme.md', 'official/source-evidence.json', 'local-validation.md']) {
  console.log({ value, resolved: resolveDocumentUrl(value, 'C15', '/', 'official/readme.md') })
}
```

实际主README结果/raw/C15/readme.md，后三个均空字符串。用户无法从正文到达所标来源/验证材料，影响讲解与来源入口。

建议只改guide：附英文换固定commit `https://github.com/iamkun/dayjs/blob/4549b8d03307891143e8a50d39fcdab1f16f77cf/README.md`，JSON和维护记录改纯说明并留local-validation维护链接；metadata/最终链接检查改用真实publisher resolver。不要扩大公共私有文件策略、改SDK或为文案重跑6SDK/已通过3case。

## 六项结论

| 维度 | 独立结论 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | PASS，实装/真实SDK/三客户端目标 | shared strict/customParseFormat、不可变add/实例locale、UTC标签加日与两个zone中午、显式instant秒级墙钟/offset往返准确；第六项混合guard与真实SDK，不假称全部拒绝均执行SDK。 |
| 解释清楚 | P2-1待修，其余PASS | 工程问题→四种值→插件与状态owner→三目标→迁移/Intl限制清楚，操作与源一致；三个不可用文档链接需限定修。 |
| Demo有用 | PASS，root固定candidate18真实3/3 | 原始browser-dayjs日志三case实际验证strict/中文weekday/不可变、NY23/25与UTC/上海24、fold/gap/恢复/level/390px/卸载重挂，无SDK/Intl/clock mock。官方新页面尚NOT_RUN。 |
| 源码可迁移 | PASS，7源/strict及候选绑定 | 两共享mjs及声明/CSS/demo齐，正常格式/真实导入，无Lab alias；原example三个export保留，module顶层登记插件、level key隔离state；无应用异步资源需取消。 |
| 官方来源可靠 | 原字节/版本/响应PASS，入口P2-1待修 | 中文3882B真实固定commit，附英文与安装相同；npm gitHead和tag同commit，源码0.0.0-development事实保留。7成功GET有rawHeaders；官网200无捕获XFO/CSP但未验iframe→unknown。 |
| 结果可复核 | 本地SDK/真实目标证据PASS，内容闭环待P2 | 43作者记录/14安装/7候选源/原文/提案独立hash0差异；SDK6/工具3各自限定，初始取证FAIL保留；browser3PASS不含新官方展示，正式三项仍NOT_RUN。 |

## 实际模型、SDK与应用边界

1. date-operations.mjs和offset-instant.mjs由UI与tests/sdk.test.mjs同时导入。strictDate不只用正则，真实dayjs.utc(value,'YYYY-MM-DD',true)检查；basicReport真实add后读取before/after/next/引用，实例locale('zh-cn')不改全局locale。SDK第二项实际比较全局前后。Day.js默认不可变，不加载badMutable。
2. 插件登记是模块全局：offset-instant先utc再timezone，date-operations再customParseFormat，加载zh-cn只登记词典。本例没有render反复extend、全局locale/tz.setDefault或卸载删除全局插件。可读安装ESM的extend/clone/add/locale与customParseFormat严格格式回比源码支持这些解释；运行入口仍真实dayjs.min.js，未替换成可读ESM。
3. civilWindow先在UTC日历标签上算nextCivil，再dayjs.tz分别构造两天中午。没有在带旧offset对象直接add后假定重新消歧，也没有把日历日等同86400000。diff(hour,true)/valueOf/toISOString均是实际库结果。白名单NY/UTC/上海，中午仅样例锚点，不是任意IANA/历史日安全承诺。低年与极限年未虚称全部支持，business四位nextCivil越界会拒绝。
4. resolveExplicitZonedInstant先形状/小时分钟秒/offset策略，拒0000、未知-00:00、超过±14:00；再dayjs(input).tz(zone)按完整秒及Z回查。合法instant不等于属于指定zone的原墙钟；春季02:30-05转换回03:30被拒。Z与+00规范化相符。两合法fold01:30-04/-05实际得到05:30Z/06:30Z，未让静态dayjs.tz猜默认earlier/later。
5. clear函数在input/zone/preset变更清旧JSON/error，run失败清旧成功；Session key按level重建，advanced不读隐藏civil。无应用timer/request/Worker/监听/临时URL，Day.js无component destroy；timezone的Intl缓存归共享SDK，停止只断开所属React DOM，不当全SDK泄漏普查。

## 来源、版本差异和工具证据

固定iamkun/dayjs@4549b8d03307891143e8a50d39fcdab1f16f77cf；release npm1.11.23 gitHead及v1.11.23 tagCommit均相同，安装包version1.11.23。源仓库package.json实际0.0.0-development，初次强断言源manifest=1.11.23的真实FAIL保存在official-fetch-initial.txt及validation/source-evidence.failed.json；作者未改依赖/源manifest来制造一致，后续采用tag/gitHead作为匹配依据合理。

完整tree未截断，实际唯一简体中文候选docs/zh-cn/README.zh-CN.md，因此优先保存中文；原文保留上游HTML/署名/声明，没把其中2kB/全浏览器营销文字挪成本地测量承诺。

| 原文 | 独立字节与SHA |
| --- | --- |
| 中文主README | 3882B，`3f4c6e9edd42554b8c6a1e111daafb568b4eba3e8b9da31a9296abebb8aae2c5` |
| 根英文附原文 | 8229B，`900c80d1b626c1a777f977111322badede124381407b3f6de23e314c05239b27`，与安装README相同 |

同步UTC2026-11-10T17:19:24.962851+00:00。实际中文原文直接链接https://day.js.org/zh-CN/，最终GET200，25项rawHeaders无XFO/CSP，body NOT_READ/bytes null；未从Lab origin确认iframe，unknown可靠，不能据200/iframe load升级allowed。

fetch-official.py全部获取/校验/序列化后暂存中文、英文、evidence，再逐件replace；异常独立failed并抛出。不是跨文件崩溃事务保证。重复headers列表和匿名cookie值脱敏/属性保存有受控fixture检查，原source-tool-transport-fixture.txt真实3场景exit0（成功/首请求失败/两README后官网失败）只证明工具。没有把受控传输算新HTTP/SDK/浏览器，审查未执行或重抓。

## 原始执行复用与未测

SDK原cwd Lab，node --test entries/C15-dayjs/tests/sdk.test.mjs，exit0/6PASS/0SKIP；包含共享strict、真实add/locale、四timezone窗口、UTC转换、两个显式往返，最后一项为应用guard+SDK往返的混合断言。无独立policy suite，未新增虚假policy PASS计数。

root browser-dayjs实际cwd Lab：pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-dayjs.spec.ts --trace=off；UTC2026-11-10T17:36:42.944972至17:36:47.443364，exit0/implicitBuild=false。固定candidate18三目标3/3PASS，原始日志在docs/library-lab/evidence/quality-upgrade/candidate-18/browser-dayjs.txt。当前七源/公共提案与已运行输入相同；作者原local-validation/notes写尚未browser是当时稳定记录，不能抹去后来真实3PASS。作者后续可按影响追加收口，不需重跑；本报告不代改作者notes。

审查者实际仓库根只执行只读Python文件hash/assert（exit0）与Lab纯document resolver（exit0），没有套件命令。实际输出：43作者记录/14安装/7候选源0差异，提案SHA相同，README字节与摘要相同，原始3条通过。正式verification三个status均NOT_RUN。

待修P2-1后仅复读文档/publisher/摘要及作者维护记录，不重测6SDK或3浏览器；新官方元数据/原文页面需匹配新构建。其他仍NOT_RUN：Lab-origin官网iframe、设备timezone/ICU矩阵、历史/极限范围、SSR hydration/独立迁入、OS IME/读屏/touch、后端调度/持久化/部署或全局SDK缓存泄漏普查。

**REVIEW FINAL STABLE：`2026-11-10T17:42:21.187807+00:00`。本次唯一写入为本报告，现停止全部C15写入，交root安排原作者限定P2修；不自行content_done。**

## P2-1独立增量复读：CLOSED（2026-11-10T17:47:22.789680+00:00）

root正式将作者限定修复后的review delta交回quality_e05；原作者已全部停写，本次仍仅追加本报告，不改其他文件/摘要或重跑有效SDK/UI/HTTP。原发现和原结论保留历史，以下为新处置。

已复读guide:82的附英文改为固定commit README.md HTTPS，:86的source-evidence与:88的local-validation已是纯维护路径说明，三个私有路径不再位于Markdown链接内。主中文README仍走声明alias，没有扩大公共发布权限。guide当前SHA为df7f462a7cc96e271dc8be44aaf24efa046ba8943f5e842994fa5b2280a5e3fa。

新publisher-links-check.mjs直接导入实际resolveDocumentUrl：遍历正文5个剩余链接、验证全部resolve，断言主README为/raw/C15/readme.md、三个私有路径仍为空且不在正文链接集合，断言固定英文HTTPS存在。已读publisher-links.txt原始cwd/argv/UTC/exit0与publisher-fix-format.txt exit0（1文件），没有把磁盘存在检查当发布可点，也没有假造SDK/HTTP。实际结果5/5resolve、3私有仍拒，符合建议的最小修复。

作者local-validation新增维护节和verification.browser.note如实记录root固定candidate18三目标3/3PASS；browser-completion-binding.json的根日志SHA5cbb1d58e405dec4bb5f7250868d3261e6ea4e668b79312f554bfea0fcbab819、公共/entry提案SHAf2fe1cd8e8166a2ae513653f95924ae303da16173343d9e6169f14381eb24d99均与前次独立读数相同。七源逐字节未变。旧“尚NOT_RUN”段落被明确保留为当时稳定记录，由后续维护节更新，不虚称原作者重复运行浏览器。

只读独立复算修后作者摘要48条（49目录文件排除摘要自身）在本delta前全部0差异，七运行源仍0差异，原完整独立报告SHA未被作者修改。追加本delta后只有本报告这一条SHA预期变化，不追写作者摘要。正式三个status仍NOT_RUN；新官方中文原文/unknown页面展示尚待candidate19，iframe仍unknown，不能由三个运行case推断第四个官方case已过。

**P2-1 CLOSED。无剩余运行P1/P2或正文发布器P2；六项在已验证本地范围可接受，官方新构建展示继续保留NOT_RUN。** 不自行content_done，不要求重复SDK6/真实三目标/HTTP；原文与源码版本/范围结论继续复用。

**DELTA REVIEW FINAL STABLE：`2026-11-10T17:47:22.789680+00:00`。C15本报告全部停写，下一步仅按root授权只读预审C19，不提前实施。**
