# C03 Valibot 独立质量复核

非作者复核者 `/root/quality_f05`；UTC `2026-11-10T15:26:03.281675+00:00`。实际 cwd `/home/lambert/githubRepos/lambert/ReactLoom`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。读取本条目 AGENTS、library/guide/agent/verification/local-validation、全部 examples/tests、固定官方原文/HTTP证据、三条 browser proposal 和原始日志，另只读匹配已装 Valibot1.4.2 的真实源码/类型/manifest。只新增本报告，没有改作者源码、依赖、公共文件或正式收据，没有重跑有效SDK/policy或共享检查，没有运行浏览器或新抓取同一官方来源。

## 结论与具体问题

未发现 Schema、公历、selected-path 跨字段、URL输出或 strip 行为方面的 P1/P2。确认一项 P2 迁移 CSS 遗漏，主控已局部修复，静态复读通过；真实客户端运行仍 NOT_RUN。

### P2：100% textarea 依赖未列入迁移文件的全局盒模型

原 [styles.css](../examples/styles.css):4–9 的 textarea 同时设置 width:100% 与 padding:.75rem，却没有 border-box。六 sourceFiles 不包含宿主全局 reset，浏览器默认 content-box 时外盒比父容器大两侧 padding 和边框，窄屏会横向溢出；当前 Lab 公共 `src/styles.css`:15–17 的 `* { box-sizing: border-box }` 恰好掩盖该依赖。[guide](../guide.md)却声明复制六源即可。

**处置**：已向主控报告，主控在 textarea 当前5行补 `box-sizing: border-box`，guide 末尾补明确迁移说明。我已只读复查，修后 CSS SHA256 `de0866609c616149cc47294699948c2d4af9a28750f4df564feac807740dbc4a`。没有扩大为公共 reset，也没有更改 Schema/SDK 调用。静态处置完成，真实宿主窄屏核对由主控负责；复用仍有效 SDK6/policy2，不为无关 CSS 重新运行。

## 六项逐项结论

| 项目 | 独立结论 | 依据与限制 |
| --- | --- | --- |
| 技术准确 | 匹配源码与真实Node SDK限定通过 | 实装1.4.2/MIT/TS peer>=5；shared Feed/Batch/Window真实导入UI与后两项SDK测试。isoDate只验格式，两端真实公历另由helper；partialCheck选择start/end，forward只迁移新增issue；URL布尔check无transform，普通object去未知键。详见下方调用链。 |
| 解释清楚 | 静态通过 | 中文按unknown/JSON语法→真实output/issues→集合嵌套路径→跨字段顺序递进；明确URL形状检查不是输出规范化/SSRF，strip不是权限，纯日期不是时区timestamp。没有以README宣传数字充当本项目体积实测。 |
| Demo有用 | 三独立目标静态成立；客户端 NOT_RUN | basic trim/strip/三字段错误/JSON恢复，business共享Feed的集合上下限和feeds.1.url，advanced不存在结束日/note+end/闰日恢复。三完整真实提案与当前控件一致，无validator mock/伪造outcome；输入、ARIA、窄屏/重挂待root匹配构建。 |
| 源码可迁移 | P2已静态修复；宿主运行 NOT_RUN | 六必要源含shared schemas、mjs实现及.d.mts声明/CSS/demo；无Lab alias、网络/资产/存储或运行脚本依赖。主控补textarea局部border-box后不再依赖公共reset。UI只有同步state和level effect，无timer/listener/Worker可dispose。 |
| 官方来源可靠 | 固定原文/记录通过；首页unknown合理 | npm gitHead=tag v1.4.2=固定library manifest commit0dc26ea88cf07a414653375f0da43f97e0eed607；完整tree八README候选无中文，选实际包library/README.md。实读原文5343B与安装README同SHA256 `7046bda07a0b96c0c3cbdca00818eb0922eb9e18b5f27bddfe871b88f38f0dcb`。六成功请求含完整头/最终URL/时间；首页GET200无XFO/强制CSP，未Lab-origin实测，unknown正确。 |
| 结果可复核 | 局部证据通过；整体/正式 NOT_RUN | 原SDK6与helper policy2、strict入口/提案、格式/metadata/diff日志有cwd/argv/UTC/exit；旧日历red exit1保留，无SKIP/强退。初读15输入/15日志摘要全部一致，SDK源码审计3文件hash一致。主控CSS/guide是后续明确增量，原15输入不能自动覆盖新文件hash；正式sdk/build/browser均NOT_RUN，不从Node推导客户端PASS。 |

## 核心机制核对

1. **两端真实公历**：[schemas.ts](../examples/schemas.ts):23–32 给 start/end 同样的 string→isoDate→isRealCivilDate。实际安装 `dist/index.mjs`:743 的 ISO_DATE_REGEX 只限制四位年/月1–12/日1–31，不能排除2月30日；helper [boundary-policy.mjs](../examples/boundary-policy.mjs):18–26 独立判断每月天数、闰世纪、拒0000且不使用Date.UTC重映射0–99年。固定格式且真实日期才按字典序比较；无效任一日期时顺序predicate返回true，避免追加误导顺序问题。原end缺失公历检查的真实red与修正SDK green均保留。
2. **partialCheck选定路径**：schemas:35–42只选`[['start'],['end']]`并forward到end。实装 partialCheck `index.mjs`:2684–2699 先检查 dataset.typed 或 `_isPartiallyTyped`（2668–2679）；note问题路径与两个选中字段均不相交，仍可执行requirement。start/end类型不可靠时不会盲读；日期本身虽为string但不是真实公历时由predicate显式跳过顺序。forward:3967–3994只转发新产生的issue，不把note错误改挂end。共享Window的真实SDK断言确实同时得到note/end两路径。
3. **URL校验与输出**：Feed的url在schemas:6–10为string→v.url→v.check，仅检查helper返回非null。实装url:3575–3596使用WHATWG `new URL`判形状；helper先trim外围空白，拒剩余ASCII控制字符、非HTTPS及凭据，内部去fragment返回canonical串。但check:915–929不替换dataset.value，因而成功output仍保留输入串大小写/fragment及可能外围空白，不能宣传为canonical转换。guide/agent明确此边界，也明确允许HTTPS本地IP形状、不是出站授权/SSRF。未发现逻辑与讲解矛盾。
4. **trim与strip**：Feed.name和Batch.owner先trim再minLength，普通object运行时构造新dataset.value并只遍历schema entries（实装object:5621起），不会拷贝未知extra。UI [example.tsx](../examples/example.tsx):73–96 将JSON.parse结果保持unknown，只有success分支使用outcome.output；失败只映射getDotPath/message，不持久记录带原始input的整包issue。后两项SDK直接导入实际schemas.ts，包含trim/strip/URL保留、嵌套路径/数量限制/非法结束日与联合错误，不是影子合同替代UI。
5. **UI/状态/所有权**：example:60–71 useId为每实例关联textarea label；level切换重置草稿与idle结果。118–121编辑仅更新原始草稿、清旧结果并置dirty，不重写输入/自动校验。JSON语法失败明确尚未safeParse；输出文本/表格路径和中文消息可见，原生button与aria-live保留。没有异步回包、全局监听、存储或timer，无需人为dispose；完整ARIA/读屏、IME/caret与hydration仍未测。

## 提案与验证边界

[三条真实browser提案](browser-proposal.txt):24–52覆盖basic真实输入与output、三字段问题、脏数据清旧结果、JSON与Schema失败分离/恢复；54–80覆盖Batch两条成功、owner/feeds.1.url、最少/最多；82–126覆盖非法结束日只自身问题、note+end联合问题、闰日恢复、390px overflow、停止旧节点断开及重挂初始问题。提案使用真实页面/真实SDK输出，不调用影子validator、不伪造结果；strict类型通过只能证明源码可编译，不能记browser PASS。

本轮复用作者日志：SDK6 PASS/0SKIP，policy2 PASS/0SKIP，类型/格式/metadata exit0；阅读并核对red日志，不重新执行。独立复核只做只读源码/类型/原文与hash计算，未跑公共脚本（metadata脚本会写input-hashes，故未调用）。原Schema与测试算法没有被本复核改动。

剩余由root运行真实输入/结果/移动布局/焦点及卸载提案，并重绑其CSS/guide增量的摘要；触摸/OS中文IME和光标、读屏公告、SSR hydration仍NOT_RUN。async schema、网络取消、RHF resolver/错误聚焦、后端保存/授权、输入字节/深度上限均未实现且文档明确，不把它们算成功能PASS。

本报告写毕即停止C03所有写入；只新增本文件，保留作者与主控的所有改动。
