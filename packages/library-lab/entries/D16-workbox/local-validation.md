# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK3项、策略3项、三CLI配方及非作者新fixture生成通过；浏览器4项仅验三配方命令展示和官方来源，未注册Service Worker，离线/缓存/激活生命周期未运行且不属于当前Node工坊验收。候选26及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D16.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# D16 本地整改证据：Node生成，不注册SW

本轮只写D16目录。保留已有workshop/matcher范围、private/glob大小限制与keepOutput行为；examples改动仅格式和等义错误字符串模板。重写讲解与agent，纠正三个关键误解：scope字段不表示已注册scope；skipWaiting/clientsClaim=false不是安全隔离；navigateFallback生成导航壳路由，并非只在断网时失败回退，private构建排除不是导航授权规则。

## 六项复核（本条交付为Node构建工坊）

| 维度 | 状态/层级 | 依据 |
| --- | --- | --- |
| 技术准确 | PASS：固定SDK源文件/实际产物/真实SDK测试 | 实装workbox-build7.4.1，Node>=20；检查build/templates/sw-template.js的message SKIP_WAITING、NavigationRoute、precacheAndRoute；当前SDK测试3/3实际生成并读产物，不将纯策略测试冒充SDK |
| 解释清楚 | PASS：静态自检，独立评审待主控 | guide讲清选择、getManifest→generateSW→浏览器安装的界限、完整Node迁入、三个实际配方与错误/清理；文件被预缓存不等于已注册导航回退 |
| Demo有用 | PASS：实际Node配方执行 | basic/business/advanced入口均exit0；分别观察revision清单、NetworkFirst配置、NavigationRoute壳；没有网页shell执行或任何SW注册；浏览器离线不属此Node工坊验收，保持未测 |
| 源码可迁移 | PASS：真实脚本执行与静态检查 | 所需workshop/cache-policy/三个入口均列sourceFiles；无env/React/额外配置，Node与依赖已声明；mkdtemp资源归属与keepOutput清理路径明确 |
| 官方来源可靠 | PASS：固定包级原文/摘要/响应 | GoogleChrome/workbox@62b9d8ba8eb3c1a2ab8aac9d84c90cda7865d6a3的packages/workbox-build/README.md原始字节；固定包/根路径无中文README，回退官方英文（短原文只有文档链接，不人工扩写）；Chrome中文官网CSP禁止Lab嵌入，blocked直达 |
| 结果可复核 | PASS：Node执行层，浏览器层NOT_RUN | commands.json原argv/cwd/exit/输出与每个产物sha256；原始CLI日志、SDK3/3、纯策略另计3/3、保留产物*.txt；未注册、未做离线/激活/更新/CacheStorage运行时测试，不据此声称浏览器PASS |

以上PASS限定本地内容与Node工坊，非正式receipt；未以平均分掩盖浏览器缺口。网页命令/源码展示提案尚未跑，交给主控；它只能证明展示，不可能证明离线工作。

## 实际CLI执行与产物

cwd均 `/home/lambert/githubRepos/lambert/ReactLoom`；命令、工具时间及exit见 `validation/commands.json`。

- `node packages/library-lab/entries/D16-workbox/examples/basic.mjs`：exit0，`validation/basic.log`。
- `node packages/library-lab/entries/D16-workbox/examples/business.mjs`：exit0，`validation/business.log`。
- `node packages/library-lab/entries/D16-workbox/examples/advanced.mjs`：exit0，`validation/advanced.log`。

三条都输出3个预缓存URL（app.js/index.html/offline.html）与310字节fixture总量，registrationExecuted=false。产物sw.js和workbox-<hash>.js、公开fixture及private排除fixture的原始字节保存到 `validation/artifacts/<level>/<original-path>.txt`，每个文件原始路径/大小/sha256列入commands.json。保存的是文本证据，不是第二站点或注册入口。生成后检查：basic没有NetworkFirst/NavigationRoute；business包含匿名matcher、NetworkFirst、statuses200、条数/时长/等待阈值；advanced额外包含NavigationRoute(createHandlerBoundToURL("offline.html"))。所有worker清单均不含private/tokens.js。

CLI日志打印的随机临时输出路径已经移除：复制字节后只删除本次命令的scratch根，先核对位于/tmp且以reactloom-workbox-开头；没有处理其他目录、缓存或SW。CLI执行后仅对源文件做格式/等义字符串调整，算法、matcher与生成参数未变；随后SDK测试在最终格式源码上再实际生成三个worker并检查其内容。

## 定向检查

- `node --test packages/library-lab/entries/D16-workbox/tests/sdk.test.mjs`：exit0，3/3真实SDK，`validation/sdk.log`。每个用例调用真实generateSW并读实际产物，finally删除本次tmp根。
- `node --test packages/library-lab/entries/D16-workbox/tests/cache-policy.test.mjs`：exit0，3/3纯策略，`validation/policy.log`；只证明方法/凭据/origin/path/header输入策略，不计SDK或浏览器缓存命中。
- 包内Biome针对examples/tests/metadata/verification/browser提案：exit0，`validation/biome-final.log`；初次模板提示保存在biome.log，已等义修正。
- validateOfficialSources实际校验owner/repo格式、固定路径等元数据，并核对快照sha256：exit0，`validation/official-contract.log`。完整脚本argv见commands.json。

## 剩余边界

`validation/browser.spec.ts` 为三层命令展示提案，供主控复制；不调用navigator.serviceWorker.register、不离线、不碰现有SW。真实浏览器缓存/离线/生命周期验收不适用当前Node-only范围，正式browser仍NOT_RUN，若以后扩展必须先有独立产品origin与单独授权，不能在Lab主源补注册。

未执行Lab全包build/typecheck/generate，无共享文件或依赖请求。正式sdk/build/browser维持NOT_RUN（没有committed receipt）。不要把隔离SW生成直接套成Lab应用build收据，也不要从NetworkFirst字符串推导网络已验证。
