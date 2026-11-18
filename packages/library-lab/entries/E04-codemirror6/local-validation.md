# 2026-11-18 主控闭环补充

六项本地质量PASS。真实State SDK3+策略3及非作者不同fixture/迁入编译通过；浏览器4项含来源，真实输入高亮/undo、有效/空/NUL/超限草稿与Storage读写异常、同View只读键盘限制、程序reset及外层destroyed观察通过；原生IME/移动设备未验。候选29及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E04.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E04 本地整改与稳定证据

只E04目录写入，保留其他工作，无shared/依赖锁/生成/build/fulltypecheck/e2e/commit。固定codemirror6.0.2/state6.7.6/lang-javascript6.2.5；真实State和DOM View分开验收。

| 六项 | 状态 / 层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS：真实SDK State+实装源码 | State3/3：不可变事务、Compartment readOnly、UI共用config中的tabSize/语言/basicSetup及只读允许程序dispatch。readOnly不是ACL，重置可改正文。 |
| 解释清楚 | PASS：静态自检 | guide说明State/事务/View所有权、三独立目标、完整5文件迁移、UTF16/空文本/NUL边界、只读用户限制和程序更新区别。 |
| Demo有用 | NOT_RUN：DOM待主控 | basic真实输入/高亮/undo；business会话保存/合法及坏草稿恢复；advanced同View只读及destroy；proposal提供实际观察，不以State通过推DOM。 |
| 源码可迁移 | PASS：静态+同配置State执行 | example.tsx、editor-config.mjs/.d.mts、draft-policy.mjs/.d.mts列入全部sourceFiles；精确三依赖、TS/React/DOM、无Provider/env/额外CSS/Worker。View.theme及语言配置齐全，effect清理destroy。 |
| 官方来源可靠 | PASS：固定原文/实装包 | codemirror/basic-setup6.0.2→commit76462c05acb10fe77e0f04edd7fcddfeb9987abd的README/LICENSE原字节；实际三包MIT，官方映射不冒称共享版本；首页GET200但无Lab嵌入确认unknown。 |
| 结果可复核 | NOT_RUN：Node有日志，DOM未跑 | SDK3/policy3各自原始日志，commands.json真实argv/cwd/exit/time。Browser proposal未执行，无DOM/destroy/IME或formal receipt PASS。 |

## 实际执行

cwd `/home/lambert/githubRepos/lambert/ReactLoom`：

- `node --test packages/library-lab/entries/E04-codemirror6/tests/node-scenarios.test.mjs` exit0，3项真实State，validation/sdk.log。新增测试使用UI实际editor-config.mjs，包含basicSetup、typescript语言及Compartment；没有创建EditorView。
- `node --test packages/library-lab/entries/E04-codemirror6/tests/policy.test.mjs` exit0，3项纯策略，validation/policy.log。中文/空白保真、50000边界、超限/NUL/非字符串；不计SDK。
- package scoped Biome check/write examples/tests/browser/metadata/verification首次exit1，已有div aria-label没有支持role；role=group又触发语义元素规则，最终将aria-label移到EditorView.contentAttributes实际textbox后通过；两次失败保留biome.log/biome-final.log，最终biome-final2.log。
- 实装package实际读取：codemirror6.0.2/state6.7.6/lang-javascript6.2.5均MIT；View作为codemirror传递依赖实际6.43.15。没有额外声明/安装依赖。
- 官网/官方tag API、peeled commit、递归树、raw README/LICENSE实际GET，保留official/source-evidence.json。固定仓库只有英文原文；这个README只对应codemirror集成包，不冒充state/语言特定版本文档。

## 生命周期和浏览器交棒

真实View只在level effect创建；readOnly effect通过Compartment重配置，不重建。清理清本次ref并view.destroy，监听属于View扩展，无独立全局订阅。Browser提案外部持有view，验证同View身份和最终destroyed，不把.cm-editor消失当销毁。

固定安装@codemirror/view6.43.15实际dist中EditorView.findFromDOM通过.cm-content的cmTile.root.view定位；测试白盒沿相同路径获取句柄并观察destroyed字段，升级需复核，不给产品添加全局调试API。

只读键盘阻止输入，但程序reset仍改变文本。存储错误try/catch且只操作自己key；含NUL/超限先拒绝后dispatch，原内容不变，合法空文本可恢复。50k只保护会话边界，不是实时输入上限。没有JSON草稿格式，不编造“坏JSON”错误。

真实IME、辅助技术/移动键盘仍人工NOT_RUN。此次未跑共享浏览器；主控复制validation/browser.spec.ts后实际执行输入/语法span/undo、会话拒绝不变、只读同view及外层destroy。无自动保存/网络/代码执行/语言Worker，不能用它证明这些能力。

完成稳定后作者停写，正式sdk/build/browser保持NOT_RUN。
