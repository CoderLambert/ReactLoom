# C11 可恢复稳定检查点：调度转交前停止

保存者quality_e05，UTC `2026-11-10T16:13:35.258033+00:00`。实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。root按用户分工纠正要求暂停C11、优先转交C10。本记录不是整库质量交付，不自行修改队列/状态，不提交推送。

## 当前实际修改与证据

**原8文件逐字节未改**，重新hash/bytes比对validation/baseline.json，8/8一致、0差异。唯一新增为validation/baseline.json及本检查点；guide/agent/library/verification/examples/tests均还是接手时实际目录内容。尚未实施UI/共享model/IME编辑器/官方快照/提案，没有运行C11 SDK、策略、类型或浏览器。正式verification保持原NOT_RUN。根公共文件/依赖锁/队列未动，保留其他工作者。

基线以实际目录读取，不能从HEAD覆盖当前工作区。恢复时先读root/条目AGENTS、当前library/guide/agent/全部example/sdk/verification与本记录；确认root新授权和冻结状态，再在本目录继续。原始8文件路径/字节/SHA及HEAD/时间在baseline.json。

## 已核实研究

- 实装react-arborist3.16.0、MIT，React/DOM peer>=16.14；其实际依赖react-dnd14.0.5、html5-backend14.1.0、react-window1.8.11（window实际peer含React19）。不要套用当前main4.x的peer安装要求或改依赖。
- 实际匿名registry GET200返回npm gitHead `d74c4ec696ba98c1a4e981075f6d60cdff3e290b`；匹配GitHub递归tree实际200/untruncated，README候选为.changes/README.md、README.md、modules/docs/README.md、modules/e2e/README.md、modules/showcase/README.md。目标package manifest在modules/react-arborist/package.json，无该包目录README，预计匹配根README。**这些只读研究没有保存完整响应证据，后续仍需正式抓取，不计官方快照完成。**
- 已读实际src/types/tree-props.ts、TreeApi/NodeApi、DefaultRow/DefaultNode及adjustMoveIndex。onMove.index是真正删除前槽位，导出adjustMoveIndex按目标兄弟ID修正；现moveTree的摘取/原子插回/循环失败返原树/父子一起选时避免复制算法应保留。
- TreeProps有readonly data、searchMatch、selection?:string、ref到TreeApi、width number|string、height number、rowHeight number|accessor。当前示例使用固定34px，不据库新能力虚构示例动态行高。
- TreeApi.deselectAll公开、真实调用setSelection并发onSelect；TreeApi.delete只调用onDelete/redraw，不替应用清selection；NodeApi.submit/reset经TreeApi结束编辑并安排SDK回焦。SDK资源归库拥有，应用只管理自己的data/输入状态。

## 已确认缺口/后续方向

1. 原onSelect只是SDK选中状态的React镜像，不是受控selection。恢复仅setSelected([])，没清真实SDK selection；应保留ref并调用deselectAll，同时保证数据/搜索/镜像一致。删除后也需保持镜像与实际选择一致，键盘焦点回存活节点的行为留真实browser。
2. starter总数7，advanced新增1800，实际总数1807；原恢复降回7。需要统一“恢复当前目标初始数据”的行为或精确说明；不能把1800说成实际总数/性能数字。
3. 默认SDK inline Edit的onKeyDown Enter直接submit，没有isComposing/229守卫。不能宣称中文重命名安全。建议仅自定义Node内容/编辑器，保留SDK默认Row的attrs/innerRef/treeitem和dragHandle；应用编辑器保护组合输入/确认Enter，Escape由本地编辑交给node.reset，别写全局键盘监听。
4. 提案中的IME序列要涵盖Enter确认与Space/鼠标确认compositionend后普通Enter，避免B17曾有的无条件compositionend吞下一次Enter问题。真实OS输入法仍NOT_RUN；合成composition序列不冒充OS通过。
5. 目标建议：basic真实树键盘/展开/稳定ID；business受控移动/重命名/删除与原算法；advanced1807模型与虚拟DOM、名称搜索/IME。可为键盘用户增加应用移动按钮，但它是自建业务fallback，不能冒充SDK拖拽事件；真实drag仍要浏览器验证。
6. 抽共享纯树模型与SDK moveTree以便真实SDK测试直接用页面函数；现SDK2只调用adjustMoveIndex，不证明整棵树/DOM。页面压缩源码、guide/agent历史/未接4.x功能堆叠、缺官方原文/完整官网头、CSS/迁移和完整三目标browser提案都待做。
7. searchTerm过滤时SDK拖放边界要核真实canDrop，应用移动按钮也应有一致策略；不要把过滤后槽位直接当全量树槽位。虚拟DOM行数与TreeApi.visibleNodes（展开/搜索后模型）是不同观察。

## 未运行与恢复条件

本阶段只有只读文件/安装类型源码/registry/tree/官网阅读和一次基线落盘。没有运行依赖或套件，没有编造PASS。恢复后固定官方版本/原文/响应头、共享SDK/策略分界、定向类型/格式/metadata和完整browser-proposal/local-validation六项仍全部待完成。root正式授权新owner后继续，不自行交叉写公共/依赖/队列。

**C11 CHECKPOINT STABLE：`2026-11-10T16:13:35.258033+00:00`，停止C11全部写入（含记录/日志）。**
