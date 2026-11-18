# C10 TanStack Virtual

实际React适配器3.14.21→core3.19.6，MIT、React19.3。只处理窗口/偏移/尺寸；文章fixture、分类/词提交、身份/展开由应用拥有。8000或3400是内存对象数，不是性能结果；没有网络/游标/分页/横向网格或全量读屏出口。

## 三目标与所有权

basic8000：365px原生滚动窗口+小型DOM+深跳；business3400：分类与词统一“筛选”提交（工程实践850），空态/重置及相同条件revision重建；advanced：真实measureElement变高、深跳、重新挂载丢掉旧测量和展开。不能把SSR0窗口或initialRect模型当DOM滚动通过。

保持stableRowId/viewIdentity，缺ID/越界抛错，不造missing-index；getItemKey依赖当前items，React用row.key。总高度getTotalSize占位，外层行绝对定位/translateY(start)/data-index/measureElement在一起，不写固定height。94只是estimate；UI不用resizeItem、不打开directDomUpdates，布局所有权单一。

useFlushSync:false是本例显式策略，实装适配器已有ref测量时flushSync保护，不谎称默认true必然React19失败。onChange仅停滚时更新自建文字，不等于SDK不重绘。

query NFC/去ASCII控制/trim/80码点是自建policy。category/query/revision用JSON编码作key；重复提交也重挂，丢展开/滚动是明示取舍。分类和词先都是草稿。IME守卫看composing/native isComposing/229及当前确认Enter按键，Space/鼠标结束不无条件吞普通Enter；OS输入法仍未验。

## 迁移与观察

复制example/demo/virtual-contract/filter-policy及.d.mts/styles.css六源，安装@tanstack/react-virtual3.14.21；core是既有精确传递依赖，公开Virtualizer从React入口再导出，无新公共依赖。SDK effect拥有滚动/ResizeObserver清理，应用只卸载自己视图；不要全局stop。SSR/hydration/读屏另验。

c10-workshop/data-level；c10-view/data-view-identity；c10-model真实JSON count/virtualCount/totalSize/firstIndex/lastIndex/firstKey/lastKey/scrollOffset；c10-scroll/spacer/row(data-row-id/data-index)；c10-filter-state为提交条件；c10-empty。控件“跳转靠近末尾/回到顶部/筛选/重置筛选/展开长文”，搜索文章与分类。停滚范围不含overscan，DOM窗口含overscan5。

## 来源和结果

React版本tag为annotated，实际ls-remote tag b809313…、peeled commit28ff2cab7a970f4e0908229d65a0da8803903900；同commit React3.14.21/core3.19.6两个manifest核对。目标React包无README，回退根原文5226B/en/SHA24bd3ff93da253313681dbe66adab7b012caca06f03edc516dfd875a1274ff00，无匹配中文。日期/7实际GET完整头/tag原始stdout见official/source-evidence.json，官网XFO DENY无CSP覆盖→blocked。

SDK3实际SSR与公开core模型：initialRect/resizeItem人工输入、key缓存重排/measure清缓存都不测DOM；policy6只查询/身份/过滤。完整browser提案交root，formal均NOT_RUN。先查local-validation和匹配候选，不能继承目录/静态/模型通过当滚动测量已验收。
