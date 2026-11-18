# B18 本地质量整改与验收边界

2026-11-10，quality_f05独占B18；工作区HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。原11文件无条目diff，实际SHA/status见[baseline.json](validation/baseline.json)。保留已有文章动作、基本键盘策略与三目标，不改公共源码/e2e/依赖锁/队列或旧B10/B14，不提交。正式sdk/build/browser仍NOT_RUN。

## 前提、问题与实际任务

实际安装cmdk1.1.1，React/DOM19.3.0；MIT、peer18/19，实际传递Dialog/FocusScope均1.2.0。运行Demo只依赖已有本地包，不用HTTP、剪贴板、用户存储或外部资产；SSR项目需要客户端交互边界。完整浏览器与独立内容复核由主控组织。

原Root/Input/List/Group/Item与四个文章动作有效，保留。原代码压缩，guide堆积历史CI/未实现远程搜索；官方快照缺失。实际1.1.1 Dialog把className给内层Root，原选择器却在该class上要求cmdk-dialog，门户定位样式未命中；原pendingImeEnter等不到keyup时无限滞留；select里的queueMicrotask归还焦点没有覆盖Escape/热键等关闭路径。原快捷键也未尊重defaultPrevented或repeat。

现5必要源正常排版：新增样式文件并分别用contentClassName/overlayClassName命中真实门户，Item改稳定id+中文keywords，保留本地引用/刷新不假称系统API。新增useCommandState三原始值selector，实际读search/value/count，未自己过滤query制造SDK结果。捕获Enter保留native composing/229与80ms尾随窗，抬键/普通键/blur解除；FocusScope关闭后的可取消0ms任务只在无人接管时归还真实打开控件，监听/任务随离开清理。高级禁用SDK vimBindings避免Ctrl+K两种含义争用，内联保留默认；没有重写SDK方向键/选择/焦点陷阱。

## 三目标与产物

| 目标 | 操作/可观察结果 | SDK与应用边界 |
| --- | --- | --- |
| basic检索/高亮/执行 | Home/方向键/Enter，查询收藏→SDK selectedId=save/count=1，稍后阅读切换，零匹配不执行 | 实际cmdk默认filter/ARIA active descendant/useCommandState；文章由本地applyDemoAction更新 |
| business分组/禁用 | RSS命中刷新，本地计数+1；禁用删除仍可匹配但不能执行；引用写入固定本地字符串 | SDK过滤与disabled；select二次拒绝/fixture不代表授权服务或剪贴板 |
| advanced对话框所有权 | 实际门户样式、可编辑目标不抢Ctrl/Cmd+K、repeat/IME保护、各关闭路径回焦、卸载不留热键 | cmdk组合Radix；应用仅管外置触发器、局部快捷键/尾随窗与自己的可取消任务 |

完整[浏览器提案](validation/browser-proposal.txt)三条@B18，原生键盘/鼠标与真实SDK/DOM，无SDK或时钟mock。禁用项用真实mouse坐标点击，避免Playwright enabled-only click预检查掩盖生产语义。IME使用明确标记的composition/keydown事件协议回归，不冒充操作系统候选窗；同轮80ms边界用同步事件验证接线，100ms自然等待后实际Enter仍可执行。界面结果/实际SDK读数/门户PNG与焦点各自断言。

## 六项检查点

| 项 | 当前结论与层级 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | PASS：匹配源码/类型与真实SDK局部 | [sdk-source-audit.json](validation/sdk-source-audit.json)记录实际cmdk1.1.1/Radix1.2.0的ESM/类型摘要与键盘/门户/关闭焦点摘录；真实defaultFilter+SSR2通过。未把utilities/SSR当完整交互。 |
| 解释清楚 | PASS：静态 | guide先用途、三种value、最小结构，再检索/本地业务/Dialog的三目标与迁移；焦点/IME/门户API版本和边界对应真实代码，agent同步。 |
| Demo有用 | NOT_RUN：主控浏览器待验 | 三目标已实现且提案完整；真实选项/分组/ARIA/门户/焦点/快捷键/事件协议/卸载尚未对本候选运行。 |
| 源码可迁移 | PASS：静态/严格类型 | 5 sourceFiles含必要CSS、业务fixture与键盘守卫，正常排版、无Lab alias/新增依赖/外部资产。应用清理自己的document/timer，SDK负责其资源；完整SSR hydration未测。 |
| 官方来源可靠 | PASS：固定原文/版本/响应 | v1.1.1→fb4ea04e9ec211777fbb39c6104e3c5f2ee107d2，包manifest1.1.1；完整tree两README无中文，包目录无README，选根原文14036B+SHA。包声明旧GitHub入口实际跳转dip/cmdk，最终XFO+CSP明确blocked。 |
| 结果可复核 | NOT_RUN：整体交互；局部日志齐 | SDK2/2、policy16/16、strict入口/提案、16文件Biome、source/metadata均exit0，有精确cwd/argv/UTC/exit与原始日志；未从局部、类型或共享build提升正式PASS。 |

## 官方依据

[原文快照](official/readme.md)14036B，SHA256 `3c91f31f521a1f6dc077c0faaa0ecd42aa0bf89ed6e2e76267b4f21fc6198cb4`，源为dip/cmdk固定提交根README.md。官方完整tree未截断，候选README.md与website/README.md，目标cmdk目录没有README或中文候选；原文字节未格式化、翻译或改写。标签和同commit包manifest确认1.1.1，旧pacocoursey仓库URL真实重定向canonical dip/cmdk。

[完整来源证据](official/source-evidence.json)保存5个匿名公开GET的原始/最终URL、完整最终响应头、状态、时间、长度/hash和包/候选；[fetch-official.py](validation/fetch-official.py)为可复核命令，失败不会覆盖成功快照证据。包声明homepage为https://github.com/pacocoursey/cmdk#readme，实际最终https://github.com/dip/cmdk；GET200、XFO deny与强制CSP frame-ancestors none，blocked依据明确，保留直达，没有把200/iframe load称为可嵌入。

安装源码确认Input强制关联Root的内部label；不要假定Input aria-label优先。默认过滤/手动DOM排序/空状态/高亮来自SDK。Dialog不透传Content onCloseAutoFocus；实际FocusScope把unmount autofocus放在0ms任务，应用的父effect任务随后检查body/连接目标，不能拿旧微任务恢复当各路径证明。升级cmdk或实际Radix时需重核与浏览器回归。

## 实际命令与结果

完整cwd/精确argv/UTC起止/exit/log见[local-runs.json](validation/local-runs.json)。以下除官方fetch在repo根，其他cwd均 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。

| 实际命令 | exit / 原始产物 |
| --- | --- |
| `python3 /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab/entries/B18-cmdk/validation/fetch-official.py`（cwd仓库根） | 0，[official-fetch.txt](validation/official-fetch.txt)，5请求与原文。 |
| `node entries/B18-cmdk/validation/source-audit.mjs` | 0，[source-audit.txt](validation/source-audit.txt)、sdk-source-audit.json，真实已装三包ESM/类型摘要。 |
| `node --test entries/B18-cmdk/tests/sdk.test.mjs` | 0，2PASS/0FAIL/0SKIP，[sdk.txt](validation/sdk.txt)。实际关键词分数0.891、0.8997300269991001，未知词0；真实React SSR验证内部label/combobox/listbox/disabled option，没有DOM替身。 |
| `node --test entries/B18-cmdk/tests/keyboard-policy.test.mts entries/B18-cmdk/tests/command-state.test.mts entries/B18-cmdk/tests/ime-window.test.mts` | 0，16PASS/0FAIL/0SKIP，[policy.txt](validation/policy.txt)；原10案例保留，新6案例验证窗口与事件归属，不是SDK运行。 |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B18-cmdk/examples/demo.tsx entries/B18-cmdk/validation/browser-proposal.check.ts` | 0，[shortcut-typecheck.txt](validation/shortcut-typecheck.txt)，实际入口+完整提案；最后一次校验覆盖重复键消费细化。 |
| `pnpm exec -- biome check --write entries/B18-cmdk/examples entries/B18-cmdk/tests entries/B18-cmdk/library.json entries/B18-cmdk/verification.json entries/B18-cmdk/official/source-evidence.json entries/B18-cmdk/validation/source-audit.mjs entries/B18-cmdk/validation/metadata-check.mjs entries/B18-cmdk/validation/sdk-source-audit.json entries/B18-cmdk/validation/browser-proposal.check.ts` | 0，16文件，[format-final.txt](validation/format-final.txt)。 |
| `node entries/B18-cmdk/validation/metadata-check.mjs` | 0，[metadata.txt](validation/metadata.txt)；共享schema/gate、3目标5源、固定原文/版本/hash/候选、主页redirect/blocked、formal NOT_RUN。 |

提案检查时原样暂存为同目录browser-proposal.check.ts，格式化后同步回.txt，完成即删除临时.ts；复核可同样复制重现类型/格式步骤，没有维护第二份可执行Demo。

初次中间格式exit1两处已保留[intermediate-format.txt](validation/intermediate-format.txt)：generic div不应aria-label、level重置依赖需准确说明；改为具名section和说明后intermediate-format-fixed/typecheck-fixed均0。candidate13收取20文件INTERMEDIATE输入时全部停写，释放后继续收尾；当前最终检查覆盖之后的修改。先前require.resolve(cmdk/package.json)因exports拒绝，只读定位改为解析实际模块后读取包目录；未改依赖或把解析报错当SDK结果。

## 文件、接线与剩余

修改guide/agent/library/verification、example与keyboard-policy；demo、command-state与原10测试仅排版（键盘既有拒绝组补repeat输入）。新增必要styles.css、6例ime-window、真实SDK测试、官方原文/请求与validation脚本/源码审计/提案/日志/摘要。AGENTS未改；完整清单见validation/final-files.txt，输入摘要见validation/input-hashes.json。

关键控件：b18-workshop带data-level/open，b18-sdk-state真实search/selectedId/resultCount，b18-status与b18-article为文章fixture。Input的可访问名来自Command/Command.Dialog的label，按具体容器内combobox定位；Option中文aria-label稳定。Dialog门户在workshop外，class rl-cmdk-dialog；root统一把提案接公共e2e，不需新共享依赖。

主控匹配新候选浏览器/独立内容复核待做，不记content_done。真实操作系统IME、读屏/触摸、完整SSR hydration、服务端授权、远程过滤/Loading/虚拟化未实现或未验收。焦点归还与时序必须据新候选结果裁定，纯策略/SDK工具函数不能替代它。正式收据还需授权干净提交与当前协议，三项保持NOT_RUN。


最终重复热键细化：区分ownsPaletteShortcut与shouldTogglePalette，自有组合的repeat仍preventDefault但不toggle，避免长按把默认动作漏给浏览器搜索。只复验直接受影响12项键盘/IME（shortcut-policy.txt）、3文件格式（shortcut-format.txt）和入口/提案strict类型（shortcut-typecheck.txt），均exit0；原4文章fixture与SDK2复用有效PASS，没有再跑全套。精确命令在local-runs.json，键盘复验为 `node --test entries/B18-cmdk/tests/keyboard-policy.test.mts entries/B18-cmdk/tests/ime-window.test.mts`，cwd同Lab。

最终交付检查：cwd仓库根执行 `python3 /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab/entries/B18-cmdk/validation/final-check.py` exit0，[final-check.txt](validation/final-check.txt)确认本地链接、原AGENTS、5源排版/迁移、原文/版本、三提案与无临时/二进制拷贝；`git diff --check -- packages/library-lab/entries/B18-cmdk` exit0，[diff-check.txt](validation/diff-check.txt)。原生Meta快捷键/各OS差异仍需对应设备验收，提案只把Chromium Control路径列为真实快捷键操作；没有把纯策略覆盖当设备通过。

## 主控独立review后P2增量

候选14原三交互+官方4PASS保留；新真实probe关闭按钮持焦Ctrl+K时dialog仍开，exit1在candidate14/b18-close-shortcut-probe.txt。无条件stopPropagation吞document bubble热键，Radix Escape为capture已排除误判。root仅拦Enter/ArrowUp/Down/Home/End以保护关闭按钮不执行cmdk高亮，放行Ctrl/Cmd+K、Escape、Tab到各owner；没有preventDefault/SDK改写，追加真实关闭控件Enter不执行/CtrlK/Escape三路径回归。受影响公共Document+本入口narrow strict类型0，旧SDK2/policy16不重复；非作者静态增量已通过，真实修复留下一匹配候选。

## candidate15 主控本地质量闭环

本条目适用六项均已通过。candidate15输入f76964af6e3bfa520b3e9e1d78c67a00b09713e1987c8adcce994b46c3e53857，公共/e2e lint/type/build/catalog0且changed=[]；固定dist真实browser29项26PASS/3FAIL，三个失败只属于尚未完成B22。本条目实际通过范围和独立处置见路线图results/B18.md；旧作者摘要为各自阶段历史，新主控输入摘要见validation/controller-input-hashes.json。正式三收据仍NOT_RUN，不是生产/真人最终验收。
