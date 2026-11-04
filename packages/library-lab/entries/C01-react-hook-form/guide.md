# React Hook Form 7.89.0｜字段身份、提交代际和中文输入

Lab 锁定 `react-hook-form@7.89.0`（MIT），和 SPA 模板同一主版本。不要为了演示升到下一个 major。v7 的动态行用 `useFieldArray` 给出的 `field.id` 做 key。

示例是本地订阅草稿，不访问网络。`delayWithSignal` 和 409 都是 fixture。没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 调用真实的 `useForm`、`useFieldArray`、`useWatch`、`register`、`handleSubmit`、`setError`。

- 草稿形状是 `{ group, sources: [{ name, url }] }`。`mode: 'onBlur'`。
- URL 通过 [`feed-url-policy.mjs`](examples/feed-url-policy.mjs) 的 `canonicalFeedUrl`：只要 HTTPS、不能在 URL 里带用户名或密码。比较重复时主机和默认 443 规范化，path 和 query 保持大小写，fragment 丢掉。这不是服务端 SSRF 防护。
- [`form-policy.mjs`](examples/form-policy.mjs) 的 `fingerprintDraft` 只覆盖分组和源的名字、URL。`canApplySubmitResult` 要求指纹、generation 和未中止三者同时成立。
- `useWatch` 看到增删行和文本变化。指纹一变就 abort 并增加 generation，清掉 `root.server`。
- 回包前再读 `getValues()` 算当前指纹。对不上就不 `setError`、不写入已保存预览。
- 重复 URL：先在客户端用 `findDuplicateFeedIndex` 标到具体行；advanced 把 `https://example.com/duplicate` 当成模拟 409，错误写到 `sources.${index}.url` 和 `root.server`。
- IME：`shouldBlockCompositionEnter` 在合成中、`keyCode === 229`，或合成结束后 80ms 内的 Enter 上返回真。
- 已保存预览只在快照指纹等于当前草稿时显示。
- 卸载时 abort。

没有 Controller 示例，没有服务端 schema，没有付费接口。下面仍写这些取舍，因为它们是迁出去之后最容易写错的地方。

## 1. 什么时候用

多字段、动态行、字段级错误、要和受控组件共存的表单。一个输入框用原生 `<form>`。JSON Schema 驱动的整页生成看别的条目，不要让 RHF 兼任 schema 编译器。

RHF 不管鉴权、幂等和乐观锁。`setError` 是这一次提交的展示，不是数据库。

## 2. 模型

非受控注册是默认路径：`register` 把 DOM 交给库，减少每个按键的 React 渲染。受控 UI（设计系统的 Select、日期）用 `Controller`，**不要和同一字段的 `register` 叠用**。

`useFieldArray` 的 `field.id` 是行的身份。数组下标会在删除中间行之后指向别的数据。

派生值（合计、是否与已保存一致）在渲染时算，不要再存一份会过期的 state。Lab 的 `savedIsCurrent` 就是这样。

提交的生命周期：

```text
handleSubmit
  → 记下指纹和 generation，创建 AbortController
  → 等待（示例里是本地 delay）
  → canApplySubmitResult?
       否：丢弃，包括 409
       是：setError 或 setSaved
```

只 abort 不够。旧请求在 abort 事件之前可能已经读到 body。所以还要核对指纹和代际。

## 3. 三层

### 基本

分组加一行来源。blur 时检查 HTTPS。错误用文本和 `aria-invalid`，不只靠红框。提交成功把当前值放进预览。

### 业务

追加和删除行。key 是 `field.id`。删除后再提交，错误必须落在剩下的那一行，而不是旧下标。`useWatch` 把增删也算进「草稿变了」。

### 进阶

把 URL 改成文档里写的 duplicate 地址，看 409 回填。提交过程中改任一字段，反馈变成「旧提交已取消」。取消和卸载都不能把旧 409 写上来。

中文输入法：组合过程中不要 trim，也不要在那次 Enter 上提交过滤或表单。80ms 窗口是示例策略，不是操作系统规范。目标环境要用真实 IME 再看一次。

## 4. 反例

### 反例 1：同一字段又 register 又 Controller

值会有两份主人。原生输入用 `register`。第三方受控组件才用 `Controller`。

### 反例 2：行 key 用 index

```tsx
{fields.map((field, index) => <fieldset key={index} />)}
```

删除第 0 行会让第 1 行的 DOM 状态串到错误的数据上。用 `field.id`。

### 反例 3：远程数据无条件 reset

Query 刷新时 `reset(serverDraft)` 会抹掉正在编辑的脏字段。先定规则：仅在 `!isDirty` 时 reset，或按版本号询问。Lab 没有这条远程回填。

### 反例 4：订阅整个表单却在每个键上做重活

`useWatch()` 不带 name 会在任意字段变化时更新。可以，但不要在那个渲染里发请求。Lab 只用它做指纹。真正的请求只在 submit。

### 反例 5：await 之后直接 setError

```tsx
const result = await save(getValues())
setError(result.path, { message: result.message })
```

中间用户可能改了 URL 或删了行。先 `canApplySubmitResult`。

### 反例 6：disabled 和清理搞反

提交中禁用按钮，防止双击。卸载仍要 abort。不要用永久 disabled 代替取消。DOM disabled 也不会取消已经发出的 Promise。

### 反例 7：把任意服务器路径传给 setError

只接受你知道的 `sources.${number}.url` 或 `root.server`。不要把接口返回的字符串直接当成路径。

### 反例 8：整段 URL toLowerCase

`/Feed` 和 `/feed` 可能是不同资源。Lab 只规范化主机和默认端口。

### 反例 9：把客户端 URL 策略当成 SSRF 防护

`canonicalFeedUrl` 不解析 DNS，不看重定向，不看内网 IP。抓取在服务端另做。

## 5. 组合

**Zod**：在提交边界 `safeParse`。RHF 的 resolver 可以接 Zod，但本示例没有装 resolver。字段组件不要再写一套矛盾的正则。

**Query**：mutation 的 key 包含分组和规范化后的 URL。409 映射到 `setError`。缓存不是表单草稿。

**MSW**：用 200 和 409 两种 handler。断言取消后 UI 不出现旧的字段错误。MSW 通过不等于 RHF 的代际逻辑通过，两边都要有。

## 6. 可访问性

每个输入有 label。错误关联到字段。`root.server` 用可读区域，不要只弹一个消失的 toast。动态行的添加按钮有名字。提交中的禁用状态要能被读到。

## 7. 练习

1. 删除中间一行再触发重复 URL，确认错误下标是新的。
2. 提交后立刻改 URL，409 fixture 不能出现。
3. 用中文输入法在名称里按 Enter，表单不提交；组合结束后短时间内的 Enter 也不提交。
4. 接上真实 mutation 时保持 abort + 指纹 + generation。不要把 `delayWithSignal` 复制进生产。

## 8. 证据

`url-policy` 和 `form-policy` 的单测不渲染 RHF。`tests/sdk.test.mjs` 若 import 了真实的 `react-hook-form`，也要实际跑过并留下收据才是 sdk PASS。

## 9. 资料

- https://react-hook-form.com/docs/usefieldarray
- https://react-hook-form.com/docs/useform/seterror
- https://react-hook-form.com/docs/useform/reset
- https://react-hook-form.com/docs/useform/watch
