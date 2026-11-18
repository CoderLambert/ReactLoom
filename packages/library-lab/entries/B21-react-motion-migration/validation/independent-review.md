# B21 非作者独立复核

复核者 quality_e05；实际 cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。本报告只新增此文件；没有改业务源码、公共文件、正式状态或作者记录，没有重跑已有有效 SDK/策略/类型/格式测试。适用 library-lab-quality 及三份 references。

## 对象与证据绑定

读取 library/guide/agent/verification、全部六个生产源码、两测试、双官方原文及 source-evidence、fetch/metadata/执行脚本、全部原始运行日志、browser-proposal。作者 FINAL STABLE 为 `2026-11-10T14:55:39.500791+00:00`。独立用 Python hashlib 重新读取 input-hashes 的22文件、log-hashes 的12文件及 sdk-source-audit 的6份实际安装包文件：**22/12/6均无摘要差异**。这是输入/日志完整性核对，不是重新执行测试。

本轮发现来源问题后 root 已确认并接手修复主快照、metadata/文档/audit，保留旧根原文字节，执行定向摘要检查；不重复 SDK。本报告主体绑定上述修前稳定输入，**root 修复完成后的新摘要尚未由本复核者复读，P2留待增量关闭**。不把修复意向写成已通过。

## 问题

### P2：主 README 选择了仓库根层级，目标包原文存在且与实际安装内容相符

位置：`library.json:107` / `library.json:112`、`guide.md:78`；相关来源脚本 `validation/fetch-official.py` 的 capture 固定获取根 `/README.md`。

已保存7475B、SHA `08915bb5254a4bc1fd47e8d7ea8fff0dcb470461f6fd6b59fb6d2f0bef0400df` 的根原文是可靠的官方原文，来源并未伪造。但同一固定提交下已发现目标包 `packages/motion/README.md`；本次独立真实 GET200 得到 **8259B**，SHA `3d53967ddaef8a5c37b6623ee07376aac9f9f1d2c52c894af3e521ba864fca3f`。实际安装 motion@14.6.0 的 `README.md` 也逐字节具有该长度和摘要。它较根原文多目标包 AnimateView 独立入口、React/DOM19.3要求及迁移说明等，并非同字节副本。

依据：[固定目标包 README](https://github.com/motiondivision/motion/blob/c624ce8e907d5668280b8c832f2ab93ba3462ab5/packages/motion/README.md)；quality 的官方来源规则要求单仓库多包先定位对应包 README。建议主快照取该目标包原文，更新 path/sourceUrl/byte/hash/日期及中文/agent/来源与检查记录，原根字节可归档，历史 react-motion 原文保留。无产品改动，无需重跑 SDK/策略。

root 已接受本项并开始上述最小修正。**当前状态：OPEN，等待新原文/元数据定向检查落盘后的增量复核**。未发现其他已确认 P1/P2。

## 六项独立结论

| 维度 | 状态与层级 | 独立证据和限制 |
| --- | --- | --- |
| 技术准确 | PASS（静态源码/实装 API；局部现代 SDK 证据有效） | library 声明和 imports 仅 motion14.6.0；实装 motion/framer-motion 两 manifest 精确14.6.0、React/DOM peer18/19，未安装旧 react-motion。guide5/11–16明确旧 Motion+独立spring/render prop 与现代数字 animate/transition 的边界，未宣称轨迹、precision/restDelta、跟随与stagger等价。旧0.5.2 peer0.14/15/16仅资料事实。useIsPresent、initial=false、popLayout 与实装源码相符；完整客户端行为未运行。 |
| 解释清楚 | PASS（独立静态） | guide3–16以旧项目迁移为工程问题；18–53按折叠、稳定身份列表、原子撤销/实时减动递进，输入状态→事务→视觉生命周期对应源码；55–65给迁移文件/所有权/SSR边界。运行限制与维护证据另列，原文与本地解释分开。来源层级 P2单列，不能用其他维度抵消。 |
| Demo 有用 | NOT_RUN（真实浏览器）；三目标静态设计通过 | basic 是布尔目标/实际presence；business 是列表身份/立即事务/离场禁用与必要回焦；advanced 是undo/单调ID/24容量/实时系统减动。browser-proposal 三项提供实际键盘/DOM/CSS/几何/媒体操作；没有 SDK/clock/RAF mock。尚未执行真实帧、退出/打断、焦点、窄屏和卸载，不能以SSR2或pure4填运行PASS。 |
| 源码可迁移 | PASS（静态与有效入口类型记录） | 六 sourceFiles 含 example/presence-items/reduced-motion/task-history/CSS/demo，依赖 motion14.6.0、无Lab alias/远程资产。真实 ref/relative 父容器满足popLayout。媒体监听成对remove；ref map经子节点null删除；业务状态、focus意图、动画资源所有权明确。没有全局stop或动画完成后写业务。真实泄漏/水合仍NOT_RUN。 |
| 官方来源可靠 | FAIL（P2目标包选择）；其他来源链静态通过 | 现代根7475B与历史15446B的固定commit/version/lang/date/hash均独立核对；实际9HTTP记录含完整最终头，双未截断tree无中文候选；历史资料明确未运行。现代包主README应换上述8259B目标包原文，root处理中。官网 https://motion.dev/ 实际200，记录头未见XFO/CSP，仅unknown正确，Lab-origin未测。 |
| 结果可复核 | NOT_RUN（整体客户端）；局部日志/摘要核对PASS | 阅读原始SDK2/策略4/入口类型/格式13/metadata与提案修后类型0日志，不依据作者口头返回；输入及日志摘要与现物一致，错误日志保留。现代SSR只证明接口/静态输出，策略只证明reducer；无浏览器收据，formal sdk/build/browser三项均NOT_RUN。来源修正后要重绑定变化输入。 |

## 核心源码核对

- `examples/example.tsx:21–30,37–49`：committedItems在layout effect同步当前数组。remove先验证已提交成员，只有删除按钮当前持焦才产生邻居/add意图；下个提交聚焦存活成员。select也拒绝已经退出身份，避免AnimatePresence保留旧props污染事务。reducer remove未知id为原状态，单步undo同时恢复items/selected且不回退nextId，24限制也在reducer检查。
- `examples/presence-items.tsx:7–19,36–73`：useIsPresent来自真实SDK，离场同提交写inert/aria-hidden、禁用所有按钮，事件自身也guard present。forwardRef到motion.li；CSS ul relative、离场pointer-events:none，SDK负责实际layout/presence，而不是自建timeout模拟。
- `examples/reduced-motion.ts:7–15`：每次挂载只拥有自己的matchMedia change监听，使用同一update解除监听。实际安装的 `framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs` 确实仅 useState(prefersReducedMotion.current)、没有setter，注释与实现的冲突记录准确。
- `examples/example.tsx:53–55` 和 presence-items 的context读数：MotionConfig never配合完整显式y/scale/layout/duration策略；不会把SDK的静态快照冒称实时。React context可以更新退出组件，不依赖冻结props。运行中已有动画如何切换仍是实际浏览器待验。
- 已独立阅读实装 AnimatePresence/index、PresenceChild、use-presence、PopChild 与 MotionConfig。unique key/保留exit/initial首次禁止、useIsPresent上下文语义和PopChild style创建/卸载对应文案。[官方 AnimatePresence 文档](https://motion.dev/docs/react-animate-presence)作为辅助；版本细节以14.6.0实装为准。

## 实际核对与证据范围

本复核执行的命令 cwd 均为仓库根：`git rev-parse HEAD` / scoped `git status --short` / `rg --files` / `cat` / `nl -ba` / Python只读JSON与hashlib审计均exit0（最初猜测目录B21-react-motion不存在的定位查询exit2，随即定位真实B21-react-motion-migration，没有写入）。Python只读审计输出：

```text
inputHashes 22 mismatches []
logHashes 12 mismatches []
sdkSourceHashes 6 mismatches []
motion 14.6.0 React/DOM ^18.0.0 || ^19.0.0
framer-motion 14.6.0 React/DOM ^18.0.0 || ^19.0.0
legacy installed False
actual GET 200 packages/motion/README.md
package README 8259 3d53967ddaef8a5c37b6623ee07376aac9f9f1d2c52c894af3e521ba864fca3f
installed motion README 8259 3d53967ddaef8a5c37b6623ee07376aac9f9f1d2c52c894af3e521ba864fca3f
```

复用原始记录（真实cwd均Lab包目录）：`node --test entries/B21-react-motion-migration/tests/sdk.test.mjs`→exit0、2pass/0skip，`node --test .../tests/task-history.test.mts`→exit0、4pass/0skip；`pnpm exec tsc ... examples/demo.tsx`→0；Biome13→0；metadata→0；提案strict原exit1的HTMLElement|SVGElement.inert错误日志仍保存，收窄后`proposal-typecheck-fixed.txt`→0，提案格式1→0，scoped diff→0。精确argv/time/stdout见既有 `validation/local-runs.json` 及对应txt；本次没有重新执行这些套件。

## 剩余与停止写入

root修正来源P2后只需对变更原文/metadata/文档/hash和新获取记录做定向增量复核；SDK/策略/入口类型不因纯来源文案重复。主控真实浏览器应验证三提案所有交互，退出窗口采样要在真实退出尚未完成时观察，不能把观察过晚当生产缺陷；单步undo/成员身份、实时媒体与卸载属于客户端行为。media remove源码已核对，浏览器提案的DOM断开不等同于全局监听/RAF内存普查，仍保留NOT_RUN。OS设备/读屏/触摸、SSR hydration、多实例和旧SDK运行均未验收。

复核报告写入后停止所有条目写入；不提交、不推送、不改正式verification。

报告 STABLE：`2026-11-10T15:22:54.819152+00:00`。

## 来源P2增量复核：CLOSED（静态）

root最小修正完成后，本复核者实际只读复核：主原文为packages/motion/README.md，8259B、SHA3d53967ddaef8a5c37b6623ee07376aac9f9f1d2c52c894af3e521ba864fca3f，与固定commit实际GET200完整receipt、library元数据、source-evidence modern及实际安装README逐字节一致；guide/agent均已更正摘要，guide固定路径正确。旧7475B根原文保存在official/repository-root-readme.md，source-evidence.archivedRepositoryRoot指向该归档且旧摘要一致，新请求也已加入requests。没有改运行源码或重复SDK。

原问题与中途残留（doc旧SHA、modern旧snapshot指向）均已实际复读关闭，不把历史发现删除。**官方来源可靠现为PASS（静态/原文与HTTP证据），P1/P2无未关闭项。**其他五项沿用前表层级；Demo和整体客户端仍NOT_RUN，正式verification未升级。复读Python只读断言exit0，当前修正输入摘要如下：

```json
{
  "library.json": "835cb263b31f032480213dc0af2998d02217fb96b272411f3c2bca22097e6b6e",
  "guide.md": "ffd6f100f9438f3a24f598d9a739156bd39673d648a68a4c5485e2854f822d24",
  "agent.md": "4d7775fd582a54a85d4d2742bc65b818765b42ae7a9f8588c8aac30f1232b4d2",
  "official/readme.md": "3d53967ddaef8a5c37b6623ee07376aac9f9f1d2c52c894af3e521ba864fca3f",
  "official/source-evidence.json": "2c6588f64db0806a5152cc7f1a4b508fae573ab17be43d86e53ce2b6cf99d1ac",
  "official/package-readme-correction.json": "1916b6d29fd005f1274d6c7f65c9983b12af82a8b3f6ac2fa4515391c1977d7a",
  "official/repository-root-readme.md": "08915bb5254a4bc1fd47e8d7ea8fff0dcb470461f6fd6b59fb6d2f0bef0400df"
}
```

增量 STABLE：`2026-11-10T15:28:15.746655+00:00`，报告写完停止所有条目写入。
