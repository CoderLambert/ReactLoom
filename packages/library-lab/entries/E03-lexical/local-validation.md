# 2026-11-18 主控闭环补充

六项本地质量PASS。真实无DOM SDK4+策略4及非作者新consumer/迁入编译通过；浏览器5项含来源，覆盖basic文本重置、JSON恢复/非法拒绝、格式CSS/真实undo redo、公开root detach外层观察、Storage异常和合成composition。真实OS IME未验。候选29及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E03.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E03 Lexical 本地整改证据（2026-11-18）

对象：独占E03，真实lexical/@lexical/react0.52.0。先落六项NOT_RUN再执行。未改shared/依赖锁/e2e/队列/生成，未跑共享build/fulltypecheck/browser，未commit。只运行条目定向SDK/policy/Biome、复制源码隔离编译及官方合同检查。正式sdk/build/browser仍NOT_RUN。

|六项|状态/证据层级|证据与限制|
|---|---|---|
|技术准确|PASS：实装源码与真实无DOM SDK|SDK4/4复用state-operations.ts检查真实EditorState read/update/parse/set、格式bit、非法恢复不变、onError重抛和update unregister；不是DOM/HistoryPlugin/选区PASS。0.52 Composer已deprecated legacy，文案明确且修正“新config对象会重置”错误。|
|解释清楚|PASS：正文/实际源码对照|用途→EditorState→有限JSON协议→选区命令/历史→IME/生命周期；区分节点策略、SDK、DOM、native IME与未来extension迁移。|
|Demo有用|NOT_RUN：DOM待主控|基础输入长度、业务草稿协议、进阶真实格式命令/History；browser提案4例尚未执行，不能用无DOMSDK替代。|
|源码可迁移|PASS：隔离复制源编译|example.tsx、snapshot-policy.mjs/.d.mts、state-operations.ts、styles.css完整列入三个sourceFiles，demo仅转发；复制后的严格React/TS/Vite CSS编译exit0。无Lab内部模块/env/账号/网络。|
|官方来源可靠|PASS：固定原文/许可与实际响应头|固定v0.52.0 peeled b2af316af8ab328a86ff27885f2ce94f18dce571；README原字节/摘要、完整tree与LICENSE保存。安装包双0.52.0/MIT、固定LICENSE MIT；主页GET200无明确frame限制但未Lab内容确认=unknown。|
|结果可复核|NOT_RUN：DOM/正式证据待办|原argv/cwd/exit/raw日志齐全，无DOMSDK4/4、policy4/4、Biome11files、隔离编译与官方合同通过；正式候选/浏览器/IME未运行。|

## 实际命令与日志

cwd `/home/lambert/githubRepos/lambert/ReactLoom`。validation/*-command.json保存精确argv/cwd/exitCode/UTC时间；*.log为真实合并stdout/stderr。不是verify:record receipt。

- `node --test packages/library-lab/entries/E03-lexical/tests/sdk.test.mjs`：exit0，4tests/4pass/0skip，sdk-final.log。真实createEditor无DOM，不是mock。共享resetDocument/restoreSnapshot；额外直接未知节点parse证明onError抛出且当前已提交JSON不变。
- `node --test packages/library-lab/entries/E03-lexical/tests/policy.test.mjs`：exit0，4/4，policy-final.log。纯策略单列，不当SDK；坏JSON/空根/未知节点/400节点上限/非法字段类型/非空CSS/Tab内容。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/E03-lexical/examples entries/E03-lexical/tests entries/E03-lexical/library.json entries/E03-lexical/verification.json entries/E03-lexical/validation/browser.spec.ts`：exit0，11files，biome.log，无诊断。
- `pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e03-portable-2gck0yo0/tsconfig.json`：exit0，无诊断，portable-typecheck.log。复制五个必要源码/类型/CSS及browser提案，独立ESM React consumer；ES2022/ESNext/Bundler/react-jsx/strict，Vite client CSS类型。使用已安装依赖symlink，没有新install或全workspace typecheck。
- `node --input-type=module -`：exit0，official-metadata.log；command.json保存实际stdin，调用真实共享validateOfficialSources并计算原文SHA256，与metadata一致。

SDK不是完整无DOM编辑器系统：它不加载React插件、不产生选区/DOM，不验HistoryPlugin或IME。没有DOM根和自有计时器可dispose；注册的测试update监听实际off，浏览器root/History清理另验。

## 核心修复与边界

旧policy只粗略遍历节点，对format/mode/未知字段过松，save只测长度。现在保存/恢复都走同一版本1字段白名单：root→paragraph→text/linebreak/tab、非空根、100000UTF16单元/总400节点/text40000、方向/对齐/整数范围/模式、无非空内联CSS，拒绝后不写入旧草稿或不应用新EditorState。只用一个Storage key。

恢复关键是onError重抛。实际LexicalUpdates.parseEditorState会catch节点异常并调用_onError；吞错可能返回部分状态，因此不把onError改成仅console.log。共享restore先policy→parse→非空→set。校验/解析失败不换当前内容；不承诺任意DOM应用异常事务回滚或ErrorBoundary能包住所有异步错误。

IME ref在真实root用registerRootListener添加composition事件，返回清理移除，editor.isComposing补真实SDK状态。组合时不保存/恢复/重置/格式/undo redo。没有onChange整篇回写；稳定OnChange callback按插件退订。样式由本例styles.css提供，不依赖Lab全局Tailwind粗体。

initialConfig仅首次读取，换文档key负责重建；新对象本身不重建。0.52实装LexicalComposer声明deprecated，新项目评估ExtensionComposer；本轮保留现有legacy插件完整协议，不谎称已迁移extension。

## 官方取证

- `git ls-remote https://github.com/facebook/lexical.git 'refs/tags/v0.52.0*'` exit0：tag object ea2ab5bc1fc46a3e6dd3653ebaa659155cdfb76d，peeled commit b2af316af8ab328a86ff27885f2ce94f18dce571。
- Python urllib实际GET固定commit递归tree/README.md/LICENSE，exit0，原字节保存在official。完整tree无官方中文根README，en回退，不用自编中文冒充原文。README SHA `c9c358b87dfb3b0bdda8735cfdadba1ea5c086ada74f2288e8e762e3a8f7778b`。
- 实装lexical与@lexical/react package字段均0.52.0/MIT；固定LICENSE为Meta MIT原文。React包peer React/DOM>=18、TypeScript>=5.2，yjs为可选未在本例使用。
- `curl -fsSL -D packages/library-lab/entries/E03-lexical/official/homepage-headers.txt -o /dev/null https://lexical.dev/` exit0，HTTP200，无X-Frame-Options/frame-ancestors；未实际Lab-origin内容确认，unknown，直达保留。

## 稳定交棒与复核重点

validation/browser.spec.ts提供4例：输入/合法恢复/坏JSON不变/合成composition；真实选区加粗+CSS/History撤销重做；实际root句柄通过公开registerRootListener/getRootElement观测detach并解绑测试observer；按key注入Storage读写异常。主控复制并冻结候选后执行，当前NOT_RUN。测试status有明确aria-label，避免output隐式status冲突。

root.__lexicalEditor是匹配版本源码的测试取柄，必须failclosed，不作产品公共接口；公开root detach不等于不存在的destroy。OnChange/History内部退订由实装源码确认，无DOMSDK实际off覆盖注册API，未声称浏览器已动态证明每个内部订阅。原生系统IME候选/撤销合并/粘贴及样式焦点另需真实浏览器/人工验收。

独立review重点：有限节点字段与实装默认JSON兼容、onError不可吞错、parse失败不应用、保存也先校验、root composition监听清理、格式CSS随源码迁入、deprecated legacy准确表述、Headless/DOM分层。作者STABLE后停止写入，交非作者和主控闭环。
