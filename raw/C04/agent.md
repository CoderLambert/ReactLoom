# C04 JSON Forms 3.8.0

Schema驱动配置页用本库；固定字段精细UX可用RHF，只校验对象用Ajv。core/react/vanilla-renderers均3.8.0，Ajv8.20，MIT、React19.3，React包peer16.12/17/18/19。仅Vanilla，未接Material/i18n/HTTP/用户存储。

三个目标：basic真实Schema控件与onChange/校验草稿；business HIDE与payload白名单；advanced additionalErrors模拟422/409、提交快照/取消/重置/卸载。源码五文件含mjs声明和forms.css，无Lab alias；demo只是出口。

实装React实现将onChange以10ms debounce发core.data/core.errors，初始也通知。data是最近已通知草稿，errors不含additionalErrors；页面计数不是请求数。保存前复验并生成新payload快照，回包不再读取新草稿。只有真实数据变化清服务错误；错误-only通知不得清它。

Vanilla HIDE是hidden wrapper，input/data可以仍存在；toSubscriptionPayload在manual时完全省url，rss分支才保留trim地址。前缀/长度不等于URL合法性；https://长度8、https://a长度9，不能说必被minLength8拦住。二层URL解析拒绝凭据/片段，仍不做DNS/重定向授权，绝不抓取输入地址。

应用owns controller/本地timer、generation、alive、provider epoch；编辑通知/取消/重置/卸载作废旧任务。abortableDelay自己clearTimeout，finally也检查代际。重置key重建本表单，epoch拒绝旧provider晚通知并清旧composition；level创建新Session。SDK owns控件/内部状态；不全局清SDK/放宽CSP。

组合期间提交不增加计数，不改变现有请求资格；协议测试不是真OSIME。服务错误只允许name/url的instancePath，本地fixture不是HTTP或后端补偿。

精确操作：c04-workshop/data-level/data-saving；基本名称“工作区名称”、启用“启用”；业务“订阅名称”“订阅类型”“RSS 地址”“启用订阅”（required会带*，按label前缀）；按钮“保存内存草稿”“取消进行中的操作”“重置”；展开“查看最终 payload”。c04-schema-errors是SDK计数，server-errors/status/request-count分别是服务错误/本地状态/累计模拟提交；c04-payload当前预览、c04-submitted本次快照，c04-notifications包含初始化与校验通知。完整browser提案在validation，root统一运行。

SDK3只真实初始SSR/Ajv，不证明动态表单；pure4只业务规则。正式三项NOT_RUN，日志/六项见local-validation。主原文固定v3.8.0 tag6075bcee…/packages/react/README4592B/hash618f7fb0…，npm gitHead缺失事实保留，官方中文候选/完整头在official。官网XFO SAMEORIGIN+CSP frame-ancestors self→blocked；正文NOT_READ，不冒称iframe运行。
