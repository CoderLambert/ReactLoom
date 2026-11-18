# B11 Radix DropdownMenu 工程入口

固定@radix-ui/react-dropdown-menu2.1.25，MIT，实际peer支持React16.8/17/18/19，宿主19.3.0。仅DropdownMenu，不添加Dialog/AlertDialog/统一radix-ui包。自有皮肤+操作菜单用此条目，整套后台或简单select另选。

三个目标：basic单button asChild/真实选择/回焦/typeahead；business真实Checkbox/Radio受控置顶排序且保持菜单；advanced双Portal子菜单筛选、锁定双重guard、当前可见集合内选择回落与空态恢复。

迁移example.tsx、feed-policy.ts、dropdown.css，demo仅适配。保留Root open/onOpenChange、Trigger asChild原生button、两层Portal、data-highlighted/data-disabled样式和可用高度滚动。Portal不继承工作区祖先CSS，命名空间类必须保留。

Checkbox与Radio的onSelect均preventDefault，当前Menu内部仍触发onCheckedChange/onValueChange；不把默认Radio行为写成不关闭。业务ID稳定，visible先scope再pins/排序/id并列；chooseVisibleFeedId只从同一visible集合选，删除不能回落隐藏行。无结果selected=''且业务菜单项禁用。恢复演示重置数据/选择/置顶/排序/筛选，锁定保留。

菜单负责键盘/ARIA/typeahead/回焦。textValue=details/rename提供D/R定位别名，R不是全局命令。无额外document keydown、timer、请求。默认modal菜单自己的层/焦点归SDK，离开只卸载自己子树，不全局清理。Trigger始终存在，未实现删除触发器的焦点回退。

锁定仅本地fixture，disabled+removeCurrent/deleteFeed双重拒绝，不能当服务端权限。查看详情只把实际字段写HTML，重命名只改标题/id不变，无窗口/HTTP/异步确认/IME/拖放/持久化。

定位b11-workshop data-open/scope/sort/selected/count/visible/order；b11-trigger、b11-feeds内button[data-feed-id]、b11-selected/status。menu沿用SDK aria-labelledby：主menu名更多操作，子menu名更多筛选；控件更多操作、收藏置顶、最新优先/热度优先、更多筛选、只看未读/有收藏的频道、显示全部频道、删除当前订阅、锁定删除权限、恢复演示数据。

真实SDK2为SSR/静态语义（第二项public forceMount inline无Portal），policy6仅数组，不能替代键盘/Portal/焦点。完整browser提案在validation，正式verification全NOT_RUN。

无精确scoped tag/gitHead；npm公开SLSA provenance映射stable commit8f50071238d5d58bacf11910bf04a51c517c6299，固定目标package.json2.1.25复核，签名加密验证NOT_RUN。目标官方原README106B/完整树无中文，hash/path/lang/time见source-audit。官网200全头无XFO/CSP但iframe未测unknown。详细证据/六项/边界见local-validation。
