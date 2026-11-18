# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK9+策略8、非作者不同fixture的权重/范围/替换/删除consumer通过；浏览器4项覆盖三层目标、IME、分类、阈值、替换删除恢复及官方来源。候选27及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D19.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# D19 本地整改证据

仅D19条目写入，既有他人工作保留。固定fuse.js7.5.0；将UI实际加权选项提取article-index.mjs及声明，SDK复用同模块。修正同ID替换仍在摘要包含React造成旧词残留的问题。作者初次将许可证误判为MIT，非作者对照已安装包及固定上游commit的package.json/LICENSE发现错误，已恢复Apache-2.0。替换现在移除全部旧可搜索字段词。规范化用明确码点过滤控制字符，保留NFC/80码点契约。

## 六项复核

| 维度 | 状态 / 层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS：真实SDK与固定官方原文 | SDK9/9，含UI真实权重title.65/summary.25/tags.1排序、分数越小越好、ignoreLocation、threshold、分组先于limit、替换删除索引。许可证已按独立复核恢复Apache-2.0，不将UI分类当ACL。 |
| 解释清楚 | PASS：静态自检，独立待主控 | guide选择→数据/索引/评分→最小迁入→三个独立目标→恢复/安全/性能边界；区分SDK、自建policy与fixture。 |
| Demo有用 | NOT_RUN：设计/SDK通过，浏览器待跑 | basic错拼/评分；business分类/IME提交；advanced阈值及稳定ID生命周期。proposal覆盖三层、composition阻止提交、分类、替换旧词消失/新词出现、删除及恢复。 |
| 源码可迁移 | PASS：真实模块执行及静态自检 | article-index、search-scope、index-lifecycle及三个.d.mts完整列入所有sourceFiles，React可选；exact依赖与宿主TSX前提、无env/Provider/网络，文本渲染与无资源清理明确。未宣称全Lab类型/构建通过。 |
| 官方来源可靠 | PASS：固定原始字节/真实HTTP响应 | v7.5.0 annotated tag2c34c70→commit45bac9fe2e71fe8c680c861a35a8b226c4ae6d5a；递归树只有README.md，无官方中文原文，因此语言en，未伪标zh-CN。sha256 ddeea10c54ccf1d6d21bcc31f89ca305db4b50c3197f3cd105dbb7b0c01ef72d；homepage GET200、未明确限制头、无Lab嵌入实测，unknown。 |
| 结果可复核 | NOT_RUN：Node已记证，交互未执行 | validation/commands.json保存真实cwd/argv/exit/time/log；SDK9和纯策略8分列，biome最终exit0；浏览器待主控，不转换为正式receipt。 |

## 实际命令

cwd `/home/lambert/githubRepos/lambert/ReactLoom`。原命令与工具时刻见validation/commands.json：

- `node --test packages/library-lab/entries/D19-fusejs/tests/sdk.test.mjs`：最终exit0，9项真实SDK，validation/sdk-final.log。新增用例消费UI同一article-index，未mock SDK。
- `node --test packages/library-lab/entries/D19-fusejs/tests/search-scope.test.mjs packages/library-lab/entries/D19-fusejs/tests/index-lifecycle.test.mjs`：exit0，8项纯策略，validation/policy-final.log，不计SDK。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/D19-fusejs/examples entries/D19-fusejs/tests entries/D19-fusejs/validation/browser.spec.ts entries/D19-fusejs/library.json entries/D19-fusejs/verification.json`：首次exit1，既有控制字符正则触发lint；改为码点过滤并重跑，最终exit0，validation/biome-final.log。原失败保留biome.log。

固定官方原文通过GitHub tag API→annotated tag object→commit递归树→raw README实际读取保存；homepage真实GET及完整响应头/正文摘要见official/source-evidence.json。不执行README里的命令。官网unknown不是允许嵌入。

## 余项

主控复制validation/browser.spec.ts到共享e2e，执行实际IME/分组/新增替换删除/恢复/阈值。此处没有运行共享浏览器，没有generate/build/full typecheck/共享依赖修改或commit。正式sdk/build/browser保持NOT_RUN。生产外来JSON schema及错误UI、可信授权过滤不在fixture实现中；已在指南明确。没有timer、Worker或持久化需要清理。
