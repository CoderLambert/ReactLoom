# C21 tailwind-merge 本地验证与复核记录

实际cwd /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab。作者初始核对真实目录C21-tailwind-merge，原7文件clean，没有覆盖dirty成果；HEAD与初始字节/SHA见[baseline](validation/baseline.json)。作者仅写本条目，保留他人工作；公共接线和后续candidate21的Lab构建/浏览器由主控协调执行。下文将作者检查和已执行的candidate21本地结果分别保留，等待非作者对记录修订做delta复核，不自行content_done。

## 六项状态

| 项目 | 当前结论与层级 | 实际证据/边界 |
| --- | --- | --- |
| 技术准确 | PASS，实际SDK与源码静态 | 实装tailwind-merge3.7.0/clsx2.1.1；真实SDK5PASS；方向、modifier/important、未知与自定义语义核19安装/宿主文件 |
| 解释清楚 | PASS，作者静态，待非作者 | 一完整实验从base/条件变体/调用者到实际DOM；CSS构建与字符串识别分开，未知类不笼统称全部custom未知 |
| Demo有用 | PASS，本地真实browser REUSED | 唯一basic、8输入预设保留旧合格用例；candidate21完整实验实际验证class/padding/背景/hover/断点/自定义/重置卸载，1case PASS；另1case验证官方原文和blocked展示 |
| 源码可迁移 | PASS，静态/入口strict | 5源含共享mjs/声明/必要CSS，真实Tailwind宿主版本与迁移前提明确；无Lab alias/网络/异步资源 |
| 官方来源 | PASS，原文/真实HTTP | npm无gitHead，用release tag→commit→目标包manifest3.7.0；匹配目录无中文，英文2549B与安装README相同；GitHub CSP none/XFO deny→blocked |
| 结果可复核 | PASS，本地证据；修订待非作者delta | SDK5/入口/完整提案/维护fixture3/metadata19源码+9链接/格式/diff均exit0；candidate21匹配Lab type/build/catalog exit0，本条浏览器2case PASS，命令、输入与原始日志见下文 |

verification保留原content字段并保持NOT_RUN；正式sdk/build/browser三status也保持NOT_RUN，无正式收据不升级。candidate21的本地浏览器已实际执行，本条两个case结果单独统计；不引用其他条目或历史CI作为本条通过。

## 为什么只保留一个目标

库核心是同步字符串函数，原basic/business/advanced重复输入与结果；本轮收成一个完整工作流而非机械扩三层。保留cn(clsx→twMerge)、旧同组px/px、px/pr双方向、md/hover真实例子作为输入预设；新增调用者覆盖预设与真实自定义px组对照，共8预设。用户仍在同一表单观察：

组件base → clsx选中/尺寸variants → 调用者className最后 → twJoin与真实默认merge/当前配置merge → article真实className → 已加载CSS。配置摘录来自公开getDefaultConfig的p/px/pr，不手写内部逐token识别结果。

5必要源为example.tsx、merge-model.mjs、merge-model.d.mts、styles.css、demo.tsx。新模型直接调用实际twMerge/extendTailwindMerge/clsx/twJoin；不是正则模拟。cn仍作为可迁移函数导出。源码正常排版，最终strict已过。

DOM需要真实Tailwind编译，不由merge生成。已读Lab实际src/styles.css的@import和vite.config.ts插件，Tailwind/@tailwindcss/vite实装4.3.3；预设中完整类名留在可迁移源供扫描。调用者px-1/bg-blue-100预设让指南示例也有完整literal，不靠运行时拼接要求JIT现场生成。自有c21-pad-* CSS实际设置padding-inline，所以把它们加px组有依据；其他动态输入不承诺存在CSS。

## 真实SDK与生命周期

[sdk.txt](validation/sdk.txt)实际正常node --test，5PASS/0SKIP exit0：
1. 共享模型基础/选中/舒适/调用者最后顺序，cn对象条件、twJoin字符串/数组。
2. 真实getDefaultConfig与px/pr两个方向、同px组冲突。
3. md与默认/hover与静止、普通modifier排序与important通道。
4. 默认未知c21-pad类都保留；真实扩展识别为px后只留较晚类，且能被已知px-6覆盖。
5. 未知my-widget重复仍保留；默认validator能识别bg-brand/bg-accent，不把“custom名字”一律归未知。

没有独立policy-only套件，不为凑数复制实现测自己。SDK后只加一个使用同已测caller值的预设、UI控制/SDK配置显示与格式化，合并函数逻辑不变；保持有效SDK5，不重跑无影响项。首次辅助Python编辑因格式化import needle触发assert，UI当次未写；模型/声明已先更新并由实际5项验证，随后用精确patch修控制预设/配置显示，最终入口strict0。没有真实SDK FAIL被掩盖。

React只持输入/选中/尺寸/custom/preset，实时计算，无timer、监听、请求、Worker、存储或自有SDK实例；重置清全部控件，卸载后重开新状态。模块级扩展/SDK缓存复用，不清全局缓存。预览contain/overflow仅限制实验布局，不是任意CSS安全沙箱；class字符串按JSX属性，不把它说成净化后的用户主题接口。

## 官方原文、版本与官网

[原始来源证据](official/source-evidence.json)保存7实际匿名HTTP及raw重复响应头，公开cookie值摘要脱敏、属性保留；官网正文NOT_READ。registry3.7.0 gitHead=null。实际tailwind-merge@3.7.0 tag链解引用到511d68a65d8fa11ae8a549b5a1d5cf4dced41101，目标manifest为packages/tailwind-merge/package.json、version3.7.0。没有把monorepo根配置或main文档当匹配package版本。

[官方包README原文](official/readme.md)：packages/tailwind-merge/README.md，英文2549B，SHA256 b7686c3623d44ff744eebef1bc9a2b8ab36cee4e491d1c609fc8131e67d2f2b3，实际完整tree中目标包直属README候选只有该文件，无匹配官方中文。与已安装包README逐字节相同，保留原文内容、署名和链接，不自行翻译替代。同步UTC 2026-11-10T18:10:55.510769+00:00；repo/commit/path/sourceUrl/version/lang/time/SHA字段完整。

官方包homepage声明为GitHub repository，没有另造独立官网。实际GET最终CSP frame-ancestors 'none'，XFO deny，两者支持blocked；不是只看HTTP200或load事件。未实际浏览器嵌入验证，也未升级allowed；直达路径由平台提供。

[抓取工具](validation/fetch-official.py)全部获取/版本检查成功才暂存README与JSON，再逐个replace，异常独立failed并抛错保留旧成功pair；不是跨文件OS崩溃事务。没有finally覆盖或提前写README。[受控传输日志](validation/source-tool-transport.txt)3/3 exit0：success验证重复头/cookie摘要/blocked及正文不读；首请求失败/README后官网失败保留两份旧成功哨兵。这只是工具维护fixture，不是新官方HTTP、SDK或browser PASS。

[源码审计说明](validation/sdk-source-audit.md)与[19文件SHA](validation/sdk-source-audit.json)核公开API/类型、扫描/分组/重要性、扩展/缓存及真实Tailwind4.3.3宿主。metadata逐份读安装/宿主文件复算SHA，不是另一次SDK执行。

## 作者实际命令与产物

全部实际cwd为Lab；完整argv/UTC/exit/log在[local-runs.json](validation/local-runs.json)。没有运行全目录检查，日志均.txt。类型和格式按影响执行，info仅模板字符串建议、没有lint error。

| 实际命令 | exit | 日志 |
| --- | --- | --- |
| `pnpm exec biome check --write entries/C21-tailwind-merge/examples entries/C21-tailwind-merge/library.json` | 0 | [validation/format-checkpoint.txt](validation/format-checkpoint.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C21-tailwind-merge/examples/demo.tsx` | 0 | [validation/type-checkpoint.txt](validation/type-checkpoint.txt) |
| `pnpm exec node --test entries/C21-tailwind-merge/tests/sdk.test.mjs` | 0 | [validation/sdk.txt](validation/sdk.txt) |
| `python3 entries/C21-tailwind-merge/validation/fetch-official.py` | 0 | [validation/official-fetch.txt](validation/official-fetch.txt) |
| `python3 entries/C21-tailwind-merge/validation/check-proposal.py` | 0 | [validation/proposal-check.txt](validation/proposal-check.txt) |
| `python3 entries/C21-tailwind-merge/validation/source-tool-transport-fixture.py` | 0 | [validation/source-tool-transport.txt](validation/source-tool-transport.txt) |
| `pnpm exec node entries/C21-tailwind-merge/validation/metadata-check.mjs` | 0 | [validation/metadata.txt](validation/metadata.txt) |
| `pnpm exec biome check --write entries/C21-tailwind-merge/examples entries/C21-tailwind-merge/tests entries/C21-tailwind-merge/library.json entries/C21-tailwind-merge/validation/metadata-check.mjs` | 0 | [validation/format-final.txt](validation/format-final.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C21-tailwind-merge/examples/demo.tsx` | 0 | [validation/type-final.txt](validation/type-final.txt) |
| `pnpm exec node entries/C21-tailwind-merge/validation/metadata-check.mjs` | 0 | [validation/metadata-final.txt](validation/metadata-final.txt) |
| `pnpm exec biome check entries/C21-tailwind-merge/library.json entries/C21-tailwind-merge/verification.json` | 0 | [validation/format-metadata.txt](validation/format-metadata.txt) |
| `git diff --check -- entries/C21-tailwind-merge` | 0 | [validation/diff-final.txt](validation/diff-final.txt) |

[metadata-final.txt](validation/metadata-final.txt)实际核唯一basic/5源、19安装与宿主摘要、双SDK/Tailwind版本、tag/manifest/原文2549B及安装同字节、7HTTP原始头/blocked、9个真实renderer可用链接，14个内容输入摘要另存content-input-hashes.json。格式后已刷新，正式所有字段仍NOT_RUN。完整单case提案proposal-check.txt在临时目录strict/Biome0，finally清掉临时TS。

## 已执行的本地浏览器与未测项

[完整Playwright提案](validation/browser-proposal.txt)直接使用实际控件/SDK输出，实际接线为公共e2e/quality-remediation-tailwind-merge.spec.ts；没有mock SDK、伪CSS或用截图替代。candidate21已验证默认左右padding12/32、上下8；舒适28/32与20；caller px-1后4/4与20；方向px/pr与双viewport断点；hover实际背景；custom真实DOM24px；配置摘录及重置、真DOM卸载重挂。另一个本条case检查固定官方原文、直达链接及blocked状态展示，未尝试把被禁止嵌入的页面加载成iframe。

candidate21输入SHA为11b1313558ef9191b68ceb7e749b4a7fca8733d3883262871ce1d0e5a1f3368a；冻结输入、构建与浏览器绑定在仓库根docs/library-lab/evidence/quality-upgrade/candidate-21/的inputs.json、input-stability.json、browser-binding.json和browser-build-binding.json。该批运行发生于2026-11-10T18:24:58.132289+00:00至18:25:07.331581+00:00，baseURL为http://127.0.0.1:4319，implicitBuild=false。

实际cwd为`/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，命令如下：

~~~sh
pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-nuqs.spec.ts e2e/quality-remediation-tailwind-merge.spec.ts e2e/quality-remediation-primitives-sources.spec.ts --grep '@C19|@C21' --trace=off
~~~

真实exitCode=0，整批6/6 PASS，C21占其中2项（完整实验1项、官方原文/blocked展示1项），8.7s。原始命令与UTC见candidate-21/browser.json，原始输出见candidate-21/browser.txt，浏览器产物保留在candidate-21/browser-artifacts/。本次记录修订复用这两个case，没有重跑浏览器。

同一稳定候选的Lab检查在仓库根运行：`pnpm --filter @reactloom/library-lab typecheck`、`pnpm --filter @reactloom/library-lab build`、`pnpm --filter @reactloom/library-lab catalog:check`均exit0。具体argv/UTC/日志见candidate-21/results.json与对应typecheck.txt、build.txt、catalog.txt；input-stability.json的changed=[]。这些是本地Lab宿主检查，不是C21独立打包配方或正式sdk/build/browser收据。

主要控件：实验预设、组件基础类、调用者 className、选中变体、卡片尺寸、启用自定义 px 规则、重置合并实验。c21-workshop/c21-preview、tw-joined/tw-merged、c21-default/c21-conflicts等testid同源。唯一basic减少路由数，旧business/advanced不声明独立已验目标。

尚NOT_RUN：触屏、读屏、其他浏览器、非默认Tailwind主题/完整CSS cascade、任意插件与未知类生成、SSR hydration、性能/包体benchmark/部署。真实browser/loaded CSS/computed/hover/断点及重置卸载已有上述限定范围的本地PASS。当前本地检查没有安装、许可或网络阻塞；不把字符串、声明或截图当真实样式通过。

## 变动与稳定交付

保留原7文件成果并修改guide/agent/AGENTS/library/verification/example/demo，新增共享模型/声明、局部CSS、真实SDK tests、官方原文/证据、抓取与维护fixture、审计/metadata/完整提案/日志及本记录。sourceFiles5足以迁移到已有React+Tailwind4应用，公开/锁/根结果归主控。最终文件与SHA见validation/input-hashes.json。

原作者FINAL后停止全部C21条目/日志/提案写入，无后台进程；主控随后完成candidate21。正式三status仍NOT_RUN，未自行content_done。

原作者FINAL STABLE UTC 2026-11-10T18:21:09.409656+00:00；当时14内容输入复算零差异，diff-after-report.txt exit0，全部作者写入停止供candidate21，无活动后台。validation/input-hashes.json和content-input-hashes.json保留该次检查点含义；本次仅修订guide/local-validation/verification中的验收前叙述，新旧摘要及只读复用核对另存validation/copy-fix-evidence.json，待独立delta复核。

## 记录修订检查

本次在仓库根对JSON语法/规范排版、39项candidate21条目输入摘要、实际两条C21浏览器结果、已保存Lab检查退出码及过期当前态措辞做只读核对，exit0；除guide/local-validation/verification外其余36个candidate21条目输入均未变。明细见[copy-fix-evidence.json](validation/copy-fix-evidence.json)，输出见[copy-fix-check.txt](validation/copy-fix-check.txt)；`git diff --check -- packages/library-lab/entries/C21-tailwind-merge` exit0，日志[copy-fix-diff.txt](validation/copy-fix-diff.txt)。

定向`pnpm exec biome check packages/library-lab/entries/C21-tailwind-merge/verification.json`实际返回exit254，原输出为`[warn] Linter process terminated abnormally (possibly out of memory)`，保存在[copy-fix-biome-failed.txt](validation/copy-fix-biome-failed.txt)。该工具检查记FAIL，没有重试或扩大检查；后续JSON解析与标准两空格序列化比对通过，不能把它改记Biome PASS。SDK、浏览器、HTTP与构建均未重跑。
