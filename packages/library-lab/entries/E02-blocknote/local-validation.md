# 2026-11-18 主控闭环补充

六项本地质量PASS。纯策略5与非作者新policy consumer/迁入编译通过，未虚构Node DOM SDK套件。浏览器4项含官方来源，真实BlockNote编辑/斜杠菜单/onChange、插入/保存/恢复新ID、坏JSON/超限/非法/媒体拒绝原文不变、Storage异常、IME和公开onUnmount/重挂通过；不称editor.destroy或每个内部资源均已动态追踪。候选28及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E02.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E02 本地整改证据

本条独占E02目录，无共享/锁/依赖/生成/build/full typecheck/commit变更。三目标为真实块编辑与菜单、会话草稿、命令插块和有限恢复。没有新增上传/商业扩展。

| 六项 | 状态 / 证据层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS：实装源码/类型静态核查+policy | BlockNote三个包0.56.0/MPL-2.0；Mantine核心/hooks9.7.3满足声明peer，utils6.0.22非当前UI直接导入；View自包Provider/CSS路径、onChange退订与editor.unmount由实装源码核对。恢复校验现在拒绝非法props/inline，不只粗略递归JSON。 |
| 解释清楚 | PASS：静态自检 | guide讲需求/选型、editor文档所有权、CSS/字体、默认菜单比存储白名单宽、五类文本恢复与生产边界、失败恢复、真实卸载范围；SDK与policy/fixture分离。 |
| Demo有用 | NOT_RUN：DOM待主控 | 三个独立目标，browser proposal实际操作编辑/菜单、insert/save/restore、ID变化、损坏/超限/非法拒绝不变、Storage读写异常、composition拦截及重挂载。未运行浏览器。 |
| 源码可迁移 | PASS：静态与pure policy | example.tsx、snapshot-policy.mjs/.d.mts齐全，转发可省；完整6包安装（React/DOM宿主peer）、Mantine/Inter CSS字体接入、无env/服务/账号。只取消自有onChange订阅；View卸载不声称destroy。 |
| 官方来源可靠 | PASS：固定原文/实际响应 | v0.56.0 annotated tag aa2cca8→commit8e0485caef54abe9cad6b84fa66505e0398acb79；真实README与LICENSE.txt保存。实装license MPL-2.0，固定LICENSE说明XL例外；递归树无中文README，language=en；首页GET200无明确frame头但未Lab嵌入确认，unknown。 |
| 结果可复核 | NOT_RUN：policy已记证，DOM SDK未执行 | policy5/5、Biome/official contract原命令cwd/exit/time/log见validation/commands.json；无伪造NodeSDK测试，DOMSDK真实断言待主控browser proposal。正式verification维持NOT_RUN。 |

## 必要实际检查

cwd `/home/lambert/githubRepos/lambert/ReactLoom`：

- `node --test packages/library-lab/entries/E02-blocknote/tests/policy.test.mjs`：exit0，5/5纯策略，validation/policy.log。覆盖合法nested/styledText/HTTPS及递归丢id、损坏/超长/不合法URL、媒体/深度、非法props和inline；不计SDK。
- 包内Biome check/write examples/tests/browser/metadata/verification：exit0，原命令见commands.json，validation/biome.log。没有全仓格式化。
- 实装package.json实际读取：BlockNote core/react/mantine0.56.0 MPL-2.0；Mantine core/hooks9.7.3 MIT、utils6.0.22 MIT。mantine包peer明确core/hooks^8.3.11||^9.0.2，原“utils主版本不同必失败”论断已删除。
- 实装源码：react/src/hooks/useCreateBlockNote.tsx仅useMemo；react/src/editor/BlockNoteView.tsx ref detach→editor.unmount；mantine/src/BlockNoteView.tsx缺Context时MantineProvider；mantine/src/style.css包含mantineStyles和blocknoteStyles；core/defaultProps及heading schema核对有限props。
- 官方GitHub tag/tree/raw实际GET及官网响应保存official/source-evidence.json；LICENSE原路径先探测LICENSE得404，列树后正确读取LICENSE.txt200，没有用失败响应冒充许可。

## 关键整改与边界

保存也先校验有限schema，避免默认菜单媒体成功保存却无法恢复的误导。默认编辑UI仍包含媒体/其他块，保存时明确拒绝；没有uploadFile。策略限制五类文本块、已知属性/inline，60000UTF16单元不是60KB；恢复前校验失败不调用SDK，因此文档不变。SDK replaceBlocks本身异常回滚未获证据，不承诺原子性。

composition ref阻止保存/恢复/insert；不在输入变更时整篇replace。onChange只更新观察计数，返回unsubscribe在effect cleanup执行。没有自造destroy调用，不以DOM消失证明内部销毁。浏览器待验真实PM view卸载/菜单portal/样式和IME，真实OS输入法另需人工。

仅操作本例Storage key，读写/删除都捕获异常。浏览器Storage异常注入只拒绝该key，其他key保持原方法；测试页关闭后恢复环境。拒绝后恢复路径和清除后不改文档已有提案。没有global clear。

## 稳定交棒

待主控复制validation/browser.spec.ts并冻结候选执行；真实DOM SDK和browser仍NOT_RUN。无纯Node SDK PASS、buildPASS或formal receipt。作者完成后停止E02写入，交独立复核。
