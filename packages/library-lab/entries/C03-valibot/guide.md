# Valibot：从未知JSON到可用RSS配置

用户导入RSS配置时，TypeScript接口不能保证这次JSON真的符合合同。Valibot把schema、校验action和转换排成pipeline，成功后得到输出，失败时得到可定位的issue。适合手写TypeScript合同、希望按函数组合规则的项目；已有Zod合同先评估迁移收益，外部JSON Schema才是唯一合同则看C05。没有测量本项目体积，不能用宣传数字替代选型证据。

固定 **valibot1.4.2**，MIT，实际TypeScript peer>=5，宿主TS7.0.2。Valibot本身与React无关；React19.3仅负责本例编辑器。没有接口、URL抓取、resolver或async schema，所有数据为本地示例。

## 三个层次不能混淆

```text
JSON文本 → JSON.parse得到unknown
   → safeParse(实际Schema,input,{abortEarly:false})
      → success=true：只使用output
      → success=false：getDotPath(issue) + message
```

JSON语法错误还没有进入Valibot；类型/业务错误才是schema结果。编辑文本仅清掉旧结果，不在onChange里trim或重写草稿。schema在schemas.ts模块顶层，UI与SDK测试导入同一份，不维护另一个相似验证器。

```ts
const Name = v.pipe(v.string(), v.trim(), v.minLength(2, '名称至少2个字符'));
type Input = v.InferInput<typeof Name>;
type Output = v.InferOutput<typeof Name>;
const outcome = v.safeParse(Name, unknownValue, {abortEarly:false});
```

pipe有顺序：先trim再测长度。InferInput/InferOutput描述类型，不会自动验证未知值。safeParse返回判别结果而不抛schema校验异常；parse是抛错式边界。这里的同步调用不能承接async动作，迁移异步规则要另用safeParseAsync并管理外部请求取消。

## 目标一：看见输出与字段错误

打开“输入、输出与字段错误”，点“运行 safeParse”。名称前后空格在output里被trim，额外extra键被普通object丢掉。URL保持输入值，分类只允许tech/business；输出来自真实outcome.output，不把原始input当成已验证数据。

FeedSchema的URL先v.url验证格式，再调用canonicalHttpsFeedUrl作**布尔检查**：helper先trim外围空白，再拒非HTTPS、凭据和剩余地址中的控制字符。helper可以返回规范化地址，但本schema没有接transform，因此输出URL仍保留路径大小写/fragment；不能把“检查时去掉fragment”误写成输出已规范化。它允许本地IP等HTTPS形状，不是出站白名单、DNS/重定向或SSRF防护。

点“载入字段错误”再运行，name、url、category均有真实问题，表格按路径和中文消息显示。把文本改成无效JSON会得到独立语法失败，不显示旧schema问题；“恢复示例”只载入，不假装已经校验，需再点运行。

普通object去未知键是当前演示的合同，不等于权限校验。需要拒绝拼错/未知配置键时可改strictObject，需要保留未知键时才考虑looseObject，并重测输出；本例没有挂载这两种模式。

## 目标二：批量合同与嵌套路径

business复用同一个FeedSchema，owner trim后至少2字符；feeds必须1–3条。这个小上限是本例业务约束，不是完整输入字节/深度保护。

点“载入批量错误”后运行，owner和第二条URL分别定位为owner、feeds.1.url；0为首条下标。abortEarly:false收集多条issue，而不是把整批压成一句“数组错误”。“载入超量批次”产生feeds集合上限错误；feeds=[]则违反最少一条。

```ts
const BatchSchema = v.object({
  feeds: v.pipe(v.array(FeedSchema), v.minLength(1), v.maxLength(3)),
  owner: v.pipe(v.string(), v.trim(), v.minLength(2)),
});
```

修正后再次验证，只有成功output可交给后续业务。页面不发送/保存导入，schema也不负责唯一索引、授权或网络事务。不要在日志里序列化整个issue，它携带原始input；本例仅向界面取getDotPath和message，不写持久日志。

## 目标三：真实公历与跨字段位置

advanced默认开始11月5日、结束11月2日，点运行应在end显示“结束日期不能早于开始日期”。规则组合为partialCheck选start/end，再forward把问题放到end，便于业务表单定位。

```ts
v.forward(v.partialCheck([['start'], ['end']], values => {
  if (!isRealCivilDate(values.start) || !isRealCivilDate(values.end)) return true;
  return values.start <= values.end;
}, '结束日期不能早于开始日期'), ['end']);
```

两端都先过isoDate和同一isRealCivilDate。官方isoDate只校验字符串格式，不能排除2月30日；本例原来end只过格式，已补齐真实公历检查。公历helper按闰世纪规则判断，拒0000年，不借Date.UTC对0–99年的1900偏移。顺序动作在日期自身无效时不追加误导性的顺序问题。

“载入非法结束日”展示end的公历错误；“载入联合错误”让独立note为number，同时日期倒置，note和end应一起出现。partialCheck可以在选中部分可按类型读取时执行，不要求无关字段都typed；完整对象check在dataset未typed时可能不运行。SDK共享合同测试验证了此处的实际行为。

“载入合法区间”用2024闰日到3月1日，验证成功。纯日期字符串是日历日，格式固定且真实时才可按字典序比较；没有时区、timestamp或跨时区计算。

## 迁移与所有权

复制六个sourceFiles：example.tsx、schemas.ts、boundary-policy.mjs、boundary-policy.d.mts、styles.css和demo.tsx（仅重导出）。保留boundary声明；类型引用mjs实现不会丢。CSS只管本例原生textarea/按钮/问题表/焦点与换行，无Lab alias或外部资源。

应用只有同步React state与场景切换effect，没有timer、监听、Worker、请求或存储可释放；卸载由React丢弃本例状态。textarea useId每实例独立，输入改变立即标记需重验并清旧issue，不把过期PASS显示成新数据已通过。错误详情和输出有可见文字，不只依赖颜色。

迁入服务器/缓存边界应同样验证unknown，并对字节、深度、条数和权限另设规则。输入文本不是InferOutput；异步动作、RHF错误焦点、服务端状态和持久化均未接入，不从这些示例推断生产安全闭环。

## 官方原文与验收边界

安装版本为1.4.2；npm gitHead与官方v1.4.2共同指向 [`0dc26ea8`](https://github.com/open-circle/valibot/blob/0dc26ea88cf07a414653375f0da43f97e0eed607/library/README.md)，当前官方repo为open-circle/valibot。完整未截断tree八个README候选无中文，优先目标library/README.md英文原文5343B，保留原始bytes；来源/version/lang/date/sha与六个实际HTTP请求完整头见official和library元数据。

官网此次GET200，完整头未见XFO/CSP；未从真实Lab origin验证iframe，保持unknown与直达，不能从200推定allowed。

本地SDK6包含实际共享Feed/Batch/Window合同；纯helper policy2另记。日历缺口红日志真实exit1已保留，修正后SDK全通过，但这不是客户端输入/ARIA/移动端验收。完整三case真实Playwright提案见validation/browser-proposal.txt，主控统一运行；formal全NOT_RUN，六项/命令/未测见local-validation.md。

迁移时保留 textarea 的局部 `box-sizing: border-box`，让100%宽度包括 padding 和 border，避免依赖宿主全局reset。
