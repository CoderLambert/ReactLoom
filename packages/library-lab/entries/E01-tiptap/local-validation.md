# 2026-11-18 主控闭环补充

六项本地质量PASS。实际Schema SDK3+策略5通过（Schema不冒称DOM）；非作者迁入编译和新Schema consumer通过。浏览器2项含官方来源，实际编辑/bold/undo、合法草稿恢复、6类非法JSON前后DOM不变、存储异常、持有实际editor确认isDestroyed、off调用与callbacks清空。候选28及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E01.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E01 本地整改证据（2026-11-18）

STABLE：仅E01目录，等待主控独立复核与浏览器；不提交/推送、不改共享依赖、不运行generate/build/full typecheck。固定react/pm/starter-kit3.32.0；正式verification三项仍NOT_RUN。

|六项|状态与层级|依据|
|---|---|---|
|技术准确|PASS：真实Schema SDK+静态|相同editor-config的getSchema实际roundtrip/bold和非法paragraph嵌套check拒绝；恢复policy→schema.check→setContent，非仅type=doc；三个安装包及固定上游package.json都MIT|
|解释清楚|PASS：静态自检，独立待主控|guide说明headless所有权/transaction、选型、三个目标、完整迁移、session范围/Schema与HTML净化边界|
|Demo有用|NOT_RUN：真实DOM/browser待主控|编辑+格式/undo；JSON草稿；可输入JSON边界/非法恢复前后不变分别独立；提案提供具体可观察断言|
|源码可迁移|PASS：静态+Schema执行|example.tsx/editor-config.ts/两个policy+storage的mjs/d.mts全部sourceFiles；精确三依赖、ReactDOM/TS bundler、SSR客户端前提，无Provider/env/服务；Hook销毁与自己的update off明确|
|官方来源可靠|PASS：固定原文+实际HTTP|ueberdosis/tiptap v3.32.0 commit388e722df0b36f5ac7d63cbd8b2354d43794360d，实际React package README，无中文package README，英文原字节SHA记录；官网X-Frame-Options:SAMEORIGIN，blocked保留直达；licenseEvidence保存三包实际字段|
|结果可复核|NOT_RUN：Schema局部已执行，DOM交互未执行|validation/sdk.log真实Schema2项、policy.log纯策略5项分别记数；biome失败/修复原日志保留；browser.spec.ts待主控，不将Schema或策略PASS当DOM Editor通过|

cwd `/home/lambert/githubRepos/lambert/ReactLoom`：

- `node --test packages/library-lab/entries/E01-tiptap/tests/sdk.test.mjs` exit0，2 actual Schema SDK tests，validation/sdk.log。直接导入UI的editor-config.ts并用@tiptap/react导出getSchema；没有DOM/EditorView/React Hook运行。Node26原生类型剥离，无新依赖。
- `node --test packages/library-lab/entries/E01-tiptap/tests/policy.test.mjs` exit0，5 policy tests，validation/policy.log。含合法/空/坏/超限/属性/链接/深度、Storage quota/security fake异常以及无关key保留，不当作浏览器配额测试。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/E01-tiptap/examples entries/E01-tiptap/tests entries/E01-tiptap/validation/browser.spec.ts entries/E01-tiptap/library.json entries/E01-tiptap/official/source-evidence.json` 初次exit1，既有控制字符正则触发规则，validation/biome.log。改为码点比较后同命令exit0，12文件，validation/biome-final.log。
- 最终metadata定向格式检查见validation/metadata-biome.log，exit0。
- `git diff --check -- packages/library-lab/entries/E01-tiptap` exit0。
- 官方tag API→固定tree→实际packages/react/README.md下载原字节；homepage真实GET头与最终URL/body摘要保留official/source-evidence.json。MIT核对来自实际安装包与三个固定上游package字段，不凭记忆。

浏览器提案：编辑器填正文、选区加粗、undo；保存后改文再恢复；advanced空/坏/超限/合法节点但非法结构四负例保持原innerHTML，合法JSON生效；临时拦截本key的Storage写入异常，reload恢复；持有真实Tiptap DOM.editor实例句柄，卸载后poll isDestroyed，确认自有update off被调用和SDK callbacks为空。内部callbacks字段为固定3.32.0白盒观测，升级时重新核对。提案未执行，不用DOM消失证明销毁，不额外给产品加全局调试钩子。真实IME候选选择/移动输入仍人工NOT_RUN。

独立复核重点：配置与白名单一致（heading2/3、Link HTTPS策略）、真实Schema check在任何恢复写入前、Storage只动本key、Hook实例销毁和自有off、全部源/类型迁入以及Node2项仅Schema的证据边界。
