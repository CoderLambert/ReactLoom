# 公共文档链接补丁独立只读复核

Reviewer /root/quality_e11；UTC 2026-11-10T17:28:22.928339+00:00；实际cwd /home/lambert/githubRepos/lambert/ReactLoom。仅写本报告，未改公共实现/测试、条目、依赖、锁；未重跑已有有效检查。

## 结论

**无未关闭P1/P2，静态安全与React接线可接受。补丁后新构建/浏览器 NOT_RUN。** 本次增量是guide/agent的已声明README alias和带版本patch的惰性纯文本链接，不把HEAD累计的已有README渲染/HTML回退改动都归于本次补丁。后续需root匹配新构建观察实际href/资源，不能引用candidate18旧dist冒充本补丁UI通过。

## 安全与实际资源

- src/lib/document-utils.mjs:53 检查外部传入snapshotPath为安全相对.md，且文档链接恰等于该快照路径或readme.md，输出固定raw/<entry>/readme.md。不把仓库official目录整体公开，也不把输入路径当任意静态文件。安全目录前提来自实际entry.official元数据；validateOfficialSources约束snapshotPath为official/readme.md，生成器先校验entry、原文digest，再只发布该原文到根readme.md（scripts/generate.mjs:92与:212）。alias自己不会读取磁盘，也不改变README原字节/摘要。
- document-utils.mjs:65 的@只在examples/tests最后filename字符集开放；目录段仍不含@。patch后缀仍交给sourceTextPath，最终为sources/examples/react-grid-layout%402.3.0.patch.txt，URL逐段encodeURIComponent。不产生可执行patch/HTML，不启用任意扩展；生成器仅输送经现有source名单检查的内容。实际B15 library三目标sourceFiles均列该文件（library.json:59/75/91）。
- 原协议/控制字符/反斜杠/空segment/..和.检查、entryId限制、BASE_URL同源path约束保持。credential HTTPS返回空后仍因冒号等字符过不了相对路径；百分号编码绕过也不在相对字符集内。@可用于正常末级源filename，不使scheme-relative/credential URL合法。
- official/source-evidence.json、local-validation.md、validation/run.txt仍没有发布分支；没有声明README的entry不获alias。错误snapshotPath/绝对/遍历与带token查询的patch仍拒绝。README alias指向已有公共资源，不是私有快照绕过；raw资源不存在或摘要不符的既有生成/读取边界没有放宽。
- 文档图片仍限本entry assets和raster后缀，skipHtml+rehypeSanitize未因这两个链接场景放宽。Markdown源码读取/复制/字节上限和SHA校验语义保持。

## React、类型与性能

- src/app/library.tsx:106/116 分别向guide/agent传entry.official?.readme；src/components/document.tsx:136 仅给非readme链接resolver传snapshotPath。官方README自己仍走resolveOfficialReadmeUrl，避免把上游相对资源错误映射到Lab私有目录。
- document-utils.d.mts:10 新可选字符串参数与实现默认空串一致，旧调用保持行为；没有变更hook顺序、effect依赖、abort owner、request key或数据获取次数。guide/agent只改变urlTransform的规则，不因metadata对象重建而重新下载文档。
- resolver为原路径校验中增加一次安全字符串检查，没有额外网络/DOM/状态。新增catalog导入没有形成模块循环：catalog依赖official-sources，不依赖document-utils；source-integrity此前已经导入catalog，未把SDK或生成器引入client。
- 不新增缓存/监听/计时器/资源，也未调用全局清理；无需借此重跑无关SDK或全量platform suite。

## 已有真实验证及未测

已实际阅读 docs/library-lab/evidence/quality-upgrade/candidate-18/document-link-red.txt：根cwd，node --test packages/library-lab/tests/document-utils.test.mjs，新增README与patch两个断言旧实现均返回空串，exit1。不是凭空声称RED。

已实际阅读同目录document-link-green.txt：根cwd，node --test packages/library-lab/tests/document-utils.test.mjs packages/library-lab/tests/source-publication.test.mjs，15/15 exit0。包括两新增功能、私有/遍历/credentials负例、原生成器source inert .txt、原字节/SHA/HTML fallback拒绝。复用这次有效focused结果，reviewer没有重跑。

尚未实际验证：该补丁的新构建type/build、真实浏览器guide/agent alias href及点击后响应、嵌套BASE_URL部署。候选18先前README/安全/其他SDK结果只按原输入范围保留，不替代这次补丁UI验收。未发现必须先改公共代码的P1/P2；建议root下一稳定候选在C13 README链接与B15 patch链接各观察一次实际已发布响应，原禁止私有链接断言保留。

## 复核输入绑定

- src/lib/document-utils.mjs — SHA256 3d007d8606635c631b2113ba04e1a06fd29c0e81dd12ca514154fb671820bc32
- src/lib/document-utils.d.mts — SHA256 43a10fa035ed13c00f6d4899388d34616728aa3820a825e546c9dd63c5242ee1
- src/components/document.tsx — SHA256 0851c39b552ed0cbb638c2d46e9249c3f534946f65988ca763db1eb72711c2c6
- src/app/library.tsx — SHA256 79c3a79eae746c798939f78ffa465da3037c493c5eb0b40a9272253d551475f2
- tests/document-utils.test.mjs — SHA256 7f6aa4fa36b694e03d2c7ffbc7fffc4cfa56637157d0416165c1e04081cb1498

仅本报告落盘，报告完成后停止写入；公共后续变动需按影响重新审查。
