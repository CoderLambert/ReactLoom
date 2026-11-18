# 公共空文档链接渲染独立只读复核

Reviewer /root/quality_e11；UTC 2026-11-10T17:50:09.743127+00:00；实际cwd /home/lambert/githubRepos/lambert/ReactLoom。仅写本报告；未改公共或条目输入，未重跑有效SDK/浏览器/全目录检查。

## 结论

**未发现P1/P2，安全与React接线可接受。** 空href回退保留可读children，移除误导性可导航语义；不需要公开私有维护材料或批量改已完成条目。README alias与版本patch的安全边界复用前一独立审查。本次不把旧候选RED/15项策略GREEN当作span渲染后的实际browser GREEN；由root在candidate19收口。

## 源码与安全

- src/components/document.tsx:159–170，href非空仍为原生a，保持href/rel noopener noreferrer/fragment target语义；空串或undefined只创建span并保留原children。没有href=""回到当前页，也没有role=link或tabIndex造成假键盘链接；嵌套code/em/strong文本不会被转换成HTML字符串。
- 正常HTTPS/锚点/已发布源仍按同一urlTransform决定。sanitize、skipHtml、图片assets白名单、Markdown读取字节限制与摘要、复制原文均未放宽。新分支不能从被拒绝的私有URL读取内容。
- document-utils.mjs:53只在安全且有效声明的.md快照路径上alias到raw/<ID>/readme.md；Library:106/116从entry.official向guide/agent注入，类型可选参数保持旧调用。官方readme自己仍用上游URL规则。metadata生成先校验entry与digest，仅发布原文readme.md，不公开official目录。
- document-utils.mjs:65只允许examples/tests最后filename出现@，.patch仍经sourceTextPath追加.txt并逐段编码。B15实际已声明该源，生成器输送原bytes/SHA，不能当可执行补丁端点。
- private evidence/local-validation/validation目录、跨entry相对路径、遍历/编码遍历、credentials URL、危险协议、无效BASE_URL边界均保留。显示普通文字是这些路径的准确前端行为，不是缺失文件的成功读取。
- 无新增hook、effect、请求、监听、timer、缓存或全局资源；request memo/abort owner和lazy loading不变。渲染每个link只增加一个真值分支，不增加逐文档网络或SDK工作。

## 审计与测试范围

实际阅读 completed-document-link-audit.json：其scope注明“candidate human review, not execution proof”，68候选跨26entries/29文档。reviewer仅用当前实际guide/agent文本和真实resolver做一次只读筛选，exit0：63条仍被拒绝引用、24entries/27文档；C11/C15的5条历史候选已由作者修正，所以没有错误把旧68全当当前缺陷。此读数不运行SDK、不写审计文件。

e2e/quality-document-links.spec.ts:4真实SheetJS例保持local-validation.md文本可见，禁止同名link及a空href；:14遍历对应27个现有guide/agent，至少检查正文/标题可见且没有空href anchor。后者是广度回归，F05精确文字断言与静态children保留共同支撑文本未丢，不能说它逐一检查了每条63标签。

另两case读取真实已发布资源，不page.route或SDK mock：C13检查实际href到/raw/C13/readme.md、响应不是SPA HTML、15874B及SHA匹配detail；B15检查编码@的.patch.txt、source-index的bytes/SHA、text/plain和真实edgeScrollRef补丁内容。当前源中的标签/文件名已核与条目相同。未强行放宽路径来令其通过。

## 真实既有证据

- candidate18/document-empty-link-red.json/.txt：Lab cwd，pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-document-links.spec.ts --grep 'blocked reference labels' --trace=off；UTC17:45:27.091467至17:45:33.819768，implicitBuild=false，exit1。真实F05标签可见但仍存在1个link（预期0），确认为旧渲染问题，非超时虚构失败。
- candidate18/document-link-green.txt：根cwd，node --test packages/library-lab/tests/document-utils.test.mjs packages/library-lab/tests/source-publication.test.mjs，15/15 exit0；证明alias/patch与原有安全/惰性原文输送。未重复运行，也未把它算span DOM通过。
- document-empty-link-format.txt、document-final-lint.txt与document-link-e2e-type-retry.txt真实exit0；当前新公共测试具备严格类型/格式证据，初次类型命令历史不覆盖。旧独立报告 document-link-independent-review.md保留初始alias/patch审查。
- root随后报告candidate19全部lint/type/build/catalog0、3083输入、stability changed=[]；reviewer没有重跑。**截至本报告尚未审阅candidate19补丁后browser结果**，实际渲染/27文档/两资源case需按该候选日志再标GREEN，不借其他SDK通过替代。

尚未覆盖嵌套BASE_URL真实部署、所有未完成条目、读屏/系统键盘矩阵；没有据本补丁声明这些PASS。

## 复核输入SHA

- src/lib/document-utils.mjs — 3d007d8606635c631b2113ba04e1a06fd29c0e81dd12ca514154fb671820bc32
- src/lib/document-utils.d.mts — 43a10fa035ed13c00f6d4899388d34616728aa3820a825e546c9dd63c5242ee1
- src/components/document.tsx — d3eed2081e51b985070a16535cd9f6db64238c85dfd81b10d44ed8dd1c5c7ad2
- src/app/library.tsx — 79c3a79eae746c798939f78ffa465da3037c493c5eb0b40a9272253d551475f2
- tests/document-utils.test.mjs — 7f6aa4fa36b694e03d2c7ffbc7fffc4cfa56637157d0416165c1e04081cb1498
- e2e/quality-document-links.spec.ts — e2af8fc8ecf6b983094cafad215ed1753aeb6d04ee24393b0fa1b4aa2b9e339d

报告完成后停写公共证据文件，返回已release的C18终稿；root独占公共接线/验证和状态更新。


## candidate19真实结果与Source URL增量独立复核

UTC 2026-11-10T17:55:34.092206+00:00，root正式交接后的非作者增量。仅追加本报告，未改Lab源/条目或重跑SDK/UI。

实际已读candidate19/browser.json/.txt：整轮12case为11PASS/1FAIL，整体exit1，不能说全绿。空href的F05精确文字、27文档全部覆盖、C13原README alias资源、两条HTML安全case均通过；C15/C16官方unknown与C18三目标+官方blocked也通过。唯一B15版本patch的实际href正确但编码%40路径返回text/html SPA，1201B/摘要校验没有完成，所以旧报告的“资源验收待跑”现精确收窄为这一项未闭。

### 根因与最小改法

root原生probe已记录在candidate19/source-url-diagnosis.md：同一固定服务、编码%40 URL得到200 text/html 730B Lab SPA；原生@ URL得到200 text/plain 1201B真实diff。public/dist均有原生@文件。reviewer另只读实装Vite dist/node/chunks/node.js:17919的sirv路径lookup：decodeURI(pathname)会保留%40，因此找不到磁盘@；:17970 public中间件也以decodeURI做文件检查。这个证据足以支持改URL编码方式，而非放宽MIME/bytes/SHA期待。

source-integrity.mjs:16新增encodePublishedPath先safeRelativePath、再encodeURI；Document resolver把已决定的published path交它，SourceViewer实际位于components/demo-host.tsx:86，也用该helper处理sourceTextPath(current.path)。同一文件不再两处各拼不同编码。sourceTextPath仍追加.txt，原filename、source-index bytes/SHA和惰性读取保持。

安全检查未发现P1/P2：URL始终在固定同entry前缀下；safeRelativePath拒绝scheme/绝对/空段/.././query/fragment/backslash/控制路径。@作为合法pathname字符保留不产生credentials origin；Unicode/空格编码，字面%仍编码为%25，使实际一次decodeURI后恢复字面%2f而非新增目录分隔。helper不做额外decodeURIComponent，也不扩大文档路径/扩展白名单。README别名和空href span不变，私有证据依旧不能变成导航目标。

SourceViewer两个原effect、AbortController、source-index/digest绑定、currentKey/loadedKey防旧内容、有限字节读取/拒绝SPA HTML、验证后复制门禁都保持；只换URL构造。没有新资源/SDK导入或hook顺序变动，生成器不需改磁盘文件名。URI编码策略与当前已读Vite行为匹配，不宣称所有代理/多重解码部署已验收。

### 既有测试与待验

- source-url-red.txt：Lab cwd，pnpm exec node --test --test-name-pattern='versioned patch' tests/document-utils.test.mjs，实际1FAIL exit1，旧%40与预期原生@不符；依据原生HTTP+SDK静态服务源码，不是为通过随意改预期。
- source-url-green.txt：Lab cwd，pnpm exec node --test tests/document-utils.test.mjs tests/source-integrity.test.mjs，20/20 exit0。新roundtrip覆盖版本@、中文/空格、字面%2f，另拒绝危险路径；原私有路径/credentials/越界、源码大小/UTF8/HTML fallback/摘要完整性测试仍在。复用该有效focused结果，不重新执行。
- source-url-format.txt实际exit0（模板字面量info无error）。未由Node绿色直接声称新浏览器通过。
- e2e/quality-document-links.spec.ts失败case保留同一实际patch的text/plain、bytes/SHA、edgeScrollRef内容断言，只改与服务匹配的原生@URL；新增真实SourceViewer选择已声明patch、pre内容、已校验SHA与复制按钮启用。未page.route/改SDK/改后端或换假patch。
- 11项原浏览器PASS按不受影响范围保留；本URL改动后的B15资源与SourceViewer合并case，待新匹配候选20只重跑这一项。本报告未审阅其新browser结果，暂不关闭该运行缺口。

增量输入SHA：
- src/lib/source-integrity.mjs — 840983341995cc6f39d3af78136cb5b725ec505bd490012de2ac8599afa3513a
- src/lib/source-integrity.d.mts — 694acd7ef437c3aadaeaacc28e02a46f885c0619294694efbb72905f70c94d7a
- src/lib/document-utils.mjs — 53fdbfc9ab15ce213852a87a1037b104b92c565e00b05e8835103a09512ae5e1
- src/components/document.tsx — d3eed2081e51b985070a16535cd9f6db64238c85dfd81b10d44ed8dd1c5c7ad2
- src/components/demo-host.tsx — e0782084384a1e5deb51d1c7094ddfc246858f85e511fe18052702dafac2046e
- tests/source-integrity.test.mjs — ce6d406024ca2904fd81f08689464cc639a977a520e3c25340d555a16e908fdd
- tests/document-utils.test.mjs — 199fb95b2b82ddd00f1443f0617d99c64805506b580dacce91c4180adf30aacc
- e2e/quality-document-links.spec.ts — 70b4832c9a648c389fe554742117a161d9d54f407cc4f607ebb31fed748ee29a

本增量写完停止公共报告写入，C18保存当前可编译中间检查点供candidate20；root独占公共构建/输送及失败项复验。
