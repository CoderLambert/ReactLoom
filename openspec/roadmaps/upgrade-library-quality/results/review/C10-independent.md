# C10 TanStack Virtual 独立六项复核

非作者 quality_e11，UTC 2026-11-10T16:48:13.346010+00:00；实际cwd /home/lambert/githubRepos/lambert/ReactLoom。作者e05在2026-11-10T16:44:25.160595+00:00声明FINAL并停止全部写入后复核。仅本报告为授权写入，没有改产品/文档/metadata，没有重跑已有效SDK3/policy6/type/格式/metadata/浏览器或抓取官方。

范围：AGENTS、library、guide/agent、全部六生产文件与两测试、formal verification、最终local-validation/原始日志/来源证据/SDK审计/完整提案，以及root candidate17/browser.txt真实4项。**无确认的P1/P2。** 独立只读哈希核对作者16输入全部匹配、四个安装SDK审计文件全部匹配；README5226B/SHA一致，entry提案与root公共三case逐字节相同。

## 六项结论

| 维度 | 独立结论 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（静态/匹配实装+有效SDK模型） | React适配器3.14.21精确依赖core3.19.6、均MIT；真实useVirtualizer、options/keys/measureElement/cache及显式useFlushSync:false匹配源。SSR与无DOM模型没有冒充测量。 |
| 解释清楚 | PASS（静态教学） | 从数据/估计/测量/身份到三目标，解释94是估计、overscan窗口与停滚范围区别、草稿统一提交及重挂清展开代价，步骤对应实际控件。 |
| Demo有用 | PASS（root candidate17三个真实目标） | 原始browser日志分别证明8000窗口/原生滚动深跳、3400筛选/空态/重复身份及组合协议、真实变高/ResizeObserver/深处/390px/重建和卸载。OS IME不在此范围。 |
| 源码可迁移 | PASS（静态/入口严格类型与匹配运行） | 六必要文件含共享合同、mjs声明和局部CSS；应用定位样式与SDK测量不重复拥有行高，原生可聚焦scroll region，SDK effect清理自己的资源。SSR hydration/全量读屏出口未验。 |
| 官方来源可靠 | PASS（固定原文/真实HTTP及tag） | npm gitHead缺失保留null；annotated tag对象与peeled commit分开；同commit双manifest版本匹配。目标React无README，根原文5226B/SHA和无中文候选有树证据；官网完整头XFO DENY无CSP覆盖→blocked。 |
| 结果可复核 | PASS（限定局部/匹配候选真实4PASS） | 16输入/4安装文件SHA、原始SDK3/policy6/类型/format/metadata日志及candidate17三场景+官网4PASS一致；formal三status仍NOT_RUN，没有把整批12PASS算作C10。 |

## 数据、DOM与身份

virtual-contract.ts由UI和SDK模型共同导入，basic只创建8000个对象，其他级3400；filterArticles对同一数组筛选不改原数据。category/query先在草稿中，提交才一起设置filter/revision，没有一边即时分类一边旧查询的混合状态。确定性工程实践850条，stableRowId保持rss-1/rss-5等业务ID；无ID/越界显式失败，不合成missing-index，外部唯一性仍由数据生产者保证。

VirtualList useMemo选项与useCallback getItemKey都依赖当前items；count/data读取同源，React行key用真实row.key。getTotalSize占位、外层absolute/translateY(start)、data-index和measureElement落同一元素，不把row.size写成固定height；不同时对DOM行调用resizeItem，也不启directDomUpdates争夺transform。expand Set按业务ID存，viewIdentity为JSON(category,query,revision)，重复提交增加revision并key重挂，旧viewport断开、缓存/展开/滚动清空是明示合同。

源中onChange只有isScrolling=false才更新自建文字，并未说滚动期间SDK/React不重绘。实装React src/index.tsx:204–216已对measuringFromRef保护flushSync，本例false是显式策略，不把默认true等同React19必然警告。

## 输入与生命周期

搜索composing/native isComposing/keyCode229与确认Enter held guard匹配提案；compositionend不无条件吞下一次普通Enter，keyup/非Enter/blur清确认按键，reset清组合/草稿/已提交身份。实际OS候选窗口、移动键盘/剪贴板仍未运行，程序composition事件只验证应用边界。

滚动窗口用有label的section region和tabIndex0保留PageDown/方向键，focus样式和确定高度365px必要。未挂载文章不在无障碍树，指南没有把8000条说成可连续读屏；分页语义出口未实现。

实际React适配器effect返回instance._didMount()的cleanup；core src/index.ts:990–999执行所属unsubs、observer.disconnect并取消自有rafId，_didMount:1029返回该cleanup。应用不加网络/业务timer或替代observer，不全局stop。root实际case检查旧DOM脱离和新会话默认展开；这不是全局资源/所有timer泄漏普查，文档剩余范围准确。

## SDK、浏览器与原始日志

只读复用sdk.txt的正常真实SDK3与policy.txt的6项，未重新执行。SDK第一项SSR无viewport而0窗口/total37600；第二项公开Virtualizer用initialRect640×200及94估计得到total1880和含overscan8项；第三项resizeItem人工提供152/100、按key重排缓存、measure清缓存，未装DOM、未mockSDK/observer/clock，也没有调用私有挂载API。人工尺寸输入绝不当真实DOM高度。

root candidate17/browser.txt整批12PASS/exit0中只有C10三交互+原文/blocked展示1项属于本条目（合计4PASS）。公开三case和entry提案相同SHA0076dddec6621fb847581cffee0b863df952c2988fd02e281a56bd03732ffd2d；源码六文件与已编译checkpoint一致，作者后续仅补来源/讲解/记录。初次Biome控制正则/scroll语义失败、最终链接检查次序失败都保存，不用后来绿结果抹去原始失败。

本人只读标准库hash核对16/16作者输入及4/4安装文件、README原文SHA与提案字节一致，实际exit0；不导入SDK，不再打开浏览器。正式verification仍NOT_RUN，匹配收据另计。

## 官方原文与维护

官方TanStack/virtual，React tag @tanstack/react-virtual@3.14.21对象b809313c001e5e29ef7e960edd1985a8098b7d74，实际git ls-remote记录peel到28ff2cab7a970f4e0908229d65a0da8803903900；React3.14.21/core3.19.6同提交manifest核对。npm没有React gitHead，未伪造。完整树有根README、其他框架/示例README，但目标React包没有；选择根而非挪用别的框架，英文5226B，SHA24bd3ff93da253313681dbe66adab7b012caca06f03edc516dfd875a1274ff00，候选无匹配中文。

source-evidence保留7个真实GET完整最终头与tag stdout；官网200/XFO DENY/强制frameAncestors null、正文NOT_READ支持blocked，不推定浏览器允许。抓取工具已是except独立failed+全部成功双暂存replace，没有finally覆盖成功对；本库未运行维护transport fixture，报告如实NOT_RUN而非复用其他库fixture计数。

剩余：真实OS IME/读屏/触摸、SSR hydration、多实例、全局泄漏/性能、任意外部数据ID合同、网络分页/游标与全量可访问入口均未验/未实现。没有新增阻断。

## 复核输入摘要

| 文件 | SHA-256 |
| --- | --- |
| examples/example.tsx | 998dca39552cfa546f679e72a30d30cef77a3e5ded05b8f67969e952c47dd32b |
| examples/virtual-contract.ts | afdcd5ce7e31388a576b75ca1dd43f661601474c9f2a7bdaa37e59ea9195a3df |
| examples/filter-policy.mjs | 4d23b63c1f8dec1a86cf4c70ab3aa4f95ec89a9d2c9112b3667ecbe7d9ae49ae |
| examples/filter-policy.d.mts | b9d7c601382bda078c97bdee62a2051db86d85853664c009790b6b17747f302c |
| examples/styles.css | 929b7f0a75c64be4f712978d4f96898f1940c71408434d097a8c3805994aaaf7 |
| examples/demo.tsx | f2284fc30009ceaaf34ecc200ff988948d95eba2717c8cf3ec70a978a2dc4038 |
| library.json | f9125dddd1af894c94b5f429ba053104c3ab7cd2ab98cb736e20ea01ab07f3fe |
| guide.md | d0e7cc54f6f39a704ebec3675084714ab0698e3828c636b4d53c8c6f788a6d0f |
| agent.md | 7272814824b894e87d735070be71d78339b84225c1387697a9299593e5c8b338 |
| verification.json | aaab31f48c9612f842a63aaafc3647bb3e0ca532e1465d3a79911f3a8f63b9a4 |
| official/readme.md | 24bd3ff93da253313681dbe66adab7b012caca06f03edc516dfd875a1274ff00 |
| official/source-evidence.json | 5dac85f7c1d9bc741bbf0ae66baebd33271807d30e4526bcdb6e5f35fad12b5f |
| validation/browser-proposal.txt | 0076dddec6621fb847581cffee0b863df952c2988fd02e281a56bd03732ffd2d |
| validation/input-hashes.json | 2e61c76bf35a6dc30672cb4e519d2d866c9074c65da2b84402c4df54852f1bb8 |

本报告是唯一写入。现已停止C10全部报告写入，继续C14已授权工作，不自行登记content_done。
