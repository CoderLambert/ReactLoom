# C01 React Hook Form — 选型与迁移

固定react-hook-form7.89.0/MIT。适合原生多字段、动态行、字段级业务错误；一个输入先用原生form。RHF管理字段注册、校验/错误与提交，不是HTTP、鉴权或schema编译器。先读library→guide→example真实源码→verification→local-validation。

## 先理解最小路径

useForm(defaultValues,onBlur)→register返回name/ref/onChange/onBlur→formState.errors→handleSubmit校验后才调用submit。noValidate让提交错误由RHF统一展示；type=url保留语义。错误文字与aria-invalid/aria-describedby对应。保留group/name/url稳定错误槽，避免onBlur移除错误段导致提交按钮在pointerdown/up之间移动；不能改成pointerdown提交或强制点击掩盖。useWatch检查区是同份草稿；本例整表订阅会重渲染，不承诺每键零渲染。

basic教注册/失焦错误/嵌套结果；business教useFieldArray稳定field.id与当前索引路径、重复URL；advanced教本地450ms/409、取消与过期回包。三个原场景和旧按钮/唯一成功output保留，没有额外第四demo。

## 迁移所需

复制examples/example.tsx、workshop.css、feed-url-policy.mjs、form-policy.mjs和两个.d.mts，保持相对路径。demo.tsx仅Lab适配。固定官方7.89.0依赖；不引入v8 beta的fields.key。只有同一字段需要第三方受控组件时用Controller，不和register叠加。

本地delay/409是fixture，不访问网络；生产用项目API client替换。默认草稿只在组件内存，不假称服务器已保存；远程数据刷新不无条件reset脏表单。

## 不可删的原保护

- useFieldArray的field.id作为React key，索引只用于sources.${index}.url路径；删除前失效活动提交。reset/重挂可产生新id。
- 提交保留输入指纹、generation和AbortController；回填前调用canApplySubmitResult并用getValues重新核对。指纹+代际+未中止必须都满足，不能只abort。
- 文本变化、增删、重置和卸载不能留下旧409/预览回包；delay完成或abort移除监听，abort清timer，卸载增加generation并abort。
- IME Enter保留composing/isComposing/keyCode229/compositionend后80ms判断；不在选词期间trim；这是本例策略，不是所有系统IME承诺。
- 只映射白名单字段路径和root.server。canonicalFeedUrl保留path/query大小写、移除fragment并规范化host/default443；不是SSRF防护。

## 定向验证

SDK tests/sdk.test.mjs真实导入RHF（SSR hooks+公开createFormControl注册/handleSubmit/字段错误/reset）；策略套件form-policy/url-policy不算SDK。当前DOM交互另等主控browser，旧@C01 p0的添加/提交/reset语义保持。新检查区testid=c01-form-state/c01-draft-json/c01-row-identities；fieldset c01-source-row附data-field-id，name/url错误id含同field.id。

不能用Node SSR证明DOM行复用/焦点/IME/延迟取消。真实服务端schema、鉴权、幂等、并发和取消是否回滚均未实现。没有正式收据不写verification PASS。

## 官方来源

采用官方V7简体README docs/README.V7.zh-CN.md@4722d22fbbafd52b3186e737e62bd530659f1b24，版本v7.89.0。较短README.zh-CN仍是V6代码，不可误迁移。official/readme.md保持原始字节，tag、候选、完整响应和摘要见official/source-evidence.json。官网GET200但未验证Lab origin嵌入，状态unknown。
