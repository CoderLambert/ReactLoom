# B18 cmdk 非作者独立复核

quality_e11，2026-11-10，实际cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。只新增本报告，不改产品/公共文件，不重跑已有SDK/policy/type/browser。读取全部条目材料/实际五源/全部测试/日志与官方证据、公共cmdk测试和candidate14原始结果，对照实装cmdk1.1.1、Radix Dialog/FocusScope1.2.0及Escape hook源码。

结论：**确认P2，待作者修正并真实回归**。其余未确认P1/P2。已独立核对23声明输入摘要和4安装SDK审计文件，无差异；官方原文14036B/hash匹配。不能用已通过的四项抵消未覆盖焦点位置的真实失败。

## 六项结论

| 维度 | 独立状态 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | FAIL（局部P2） | 过滤/ARIA/三种value/默认排序/disabled/真实Dialog与生命周期匹配；关闭按钮全量stopPropagation吞掉document冒泡热键，违背已拥有组合的契约。 |
| 解释清楚 | FAIL（该快捷键契约待修） | 总体中文三目标/迁移/fixture清楚，SDK和应用、IME协议与OS区别准确；guide承诺面板开启时Ctrl/Cmd+K可关闭，但关闭按钮持焦例外没有合理依据。 |
| Demo有用 | FAIL（局部P2；四项已有PASS） | candidate14真实三个交互case及一个官方case均PASS；独立额外close-button聚焦探针实际失败。其余能力未因本问题被否定。 |
| 源码可迁移 | PASS（文件/类型结构），功能缺口见P2 | 五源含必要CSS、独立业务/键盘规则，无Lab alias/新增依赖/用户数据写入；复制前须同步P2修复，不能将结构PASS当功能完成。 |
| 官方来源可靠 | PASS | 固定v1.1.1/包manifest、根原文14036B与独立hash、两个候选无中文；旧官方地址真实重定向dip/cmdk，最终强制CSP none/XFO deny支持blocked。 |
| 结果可复核 | FAIL（P2尚未闭环） | 命令/cwd/exit/初始失败日志齐；SDK2/策略16及受影响12复验、类型/格式/metadata结果可复用，candidate14四PASS有据；额外实际probe exit1不能忽略。formal三项NOT_RUN。 |

## P2：关闭按钮持焦时吞掉面板切换热键

位置：`examples/example.tsx:198`，关闭按钮 `onKeyDown={(event) => event.stopPropagation()}`；实际热键owner位于125–138的document非capture监听。这个无条件阻断使该按钮持焦时Ctrl/Cmd+K无法到达owner，尽管面板已打开且ownsPaletteShortcut应该接管组合。

原始证据：`docs/library-lab/evidence/quality-upgrade/candidate-14/b18-close-shortcut-probe.txt`，真实固定dist浏览器记录 `close focused true`、`dialog after documented shortcut true`，exit1，报Owned shortcut was swallowed。此探针由root执行，本复核只读，不重复。原三个交互case从Input测试切换关闭，未覆盖此按钮焦点位置，因而四PASS与该失败并不矛盾。

建议精确拦截可能误触Command根选择/导航的Enter、ArrowUp/ArrowDown/Home/End等按钮内键，放行已拥有的Ctrl/Cmd+K及Tab/Escape到对应owner；不能简单删所有保护，让按钮Enter同时执行高亮命令。root已接受并负责最小产品修正与真实close-button shortcut/Enter不执行/Escape回归，本报告不代写源码。

**Escape边界校准**：实际Radix useEscapeKeydown使用document `capture:true`，在按钮冒泡阻断之前已收到Escape。因此不把“关闭按钮Escape失败”列为已确认缺陷；确认失败仅是应用document bubble热键。源码推断要服从真实事件阶段，不能把所有键混作同一路径。

## 其它重点核对

- Input查询、Item固定id、Root高亮value分离；中文label/keywords不改变身份。useCommandState三个primitive selector保持useSyncExternalStore快照稳定，读数来自SDK而非自造过滤。disabled可匹配但不可执行，select再拒绝delete。
- Command.Dialog实际className给内部根，contentClassName/overlayClassName给真实门户，前缀CSS与viewport限制齐；没有伪传Content onCloseAutoFocus。Radix管modal，应用外置opener与可清理0ms归还任务只在body/脱离焦点且原目标仍连接时恢复，已有焦点不抢。
- document监听只在advanced，成对remove；已消费事件/修饰冲突/编辑目标/组词放过；已拥有repeat只preventDefault不toggle。关闭/重开/level离开/卸载清焦点timer，未清页面全局资源。
- IME native isComposing/229加捕获Enter保护，尾随80ms自然失效、普通输入/抬键/blur解除，不无限等待keyup。协议探针使用合成composition/keydown的性质写明，不冒充OS候选窗；真实OS/设备仍未验。
- 文章fixture仅内存saved/read/citation/count；引用不写系统剪贴板，刷新不请求外站，disabled危险动作无业务分支。原SDK2仅真实filter与SSR标记，policy16仅规则/本地动作，分别记录，没有从它们推导Dialog运行。

## 官方及运行证据

独立重算README14036B，SHA-256 `3c91f31f521a1f6dc077c0faaa0ecd42aa0bf89ed6e2e76267b4f21fc6198cb4`。官方dip/cmdk固定commit `fb4ea04e9ec211777fbb39c6104e3c5f2ee107d2`，同commit cmdk manifest1.1.1。未截断tree仅README.md/website/README.md，目标包目录无README/中文，选根英文原文合理。5匿名GET完整最终头/重定向/日期与摘要保存完整，未改写原文。

包主页pacocoursey/cmdk#readme最终dip/cmdk，HTTP200并不等于可嵌入；XFO deny和enforced frame-ancestors none明确支持blocked，GitHub本身就是声明的主页，未拿raw头冒充独立站。

candidate14 `browser.txt`中B18三个真实交互和primitives-sources官方case共四项PASS，原生Control路径/筛选/高亮/disabled/门户/焦点/协议/卸载已有证据；candidate14整体另有其它条目的失败，不冒称整批全绿。本报告只复用有效记录。P2关闭按钮路径已由额外真实探针确认FAIL，修正后需新匹配候选定向回归。Meta键各OS、真实中文IME、读屏/触摸、完整SSR hydration和远程能力仍NOT_RUN。formal sdk/build/browser不提升。

## 关闭按钮P2：作者最小修复增量核对

2026-11-10，按授权只追加，不改产品/不重跑。现example.tsx198–203只对Enter/ArrowUp/ArrowDown/Home/End stopPropagation，既防止Command根误执行高亮动作，也放行Ctrl/Cmd+K、Tab与Escape到各自owner；没有preventDefault，按钮原生Enter仍能触发onClick关闭。document热键的IME/defaultPrevented/repeat规则未改，Radix Escape capture所有权保留。

公共cmdk测试新增真实close按钮持焦三路径：带收藏高亮时Enter关闭但文章未保存、Control+k关闭并回真实trigger、Escape关闭并回焦，最后文章仍未保存；不改原失败输入或宽松化旧断言。根probe旧dist exit1保留。静态P2已修，无新确认P1/P2；原六项的技术/讲解缺口静态关闭，但该新增路径真实browser仍NOT_RUN，结果不能提前从FAIL改整库PASS，待匹配候选回归后闭环。既有四项PASS保留，formal三项不提升。
