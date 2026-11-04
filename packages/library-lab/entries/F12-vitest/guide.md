# Vitest 5.0.5｜夹具里的 URL、状态码和代际

Lab 锁定 `vitest@5.0.5`（MIT）。它已经在锁文件里，不需要再执行一次「把 Vitest 加进依赖」。页面仍然只展示命令。跑过命令之后，还要有 `docs/library-lab/evidence/runs/` 收据，verification 里的 sdk 才能离开 NOT_RUN。

执行种类是 `node-ci`。网页不启动 Vitest，也不挂载终端。`vi.fn` 返回的 `Response` 是注入的替身，不是连上了后端。

Actions 41779873259 跑过仓库的安装、类型检查、生产构建、52 个 SDK 文件共 153 项测试和 45 项 Playwright。那不是这三份 `examples/*.test.ts` 的 PASS，也不要把它抄进 F12。

## Lab 当前示例

| 文件 | 作用 |
| --- | --- |
| `examples/domain.ts` | 业务函数，不 import Vitest，方便拿到产品代码里 |
| `examples/basic.test.ts` | `it.each`：HTTPS 规范化与拒绝 |
| `examples/business.test.ts` | 200 / 422 / 503、坏 JSON、AbortSignal |
| `examples/advanced.test.ts` | `vi.useFakeTimers` 与 `createLatestRequest` |

页面按入口展示，例如：

```bash
pnpm exec vitest run entries/F12-vitest/examples/basic.test.ts
```

工作目录是 `packages/library-lab`。三条命令各自只跑一个文件。没有浏览器项目，没有 jsdom 组件。Testing Library 是组合教学，本目录没有挂载。

## 1. 什么时候用

纯函数、可注入的请求函数、假时钟和取消代际。真实 Chromium 里的点击、焦点和网络栈用 F13。可访问性规则用 F17。拦截 `fetch` 的 Service Worker 用 F11。不要用这一页代替那三件。

单个 `node:assert` 就够的脚本不必为了演示再包一层。这里要展示的是 Vitest 的 `describe` / `it.each` / `vi` / 假时钟。

## 2. 模型

`normalizeFeedURL` 用 `URL`。协议必须是 `https:`，不能有用户名或密码，hash 清掉，其余保留。`javascript:`、`http:` 和 `not-a-url` 抛错。这不是 SSRF 防护。

`verifyCode(request, signal)` 不自己 `fetch`。调用方传入 `(signal) => Promise<Response>`。

```text
已取消 → AbortError，且不调用 request
request(signal)
仍取消 → AbortError
422 → json → 再看 signal → { kind: 'invalid', code }
503 → { kind: 'retry', after: 3 }，不读 body
其它非 ok → throw
200 → json 必须有字符串 message，否则 Invalid JSON shape
```

422 的 JSON 若没有字符串 `code`，变成 `UNKNOWN`。读 JSON 之后还要再看 signal，所以取消发生在解析过程中时不能返回成功。

`createLatestRequest` 每次 `run` 先 abort 上一个 controller，generation 加一。只有代号仍是最新且未 abort 才返回值，否则 `null`。`cancel` 增加 generation 并 abort。当前代的真实错误会抛出；取消之后的同样错误变成 `null`。`finally` 只在 `current` 仍是这次的 controller 时清掉它，避免清掉更新的那次。

假时钟只包住使用 `setTimeout` 的那条测试。`afterEach` 恢复真实时钟，免得泄漏到下一个文件。

## 3. 三层

### 基本

两行合法 URL：带 hash 的 RSS 去掉 fragment；带 query 的保留 query。四行非法输入都 `toThrow()`。没有 mock。这是 `it.each` 的表，不是网络。

### 业务

三行矩阵：

| 状态 | 体 | 结果 |
| --- | --- | --- |
| 200 | `{ message: '验证码通过' }` | `{ kind: 'ok', message }` |
| 422 | `{ code: 'OTP_EXPIRED' }` | `{ kind: 'invalid', code }` |
| 503 | 任意 | `{ kind: 'retry', after: 3 }` |

`vi.fn` 记录调用次数和那次 signal。200 且 JSON 是 `{ unknown: 42 }` 必须抛 `Invalid JSON shape`，不能当成通过。

已 abort 的 signal 不会调用 request。解析开始后 abort，再交 `{ message: 'late-success' }`，结果是 AbortError。422 的解析同样：abort 之后不能收下 `OTP_EXPIRED`。

### 进阶

第一次请求的定时器是 100ms，第二次是 10ms。先 `run` 再 `run`，`advanceTimersByTimeAsync(110)`。旧的结果是 `null`，新的是 `value-2`。

后端忽略 abort、稍后 resolve `'late'` 时，`cancel()` 仍让 promise 变成 `null`。

活动中的 `reject(new Error('real failure'))` 会抛出。取消之后的 `late failure` 变成 `null`，不再抛。

## 4. 反例

### 反例 1：业务文件 import Vitest

```ts
import { vi } from 'vitest'
export async function verifyCode() {
  return vi.fn()
}
```

产品代码不能依赖测试包。`domain.ts` 只接收 `request`。mock 留在 `*.test.ts`。

### 反例 2：测试里打真实主机

```ts
await fetch('https://api.example.com/otp')
```

会碰到网络、密钥和不稳定。本目录的 URL 只出现在 `new URL` 的解析里。请求函数由测试注入。不要把令牌写进夹具。

### 反例 3：只看 abort 标志，不看代际

```ts
current.abort()
const result = await load(signal)
setState(result)
```

对端可以忽略 abort，promise 仍会完成。`createLatestRequest` 用 generation 丢掉过期值。只 `expect(signal.aborted).toBe(true)` 不够。

### 反例 4：任意 sleep

```ts
await new Promise((r) => setTimeout(r, 50))
```

在真实时钟上会慢，也会和别的测试抢时间。进阶用 `vi.useFakeTimers()` 和 `advanceTimersByTimeAsync`。用完在 `afterEach` 恢复。

### 反例 5：503 当成功

```ts
if (response.status === 503) return { kind: 'ok', message: 'retry' }
```

本函数返回 `{ kind: 'retry', after: 3 }`，不读 body。UI 若把所有对象都显示成成功，那是调用方的错。测试要 `toEqual` 整个对象。

### 反例 6：422 解析完就当有效

取消可能发生在 `response.json()` 的 promise 中间。解析后的 `requireActive` 必须留着。删掉它，晚到的 `OTP_EXPIRED` 会变成无效验证码而不是取消。

### 反例 7：假时钟泄漏

在一个 `it` 里 `useFakeTimers`，忘记 `useRealTimers`。下一个文件的超时会停住。本页用 `afterEach`。

### 反例 8：把 vi.fn 说成 HTTP 已连通

`new Response(...)` 没有离开进程。不能写成契约测试或生产 503 演练。那是 F11 或真实环境的事。

### 反例 9：一个文件绿了就填三条 PASS

basic 不覆盖 abort，business 不覆盖假时钟。三条命令分开。页面展示其中一条，不代表三条都跑了。

### 反例 10：用 jsdom 冒充浏览器

本目录没有组件。按钮名、焦点和 aria 在 F13 / F17。Vitest 的 Node 环境看不见它们。

### 反例 11：快照整段错误对象

`toThrow()` 和 `toMatchObject({ name: 'AbortError' })` 钉住行为。不要把堆栈快照进仓库。

### 反例 12：在 domain 里吞掉错误

```ts
catch { return null }
```

活动失败必须抛出，取消后的失败才是 `null`。测试把这两条分开。不要为了让 `it` 变绿而改成全吞。

## 5. 组合

**F11 MSW**：handler 提供状态码，Vitest 驱动断言。本目录没有启动 MSW。注入的 `Response` 不能写成 Worker 已控制页面。

**F13 Playwright**：同一套 200/422/503 和过期响应可以在 Chromium 里再做一遍。`page.route` 不是 `vi.fn`。Lab 的 F13 也只是规格文件，不是已经跑过的套件。

**F17 axe-core**：规则要真实 DOM。不要在 Vitest 里 mock `axe.run` 然后说无障碍通过。

**Testing Library**：组件可见文字和角色属于另一层。这里没有 `render`。

## 6. 清单

- `domain.ts` 不出现 `vitest`。
- 每个请求测试都断言调用次数和 signal。
- 200 的坏形状会抛，而不是 `kind: 'ok'`。
- abort 发生在调用前、JSON 中、422 解析中都有断言。
- 假时钟测试结束恢复真时钟。
- 旧请求返回 null，新请求保留值。
- 活动错误抛出，取消后的错误不抛。
- 不请求外网，不写密钥。
- 三条 `vitest run` 分开记录。
- 命令输出还不等于收据。

## 7. 升级

5.0.5 的 `vi.useFakeTimers`、`advanceTimersByTimeAsync`、`it.each` 是合同。升级 minor 时三条文件都要再跑。不要为了新的浏览器模式把这页改成 jsdom，除非同时改 library.json 和测试命令。

v4 的部分 mock 路径和 v5 不同。迁过来时以 https://vitest.dev/guide/learn/writing-tests 和 https://vitest.dev/config/ 为准，不要抄旧的 `vi.setSystemTime` 示例来代替代际。

锁文件已经是 5.0.5。文档不要写成待添加。

## 8. 验收

在 `packages/library-lab`：

```bash
pnpm exec vitest run entries/F12-vitest/examples/basic.test.ts
pnpm exec vitest run entries/F12-vitest/examples/business.test.ts
pnpm exec vitest run entries/F12-vitest/examples/advanced.test.ts
```

页面每次只展示其中一条，并且不执行。退出码要进入收据之后，sdk 才不是 NOT_RUN。build 与 browser 本条目没有单独的构建产物或页面，保持 NOT_RUN，不要记成失败来凑数。仓库那 153 项测试若未包含这三个文件的收据，就不能引用。

## 9. 时钟、隔离和假响应

`advanced.test.ts` 的 `afterEach` 无条件 `useRealTimers`。即使用例失败，下一个文件也不应继承假时钟。第一条进阶用例在假时钟里用 100ms 和 10ms。`advanceTimersByTimeAsync(110)` 让两个定时器都到期，但旧的那次已经被第二次 `run` abort，resolve 的 `'aborted-1'` 因为代号变了而变成 null。新的一次得到 `value-2`。

第二条不使用定时器。`cancel()` 之后对端仍 `resolve('late')`。返回值是 null，说明代际比 abort 事件更靠后。若实现只在 catch AbortError 时丢弃，这条会把 `'late'` 漏出去。

错误所有权：第一次 `run` 的 reject 是活动失败，必须 `rejects.toThrow('real failure')`。接着 `run` 再 `cancel`，同一次 reject 函数若再次被调用，得到的是 null 而不是抛出。测试把 `rejectLoad` 留在闭包里，用来模拟「对端晚到」。不要改成 `try/catch` 后一律 return null，那会吞掉活动失败。

business 的 422 解析用一个永远不自己完成的 `json()`，直到测试 abort 再 `release`。顺序是：请求进入、json 开始、abort、然后才给 body。断言是 AbortError，不是 `OTP_EXPIRED`。200 的晚到成功同样不能变成 `kind: 'ok'`。

`vi.fn` 的 Response 是进程内对象。没有套接字，没有 TLS，没有 Retry-After 头。503 的 `after: 3` 写死在 domain 里。产品若要读响应头，要改 domain 并加一条断言，而不是把这个数字说成已经解析了头。

basic 不使用 mock。URL 解析的四条反例覆盖协议、明文 http、用户信息、非 URL。hash 去掉是为了比较身份；query 保留是因为过滤条件属于地址。不要把整串 `toLowerCase()`，路径大小写可能有意义。本函数没有做这件事，测试也没有要求。

文件之间没有共享的 mock server。每个 `it` 自己造 request。不要把 `vi.mock` 提到文件顶上替换 `domain.ts`，否则测的就不是这份实现。

和仓库 `pnpm test` 的关系：Library Lab 的平台测试会跑很多文件。Actions 41779873259 记录的是那次 153 项。除非收据写明包含这三个路径，否则不要假设它们在里面。页面每次只展示一条 `vitest run`。

## 10. 故障对照

| 现象 | 先看 |
| --- | --- |
| 下个文件超时不动 | 假时钟没有在 afterEach 恢复 |
| 旧请求返回了 value-1 | generation 没有在第二次 run 时增加 |
| late 成功变成 ok | JSON 之后没有 `requireActive` |
| 已取消仍调用了 request | 函数开头的 `requireActive` 被删 |
| 503 被收成 ok | kind 写错。应是 retry |
| 测试 import 进了产品包 | domain 必须零依赖 vitest |
| 命令找不到 vitest | 应在 packages/library-lab 里用 pnpm exec。版本已在锁里，不是缺依赖声明 |

不要在测试里 `fetch` 外部主机来「看看真的 422」。那会碰到网络和密钥。注入的 Response 足够说明分支。

浏览器组件的渲染、IME 和焦点不在这三份文件里。要那些，用 F13 或组件测试，并单独记收据。

## 11. 资料

- https://vitest.dev/guide/learn/writing-tests
- https://vitest.dev/config/
- https://vitest.dev/guide/cli
- https://github.com/vitest-dev/vitest/releases/tag/v5.0.5

## 12. 三条命令各自证明什么

`basic.test.ts` 只证明 `normalizeFeedURL`：hash 去掉，query 留下，四种非法输入抛错。它没有 mock，也没有时钟。

`business.test.ts` 证明注入的 200、422、503、坏形状、调用前取消、JSON 中途取消。`vi.fn` 的 Response 不出进程。503 的 `after: 3` 是写死的数字，不是响应头。

`advanced.test.ts` 证明假时钟下旧定时器变成 null、新结果是 `value-2`，以及忽略 abort 的晚到成功仍是 null。活动中的错误抛出，取消后的错误变成 null。`afterEach` 恢复真实时钟。

三条都要在 `packages/library-lab` 里用 `pnpm exec vitest run` 加上对应路径。页面一次只展示一条，并且不执行。锁文件已经是 5.0.5，缺的是收据，不是依赖声明。

不要把 Actions 41779873259 的 153 项测试当成这三份文件。除非收据写明路径和退出码。build 与 browser 本目录没有页面产物，保持 NOT_RUN。不要为了凑浏览器模式把 `domain.ts` 改成依赖 jsdom。

`createLatestRequest` 的 `finally` 只清除仍等于这次的 controller。清掉更新的那次会让后一次请求失去取消句柄。`verifyCode` 在 422 读完 JSON 之后还要看 signal，否则晚到的 `OTP_EXPIRED` 会变成字段错误。

测试夹具里的文案「验证码通过」是本地字符串。不要换成真实短信网关，也不要把口令写进仓库。假时钟用完必须恢复，否则下一个文件的超时会停住。

basic 不覆盖取消。

business 不覆盖假时钟。

advanced 不覆盖 URL 规范化。

三条路径分开记收据。

`domain.ts` 保持不 import vitest。
