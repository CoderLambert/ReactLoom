# B19 Embla Carousel 非作者独立复核

quality_e11，2026-11-10。实际cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，共享HEAD1218066e706a90ba03fac8dff8c9b843dd2429c4。只写本报告，不改产品或公共文件，不重跑有效policy/type/lint。已读全部条目材料/源码/规则、官方原文/完整头/已有日志及公共quality-remediation-embla.spec.ts，对照实际安装wrapper/core8.6.0源码。

结论：确认一个P2，已由作者静态修正；未确认其它P1/P2。修正后真实运行尚待主控candidate14。不能将下述静态核对当浏览器闭环。

## 六项结论

| 维度 | 状态 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（静态/已有类型），P2已静态修正 | wrapper与核心/reactive-utils均8.6.0；watchSlides:false、手动提交后reInit、默认RO、getter、loop不足回退、jump和hook destroy均匹配。48%+3%旧组合不能保证snap合并，现gap2%对应算法目标，真实RO仍待验。 |
| 解释清楚 | PASS（静态） | 两目标去掉重复，区分slide索引/snap索引/业务ID；应用键盘增强和SDK能力、loop请求与实际结果、getter快照与持续状态清楚。 |
| Demo有用 | NOT_RUN（真实浏览器） | 真DOM测量、拖动、宽度控制、动态卡片/循环和清理均有实现/公共三case；没有把规则5项当轮播引擎验收。 |
| 源码可迁移 | PASS（静态/已有类型） | 三源包含必要内联样式、显式border-box和minWidth0；无Lab alias/外部资产/传递包直导；useId标签、单调ID、订阅和媒体监听所有权清楚。 |
| 官方来源可靠 | PASS | 固定npm gitHead和manifest8.6.0；13872B原文hash独立重算匹配，完整14候选无中文，官网真实完整200头无XFO/CSP，unknown正确。 |
| 结果可复核 | NOT_RUN（整体客户端运行） | 既有policy5/类型/最终lint/metadata0日志可复用；首轮ARIA告警保留。formal三项NOT_RUN；candidate14真实引擎结果由主控另记。 |

## P2：48%卡片与3%间距不一定产生更少snap

原 `examples/example.tsx:200` marginRight3%，48%卡片形成约51%步距。匹配core8.6 ScrollContain/SlideSizes把末尾margin纳入contentSize：四卡内部snap约0/-51/-102/-104（以viewport百分比示意），末两个仍不相同，可能仍四个snap；并非只要一屏多卡就自动合并。原guide的合并目标和公共测试snap<4缺少对应布局依据。

作者已将唯一gap改为2%，保持48%控件及原<4验收期望，未放宽断言。约50%步距在非loop/trimSnaps下使末两位置达到同边界，静态算法目标合理。此报告已只读确认source实际为2%。修正后是否经真实ResizeObserver得三snap，必须由candidate14浏览器观察，未使用fake layout/core替身证明。

## 其它重点核对

- `example.tsx:79–112`：相同sync读实际selectedScrollSnap/scrollSnapList/canScroll，select/reInit成对on/off；React控制slide ID签名与reset代数后一个effect reInit，不再并行启用MutationObserver处理相同数据变化。watchResize未关闭，真实CSS尺寸变化仍由SDK RO重新测量。
- 实装hook保存options，拥有创建API及destroy cleanup。应用不二次destroy。destroy观察器只在SDK真实事件发生时标记旧viewport，捕获element而非在cleanup读已清空ref，随后off。core destroy先清拖拽/事件/RO/动画等，再emit destroy；静态可支撑观察标记的真实性，实际回调时序仍待browser。
- core createEngine在loop:true但slideLooper.canLoop失败时递归创建loop:false引擎；没有把配置请求写成始终循环。单卡不可滚动需读实际API，reset会reInit后jump首snap，数组已是默认时reset代数仍有效。
- allocateSlideId结合lastAllocated与当前max，删除/恢复不回退已分配ID，最多24/至少1；快速操作可跳过ID但不复用。reading取实际slideNodes dataset与其它getter，trackWidth是实际clientWidth，不冒充总内容滚动宽度。
- ARIA外层命名section包括卡片与全部控件，slide是有序名称group；viewport局部箭头只在event.target===currentTarget时处理，不劫持子按钮。自有media change成对清理，按钮/局部键盘使用jump；未宣称手动物理拖动全程零动画或WCAG通过。

## 官方与剩余

实际原文13872B，重算SHA-256 `d7b2b1227204396e7900e4f951df7a59c2266b565040927de74d86184f9998d0`，与library/source-audit一致。精确commit `0fe65834136f1aa35e4c1a4a477e5ccb4bb5ee54`，path packages/embla-carousel-react/README.md，npm与固定manifest均8.6.0、依赖core/utils精确8.6.0。未截断tree14 README候选没有官方中文。官网https://www.embla-carousel.com真实GET200完整头未见XFO/CSP；未做Lab-origin iframe故unknown，不把raw/GitHub限制头混作官网头。

复用已有有效日志，未重跑。真实48% RO合并、可信pointer/transform、循环跨边界与单卡回退、动态ID/恢复/24上限、局部键盘/实时减动jump、窄屏RO和hook destroy标记/重挂仍NOT_RUN。读屏、硬件触控、SSR hydration和性能也未验收。P2静态修正等待主控真实候选闭环，formal sdk/build/browser保持NOT_RUN。
