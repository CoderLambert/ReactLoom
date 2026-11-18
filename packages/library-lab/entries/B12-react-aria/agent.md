# B12 React Aria Components 1.21.0

用于需要自定义外观的可访问ComboBox/列表/Popover。Apache-2.0，React19.3宿主；实际peer支持16.8/17/18/19系列，不等于所有组合已验收。没有网络、表单状态库或完整WCAG签收。

三个目标：basic四候选键盘选择→真实FormData key；business按名称/分类过滤、七项含禁用项与可恢复空态；advanced240ms本地异步、查询对齐与代际取消、IME组合期submit guard。素材/数据/CSS本地原创。

实际1.21依赖react-stately3.50：selectedKey/onSelectionChange已deprecated但兼容，value/onChange同时支持。本例保留前者，不能把后者说成不存在；不同时控制两套选择接口。inputValue独立，仅有效项选中同步完整名，null选择通知不写inputValue；编辑后清掉不匹配身份，明确清空按钮/level重置才同时清文本；Escape按SDK revert恢复当前选择名或空串，确认要求enabled且名称完全对应；name=channel默认真实隐藏表单input提交key。

关键边界：

- defaultFilter始终true，应用items承担名称/分类过滤；ListBoxItem稳定id与textValue分离，禁用项SDK+业务确认双重拒绝。
- allowsEmptyCollection显式打开，才能在零候选/查询中观察renderEmptyState；SDK空态占位可有option角色，真实数量看visibleIds。hintId=useId，每实例描述唯一。
- raw input不trim，过滤才trim。advanced忙碌或resolvedQuery不匹配时queryRows返回[]；timer cleanup clearTimeout/abort/generation++一起保留，callback再检查signal/代际。它不是HTTP。
- compositionstart/end维护ref，组合期间submit直接返回。Input局部onKeyDownCapture仅在非组合Escape同步受控文本到SDK revert目标，不preventDefault/stopPropagation、不设open/焦点；SDK继续执行关闭。普通null通知不改查询。无全局键盘/尾随Enter吞键。合成事件guard覆盖不等于OSIME。
- 提交读取真实FormData并和确认id一致；不以中文标签替id或半输入提交旧key。

迁移四文件example/channel-policy/combobox.css/demo，含Popover前缀CSS与窄屏边界，无Lab alias。应用清自己的timer/controller，SDK清Popover/焦点/集合资源；不清全局。SSR静态HTML不是Portal/hydration验收。

观察b12-workshop/state/query-status/submit-status；region“React Aria Components 可访问组合框实战”，combobox“选择 RSS 频道”，展开“显示可选频道”、提交“提交真实表单”、清空“清空选择”。state直读selectedKey/inputValue/visibleIds及busy/resolvedQuery/generation。完整browser源码提案见validation。

精确npm/安装gitHead0a2a7e68e4d896b3ac46c3647fe48fac9ea3ae2e；递归tree246 README候选无中文，目标包英文原文1915B，repo/path/version/lang/date/sha与完整HTTP头在official。官网enforced frame-ancestors self→blocked，非浏览器allowed。

Node SDK2为真实ComboBox SSR，policy4另记；不代替键盘/Portal/真实IME/异步生命周期运行。六项与真实命令日志见local-validation，正式verification全NOT_RUN。
