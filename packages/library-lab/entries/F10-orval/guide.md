# Orval 8.44.0｜离线 OpenAPI，生成两次并比对摘要

Lab 锁定 `orval@8.44.0`（MIT）。它读 OpenAPI，写出 fetch 或 React Query 客户端。它不发请求，也不证明后端实现了契约。

执行种类是 `node-ci`。页面只展示命令，不启动进程。`output-policy.test.mjs` 和 `spec-check.mjs` 不运行 Orval，不是 SDK PASS。

`run.mjs` 要求 Node ≥ 22.18。仓库的 Node 基线是 22。版本不够时命令会在生成前失败，这不是「还没把 Orval 加进锁文件」。包已经在锁里。

没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。Actions 41779873259 是仓库级安装、类型检查、构建、52 个 SDK 文件 / 153 项测试和 45 项 Playwright，不是 F10 的 PASS。

## Lab 当前示例

| 文件 | 作用 |
| --- | --- |
| `examples/openapi/news.json` | OpenAPI 3.0.3，服务器 `http://127.0.0.1:4319` |
| `examples/orval.config.ts` | 三个 project：`basic`、`business`、`advanced` |
| `examples/run.mjs` | 清掉当前 project 的固定路径，生成两次，比 SHA-256 |
| `examples/output-policy.mjs` | 拒绝符号链接、非 ts 文件、超限体积，并检查导出 |
| `examples/spec-check.mjs` | 只检查 JSON 形状，打印 CLI 未运行 |
| `examples/basic.mjs` / `business.mjs` / `advanced.mjs` | 各自调用 `run(project)` |
| `examples/generated/` | 产物目录，被 gitignore，不是提交物 |

页面命令类似：

```bash
node entries/F10-orval/examples/basic.mjs basic
```

脚本不读多余的 level 参数，project 写在文件里。工作目录要能让 `pnpm exec orval` 在 `@reactloom/library-lab` 包根执行。配置里的路径是相对这个包根的。

不要用 `orval --clean`。它可能删到别的项目。`cleanProject` 只删除当前 project 列出的名字。

契约是教学夹具：`listSources`、`createSource`、`getSource`。没有生产密钥，也不要把它指到真实供应商。

## 1. 什么时候用

前端要跟着 OpenAPI 生成类型和调用函数，并且契约文件进了仓库。手写十几个端点时，生成器的配置成本可能不值。运行时校验用 Zod（C02）或同类，生成的 TypeScript 挡不住服务端多返回一个字段。

Mock 用 F11。缓存用 TanStack Query（D07）。Orval 不代替这两者。

## 2. 模型

`basic`：`client: 'fetch'`，`mode: 'single'`，输出 `generated/basic.ts` 和 `basic-models`。

`business`：`client: 'react-query'`，`httpClient: 'fetch'`，还要导出 `useListSources`、`useCreateSource`、`useGetSource`。

`advanced`：`client: 'fetch'`，`mode: 'tags-split'`，输出要落在 `generated/advanced/` 下面。

`baseUrl` 固定 `http://127.0.0.1:4319`，和规范里的 server 一致。这是 Lab 本机地址，不是对外服务。

`run` 的顺序：检查 Node → 删除该 project 的固定目标 → `pnpm exec orval --config ... --project ...` → `inspectProject` → 再生成一次 → 摘要必须相同。超时 90 秒，输出缓冲 1 MiB。非 0 退出直接失败。

`inspectProject`：目录最深 8 层；只收 `.ts` / `.tsx`；单文件 ≤ 1 MiB；最多 128 个文件；合计 ≤ 6 MiB；拒绝符号链接和其它文件类型。摘要是路径加内容的 SHA-256。三个 operation 都必须以 export 的函数或 const 出现。business 再检查三个 hook。

`spec-check.mjs` 确认 openapi 3.0.3、operationId 唯一且正好三个、存在 `Source` / `CreateSource` / `Error`、server URL 是 loopback。它最后一行写明没有跑 CLI。

## 3. 三层

### 基本

生成单个 fetch 客户端。成功日志含文件数和 sha256。空目录算失败。不要手写一个 `basic.ts` 放进目录冒充。

### 业务

同一份规范，输出 React Query hooks。没有 Provider 的演示页。hook 出现在文件里，不等于组件里已经 `useQuery`。

### 进阶

按 tag 拆文件。检查要求至少有一条路径以 `advanced/` 开头。拆分后的 operation 仍然要能在合并文本里找到。

## 4. 反例

### 反例 1：`--clean` 清整个输出根

```bash
pnpm exec orval --clean --config entries/F10-orval/examples/orval.config.ts
```

可能删掉其它 project 刚生成的文件。只删 `projectPaths` 里的那几项。

### 反例 2：目录里有旧文件就算成功

```js
await access('examples/generated/basic.ts')
```

`verify.mjs` 和 `inspectProject` 要读内容、核对 export 和两次摘要。存在不是生成。

### 反例 3：把策略测试当成 CLI

`output-policy.test.mjs` 构造字符串。`spec-check.mjs` 只读 JSON。它们可以在没有 Orval 的情况下通过。PASS 必须是 `run.mjs` 真的启动了 CLI。

### 反例 4：指向生产 OpenAPI

```ts
input: { target: 'https://api.vendor.example/openapi.json' }
```

本配置只读仓库里的 `news.json`。不要把含密钥的 URL 写进配置或提交生成物里的 token。

### 反例 5：一次生成就提交

两次 SHA-256 不同说明产物不稳定或夹进了旧文件。先让两次一致，再决定是否把生成结果纳入版本管理。Lab 的 `generated/` 被忽略，指南不要求提交它。

### 反例 6：Node 版本不够仍继续

Orval 8 在 `checkNodeRuntime` 里拒绝 22.18 以下。不要删掉这道检查去「让命令先跑起来」。

### 反例 7：生成代码里改业务

手改 `generated/*.ts` 会在下次生成时丢失，也会让两次摘要对不上。改规范或 `orval.config.ts`。

### 反例 8：类型当成 422 已处理

生成的客户端不会替你显示字段错误。409 和 422 在规范里有描述。UI 仍要看状态码。MSW 或真实服务负责那些响应，Orval 不负责。

## 5. 组合

**F11 MSW**：handler 的路径要和生成的 `/api/sources` 一致。拦截成功不是生成成功。

**D07 TanStack Query**：business 的 hook 需要 Provider、key 和失效策略。本条目没有这层。

**C02 Zod**：在边界上解析响应。编译通过不能代替。

**API client**：若产品用 `@reactloom/api-client`，不要并行再留一套不受 schema 约束的 fetch。生成器的 mutator 是迁移题，本配置没有 mutator。

## 6. 清单

- 规范、配置、生成目录都在本条目内。
- 只清理当前 project 的固定名字。
- 生成两次，摘要和文件数一致。
- 拒绝符号链接和非 TypeScript 文件。
- 三个 operation 都出现；business 还有三个 hook。
- baseUrl 保持 loopback，不换生产主机。
- 不提交密钥，不把 `generated/` 当证据。
- 页面上的命令不会自己执行。

## 7. 升级

8.44 的 `defineConfig`、`client: 'fetch' | 'react-query'`、`mode: 'tags-split'` 是合同。升级后对同一 `news.json` 重跑两次摘要。operation 的导出名变了就要改 `OPERATIONS`，不要把检查放宽到「文件非空」。

React Query 的 peer 要和 Lab 里的 TanStack Query 主版本一起看。本页不渲染 hook。

## 8. 验收

形状：

```bash
node packages/library-lab/entries/F10-orval/examples/spec-check.mjs
```

它会声明 CLI 未运行。真正的生成是 `basic.mjs`、`business.mjs`、`advanced.mjs`。日志里要有 sha256。再对产物做一次类型检查才谈得上 build。这些都要收据。browser 没有挂载生成的 UI，保持 NOT_RUN。

## 9. 规范里实际有什么

`news.json` 是 OpenAPI 3.0.3。服务器只有 `http://127.0.0.1:4319`。路径 `/api/sources` 上有 GET `listSources`（query `limit` 1–100）和 POST `createSource`。另有按 id 取单条的 `getSource`。组件 schema 至少包括 `Source`、`CreateSource`、`Error`。409 表示重复的 RSS URL，422 一类的错误体用 `Error`。这些描述不会变成运行中的路由。Lab 应用自己的任务 API 不是这份文件。

生成前 `spec-check.mjs` 只断言：版本、三个不重复的 operationId、三个 schema 名字、server URL。它打印 CLI 没有运行。不要把这条输出贴进 sdk 收据。

`orval.config.ts` 的注释要求在包根执行。`input.target` 和 `outputRoot` 都相对 `@reactloom/library-lab`。在仓库根直接跑 orval 会找不到 `./entries/...`，除非你的 cwd 就是这个包。页面上的 `node entries/F10-orval/examples/basic.mjs` 由 `run.mjs` 把 spawn 的 cwd 设到包根，所以多出来的 level 参数无害，cwd 不能改错。

清理范围是名字列表：basic 的 `basic.ts` 与 `basic-models`；business 的 `business.ts` 与 `business-models`；advanced 的 `advanced.ts`、`advanced` 和 `advanced-models`。符号链接直接拒绝。不要为了「方便」改成 `rm -rf generated`。

两次生成之间如果有人手改文件，摘要会变，命令失败。这是保护，不是不稳定的网络。产物不进 git。需要类型检查时对生成出的 ts 单独跑 tsc，那是另一次命令，本配置没有挂 tsc。

React Query 的 hook 名字来自 operationId。改 operationId 而不改 `OPERATIONS` 和 business 的 hook 列表，inspect 会失败。那是合同，不要改成「只要文件里有 export」。

没有 mutator，所以生成的 fetch 不会自动走 `@reactloom/api-client` 的重试和 `ApiError`。迁到产品时要显式接，而不是假设 baseUrl 已经带上凭证。本页的 baseUrl 是 loopback，没有 Cookie，也没有 Bearer。

## 10. 故障对照

| 现象 | 先看 |
| --- | --- |
| 找不到 openapi 文件 | cwd 不是 library-lab 包根 |
| Node 版本错误 | 低于 22.18。不要删 `checkNodeRuntime` |
| 空输出 | 清理后 CLI 失败，或写到了别的目录 |
| 两次 sha256 不同 | 旧文件没删干净，或生成不稳定 |
| 缺 `useListSources` | 跑的不是 business，或 client 不是 react-query |
| advanced 没有子目录 | mode 不是 `tags-split` |
| 页面没有生成文件 | 页面只展示命令 |

不要把供应商的令牌写进 `news.json` 的 server，也不要为了演示把 target 改成 https 下载。生成的客户端若被提交，先确认里面没有环境专属的密钥。Lab 选择不提交 `generated/`。

## 11. 资料

- https://orval.dev/docs/guides/basics/
- https://orval.dev/docs/quick-start/
- https://orval.dev/docs/guides/fetch/

## 12. 生成物里要能搜到的名字

basic 与 business 的主文件名是 `basic.ts`、`business.ts`。advanced 必须出现 `advanced/` 前缀，因为 `mode` 是 `tags-split`。三个 project 都要能搜到导出的 `listSources`、`createSource`、`getSource`。business 还要 `useListSources`、`useCreateSource`、`useGetSource`。

这些名字来自 operationId，不是手写的客户端。手改 `generated/` 会在下一次生成时丢失，也会让两次 SHA-256 对不上。检查失败就改规范或配置。

Node 必须 ≥ 22.18。超时 90 秒，子进程缓冲 1 MiB。非 0 退出立即失败，不读旧文件充数。清理只碰当前 project 的固定路径，拒绝符号链接。单文件 1 MiB、最多 128 个文件、合计 6 MiB、目录深度 8。

`spec-check.mjs` 不在 PASS 路径上。页面展示的 `node .../basic.mjs basic` 多一个参数，脚本忽略它，cwd 由 `run.mjs` 设到包根。不要在仓库根另起一份会下载远程规范的配置。

生成的 fetch 没有接 `@reactloom/api-client`。没有凭证，baseUrl 是 `http://127.0.0.1:4319`。不要把生产主机或令牌写进 `news.json`。`generated/` 不提交。没有收据时 sdk 保持 NOT_RUN，browser 没有挂载 hook，也保持 NOT_RUN。

`output-policy.test.mjs` 可以在没有 Orval 二进制时通过。它和 `spec-check.mjs` 都不要写进 sdk。两次摘要一致只说明这次生成稳定，不说明后端实现了 409 或 422。

React Query hook 要有 Provider 才谈得上缓存。本目录没有 Provider，也没有 mutator。改 operationId 时同步改 `OPERATIONS` 和 business 的三个 hook 名字。

不要使用 `orval --clean`。

不要用文件存在代替两次摘要。

页面不会启动这个进程。

规范服务器保持 loopback。
