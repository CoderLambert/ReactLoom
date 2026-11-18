# B14 原生拖放本地整改记录

Owner主控，仅本条目与公共e2e接线，保留其他工作者成果。实际repo cwd=/home/lambert/githubRepos/lambert/ReactLoom，HEAD1218066e706a90ba03fac8dff8c9b843dd2429c4，dirty输入；原10文件基线SHAc39f613c1b6ce507afeb094cee2392027251b39aab93c7a02571381a1fe9f124，validation/baseline.json。正式sdk/build/browser均NOT_RUN，没有提交/推送/发布。

## 问题、目标与修改

原真实adapter/combine、固定区间、会话revision、键盘按钮均保留；原讲解声称双实例隔离但仅挂一个列表，源码拥挤且有重复4.x历史/未实现能力堆砌。

现三个目标：基础前三行真实原生手柄拖放/键盘回退并保留隐藏尾部；业务五行固定位置不被跨越；高级主列表+独立对照实例，各有scope/数组/monitor，跨实例拒绝、各自排序与一次撤销。补真实dropTarget回调目标底色、data-all-order观测、SDK真实reorder替换手写splice；无变化重置不制造撤销快照，但仍递增revision使旧drop过期。

运行源只有demo.tsx、example.tsx、pinned-order.ts，样式内联、原创数据，无Lab alias或新依赖。普通排版、输入/规则/结果讲解与实际源码同源。Node工具函数/纯policy/浏览器原生DND分层，触摸/读屏/服务端并发未测。

## 官方原文与版本依据

实际安装核心1.8.1/Apache-2.0，无React peer（核心框架无关）。npm1.8.1无gitHead/dist attestations，git ls-remote对应1.8.1标签无结果。首次查最近5个官方公开package文件提交均4.0.0，未拿当前README冒充旧版。按npm公开发布时间2026-04-22T11:07:59.327Z定位发布当日镜像提交1287861b7c77439f906dc108c21f6236b34c8f53，固定packages/core/package.json确为1.8.1；不声称这已证明精确npm构建commit。原始搜索/匹配依据见validation/version-source-search.json与matched-source.json，首次缺gitHead退出2的来源元数据保留official/source-audit-initial.json。

固定完整tree README候选14项无中文，选择目标packages/core/README.md原文216B，SHAbd43a66cfa1697781045dae0873d9fa77ac34ef31e6ecb5fba8583eb23a3e4e2，未改写或拼接。官方仓库、固定commit/path/lang/version/time/hash及全部GET头在official/source-audit.json/library.json；官网200，CSP头该次为空、无XFO，未Lab-origin iframe确认，unknown并直达。

## 实际命令与原始日志

命令cwd为repo根，pnpm --dir子命令cwd为packages/library-lab。

| 命令 | 结果/日志 |
| --- | --- |
| python packages/library-lab/entries/B14-pragmatic-drag-and-drop/validation/fetch-official.py | 首次exit2（npm无gitHead）；匹配固定版本源后exit0，原始请求official/source-audit.json |
| node --test packages/library-lab/entries/B14-pragmatic-drag-and-drop/tests/sdk.test.mjs | 2PASS/0FAIL/0SKIP，validation/sdk.txt；实际SDK reorder不改输入且保对象身份，combine顺序调用清理。无DOM/mock/force-exit。 |
| node --test packages/library-lab/entries/B14-pragmatic-drag-and-drop/tests/pinned-order.test.mjs packages/library-lab/entries/B14-pragmatic-drag-and-drop/tests/drag-session.test.mts | 12PASS/0FAIL/0SKIP，validation/policy.txt，仅业务规则；随后仅排版/注释，复用有效结果。 |
| pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B14-pragmatic-drag-and-drop/examples/demo.tsx | 组合shell最后实际exit0，validation/typecheck.txt；之后仅同型data-all-order观测/排版，公共候选再覆盖类型。 |
| node packages/library-lab/entries/B14-pragmatic-drag-and-drop/validation/check-metadata.mjs | exit0，metadata.txt；官方schema/原文SHA/3目标3源真实存在。 |
| pnpm exec biome check --write （实际文件参数见日志） | exit0，6文件；初次只8 info模板字符串，改真实业务文案模板后最终format-metadata.txt通过；metadata-runs.json记录argv/cwd/exit。 |

Node SDK/policy/初次入口类型通过一个顺序shell执行，捕获整条shell exit0及各Node测试原始汇总，没有独立退出码manifest；不把工具函数PASS当浏览器适配器运行。其余metadata/格式独立subprocess实际exit在原日志。没有重复跑不变的policy/SDK以凑检查数。

## 六项检查点

| 项 | 状态 | 依据与范围 |
| --- | --- | --- |
| 技术准确 | 静态/utility PASS | 1.8.1实际接口与源码，ID→当前索引→业务守卫→SDK reorder；普通Node工具函数2，非DOM。 |
| 解释清楚 | 静态PASS | 频道排序问题、选型/模型/3操作目标、输入处理结果和固定/作用域/会话边界对应真实源。 |
| Demo有用 | NOT_RUN | 三目标实现，必须等真实原生DND/键盘/双scope运行，不能以12policy或文件齐判通过。 |
| 源码可迁移 | 静态/类型PASS | 3源、局部内联样式、原创数据、effect combine/monitor detach；实际卸载清理待浏览器。 |
| 官方来源可靠 | PASS | 匹配版本固定源码、完整中文候选检查、目标原文/哈希与首页unknown依据齐，不冒称npm gitHead或iframe允许。 |
| 结果可复核 | NOT_RUN | 独立非作者复核+匹配候选浏览器待完成；原始命令/文件/来源保留。 |

公共候选提案已经接成e2e/quality-remediation-pragmatic.spec.ts（主控所有权）：三项实际鼠标原生事件isTrusted、真实行DOM身份、隐藏尾部、键盘按钮、固定源/跨越拒绝、双scope拒绝与互不改写、撤销、old draggable属性清理/重挂。没有SDK mock或DataTransfer结果伪造。触摸/读屏/真实服务器、布局性能/虚拟化不在覆盖；正式三项保持NOT_RUN。

## 主控candidate12真实闭环

真实Pragmatic三目标+官方展示4项PASS：真实mouse原生dragstart isTrusted、SDK行DOM身份与reorder结果/隐藏尾部、原生键盘按钮；固定源不可拖且跨越被拒；双scope跨实例drop不改任一数组而内部拖动只改自己，一步撤销；原生拖动中程序化UI重置模拟业务刷新，随后trusted drop被过期会话拒绝；卸载旧draggable属性清除与重挂再次原生排序。实际Node SDK reorder/combine utility2与业务policy12分开。

非作者完整六项无P1/P2，P3正式note已更正为缺匹配receipt。本地schema/固定1.8.1源码/216B原文/hash/14候选无中文齐，未将无npm gitHead的镜像匹配commit冒称精确发布构建。官网Report-Only frame-ancestors非强制，未iframe确认unknown准确。所有场景实际原生指针，无伪造DataTransfer/SDK结果。

候选2298输入SHA611cb29d104643bf85ae397fdac06a64146259d4b28b5d85278e6264738d3063，lint/type/build/catalog全部0、stability=[]，browser固定dist无隐式build，实际argv/cwd/exit/产物在docs/library-lab/evidence/quality-upgrade/candidate-12。初次16项10PASS6FAIL、观察修正retry5项5PASS，各条目实际范围单独计；不隐瞒他库失败也不重跑本条已通过项。非作者六项与本地运行闭环，正式sdk/build/browser仍NOT_RUN，等待授权干净提交及recorder，不擅自提交以解锁。
