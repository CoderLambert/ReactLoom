# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK3+策略3、三条精确页面CLI及非作者新HTML原生consumer通过；浏览器2项仅三CLI展示和官方来源，未执行访客search，不将生成当已部署搜索。候选28及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D21.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# D21 Pagefind 本地质量复核（2026-11-18）

独占D21目录，Pagefind1.5.2；先记录NOT_RUN再执行。未改公共宿主/依赖/锁/生成/e2e/队列；未运行共享build/fulltypecheck/browser，未提交。三场景是Node原生索引工坊，不是主站搜索UI。公开原创HTML/RSS fixture，无真实私密资料、账号或网络抓取。

## 六项复核

|维度|状态/证据层级|证据与范围|
|---|---|---|
|技术准确|PASS：真实native SDK/CLI|三个CLI与SDK3项真实执行createIndex/addHTMLFile/addCustomRecord/addDirectory/getFiles/writeFiles；记录实际响应metadata、目录page_count、写盘资产摘要。修正getFiles/writeFiles两次生成不能假设hash文件名一致。|
|解释清楚|PASS：静态对照|选型/公开性边界→HTML→customRecord meta/filters→目录扫描/部署；补完整命令cwd、optional native依赖、语言、配置/失败与清理。|
|Demo有用|PASS：真实Node CLI执行|basic实际HTML、business自定义RSS/filter/meta、advanced仅临时公开目录扫描，2/4/5记录对应不同目标；没有用数量变化充场景。主站命令显示浏览器测试待执行。|
|源码可迁移|PASS：实际CLI接入|workshop.mjs+publication-policy.mjs+所需三个入口，真实Node ESM，无Lab内部模块。说明平台二进制/tmp权限、close服务所有权、站点部署与URL内容仍由业务提供。|
|官方来源可靠|PASS：固定原文字节/实际响应头|固定v1.5.2提交bf17396721be637cc67c8ed7ead1dc7b8ac43d96，完整tree无中文根README；MIT由安装包字段和固定LICENSE双核；主页GET200无限制头但未实际嵌入确认，unknown。|
|结果可复核|NOT_RUN：主站展示/正式验收待办；Node证据完整|三条精确声明CLI的argv/cwd/exit/raw输出、实际磁盘manifest及代表原字节已存；SDK/policy分计。未执行主站浏览器资料展示或访客search，不把索引生成当search PASS。|

## 实际CLI与产物

最终命令cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，与页面声明一致（末尾level由宿主配方附加，入口固定对应场景）。

|argv|exit|真实输出|
|---|---|---|
|`node entries/D21-pagefind/examples/basic.mjs basic`|0|2记录，16磁盘文件，645963字节，directoryPages0|
|`node entries/D21-pagefind/examples/business.mjs business`|0|4记录，20磁盘文件，646622字节，directoryPages0；自定义RSS响应meta含category=guide/title=RSS field notes，磁盘含filter资源|
|`node entries/D21-pagefind/examples/advanced.mjs advanced`|0|5记录，21磁盘文件，646847字节，directoryPages1|

每项`validation/<level>-cli-final.log`是原始合并stdout/stderr；`*-cli-final-command.json`含argv/cwd/exitCode/UTC时间、实际清理的ownedScratch路径与清理后exists=false。`<level>-result.json`为原输出JSON；`<level>-disk-manifest.json`为独立遍历本次真实写盘所得path/bytes/SHA256，并与workshop返回assets逐项相等。

必要原字节保留`<level>-pagefind-entry.json.txt`及`<level>-pagefind.js.txt`；`.txt`是保留真实原字节而非自编摘要，不从网页执行这些文件。二进制分片/WASM保留精确摘要清单，不复制整个包。原临时目录已由运行记录者在只读检查/取证后删除，未清理其他tmp。SDK默认keepOutput=false自行清理；入口finally close，每个workshop finally deleteIndex。

`fileCount/bundleBytes/assets`来自实际写盘读取，不是getFiles估计；`memoryFileCount/memoryBundleBytes`单独记录内存生成。数值仅代表本次平台/版本/fixture，不是网络传输量或搜索性能。

## 检查命令与原始日志

其余检查cwd `/home/lambert/githubRepos/lambert/ReactLoom`，精确argv见对应`validation/*-command.json`，所有退出码均保存。

- `node --test .../entries/D21-pagefind/tests/sdk.test.mjs`：exit0，3 tests/3 pass/0 skip，`sdk-final.log`。真实native二进制，HTML、自定义RSS metadata/filter资源、扫描page_count1；磁盘字节汇总与SHA格式均断言。不是访客查询。
- `node --test .../entries/D21-pagefind/tests/publication-policy.test.mjs`：exit0，3/3，`policy-final.log`。公开标记、URL前缀/编码/遍历/查询参数、标题/正文形状、HTML转义；纯策略与SDK分计。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/D21-pagefind/examples entries/D21-pagefind/tests entries/D21-pagefind/library.json entries/D21-pagefind/validation/browser.spec.ts`：exit0，9files，`biome-final.log`。
- `node --input-type=module -`：exit0，真实共享validateOfficialSources返回[]，原文字节SHA匹配，`official-metadata.log`与command.json含完整stdin。

最初advanced根目录CLI exit1：错误地把getFiles带hash的内存路径逐项对应第二次writeFiles磁盘生成，实际pf_meta路径不同，ENOENT。失败原文保留`advanced-cli-initial-failure.log`及command.json；本次scratch在失败finally中清理。改为分别记录两次生成，对实际writeFiles目录独立遍历/读盘，最终三CLI全部通过。首次Biome exit1（finally中手动rethrow）保留biome.log；改成deleted标记与嵌套finally，自然传播错误并保证失败清理，最终通过。

## 官方取证

- 实际`git ls-remote https://github.com/Pagefind/pagefind.git 'refs/tags/v1.5.2*'` exit0：tag object97beee66666767c679d836a93488427066f0f3a5，peeled bf17396721be637cc67c8ed7ead1dc7b8ac43d96。
- Python urllib GET该commit递归tree、根README.md与LICENSE，exit0；official/tree.json/source-evidence.json保留目录选择依据，无中文根README，使用英文en原文，未自编翻译。安装包pagefind/package.json实际version1.5.2/licenseMIT；固定LICENSE为MIT文本并保存official/license.txt。
- official/readme.md SHA256 `e363a3eede2deb4622808e246bcf1490483e8a5d3326483a2deda49a7b0735ac`，匹配元数据/共享校验。
- `curl -fsSL -D packages/library-lab/entries/D21-pagefind/official/homepage-headers.txt -o /dev/null https://pagefind.app/` exit0，GET200。响应无X-Frame-Options/frame-ancestors；没有Lab-origin浏览器内容确认，保持unknown，未推定allowed。

## 后续与独立复核重点

validation/browser.spec.ts仅验证三条Node命令展示、没有搜索宿主、固定README及unknown主页直达；交主控复制执行，当前NOT_RUN。不注册新runner，不在主站提供/pagefind，不执行访客search。

独立review请检查：getFiles与writeFiles不同生成的真实证据边界；仅公开原创fixture、filters/meta非ACL；customRecord索引URL不会自动发布目标文件；close为进程级、deleteIndex为本索引级，失败/成功留存的tmp所有权；实际3CLI产物摘要与原字节、仅本次tmp清理。生产search接线是明确未执行的教学示意，不能把本地索引质量推成相关性/中文/浏览器WASM PASS。正式verification sdk/build/browser仍NOT_RUN，无伪造收据。
