# C21 实装源码与样式前提审计

19文件的实际路径/字节/SHA见sdk-source-audit.json：tailwind-merge包/公开类型/实现、clsx实现、真实Tailwind与Vite插件manifest及Lab CSS/Vite接线。它是只读源码核对，不是新增SDK/浏览器结果。

- 目标实装3.7.0/clsx2.1.1，均MIT。tailwind-merge package exports稳定入口包含twMerge/twJoin/getDefaultConfig/extendTailwindMerge；本例未用unstable-do-not-import或从内部parser偷建逐token诊断API。
- merge-classlist.ts从后向前，parseClassName给modifier/important/base类，class group识别成功后用组合ID记录冲突组；未识别直接保留。相同未知类重复不保证去重。删除的是已识别配置冲突，不是按字符串相似或完整CSS cascade计算。
- default-config.ts真实px冲突包含pr/pl/ps/pe，pr没有反向px边，因而px-3 pr-4与pr-4 px-3不同。UI展示公开getDefaultConfig中p/px/pr摘录，SDK测试直接比真实配置，非猜测token group。
- parse-class-name.ts区分方括号/括号深度、modifier与后置important，保留legacy前置important支持；sort-modifiers.ts只排序普通modifier片段，遇任意variant/orderSensitive分段。未声称所有variant可交换。
- 默认color规则可接受部分项目自定义名字，真实bg-brand/bg-accent合并；未知c21-pad默认保留。认识group不保证项目CSS存在，不笼统“所有custom token不支持”。
- extend-tailwind-merge.ts通过getDefaultConfig+mergeConfigs创建扩展；本例模块级扩展classGroups.px两完整自有类名。styles.css实际padding-inline和px语义一致，不额外手写class合并结果。
- create-tailwind-merge.ts首次调用才初始化configUtils/cache，之后同配置缓存输入字符串。本例模块级twMerge/扩展，不每render创建。无监听/timer/Worker/请求/可变SDK实例需destroy；未清全局缓存。
- cn保留clsx→twMerge，模型把基础、条件变体、调用者按顺序送真实SDK。twJoin仅字符串/数组真值连接，不能替代clsx对象条件API。
- Lab当前src/styles.css首行@import tailwindcss，vite.config.ts实际使用@tailwindcss/vite4.3.3；Tailwind包4.3.3匹配官方支持4.0–4.3。预设literal token与两自有CSS类是实际DOM样式前提；未给未知动态token手写计算样式伪造Tailwind通过。

SDK5为真实目标包+同源模型，不另有policy-only套件。新增调用者预设只使推荐覆盖的完整token随迁移源可被CSS扫描，不改已测merge逻辑；后续格式无语义变化。浏览器提案严格检查实际className/已加载padding、背景/hover/断点以及custom类和重置/卸载；作者当前未执行其真实browser。
