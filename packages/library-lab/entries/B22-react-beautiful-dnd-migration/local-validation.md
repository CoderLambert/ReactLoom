# B22 React19迁移整改与验收边界

2026-11-10，quality_f05独占B22；repo cwd=/home/lambert/githubRepos/lambert/ReactLoom，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。原10文件clean entry基线和SHA/status在[baseline.json](validation/baseline.json)，queue原摘要8fe567476a8b0184fd4936585d326ea8338c87addea13413e5b8885bfecc4c7f。保留他人改动，不改公共源码/e2e/依赖锁/队列，不提交。正式sdk/build/browser均NOT_RUN。

## 前提、问题、目标与交付

目标来自本条queue：在React19保留历史Droppable/Draggable列表形状，实际迁到已锁定@hello-pangea/dnd18.0.1。原react-beautiful-dnd13.1.1已npm弃用、官方仓库归档；peer仅16.8.5/17/18，实际替代peer18/19。两者Apache-2.0。未为本次安装或加载原库，所有“真实SDK”局部执行均指替代库，不存在原库PASS。

原ref/props/style/placeholder、稳定id、固定闭区间、隐藏尾部、revision/id/level快照、上下按钮与一步撤销均有效，保留。原metadata错误地称“真实react-beautiful接口”，business标题暗示持久化，源码压缩且缺官方原文。更重要的是原revision只在组件提前检查，没有在reducer最终写入层验证；快照又在异步onDragStart创建，可能晚于业务失效。现同步onBeforeDragStart捕获，异步start只观测；最终drop action在reducer按当前state检查取消、空落点、revision/ids/source/level与固定区间，再走不可变move。无变化reset仍增revision但不造新undo，同位drop不造事务。

| 独立目标 | 实际入口/结果 | SDK与应用边界 |
| --- | --- | --- |
| basic替代绑定/双传感器 | Space/Arrow/Space与真实鼠标手柄，SDK mode/source/destination/reason；前三项改变，尾部global/notes保留 | 实际替代SDK传感器、位移style与placeholder；不是HTML5 DragEvent，按钮回退不冒充SDK |
| business固定区间 | 五项、固定行禁拖/按钮禁用；可拖落点仍可能被业务拒绝，顺序与revision不变 | isDragDisabled只是第一层，最终reducer固定守卫在各种路径一致 |
| advanced取消/历史/失效 | 真实CANCEL不写顺序；一次undo/reset；并发刷新使旧真实drop失效；停止与重挂清理 | 原始SDK回调子集与应用phase/snapshotRevision标注分开，最终结果看实际state |

四必要源正常排版、增加必要CSS，完整中文与agent同步。没有服务器、存储、用户数据、IME输入或外部资产。SDK owns传感器/注册/内部style/焦点，应用只清快照，不手动删全站资源。

## 六项检查点

| 项 | 结论与层级 | 证据/范围 |
| --- | --- | --- |
| 技术准确 | PASS：匹配版本源码/类型与真实替代SSR局部 | [sdk-source-audit.json](validation/sdk-source-audit.json)记录实装18.0.1、peer/Apache、同步beforeStart/延后start、内部style清理与公开导出；实际resetServerContext不存在。真实替代SSR2通过，原库没有运行。 |
| 解释清楚 | PASS：静态 | guide由React19迁移问题→三组件/传感器→三操作目标→最终写入/清理/迁移，区分原库、fork、policy、原始回调与本地revision，没有未实现持久化承诺。 |
| Demo有用 | PASS：主控匹配候选真实3目标闭环，正式收据另行NOT_RUN | 三目标实现且完整三条提案，鼠标/键盘/位移/占位/CANCEL/历史/过期写入/清理未在本工作者浏览器运行。 |
| 源码可迁移 | PASS：静态/严格类型 | 四源含CSS/模型/入口，稳定ID/ref/placeholder/style/手柄保留，无Lab alias或新依赖。级别切换layout清快照、key重挂context；设备/完整hydration未测。 |
| 官方来源可靠 | PASS：固定双来源与公开请求 | 实际替代18.0.1固定commit/10875B README/唯一英文候选；历史13.1.1另存11026B固定npm gitHead原文和弃用/归档/peer事实，不混当当前SDK手册。官网200无强制限制证据，但未Lab-origin确认→unknown。 |
| 结果可复核 | PASS：本地六项闭环；正式收据仍NOT_RUN | 替代SSR2/2、policy17/17、入口+完整提案strict类型、14文件Biome、source/metadata均exit0；精确argv/cwd/UTC/exit与原日志齐。无fake SDK/force-exit，不从局部或共享build推导正式PASS。 |

## 官方与历史来源

主[原文快照](official/readme.md)为hello-pangea/dnd v18.0.1→commit `410173402853654f64436d116d68e3f89359d496`的README.md，10875B，SHA256 `cb8eefef4209f565a8f57e27bcd107d9ea4a59e8b86d22a1c03c24e311436851`。完整tree未截断、仅README.md，无官方中文候选；同commit包manifest确为18.0.1，未翻译改写原文。

历史[原库快照](official/legacy-readme.md)独立绑定npm13.1.1的gitHead `1a380855d0d008c5d6ef8e34c7c8ffb96c66a881`，11026B，SHA256 `eb6feac2530eae986bd0ac8749365548c54ddb874f708c4c47bf598dd1dde2c5`。npm deprecated文本/无React19 peer与当前官方仓库archived=true由各自公开元数据记录；历史README本身不冒称包含当前归档通知，也不充当原库执行证据。

[完整证据](official/source-evidence.json)保存10个公开GET的原始/最终URL、最终响应头、状态、时间、正文长度/hash、固定版本与双来源。匿名服务器cookie值脱敏，保留cookie名/属性与值hash；没有发送/复用该cookie、读取.env或使用凭据。实际官方仓库声明主页https://dnd.hellopangea.com为GET200/9984B，未发现强制frame限制，尚无Lab iframe验证，所以unknown并保留直达/重试。源捕获脚本[fetch-official.py](validation/fetch-official.py)失败不覆盖成功快照。

关键时机以实际安装ESM为准：beforeStart直接调用onBeforeDragStart，start通过asyncMarshal排队；样式marshal按contextId创建两style并在cleanup移除。外部GitHub网页读取responders.md本次有503，未反复请求或拿它当API阻塞；对应已安装18.0.1源码/类型足以核对，README与官方元数据均200。

## 实际命令与原始结果

完整[local-runs.json](validation/local-runs.json)含逐项精确argv、cwd、UTC起止、exit/log。以下除标注仓库根的命令，其他cwd均 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。

| 实际命令 | exit / 产物 |
| --- | --- |
| `python3 /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab/entries/B22-react-beautiful-dnd-migration/validation/fetch-official.py`（cwd仓库根） | 0，[official-fetch.txt](validation/official-fetch.txt)；10请求、双原文。捕获后仅脱敏cookie值，数据/安全头与正文hash不改。 |
| `node entries/B22-react-beautiful-dnd-migration/validation/source-audit.mjs` | 0，[source-audit.txt](validation/source-audit.txt)；实际ESM/类型/公开导出与Lab无原库直接依赖审计。 |
| `node --test entries/B22-react-beautiful-dnd-migration/tests/sdk.test.mjs` | 0，2PASS/0FAIL/0SKIP，[sdk.txt](validation/sdk.txt)；真实React19替代组件SSR绑定、同树两个context身份_R_1_/_R_2_，不证明hydration或传感器。 |
| `node --test entries/B22-react-beautiful-dnd-migration/tests/order-history.test.mts entries/B22-react-beautiful-dnd-migration/tests/pinned-order.test.mjs` | 0，17PASS/0FAIL/0SKIP，[policy.txt](validation/policy.txt)；原13+新增最终写入/取消/无变化4项，只是业务规则。 |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B22-react-beautiful-dnd-migration/examples/demo.tsx entries/B22-react-beautiful-dnd-migration/validation/browser-proposal.check.ts` | 0，[typecheck-final.txt](validation/typecheck-final.txt)，实际入口/完整提案。随后提案等真实start/尚无事件时返回null的细化只再查提案，见proposal-typecheck.txt，exit0。 |
| `pnpm exec -- biome check --write entries/B22-react-beautiful-dnd-migration/examples entries/B22-react-beautiful-dnd-migration/tests entries/B22-react-beautiful-dnd-migration/library.json entries/B22-react-beautiful-dnd-migration/verification.json entries/B22-react-beautiful-dnd-migration/official/source-evidence.json entries/B22-react-beautiful-dnd-migration/validation/source-audit.mjs entries/B22-react-beautiful-dnd-migration/validation/metadata-check.mjs entries/B22-react-beautiful-dnd-migration/validation/sdk-source-audit.json entries/B22-react-beautiful-dnd-migration/validation/browser-proposal.check.ts` | 0，14文件，[format-final.txt](validation/format-final.txt)；提案细化后其独立格式仍0。 |
| `node entries/B22-react-beautiful-dnd-migration/validation/metadata-check.mjs` | 0，[metadata.txt](validation/metadata.txt)；共享schema/gate、3目标4源、仅替代包、双原文hash、原库未运行、主页unknown、formal NOT_RUN。 |
| `python3 /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab/entries/B22-react-beautiful-dnd-migration/validation/final-check.py`（cwd仓库根） | 0，[final-check.txt](validation/final-check.txt)；四源/迁移边界/链接/三提案/双原文hash/脱敏/无临时或二进制复制。 |
| `git diff --check -- packages/library-lab/entries/B22-react-beautiful-dnd-migration`（cwd仓库根） | 0，[diff-check.txt](validation/diff-check.txt)。 |

初次source格式exit0仅4个原测试标题拼接info，改等价模板字符串后最终格式无info；SDK/规则行为未变，复用有效2/17结果，不为标题重复执行。提案临时原样复制为同目录browser-proposal.check.ts，检查后同步回.txt并删除临时.ts，不维护第二份可执行Demo。没有全目录生成/构建或隐式浏览器build。

## 文件、控件与浏览器交接

修改guide/agent/library/verification、example/model，demo与原测试正常排版；增加styles.css、真实替代SSR测试、4项最终边界policy、官方双快照/证据、源码/metadata脚本、基线/日志/完整提案/摘要。AGENTS保留；完整清单见validation/final-files.txt，输入摘要见validation/input-hashes.json。

[三条browser提案](validation/browser-proposal.txt)使用真实@hello-pangea传感器与SDK响应，不用HTML5 DataTransfer、dragTo或伪造DropResult。basic验证SNAP键盘/FLUID鼠标、位移fixed/placeholder、真实鼠标isTrusted、稳定行与隐藏尾部；business验证SDK提出跨固定落点但最终拒绝、合法拖动与上下按钮；advanced验证CANCEL/undo/no-op reset失效后真实鼠标drop被拒绝，并按捕获context id验证该SDK自己的两style标签清理/重挂。并发恢复按钮为明确的程序化UI刷新fixture，鼠标与SDK真实，不能标成纯物理双操作。

区域“Beautiful DnD迁移示例”，b22-workshop data-level/revision/all-order，b22-list及li[data-item-id]的data-dragging来自真实render snapshot，b22-sdk-event为真实SDK回调子集+本地标注，b22-order/state/status为业务结果。保留拖动/上移/下移、撤销上次排序/恢复原序标签，标题改为实际本地功能。

真实传感器、占位尺寸、取消、焦点、内部style清理均待主控新候选；不能从SSR或17policy填运行PASS。触摸、真实读屏/完整中文公告、滚动/祖先transform、虚拟列表、SSR hydration、跨列/HTTP持久化未验收。独立内容复核待主控，正式收据需授权干净提交与协议匹配；原库仍完全未执行，不能借替代条目或共同API名字记原SDK PASS。

候选15真实三场景全FAIL：Space与鼠标均未提起（data-dragging=false），缺少button handle所需disableInteractiveElementBlocking；实际安装SDK源码5791交互元素过滤+6626prop映射及d.ts221确认。root最小补该prop，原17规则/SSR不受影响，下一候选复验相同实际断言，不计已验收。


## 主控实际browser闭环（仅记录，未改运行源）

UTC `2026-11-10T16:28:05.660337+00:00`，按root明确授权仅同步本地记录与verification.note。真实实现是@hello-pangea/dnd18.0.1的React19迁移，**原归档react-beautiful-dnd SDK未在本条目导入/执行**；替代库的成功不能记原SDK PASS。

主控candidate16原三场景中basic与advanced实际PASS，来源展示此前candidate15/16已PASS并复用。fixed slot原鼠标提出最后落点的观察受页面自动滚动干扰，没有放宽dest4、固定槽守卫或结果断言；公共专项改为真实SDK keyboard sensor：Space拾起→4次ArrowDown→Space放下，真实receipt reason=DROP/destination.index=4，权威顺序/revision0不变且拒绝信息可见。随后合法鼠标拖动与原生上下按钮仍实测。

实读根证据 `docs/library-lab/evidence/quality-upgrade/candidate-16/browser-targeted-observation-retry.txt`：实际cwd为Lab，命令 `pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-ag-grid.spec.ts e2e/quality-remediation-beautiful-dnd-migration.spec.ts e2e/quality-remediation-virtuoso.spec.ts --grep @C08 actual client|@B22 fixed|@C09 advanced --trace=off`，exit0/3passed，其中**只有1项属于本B22 fixed slot**，不能把3项都算B22。其余两B22场景来自candidate16原有效PASS，不因本次记录重跑。官方来源展示PASS独立复用。

本地六项现可闭环：技术准确（实装来源/真实替代SSR与浏览器SDK）；解释清楚（原库/替代/自建policy清楚）；Demo有用（3独立真实目标）；源码可迁移（4必要源与真实清理）；官方来源可靠（固定原文及实际展示，主页unknown没有误写allowed）；结果可复核（原始argv/cwd/exit/公开日志与来源）。此前作者NOT_RUN段落保留为阶段历史，本段记录的是主控后续真实验收。root负责整库local/content结果登记，作者没有改队列/results或公共spec。

正式verification的sdk/build/browser status全部保持NOT_RUN：本地PASS不是授权干净提交/记录器绑定的正式收据。SDK2/17policy、运行源/原README与已PASS场景输入未变，不重复执行；本次没有新建SDK测试、修改业务源或放宽公共断言。仅这两文档/notes增量不冒充旧作者输入摘要已包含它，当前根收集候选需重新绑定最新记录。

B22记录 FINAL STABLE，停止全部B22写入；继续C12按主控候选17冻结等待release。
