# JSON Forms 3.8.0｜Schema 画表单，payload 另写

Lab 锁定 `@jsonforms/core@3.8.0`、`@jsonforms/react@3.8.0`、`@jsonforms/vanilla-renderers@3.8.0`，校验侧是 `ajv@8.20.0`（均为 MIT）。三个包必须同一版本。JSON Forms 把 JSON Schema 和 UI Schema 画成控件。它不决定最终 POST 的白名单，也不做鉴权。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 渲染真实 `<JsonForms>`，渲染器是 `vanillaRenderers` 和 `vanillaCells`。没有 Material 套件，没有 `src/App.tsx`。三个 level 都在这个文件里。

- **basic**：只有 `name` 和 `enabled`。`additionalProperties: false`。`onChange` 用 JSON 字符串比较，数据没变就不 `setState`。状态行报告 Schema 错误数。
- **business / advanced**：`subscriptionSchema` 在 [`submission-policy.mjs`](examples/submission-policy.mjs)。`feedType` 为 `rss` 时 `if/then` 要求 `url` 匹配 `^https://`。UI Schema 在 `manual` 时 `HIDE` url。提交走 `toSubscriptionPayload`：manual 分支丢掉 url，rss 分支保留 trim 后的 url。
- **advanced**：`abortableDelay` 500ms（business 160ms）。名称 `duplicate`（忽略大小写）模拟 409，`toServerError('name', …)` 放进 `additionalErrors`。`validateSubmission` 再拒绝用户名、密码和 fragment。草稿一变就增加 generation、abort，并清掉服务端错误。`onCompositionStart/End` 包住整段表单，组合中提交被拒绝。卸载时 abort 并作废 generation。

研究笔记里的 `rankWith` 自定义 range、Redux 集成、远程 schema 和 TanStack Query 都没有挂载。

## 什么时候用

字段随类型变化、三端要共享同一份 JSON Schema 的配置页。固定的登录框用 React Hook Form 更直接。只校验 HTTP 体、不画 UI 时用 Ajv 或 Zod，不必拉渲染器。

JSON Forms 的 `onChange` 在初始化时就会来一次。那是校验回调，不是保存。

## 数据与模型

三份东西不要混：

| 对象 | 谁拥有 | 失败时怎样 |
| --- | --- | --- |
| Schema | 可信的应用代码 | `if/then` 约束 rss 必填 |
| UI Schema | 可见性 | `HIDE` 不删除 data |
| payload | `toSubscriptionPayload` | manual 不含 url |
| 服务端错误 | `additionalErrors` | Ajv `ErrorObject`，`instancePath` 只能是 `/name` 或 `/url` |

`validationMode="ValidateAndShow"` 管的是 Schema 错误。官方行为是：`additionalErrors` 即使在别的校验模式下仍会显示。清掉它们要靠数据真的变了，而不是每次 `onChange`。

Lab 的 `onDataChange` 先比较 `JSON.stringify`。只有 data 变了才 abort、加 generation、清空服务端错误。仅 errors 数组变化时只更新错误计数。这避免「把 additionalErrors 设回去又触发 onChange，再把错误清掉」的循环。

`toServerError` 对未知字段抛 `TypeError`。不要把接口返回的任意字符串塞进 `instancePath`。

Schema 的 `pattern: '^https://'` 挡不住 `https://user:pass@host`。`validateSubmission` 用 `URL` 再看 protocol、hostname、username、password、hash。它仍然不解析 DNS。

## 三层示例

### 基本

改短名称，错误数增加，预览 JSON 跟着变。不要在 `onChange` 里 POST。Vanilla 控件负责 label。空布局时先看 `renderers` 和 `cells` 是否传入，以及 core / react / vanilla 是不是都锁在 3.8.0。

### 业务

切到 `manual`，地址框隐藏，点开「查看最终 payload」应没有 `url`。再切回 `rss`，地址还在 data 里，因为 HIDE 没有删它；payload 函数会再带上。把地址改成 `http://` 或短于 8 个字符，Schema 应失败，保存按钮在 `errors > 0` 时禁用。

把地址写成 `https://user:password@example.org/feed`。Schema 的前缀正则可能通过，`validateSubmission` 必须拒绝，并回填 `/url`。

### 进阶

名称改成 `duplicate`，约 500ms 后状态出现 409，名称字段带 `additionalErrors`。保存过程中改任意字段，或点取消、重置：generation 变化，旧延迟不能把成功或 409 写回来。组合输入期间点保存，状态是「请先完成中文输入法选词」，且不会发出那次延迟。

这是内存 fixture。生产写入要有幂等键或 revision。abort 只停止客户端回写，停不了已经到达服务器的请求。

## 反例

### 1. 以为 HIDE 会删数据

```tsx
rule: { effect: 'HIDE', condition: { scope: '#/properties/feedType', schema: { const: 'manual' } } }
```

控件没了，`data.url` 还在。提交必须走 `toSubscriptionPayload`。只靠 UI 做必填也不够，Schema 要有 `if/then`。

### 2. onChange 里直接保存

初始化就会进 `onChange`。保存只放在按钮上。草稿变化用来作废旧请求，不用来发新请求。

### 3. 每轮渲染新建 additionalErrors

```tsx
<JsonForms additionalErrors={[{ instancePath: '/name', message: '冲突' }]} />
```

新数组会让内部状态反复重置。放进 `useState`，只在数据变化时清空。

### 4. 用 NoValidation 指望藏起 409

服务端错误和 Schema 模式是两条通道。要藏 409，得自己把 `serverErrors` 设成空数组，并说明为什么用户可以忽略它。

### 5. 自定义控件不调用 handleChange

研究笔记的 range 控件不在本 Demo。若以后写 `rankWith`，必须 `handleChange(path, Number(value))`。字符串塞进 `integer` 字段会在 Schema 上失败，界面却像已经改过。

### 6. 组合期间 trim 并写回

`onChange` 里 `name.trim()` 再塞回 data，拼音会被截断。Lab 在提交函数里才拒绝组合态，trim 发生在 `toSubscriptionPayload`。

### 7. 取消等于没保存

```tsx
controller.abort()
setStatus('未保存')
```

若请求已经在服务端落库，这句话是假的。客户端只保证旧响应不回写。写入靠服务端 CAS。

### 8. 编译租户随手贴来的 Schema

远程 `$ref`、深层 `oneOf` 和恶意 `pattern` 能拖垮 Ajv。Lab 的 schema 是源码常量。用户自定义表单要先审核版本、深度和体积，渲染器列表固定。

### 9. 把 Vanilla 和 Material 叠在一起

本条目只装了 vanilla。再加 Material 会带上另一套 peer 和样式。设计系统只有一个主人。

## 组合

**Ajv。** JSON Forms 内部已经在用 Ajv。跨字段和「无凭据 HTTPS」仍要写在 Schema 和 `validateSubmission` 两边。不要为了同一份订阅配置再装一套会漂移的 Zod，除非 Zod 是另一条 TypeScript 边界并有契约测试。

**React Hook Form。** 字段固定、要管脏状态和中文输入时，RHF 更合适。JSON Forms 适合 Schema 会变的配置页。不要两套同时拥有同一个 `name`。

**Query。** mutation key 带订阅 id 和 revision。409 写成 `additionalErrors`，503 写成 `role="status"` 的可用性消息，不要伪装成 `minLength`。缓存不是草稿。用户正在编辑时，refetch 不能 `setData`。

## 生产清单

- core、react、vanilla-renderers 锁定同一 3.8.0。
- schema、uischema、renderers 放模块顶层。
- 提交 payload 白名单，和 HIDE 规则分开测。
- 服务端错误只接受已知 `instancePath`。
- 保存中禁用提交，卸载和编辑都 abort 并增加 generation。回包前比较 generation。
- 每个控件能被读到名字。错误不要只靠颜色。Lab 的状态使用 `role="status"`。
- 严格 CSP 下 Ajv 编译可能要 `unsafe-eval`。需要禁止 eval 时改为服务端校验或 Ajv standalone，不要为了这个表单放宽整站 CSP。
- SSR 把编辑器标成 client component。本 Demo 没有水合证据。

## 升级

v2.5 之后官方推荐独立状态，而不是必须套 React-Redux。旧教程里的 store 绑定不要抄进来。升级 minor 时三个包一起动，并回归 HIDE、`if/then`、`additionalErrors` 和初始化 `onChange`。

保存按钮在 Schema 错误数大于 0 时禁用。这只挡住这一次点击，挡不住已经发出的延迟。所以 advanced 仍要 generation。名称 `duplicate` 的大小写不敏感，是 fixture 的约定，不是通用的唯一索引。服务端冲突仍可能发生在 Schema 完全合法的 payload 上，所以 409 必须能回填到 `/name`，而不是只改状态行。

`toServerError` 抛错的字段不能进 `additionalErrors`。若接口返回了第三个字段，先映射到已知字段或放进 `role="status"` 的总述，不要把任意 `instancePath` 交给 JSON Forms。

## 练习

1. 加 `delivery: email | webhook`。UI 用 SHOW/HIDE，Schema 用 `if/then`。email 模式的 payload 不得带 webhook URL。
2. 两个快速保存：先把名称改成 `duplicate`，在 500ms 内改回合法名称。界面不能留下 409。
3. 组合中文名称时按保存，请求计数不增加。
4. 用固定字段把 basic 重写成 RHF。比较错误回填和 IME，不要编造耗时数字。

## 故障排查

| 现象 | 先看 |
| --- | --- |
| 控件是空的 | `renderers` 和 `cells` 是否传入，三个包是否都是 3.8.0 |
| 一打开就保存 | `onChange` 被当成了提交。初始化回调一定会出现 |
| 切到 manual 后请求里还有 url | 只写了 HIDE，没有走 `toSubscriptionPayload` |
| 409 闪一下就没了 | `additionalErrors` 在每次渲染新建，或数据没变也被清空 |
| 取消后仍显示成功 | 只调用了 abort，回包没有比较 generation |
| 中文拼音被截断 | `onChange` 里 trim 并写回 data |
| 地址带用户名仍能过 Schema | `^https://` 不管 userinfo，要靠 `validateSubmission` |

Vanilla 和 Material 不要叠用。自定义控件若不 `handleChange(path, value)`，界面动了 data 不会动。数字字段要传 number，不要把范围条的字符串留在 integer 上。本 Demo 没有这颗自定义控件。

租户贴来的 Schema 先限制深度、体积和远程 `$ref`。Ajv 在浏览器里编译可能触及 CSP 的 eval。需要禁止 eval 时把校验放到服务端或 standalone 产物，而不是放宽整站策略。

## 官方链接

- https://jsonforms.io/docs/integrations/react/
- https://jsonforms.io/docs/validation/
- https://jsonforms.io/docs/i18n/
- https://github.com/eclipsesource/jsonforms

basic 的 schema 没有 url。不要把 business 的 `if/then` 复制到 basic 再抱怨没有地址框。两个 level 的 schema 是故意分开的。重置会 abort、增加 generation，并把 data 和 ref 一起设回 `initial`。只清 state 不清 ref，下一次提交会把旧草稿送出去。

`validationMode` 用 `ValidateAndShow`，错误数来自 `onChange` 的 `errors` 长度。这个数字不是 `additionalErrors`。状态行把两者分开写。把 409 算进 Schema 错误数，会在名称改回合法值之前一直禁用保存，即使用户已经改对了别的字段。Lab 只在 Schema 错误大于 0 时禁用按钮，409 仍显示在字段上，允许再次提交。

## 证据

`submission-policy` 单测不挂载 JSON Forms。sdk 要真实 import `@jsonforms/react@3.8.0` 并在 `docs/library-lab/evidence/runs/` 留下收据。浏览器还要看 HIDE、409 回填和取消。build 单独计。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C04 的条目 PASS。不要改 `verification.json`。
