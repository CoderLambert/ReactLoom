# TanStack Virtual：数据留在内存，DOM只保留一个窗口

文章列表有数千条，逐条.map会创建大量DOM；又希望自己决定文章标记、展开内容和滚动容器。TanStack Virtual计算窗口、偏移和尺寸，React按这些结果画行。本例使用`@tanstack/react-virtual@3.14.21`，实际依赖`@tanstack/virtual-core@3.19.6`，均MIT，宿主React19.3；数据全部是确定性的本地fixture，没有分页请求。

适合需要控制DOM/容器的列表；希望更少地处理动态列表样板可比较C09 Virtuoso，完整表格先由C07拥有行模型。虚拟化减少已挂载DOM，不减少当前数组数据，也不提供请求缓存、游标或服务端权限。8000/3400是对象数，不是容量、帧率或内存测量。

## 核心模型：估计、测量、身份

`items → count/getItemKey/estimateSize → Virtualizer范围与totalSize → 自己定位/测量DOM`。

| 输入或结果 | 本例含义 |
| --- | --- |
| count | 当前已提交筛选后的数组长度 |
| estimateSize | 94px，仅对尚未量过的行估计，不是CSS固定高度 |
| getItemKey | `stableRowId(items,index)`返回rss-*业务ID，React也用row.key |
| getVirtualItems | 包含overscan=5的实际渲染窗口，含index/key/start/size |
| getTotalSize | 整个列表的模型总高度，用来撑起滚动条 |
| measureElement | 测量外层行，实际高度更新尺寸模型 |

[`virtual-contract.ts`](examples/virtual-contract.ts)共享fixture、筛选和窗口选项；[`example.tsx`](examples/example.tsx)是唯一React实现。最小接入的关键不是某个CSS类，而是三处连接：

```tsx
const virtualizer = useVirtualizer({
  ...createVirtualOptions(items),
  getScrollElement: () => viewport.current,
  useFlushSync: false,
})
// 有确定高度和overflow的viewport里：
<div style={{height: virtualizer.getTotalSize(), position: 'relative'}}>
  {virtualizer.getVirtualItems().map(row => (
    <div key={row.key} data-index={row.index}
      ref={virtualizer.measureElement}
      style={{position: 'absolute', top: 0, transform: `translateY(${row.start}px)`}}>
      {/* 按row.index取真实文章；完整结构/宽度/样式见源码 */}
    </div>
  ))}
</div>
```

完整组件保持getItemKey引用稳定且依赖当前items；源数据缺id/越界会明确抛错，不合成missing-index。外来数据还需由生产者确保ID全局唯一。测量ref和data-index在同一外层，内容自然撑高，不把row.size再写成固定height。

## 目标一：8000数据与小型DOM窗口

运行“基础窗口与键盘滚动”。数据8000条，但DOM窗口只是视口加overscan附近的行。滚动区365px高，可聚焦后用PageDown/方向键，也可直接滚轮；“跳转靠近末尾”调用真实scrollToIndex(count-20,{align:'center'})，“回到顶部”定位index0，没有smooth干扰动态尺寸校正。

`c10-model`展示真实SDK的窗口数量、首尾index/key、totalSize与scrollOffset。“停滚后范围”是未加overscan的视口范围；DOM窗口来自getVirtualItems，可能比它更大。不能把DOM窗口数量等同于可见文章数或固定14行。

自建停滚文字只在onChange且isScrolling=false时写state；SDK/React适配器仍按自身机制更新渲染，不能说整个滚动过程没有React更新。本例保留useFlushSync:false作为显式批处理策略；**实装适配器已有测量ref期间的flushSync保护**，不是宣称默认true必然在React19报错。快速滚动与变高效果仍由浏览器验收。

## 目标二：统一提交筛选与视图身份

运行“统一筛选与视图身份”，3400条基础数据。分类和关键词都先是草稿：仅改变分类时结果仍3400；按“筛选”才一起提交。选“工程实践”再提交，确定性结果是850条，ID仍为rss-1、rss-5等，不变成结果下标。

关键词由[`normalizeFilterQuery`](examples/filter-policy.mjs)做NFC、删除ASCII控制字符、trim和最多80码点截断，这是应用策略，不是Virtualizer搜索能力。`c10-filter-state`显示已提交category/query/revision/count；文本框保留草稿，不把用户输入每一帧当查询。

筛选提交后 `viewIdentity(category,query,revision)`用JSON编码成为VirtualList的React key；分类/词变化和**同词再次提交**都让revision增加，重新挂载一个没有旧滚动/尺寸的视图。先跳到深处，再重复提交相同条件，新视图应从顶部开始。这是本例选择的测量失效策略，不是SDK自动理解查询。

输入不存在的关键词并提交，显示明确空态，两个跳转按钮禁用；“重置筛选”恢复全部3400条并重建视图。组合输入期间不提交，Enter候选确认用isComposing/229和当前确认按键状态保护；Space/鼠标结束组合不会无条件吞掉下一次正常Enter。合成事件只能验证应用守卫，真实OS输入法仍另验。

## 目标三：变高行与测量重建

运行“变高行测量与视图重建”。展开首条长文，真实DOM高度增加，measureElement/ResizeObserver更新模型，下一行的start向下移动而不是覆盖；收起后重新测量恢复。`c10-model.totalSize`是模型结果，不是手工给出的展开高度。

用稳定业务ID保存展开Set，普通滚动不会把状态带给另一个下标；但当前Set在VirtualList内部，重复筛选导致重挂时会清空。若产品要保留展开，应把Set移到视图key外，并清除已不存在的ID。本例用更明确的重建换掉旧测量，代价是丢掉该视图的展开/滚动状态。

同一DOM行只由measureElement决定尺寸，不再同时resizeItem；directDomUpdates未打开，所以应用继续拥有transform和总高度样式。实际展开、深跳与窗口resize均需浏览器测量，不能用Node里传入一个数来冒充DOM高度。

## 接入、清理与可复核模型

复制源码面板六个文件：example/demo、virtual-contract、filter-policy及声明、styles.css，安装`@tanstack/react-virtual@3.14.21`。不需单独加core依赖，本例通过React入口公开再导出的Virtualizer做Node模型核对；实际core版本3.19.6另记。样式提供滚动区高度、定位、内容宽度/换行和焦点，不依赖Lab全局reset或远程资产。

应用拥有文章/草稿/已提交筛选/展开状态；SDK拥有滚动监听、ResizeObserver和尺寸缓存。useVirtualizer挂载effect返回SDK清理，离开/重挂卸载自己子树即可，不调用全局stop。组件没有网络、业务定时器或Observer替代物。未挂载文章不在无障碍树中，不能宣称8000条都可被读屏器线性访问；分页的语义出口需另设计。

Node局部证据分两种：React SSR只有无视口初始化（0窗口行）；公开core模型显式给initialRect=640×200、20条94px估计，实际得到total1880/8个含overscan项。模型传resizeItem(0,152)后得到1938，重排按业务key保留，measure()清缓存回1880。**这些是实际SDK模型执行和人工尺寸输入，未运行浏览器测量或滚动。**

## 官方原文与验收边界

[官方原README](official/readme.md)固定TanStack/virtual@`28ff2cab7a970f4e0908229d65a0da8803903900`的README.md，英文5226B、SHA-256 `24bd3ff93da253313681dbe66adab7b012caca06f03edc516dfd875a1274ff00`。匹配React包目录没有README（安装包也未附带），因此回退同提交根原文；未截断tree没有匹配中文候选。npm省略gitHead，实际annotated React版本tag经ls-remote解析并peel后，再核React/core两个manifest，未把tag对象当commit。

[完整来源证据](official/source-evidence.json)保存实际7GET完整头、固定版本/候选/日期/摘要及真实tag解析stdout。官网https://tanstack.com/virtual最终GET200有X-Frame-Options:DENY且无CSP frame-ancestors覆盖，标blocked、保留直达；没有Lab-origin允许证据，不能标allowed。

[local-validation.md](local-validation.md)区分SDK3、policy6、入口类型、静态内容和真实浏览器；[完整三目标提案](validation/browser-proposal.txt)由主控接入。DOM数量、原生滚动、真实变高/resize、重复查询清测量/卸载、OS输入法/读屏和SSR hydration未运行前都保持NOT_RUN，正式verification不升级。
