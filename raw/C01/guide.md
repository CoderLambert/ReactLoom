# React Hook Form：从字段注册到动态订阅表单

一个RSS订阅表单有分组、标题和URL，随后还要支持增删来源、指出哪一行重复、提交时展示业务错误。React Hook Form（RHF）负责输入注册、校验、字段状态和提交协调；你的应用负责URL规则、请求、取消和保存。本例固定 **react-hook-form 7.89.0**，使用真实SDK与本地订阅fixture，没有网络或服务端持久化。

当表单有多个字段、动态行和字段级错误时，RHF能省去手写值与错误同步。只有一个输入时先考虑原生form；需要JSON Schema生成整页时比较JSON Forms。RHF不是鉴权、API client或schema编译器；和Zod组合需要另外接resolver或提交边界校验，本例没有安装resolver。

## 先走通register → errors → handleSubmit

| 入口 | 本表单做什么 | 观察位置 |
| --- | --- | --- |
| `useForm({ defaultValues, mode: 'onBlur' })` | 定义嵌套草稿和校验时机；失焦或提交时按规则检查 | 默认值、字段错误和草稿状态 |
| `register('group', rules)` | 返回name、ref、onChange、onBlur，连接原生input与库 | 输入框的值与分组错误 |
| `formState.errors` | 保存按字段路径组织的错误 | 对应字段文字、aria-invalid、aria-describedby |
| `handleSubmit(onValid, onInvalid)` | 校验通过才调用业务submit；失败走错误回调 | 状态提示、提交尝试次数和成功预览 |
| `reset()` | 恢复本例defaultValues和字段状态 | 一行初始来源，成功预览被应用清除 |

RHF默认走原生输入注册，不要求为每个input再写React的value/onChange。`register`返回的处理器要真正展开到input，不能被另一套onChange悄悄覆盖。第三方受控Select等才考虑Controller，不能对同一字段同时register与Controller。

实际 [example.tsx](examples/example.tsx) 的关键调用如下；完整文件保留IME和异步保护，不应只复制片段就接生产请求。

```tsx
useForm<SubscriptionDraft>({ defaultValues: defaultDraft, mode: 'onBlur' })

<input {...register('group', {
  required: '请输入分组名',
  minLength: { value: 2, message: '最少两个字符' },
})} />
```

字段路径 `sources.0.url` 对应结果中的 `sources[0].url`，不是一个含点号的平面键。完整form使用noValidate，让提交时错误统一交由RHF和可读文字呈现；输入type=url仍保留语义。HTML校验与RHF规则是两个机制，不靠浏览器原生弹窗冒充RHF错误。

本例useWatch订阅整个草稿来展示数据和计算提交指纹，所以输入会使外层示例重新渲染；不要把“非受控注册”理解成整棵React树永远不重渲染。真实大表单可按字段拆分订阅，别在每次键入时做昂贵计算或网络请求。

## 实验一：字段错误和成功的嵌套数据

**操作**：在basic清空“分组名称”后移开焦点，或输入1个字符；将URL改为`http://example.com/rss`并失焦。也可直接点“验证并预览”。

**观察**：分组出现必填/最少两字提示，URL显示只允许无用户名密码的HTTPS完整地址；字段的aria-describedby指向本行错误。字段错误区域预留两行高度，失焦校验显示或移除当前提示时不把提交按钮推离正在点击的位置；没有用pointerdown绕过正常提交。失败时不会出现成功output。修正分组、标题与HTTPS地址后提交，出现“通过校验的本地数据”，包括group和sources数组。

“草稿状态/提交状态/提交次数”来自真实formState；次数包括校验失败的提交尝试，不等于服务端已保存次数。展开“查看草稿与动态行身份”，看到同一useWatch草稿；修改任何字段后，旧成功预览只有在指纹仍与草稿相同才显示。重置恢复默认值并清除预览。

URL规则来自 [feed-url-policy.mjs](examples/feed-url-policy.mjs)：只接受HTTPS且不带用户信息；比较重复时规范化主机和默认443端口、移除fragment，保留path/query大小写。它不解析DNS、重定向或内网IP，不能替代服务端SSRF防护。

## 实验二：动态行的身份与字段路径

**操作**：在business新增两行，分别修改名称/URL；展开草稿与行身份记录field.id，然后删除第一行，再查看剩余值和id。最后让两行指向规范化后相同URL，提交。

**观察**：删除导致剩余行下标前移，但原field.id保持；React复用正确行，不把旧DOM状态串到另一条来源。重复URL错误出现在后出现的重复行，并有分组级提示。重置后回到一个默认来源；reset或重挂可以生成新的field.id，不承诺id是数据库主键。

实际代码用 `useFieldArray({ control, name: 'sources' })` 返回fields/append/remove，渲染key是field.id；注册路径仍是当前的` sources.${index}.url `。一个解决React行身份，一个描述表单值位置，不能互相替代。v7.89.0默认id；当前官网同时提到v8 beta将id改为key，本例不提前迁移。

添加/删除会先取消当前提交，再改变字段数组；不能等旧409回来后仍按提交时的数组下标映射。已存在的[field身份和提交策略](examples/form-policy.mjs)继续保留，不为教学改成下标key。

## 实验三：409、改稿、取消和过期结果

**操作**：在advanced把任意URL改为`https://example.com/duplicate`并提交，等待450ms本地fixture。然后改成正确URL重新提交；也可在450ms窗口内编辑字段、删除来源、点“取消本地提交”或停止卸载。

**观察**：URL文本含`/duplicate`时模拟409，把错误写到具体sources行的url和root.server；这不是发出的HTTP请求。改稿或主动取消后不会回填旧409，也不会用旧值覆盖当前预览。修正后再提交，可以恢复成功预览。字段错误通过setError显式映射，只接受已知路径，不把任意服务端字符串当字段路径。

```text
handleSubmit校验通过
  → 保存输入指纹与generation，创建本次AbortController
  → 等待本地fixture（生产替换成API client）
  → 当前指纹相同 AND generation相同 AND signal未中止？
      是：setError或写成功快照
      否：丢弃整个旧结果
```

`onChangeCapture`及时使活动提交失效；useWatch同时覆盖文本与增删，回填前再读getValues核对当前指纹。Abort只表示取消意图，不能单靠它推断已经到达回包处理的旧结果不会写入；generation区分轮次，指纹区分具体输入。取消请求也不等于服务端事务回滚。

中文IME由现有 [form-policy.mjs](examples/form-policy.mjs) 处理：组合中、native isComposing、keyCode229或compositionend后80ms内的Enter会被拦截，避免选词Enter误提交；不在组合过程中trim输入。80ms是本例策略，Node或脚本派发composition事件不能证明所有真实操作系统IME行为。

## 最小迁移与清理

在现有ReactTypeScript项目中安装`pnpm add react-hook-form@7.89.0`。复制example.tsx、workshop.css、feed-url-policy.mjs、form-policy.mjs及两个.d.mts；保持相对路径。demo.tsx只是Lab重导出。默认组件接收level为basic/business/advanced。

UI卸载时增加generation并中止本组件持有的controller。本地delay在完成/abort时移除监听，abort会清除timer。保存值、反馈、AbortController与动态行身份只归当前表单；未实现localStorage或服务器存储。

迁入真实业务时用项目API client替换delay与冲突fixture，仍保留提交快照+代际+signal校验、增删前失效和卸载清理。远程Query刷新不能无条件reset正在编辑的草稿；先定义脏字段与版本冲突策略。服务端还需schema、授权、幂等和并发控制。取消客户端Promise不保证远端没有写入。

## 运行与验证范围

仓库依赖已固定，正常打开Lab的demo页即可操作。定向Node命令cwd为packages/library-lab：

```sh
node --test entries/C01-react-hook-form/tests/sdk.test.mjs
node --test entries/C01-react-hook-form/tests/form-policy.test.mjs entries/C01-react-hook-form/tests/url-policy.test.mjs
```

SDK套件真实导入RHF：SSR注册field-array字段，以及公开createFormControl的注册校验、有效/无效handleSubmit、setError/clearErrors和reset；它没有调用私有control字段。策略套件只检查URL身份、指纹/代际/abort门禁和IME规则。两者不能证明真实DOM的动态焦点、行身份、IME、450ms取消或错误关联，仍需浏览器对应路径。

本轮命令/退出码/原始输出/六项和未测项见 [local-validation.md](local-validation.md)。正式verification的sdk/build/browser仍NOT_RUN；本地SDK执行与干净提交收据分开，不继承旧Actions结论。

## 官方原文与版本

[官方V7简体中文README](official/readme.md)取自react-hook-form/react-hook-form的固定v7.89.0提交`4722d22fbbafd52b3186e737e62bd530659f1b24`，路径`docs/README.V7.zh-CN.md`。同ref的`docs/README.zh-CN.md`仍展示V6的ref={register}写法，因此没有因文件名更短就误选它；根README和其他翻译候选已实际列目录核对。

原文保持上游字节、署名、图片/链接，不把本地中文教学冒称官方翻译；精确语言/版本/日期/SHA-256在library.json和official/source-evidence.json。[官网](https://react-hook-form.com/)本轮GET200，未见明确跨源嵌入限制头，尚未经Lab origin浏览器确认，所以unknown并保留直达入口。
