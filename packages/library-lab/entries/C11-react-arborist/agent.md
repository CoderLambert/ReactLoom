# C11 react-arborist 工程接入

适用于有选择/焦点/键盘/拖放的订阅树、文件目录；简单折叠内容可先用普通 HTML。实装3.16.0/MIT，React/DOM peer>=16.14。不要把main4.x的依赖要求套进当前pin。运行源是真实Tree，所有订阅和移动/改名策略是本地fixture，无后端/持久化。

## 模型与迁移

复制examples全部7源文件（example/demo/tree-model/move-tree/tree-node/ime-guard/styles.css），保留CSS导入、非零340px窗口和34px固定行高、宽度100%、overscan3。move-tree用.ts扩展导入共享模型，目标tsconfig需allowImportingTsExtensions与noEmit或按自己的编译流程调整。实际依赖react-dnd14.0.5/backend14.1.0/window1.8.11由已装SDK提供，本例不另建DndProvider。客户端挂载，SSR hydration没有验收。

- data是应用受控树；onMove/onRename/onDelete回写新数组。ID全树唯一，名字/父级变化不换ID。children数组是分组，undefined是叶子。
- onSelect只镜像SDK选中ID，未传selection。恢复/删除必须公开deselectAll清实际选择，不能仅清React镜像。删除发生在树内时回焦到存活首节点，真实焦点留browser验收。
- onMove.index是删除前槽位；保留adjustMoveIndex、整子树摘取、插入失败返原树、父子同选不重复。按钮fallback标source=button，真实SDK拖放标sdk；不是授权校验。
- searchMatch只按name，组合期间不更新searchTerm。搜索时SDK canDrop拒绝，应用移动也禁用。
- 默认SDK Row attrs/innerRef/treeitem不替换；Node保留style和dragHandle。自定义编辑器guard看组合ref/native isComposing/229，确认Enter保持到keyup；compositionend不能无条件吞下一次Enter。Escape reset，普通Enter submit，name trim/空白→未命名。
- TreeApi.visibleNodes是模型，不是DOM行数；filteredCount只数真正匹配。advanced7+1800=1807，恢复仍1807；不把规模写成性能。

## 三目标和断言

basic：默认Row ARIA、方向键焦点/Space选择、折叠模型7→5→7，恢复实际aria-selected与镜像都空。

business：真实HTML5 drag→SDK onMove/跨组稳定ID；同组按钮index2→最终index1是应用fallback；改名/取消/Enter或Space/鼠标组合确认、删除选择与焦点。SDK Node测试直接调用页面moveTree与真实helper，不能证明DOM拖拽。

advanced：1807模型而DOM少量，原生wheel/scrollTo bulk-1799、name搜索“官方”两匹配加祖先、ID词无命中、组合完成提交、恢复保留规模、390px/卸载新挂载。合成composition只验证应用协议，真实OS输入法仍NOT_RUN。

## 资源与边界

应用无网络/timer/全局监听/存储；SDK管理自己的Dnd/虚拟列表/临时键盘任务，卸载Tree即可移除应用子树。不能由静态清理推导全局泄漏PASS。服务端另验ACL/环/revision；不存在Query/URL同步/虚拟分页后端。全树仍在内存，算法遍历不是无限规模方案。

官方固定jameskerr/react-arborist@d74c4ec696ba98c1a4e981075f6d60cdff3e290b/README.md，npm3.16.0 gitHead与manifest匹配。包目录无README、无匹配中文原文，根英文24954B/SHA0c3ba42abd227ddce29578749b9765b5513797d446cb2d3d2b96281a429fa80a；历史请求字典在official/source-evidence.json；同名重复头未保留，不称完整原始头，不补造历史列表。官网历史200字典未捕获XFO/CSP，Lab-origin未确认→unknown。抓取脚本异常写独立failed，全部成功才暂存replace原文/证据，不得finally覆盖旧成功对。

root固定candidate18实际三目标+原文/unknown展示4PASS已记录在local-validation.md，完整提案仍在validation/browser-proposal.txt。真实HTML5拖放、导航/选择、编辑守卫、虚拟窗口与卸载均使用真实SDK；合成composition非OS输入法。正式verification三个status保持NOT_RUN，不用本地成功代替正式收据。现有fetch工具只捕获headers字典，未来需要重复头时应升级列表捕获，不能从旧字典补造。
