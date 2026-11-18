# C15 Day.js：作者完整整改与本地定向验证

Owner quality_f05；实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。接手原10文件无diff，逐项sha在[baseline](validation/baseline.json)，两次只读review/候选暂停的过程保留[intermediate](validation/intermediate-validation.md)和[checkpoint输入](validation/checkpoint-input-hashes.json)。只写自有C15，保留他人工作；未改公共src/scripts/e2e、依赖/锁/队列/results/索引，没有install、全目录generate/typecheck/build、提交或推送。

## 问题与三个工程目标

原严格解析、NY23/25窗口和显式offset/IANA墙上时间往返有效，予以保留。原UI把所有计算混在TSX、不可变未实际观察，level状态共用使隐藏无效civil可影响advanced；输入/zone变化仍可能展示旧结果，advanced预设只清结果不清旧alert；官方固定原文/官网依据缺失。现在：

1. basic严格日期→真实不可变add→实例中文weekday，原对象前后/新对象引用各自观察。
2. business四个真实zone/日期窗口：纽约春23/秋25、上海与UTC24小时，分别比较本地中午/实际ISO instant/经过ms。
3. advanced两合法偏移的01:30→不同instant，真实NY秒级墙上+offset往返拒春季不存在02:30，恢复/场景/卸载边界明确。

实际安装dayjs1.11.23/MIT，模块顶层登记utc/timezone/customParseFormat，展示用实例locale，既有helper与原example三个函数导出保留。正常排版、7必要源、纯模块共享到SDK检查，无外部资产/服务器请求/cron/存储/Worker。

## 六项状态与真实范围

| 维度 | 作者结论 | 证据与限制 |
| --- | --- | --- |
| 技术准确 | 局部真实SDK/源码/strict可接受 | 安装主文件/类型及可读ESM14文件审计；实际共享运算6组PASS，含一组mixed应用guard/真实往返，不是全体拒绝都调用SDK。 |
| 解释清楚 | 中文教学完成，独立review待安排 | guide先分日历/墙上/instant/展示，再不可变/插件/三目标/迁移/宿主Intl与全局插件；agent保留不可删合同。 |
| Demo有用 | 三目标实现与完整提案齐，真实UI NOT_RUN | 结果由真实Day.js返回；完整3case覆盖严格/窗口/DST/恢复/场景/390px/卸载，不以Node代按钮PASS。 |
| 源码可迁移 | 7源静态/入口strict可接受 | example/demo、两个共享mjs及d.mts、局部CSS，无Lab alias或跨条目依赖；独立宿主/SSR未测。 |
| 官方来源可靠 | 实际固定中文原文/真实GET齐 | 中文原文3882B，附英文8229B与安装字节相同；tag/npm gitHead相同、源码development版本与发布/安装差异如实记录；中文官网unknown有完整头。 |
| 结果可复核 | 既有检查/新提案与维护证据可复核，客户端闭环NOT_RUN | 6SDK/入口strict复用，元数据/提案strict/格式/3受控维护场景exit0，原初取证断言FAIL保留；正式三项NOT_RUN。 |

完整作者内容已交付，但三客户端目标、官方UI展示与独立review待root匹配候选；**不自行登记content_done，不生成正式收据**。

## 实现、数据与所有权

date-operations与offset-instant由UI和Node检查共同导入。strictDate保留整串正则并用真实UTC strict解析，日历下一日也在UTC标签上算，再在各zone分别构造中午。UTC对象作稳定日历算术载体，不把用户本地日历日当成已选UTC瞬间。basic真实add后比before/after/next和sameReference；中文weekday依赖实际locale词典而不是数字日期字面量。全局locale在SDK检查前后不变。

civilWindow对两天中午真实dayjs.tz，输出实际format、toISOString、diff(...,true)和valueOf差。NY/上海/UTC为明确演示白名单，中午并非所有历史IANA变更都无歧义的普适保证，也没有生产调度。默认不可变不能被badMutable改变；没有加载该插件。timezone内部用宿主Intl.DateTimeFormat/formatToParts和缓存，未内置独立TZDB，升级库不等于升级宿主规则。

显式事件先约束合法时分秒、明确offset、拒未知-00:00/超±14:00/0000；随后真实dayjs(input).tz(zone)，按完整秒和format Z往返，Z规范为+00:00。春季gap和不匹配offset即使是可解析的instant也拒绝。不让静态dayjs.tz猜无offset的重复01:30，不用keepLocalTime改变instant冒充转换。低年/极限年边界不是本现代RSS演示的全历史历法承诺。

level切换独立Session，advanced不再读取隐藏civil；input/zone/preset变化清旧结果与错误，计算失败清旧结果，reset恢复种子。输入onChange不trim，不干扰编辑；计算按钮原生Tab/Enter激活，无隐式日期框Enter/OS IME宣称。保留原region/控件/两预设/计算按钮/dayjs-result，新增c15-workshop/data-level、c15-status/重置当前目标。CSS只c15作用域、控件宽度/长offset与JSON断行/焦点可见。

应用无timer、网络、全局监听、Worker、对象URL或存储租约。Day.js对象没有component destroy，卸载只丢弃所属React state/DOM；插件/locale注册作用于共享模块，不能随卸载删除影响其他用户。节点断开不宣称所有SDK缓存泄漏普查。

## 官方版本、原文与官网

本次首次捕获到npm1.11.23 gitHead `4549b8d03307891143e8a50d39fcdab1f16f77cf`，固定仓库package.json实际version **0.0.0-development**，不是1.11.23。初脚本强断言manifest=发布版本失败，exit1原日志[official-fetch-initial](validation/official-fetch-initial.txt)与前三请求完整头/失败单独证据[source-evidence.failed](validation/source-evidence.failed.json)保留。一次只读manifest诊断确认该声明；没有改源码manifest或包/锁来制造一致。

正确版本依据是**官方v1.11.23 tag与npm1.11.23 gitHead都绑定同一commit，安装包manifest为1.11.23**。修正取证为验证该tag/gitHead，同时保留源manifest development版本，完整成功7GET全200，原日志[official-fetch](validation/official-fetch.txt)；这是成功捕获7请求，不把此前失败尝试或诊断请求抹去。来源元数据没有伪造npm与源码manifest同版本。

实际未截断树发现唯一简体中文候选 `docs/zh-cn/README.zh-CN.md`，故主[官方中文原文](official/readme.md)3882B/zh-CN，SHA256 **3f4c6e9edd42554b8c6a1e111daafb568b4eba3e8b9da31a9296abebb8aae2c5**。附[同commit根英文原文](official/package-readme.md)8229B，SHA **900c80d1b626c1a777f977111322badede124381407b3f6de23e314c05239b27**，与安装README逐字节相同。两文件未经本地翻译/格式器/裁剪；repo/commit/path/language/version/time/sha绑定见library与[source-evidence](official/source-evidence.json)。

匹配中文原文直接链接https://day.js.org/zh-CN/，实际GET200完整rawHeaders无XFO或强制CSP，不读正文、不造正文hash。未从Lab origin确认iframe可用，官网unknown；不是allowed/blocked，保留直达/重试。记录包含最终URL、时间、重复头；匿名Cookie值脱敏/hash并保留属性，不读取.env/凭据或复用Cookie。

抓取所有网络/来源校验/序列化完成后才暂存中文/英文/evidence三件再replace，异常独立failed，避免finally毁旧成功；不是跨三文件OS事务或崩溃原子性承诺。[维护fixture](validation/source-tool-transport-fixture.py)在TemporaryDirectory复制脚本，用标准库传输fixture执行真实路径结构：成功、首请求失败、两README到手后官网失败三场景exit0，旧三件成功产物逐字节保留、失败独立记录、暂存清除；也核重复Cookie属性/值脱敏与主页NOT_READ。当前官方三件字节不变，**无外部HTTP/Day.js/UI/browser执行，不算新官方或SDK PASS**。

## 实际命令、cwd、exit与产物

除注明仓库根，cwd为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。[local-runs](validation/local-runs.json)保存全部定向检查的完整argv、UTC起止、exit与原始stdout/stderr；实际Node/Python版本另在platform-binding。

| 实际命令/范围 | exit及日志 |
| --- | --- |
| `pnpm exec -- biome check --write entries/C15-dayjs/examples entries/C15-dayjs/tests entries/C15-dayjs/library.json` | 0，9文件/8正常格式化，2条useTemplate info保留，未称零诊断；[checkpoint-format](validation/checkpoint-format.txt)。 |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C15-dayjs/examples/demo.tsx` | 0，[checkpoint-types](validation/checkpoint-types.txt)，7源实际入口。 |
| `node --test entries/C15-dayjs/tests/sdk.test.mjs` | 0，6PASS/0SKIP，[sdk](validation/sdk.txt)：共用strict/不可变locale/4窗口/转换/显式往返/混合guard，不是DOM运行。 |
| `python3 <所属绝对validation/fetch-official.py>`（仓库根） | 首次1，过强版本断言失败；校正真实版本依据后0/7成功GET；两次实际日志分别保留。 |
| `python3 entries/C15-dayjs/validation/source-tool-transport-fixture.py` | 0，3受控维护场景，[source-tool-transport-fixture](validation/source-tool-transport-fixture.txt)，非HTTP/SDK。 |
| `pnpm exec -- biome check --write`（library/verification/官方JSON/audit/metadata/临时完整提案） | 0，6文件，[final-format](validation/final-format.txt)；原README不入格式器，运行源未动。 |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --esModuleInterop --types vite/client,node <所属临时browser-proposal.spec.ts>` | 0，[proposal-types](validation/proposal-types.txt)，完整3case提案，保存.txt后临时目录删除。 |
| `node entries/C15-dayjs/validation/metadata-check.mjs` | 0，[metadata](validation/metadata.txt)：共享schema/gate、3目标7源/14安装SHA、版本差异、双原文与安装英文、unknown/正式NOT_RUN。 |

SDK/入口之后只有文档/来源/metadata/提案变化，7生产源逐字节与candidate18一致，复用有效SDK6/入口而不重复。14安装文件审计核actual main dayjs.min.js/类型及包内可读ESM，不替换运行入口。无独立purepolicy套件，早拒字符串guard与真实SDK往返在集成测试中清楚分层，不额外制造策略PASS数。

主控candidate18共享e2e lint/type/build/catalog exit0、input changed=[]只覆盖当时7源编译；最终来源/文案的实际展示与全部C15浏览器目标尚未运行，不借C11/C14 browser结果。[platform-binding](validation/platform-binding.json)绑定共享日志/源sha与限制。最终只读源/链接/语法/范围检查另记final-check/diff-check。

## 完整浏览器交接与剩余

[三条完整Playwright提案](validation/browser-proposal.txt)已严格类型/格式通过，公共由root接线，本作者不写e2e：basic真实文本输入拒绝/恢复、中文weekday/不可变JSON、原生Enter按钮/清旧结果/reset；business真实zone/date选择、NY23/25及上海UTC24、实际ISO经过ms/错误后恢复；advanced从basic无效草稿切换、两fold与春季gap、preset清旧alert、390px严格无横溢出、实际停止节点断开/再挂默认种子。

不在测试里调用helper生成预置结果，不替换Day.js/Intl/DOM/时钟、直调React处理器或force click；解析实际UI JSON后用独立预期和Date.parse差值断言。合成OS IME或时间冻结都未使用。节点断开只证明自己的React节点。原控件精确名称与新增testid在agent，迁移仍带全部7源/样式。

仍NOT_RUN：三个真实UI目标与官方原文/unknown展示、Lab-origin官网iframe实际可用性、不同设备timezone/Intl版本矩阵、OS IME/触摸/读屏、SSR hydration、独立迁入/更广历史与极限日期/全SDK缓存普查；独立六项review待root安排。没有实现后端调度/租户权限/幂等/HTTP/持久化，不能当已有能力。formal sdk/build/browser三个status保持NOT_RUN。

## 文件与最终交付

原有效计算与偏移往返保留，共享到新date-operations模块；example/demo/两个声明/SDK正常排版，新增styles、固定中文/附英文原文与源证据、安全抓取工具/3维护fixture、14安装源审计、metadata/完整提案/实际日志/候选源绑定。guide/agent/library/verification.notes同步，AGENTS保持原字节。完整清单validation/final-files.txt，内容/源输入validation/input-hashes.json，日志摘要validation/log-hashes.json。


最终受影响检查：候选绑定JSON格式exit0/无修改；[final-check](validation/final-check.txt)只读验证7源与candidate18完全一致、3完整提案、文档本地链接、Python语法和无临时提案/二进制，exit0；[diff-check](validation/diff-check.txt)scoped git diff --check exit0。实际完整argv/cwd/UTC已入local-runs；不重复已有效SDK6/入口/已完成取证或维护fixture。

**FINAL AUTHOR STABLE：2026-11-10T17:29:46.906946+00:00。最终摘要生成后停止全部C15写入（含guide/logs/metadata），无后台任务。六项作者内容完整，真实三目标/官方展示及独立review仍NOT_RUN，交root安排，不自行content_done；formal sdk/build/browser保持NOT_RUN。**

## 非作者P2-1限定修复与真实3目标记录（2026-11-10T17:46:05.526080+00:00）

quality_e05的完整独立review已FINAL停写，仅指出guide三个私有本地路径在实际publisher resolver为空；运行合同无P1/P2。root正式交回作者后，先将C17保存可编译检查点并全部暂停，再仅改C15：附英文改固定commit README.md HTTPS；official/source-evidence.json与local-validation.md改纯维护路径说明。没有扩大公共发布策略或动e05报告/官方原文/运行源。

新增publisher-links-check使用**实际resolveDocumentUrl**，不是磁盘存在代替可点击：guide5个剩余链接全能resolve，主README alias为/raw/C15/readme.md，三个私有路径仍返回空且不再是正文链接，固定英文源URL存在。Lab cwd `pnpm exec -- biome check --write entries/C15-dayjs/validation/publisher-links-check.mjs` exit0，`node entries/C15-dayjs/validation/publisher-links-check.mjs` exit0，日志publisher-fix-format.txt/publisher-links.txt与实际argv/UTC在local-runs。这不是SDK/浏览器/新HTTP，未重跑6SDK/三UI或取证。原发现保留，待e05只复读delta关闭。

已实际读取root candidate18/browser-dayjs.txt：三个C15目标真实3/3PASS/exit0，未混入C11/C14/官方展示。复用未变SDK6/入口与7候选源，完整entry提案/公共实际spec同SHA。真实3目标/文案修复绑定在browser-completion-binding.json；原作者记录“客户端NOT_RUN”保留历史含义，由本节后来的3PASS更新。六项作者内容与真实3目标有效，独立复核余下仅此publisher delta；**新增官方中文原文/unknown页面展示仍待19，不能计第四case或已iframe允许**。formal sdk/build/browser全部NOT_RUN，原设备/Intl矩阵、OS IME/读屏/touch/SSR/独立迁入/历史边界等未测保留。

该限定维护结束后停止全部C15作者写入，交e05仅改review delta；C17等待主控candidate19状态后恢复，不交叉同entry写入。

## 最终本地六项闭环（2026-11-10T17:55:49.738825+00:00）

仅按root正式授权收口作者记录。已只读复核e05独立delta：P2-1 CLOSED，原报告/新delta未被作者改动；原文与版本/SDK/源码合同可复用，无剩余运行或正文发布P1/P2。root固定candidate19/browser.txt的C15官方中文原文与unknown展示**单项PASS**；该命令整轮11PASS/1FAIL、exit1，其他公共case失败不能写成整轮PASS。加上candidate18三个真实UI目标3PASS，C15本地合并三个目标+官方展示4PASS，不是一次四case全跑。

最终绑定browser-completion-binding.json保存两次实际原日志/命令范围、独立CLOSED报告sha、7运行源和entry/public提案。六项本地必验已按root确认闭环：技术/中文/三个真实目标/迁移源/官方固定源与展示/可复核结果；不自行写queue/results/content_done。官网unknown展示PASS不代表iframe实际允许，未测Lab-origin iframe、设备Intl/TZ矩阵、OS IME/touch/读屏、SSR/独立迁入/历史与极限日历/全SDK缓存普查仍保留。formal sdk/build/browser三个status全部NOT_RUN。

本次仅local-validation、verification.browser.note、绑定/索引摘要更新，7运行源与官方字节不变，未修改e05报告/公共/依赖，也不重跑SDK6/HTTP/UI/类型或格式。记录写毕全部C15作者停写，返回C17继续授权整改。
