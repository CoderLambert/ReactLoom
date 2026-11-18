# B11 非作者独立六项复核

复核者 `/root/quality_e05`，UTC **2026-11-10T13:53:23.389932+00:00**；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。仅复核B11作者最终STABLE后的材料，唯一写入本报告。未改源码/测试/元数据/正式状态或公共文件，未提交推送、生成构建，也未重跑有效SDK/policy/类型/浏览器。

**结论：未发现阻断的P1/P2；静态复核通过。** 三场景真实运行仍NOT_RUN，交主控匹配候选浏览器，不把此报告、SSR或policy当客户端PASS。

## 六项独立结论

| 维度 | 独立状态/层级 | 证据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（匹配安装源码/类型、静态） | DropdownMenu与委托Menu均2.1.25、MIT、React/DOM peer含19，当前19.3匹配。真实asChild、受控Root、Checkbox/Radio select事件、Sub/两层Portal与CSS变量均符合安装实现；未把preventDefault误写成取消值更新。 |
| 解释清楚 | PASS（静态） | 工程问题→触发与回焦→受控置顶/排序→过滤/删除身份，具体操作与源码对应。明确SDK/本地数组/fixture权限/样式所有权，无未挂载Dialog或HTTP流程冒充当前行为。 |
| Demo有用 | NOT_RUN（真实浏览器） | 三独立目标具真实可操作代码和完整3case提案，涵盖typeahead、普通项关闭、复选单选保持、子菜单、空态和恢复；实际Portal/键盘/布局/清理由主控验收。 |
| 源码可迁移 | PASS（静态/已有类型证据） | 四sourceFiles含命名空间CSS齐、正常排版、无Lab alias。公开data状态、asChild单button、稳定feed.id、当前scope选择回退均保留；无额外全局监听/timer/网络资源。 |
| 官方来源可靠 | PASS（公开元数据映射/原文/HTTP） | npm2.1.25无gitHead，通过公开SLSA映射固定commit，并独立GET该commit包JSON核2.1.25/MIT。原文106B/hash吻合、65README完整候选无中文。签名加密验证明确NOT_RUN。官网200全头无XFO/CSP，iframe未实测→unknown。 |
| 结果可复核 | NOT_RUN（整体运行）；局部记录一致 | SDK2真实SSR与policy6分开、cwd/命令/exit0原始日志齐，CSS最终窄查0且未重跑无关套件。正式sdk/build/browser全部NOT_RUN；本复核15输入sha如下，运行缺口不被静态通过抵消。 |

## 关键调用和业务不变量

1. **事件preventDefault真实含义。** `examples/example.tsx:173–221`的Checkbox和两个RadioItem都明确onSelect.preventDefault，checked/onCheckedChange和RadioGroup.value/onValueChange仍受控。安装`@radix-ui/react-menu/dist/index.mjs:408–415`创建可取消menu.itemSelect事件，仅未被preventDefault时rootContext.onClose；`:517–521`与`:553–557`的Checkbox/Radio组合回调用checkForDefaultPrevented:false。因此文案“保留菜单，同时更新业务值”与当前实现一致。普通详情/重命名/删除不阻止选择默认关闭；没有伪造SDK回调。
2. **可见集合回退正确。** `feed-policy.ts`先filter再对新数组按pins、new/popular、id排序，不改调用者数据。chooseVisibleFeedId使用同一visible函数，保留仍可见id，否则首项或空串。`example.tsx:31–43`在scope改变/删除后同时使用该helper，删除还清选中id对应pin；渲染selectedFeed来自visible而非原数组。unread删除browser/release后design仍在数据但隐藏，selected为空、动作disabled；清scope才能选择design。置顶只变顺序，不使现有选中行消失。原policy6覆盖这些边界。
3. **锁定与恢复边界明确。** SDK删除Item.disabled=locked或无selected；removeCurrent先guard，纯deleteFeed也guard。本地lock不是权限服务。恢复三条fixture同时清pins/scope/sort/selected，locked保留，正文一致。所有动作同步本地，不暗示远程保存、事务或异步确认。
4. **Portal、名称和回焦。** Trigger asChild直接一个原生button，未吞props/ref或button嵌套；触发器不随频道删除而被移除。安装DropdownMenu实现Content aria-labelledby=triggerId，主menu/子menu名称与提案一致；closeAutoFocus在未主动交互外部时调用triggerRef.focus。两层Portal为真实SDK，应用不手写焦点陷阱或全局按键。默认modal菜单会管理交互范围，提案用真实browser Back卸载，不强点屏蔽背景。实际监听/焦点/body pointerEvents恢复仍需浏览器。
5. **CSS与迁移。** class前缀用于Portal外观，未要求其成为宿主section后代。data-highlighted/data-disabled是公开状态，content可用高度变量由SDK提供；max-width/height及滚动声明与窄视口目标对应。没有动画工作负载，reduced-motion声明没有被当成实际设备已验。仅当前DropdownMenu包，不把文档统一radix-ui入口或Dialog能力强塞进依赖。
6. **观察与fixture分界。** 详情确实输出当前title/unread/saved，重命名改title不改id。textValue details/rename提供SDK局部typeahead别名，R不是全局快捷键。data-order/count/visible/selected直接反映本地真实集合，而非预填结果。

## 来源的独立核对

实际安装DropdownMenu2.1.25依赖Menu2.1.25，包peer为React/DOM `^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc`。此声明不等于跨版本实际验收。

本复核额外只读GET两个官方npm JSON及一个固定官方raw文件（均成功返回200），没有执行SDK或下载/运行外部代码：

- [npm 2.1.25](https://registry.npmjs.org/@radix-ui%2freact-dropdown-menu/2.1.25) 的gitHead为空；记录的dist.integrity为sha512，发布/构建attestation subject同为pkg:npm/%40radix-ui/react-dropdown-menu@2.1.25并对应相同sha512内容摘要。
- [公开attestations](https://registry.npmjs.org/-/npm/v1/attestations/@radix-ui%2freact-dropdown-menu@2.1.25) 的SLSA v1 payload指向radix-ui/primitives stable、resolved gitCommit **8f50071238d5d58bacf11910bf04a51c517c6299**、workflow invocation37386418731/attempt1；与source-audit一致。本次只读取/解码JSON，不验证DSSE/Sigstore签名或信任根，不能声称供应链签名已验证。
- [固定package.json](https://raw.githubusercontent.com/radix-ui/primitives/8f50071238d5d58bacf11910bf04a51c517c6299/packages/react/dropdown-menu/package.json) 实际返回name @radix-ui/react-dropdown-menu、version2.1.25、MIT。固定目标README当前快照106B，重算SHA-256 **7d715ed849386dad4615d5624cc5c694564155174c315de736c142a3f1c59317**，与library/source-audit一致。其本来是短文档指针，未改写原文来虚增内容。

source-audit的完整tree truncated=false、65候选中无官方中文，目标包路径优先；syncedAt `2026-11-10T13:38:02.796922+00:00`、repo/ref/path/version/en/sha齐。官网完整GET200最终头在homepage-response，无XFO/CSP，本复核不重请求官网，不从200推断allowed。无真实Lab-origin确认所以unknown合理。

## 验证证据与剩余

复用`validation/sdk.txt`的2PASS/0SKIP：真实closed asChild只一个button，第二项公开forceMount、modal:false且不放Portal的inline SSR。它与生产Portal路径不同，作者说明准确。复用policy6、入口strict类型、metadata、提案类型/格式和最终CSS日志；未重跑任何检查。

浏览器3case提案使用真实键盘/指针/ARIA/行DOM和两层Portal；验证普通动作关闭/回焦、复选/单选保持与order、锁定End跳过、过滤后删除回退、空态恢复、窄视口和打开子菜单时同文档SPA卸载。未使用mock SDK、假菜单、env=test或伪资源getter。等待主控实际运行，发生失败须保留真实日志后定向诊断，不能改expected来替代产品语义。

剩余NOT_RUN：以上全部真实浏览器交互/清理、原生触摸/读屏/辅助技术、SSR hydration、完整资源计数、官网iframe；没有IME输入路径，指南明确未演示该能力。正式verification保持三项NOT_RUN，无阻断的公共依赖或额外安装需求。

## 绑定的15项复核输入

- `library.json`：`b2ab53655c27b03e814bf6f3418fbfc3e33408c76fe837e1d3e8027dbbd5ebe2`
- `guide.md`：`cd740482ec8ca389626be369857829dfe47b9f60f18f47d45464becd4c686b29`
- `agent.md`：`6bf86035f0bcd322eec9da9eec2173ff35757d671aed82249164f4a702b87bd7`
- `verification.json`：`e1ce506cf7254ce91b6e81643ef91f82d0fe99b2ab362eae27f8de4a8e1b0b00`
- `local-validation.md`：`88b65edf9c8b4689e5812c05c7881fbd0314f4dcdfadcb0e2485ec7f3c64aac3`
- `examples/demo.tsx`：`f2284fc30009ceaaf34ecc200ff988948d95eba2717c8cf3ec70a978a2dc4038`
- `examples/example.tsx`：`06de94e48f5cfa03b1be065f056491b3d3c34d085bf9eabc027e50bf649f0ee6`
- `examples/feed-policy.ts`：`c7c51edab36359e0ef0e90c227cd6a10d35801714b75a135b652f1ab7bfb3cb3`
- `examples/dropdown.css`：`7af4189dcf6108bb9d26ff09b7ae559be66fb79c594c2224d42a124f26db0f9d`
- `tests/sdk.test.mjs`：`bd6312cf30b36dc221d0594c468ce7d54e335e722b581c2ddd713b3c0cf5bed9`
- `tests/feed-policy.test.mts`：`3ff6e65b04400f81031ca8342accc8d58a4c4739b2f1529955be5ab4a411a371`
- `official/readme.md`：`7d715ed849386dad4615d5624cc5c694564155174c315de736c142a3f1c59317`
- `official/source-audit.json`：`b974bca83b8fec2137f227dd497491f70f500449d9f95632cf95717a1ffb4c3a`
- `official/homepage-response.json`：`0002b86e44b9ae0e411389f1534efe4b3c0d57e4c203e7f54d16a732a2092439`
- `validation/browser-proposal.txt`：`38df72b9ee50cbbc9d09fd177163bd7800866ac2a0305a3f319b1aad31d05a9b`
