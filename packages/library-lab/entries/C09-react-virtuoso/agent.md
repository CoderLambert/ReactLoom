# C09 React Virtuoso — 工程入口

用于变高文章/历史消息流。实际 `react-virtuoso@4.18.19`，MIT，React/DOM peer 接受 19；不运行收费 Message List、TableVirtuoso、Query 或 HTML 净化。contentState=recreated 与原恢复 provenance 保留，不继承旧 PASS。

先读 [guide](guide.md)、[真实入口](examples/example.tsx)、[verification](verification.json)。三个目标：basic 真实一万条窗口/scrollToIndex；business 630条本地筛选、可取消260ms任务、同名搜索新窗口；advanced 同次前插 data/firstItemIndex、业务ID展开与按SDK位置跟随。

迁移五个 sourceFiles：example.tsx、view-policy.mjs/.d.mts、workshop.css、适配再导出的demo.tsx。生产核心无需demo适配。保持 CSS 导入、确定容器高度、内部padding、稳定 article.id。defaultItemHeight 是估计，不能改成 fixedItemHeight 冒充变高测量；rangeChanged 是已渲染区间，可能含缓冲，不是精确可见交集或服务器 cursor。

应用拥有数据/查询/分页/展开Set和本地timer；SDK拥有滚动窗口/测量/监听。搜索先清timer、generation++、pending=false、limit=30，再以新revision重挂窗口；相同query也新revision。追加不重挂。取消/卸载同样使旧任务失效；alive拦迟到回调。SDK ref unobserve所属元素，scroll effect移除所属监听；不要清宿主的全局observer/RAF，不能宣称卸载瞬间全局资源归零。

搜索只在提交后生效。normalizeFeedQuery=NFC+C0/DEL删除+trim+80码点，并不清所有零宽字符；IME合成期间不提交。260ms是应用fixture，没有HTTP/游标/后端错误。换真实接口时保留身份校验，另接AbortSignal/请求错误恢复。高级fixture最多1000条，序号仅作本地生成，不解析真实UUID；firstItemIndex保持正数，前插减量与新增数相同，旧id不变。

精确控件：“跳至第 9001 条”；“文章关键词”“搜索”“加载下一段”“取消本地加载”；“向前加载 10 条”“添加最新消息”“跳至最新消息”。展开按钮名称包含 article-ID。容器 c09-basic/business/advanced；状态 c09-range/load-status/query/empty/history-status；窗口 c09-viewport，真实SDK子容器 data-virtuoso-scroller；行 data-article-id。business data-loading/view-revision、advanced data-at-bottom均为实际应用/SDK状态，不是假结果。

断言：basic目标article-9001进窗口且DOM远小于10000；business取消不增条数、同名搜索旧scroller脱离并回30、React为30/210、无匹配为0/0、离开后新会话revision0；advanced前插30→40/100000→99990且旧行相对位置/展开保持、长文实际高度与SDK已知高度更新、历史追加不跳/贴底追加跟随。完整真实Playwright代码在 [提案](validation/browser-proposal.txt)，不把程序composition事件当OS输入法通过。

固定官方tag解引用commit `324f632f2fc745257cc46c28d1cb952eb7c68464`，包README `packages/react-virtuoso/README.md` 原文9703B，SHA `67bcd5ac56f7697428bdeb2bf6ec5eea7ffbb078a16b5979f123411ff6e559df`；实际树无对应中文候选。npm gitHead缺失保留null，manifest匹配4.18.19。官网重试GET200完整头未提供XFO/CSP，但无实际iframe证明→unknown。详见 official/source-evidence.json。

SDK SSR只证明实际initialItemCount/内容/逻辑下标，policy只证明纯规则。真实滚动、测量、输入法与卸载由浏览器单独验收；formal全部NOT_RUN。未挂载项不在无障碍树，本例未做全文分页入口，不声称完成全量读屏支持。局部命令、失败历史与剩余项见 local-validation.md。
