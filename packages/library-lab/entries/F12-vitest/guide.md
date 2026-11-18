# Vitest 5.0.5：运行测试，而不是模拟测试结果

Vitest提供测试收集、断言、spy和假时钟。此条目用真实5.0.5 CLI测试原创业务函数，不是浏览器在线终端。`vi.fn`返回的Response是进程内夹具，没有套接字/TLS/后端连通性证明；fake timer推进的是模拟时钟，不是实际等待性能。

## 三个目标

| 场景 | 实际入口 | 可观察断言 |
| --- | --- | --- |
| basic | basic.test.ts | 6项：HTTPS规范化保留query/去fragment；协议、凭证、坏URL拒绝 |
| business | business.test.ts | 9项：注入200/422/503、坏JSON形状、调用前/JSON中取消、503不读body、422 UNKNOWN、403错误 |
| advanced | advanced.test.ts | 4项：假时钟下旧结果null/新结果value-2、忽略abort的晚结果、活动错误/取消后错误、旧finally不能清新controller |

这是Vitest真实runner的19项业务断言，不是19项外部服务测试；没有第二套纯policy套件，不把业务断言再双重计数为SDK+policy。网页只展示命令和源代码，不执行CLI。浏览器交互、IME、布局、无障碍不在本条范围。

## 完整迁入与运行

Node满足Vitest包engines：`^22.12.0 || ^24.0.0 || >=26.0.0`，本次Node26.13.1。已有TypeScript ESM工程安装精确`vitest@5.0.5`并满足其Vite peer（本次沿用已安装Vite，不改依赖）。只有测试/配置import Vitest，产品`domain.ts`不依赖测试包。无需jsdom、浏览器项目、MSW、Provider或环境变量。

复制`vitest.config.ts`和`examples/domain.ts`，以及需要的basic/business/advanced.test.ts。保留examples目录结构；每个demo sourceFiles列出该测试、domain和配置，全复制就是五份。配置用import.meta.url定位自身目录，include仅这三测试，environment=node，不继承宿主Vite插件或收集其他entry。迁出已有项目要保留该独立配置或审查后合并include/environment，不能盲用宿主设置。

在仓库根运行：

```sh
pnpm --filter @reactloom/library-lab exec vitest run --config entries/F12-vitest/vitest.config.ts examples/basic.test.ts --reporter=verbose
pnpm --filter @reactloom/library-lab exec vitest run --config entries/F12-vitest/vitest.config.ts examples/business.test.ts --reporter=verbose
pnpm --filter @reactloom/library-lab exec vitest run --config entries/F12-vitest/vitest.config.ts examples/advanced.test.ts --reporter=verbose
```

迁出后在自己的项目根使用`pnpm exec vitest run --config ./vitest.config.ts examples/basic.test.ts`（另两文件同理）。Demo 面板用同一份条目专用配置，在 `packages/library-lab` 中复制执行。Vitest会转译TS但默认不作完整类型检查；本次另外复制五文件严格tsc通过，见migration-command.json。

## 业务合同

normalizeFeedURL用URL解析，仅允许无用户名/密码的HTTPS，去hash、保query和路径大小写。不拒绝内网/IP，不是SSRF防护或业务授权。

verifyCode接收`(signal)=>Promise<Response>`。调用前、request之后、200/422 JSON之后检查signal，取消抛AbortError。422 code缺失返回UNKNOWN；503不读body，after:3固定，不是Retry-After解析；其它非ok抛错；200必须含字符串message。测试用部分Response double延迟json以控制取消边界，不假称原生网络延迟。真实HTTP接项目API client，不能复制fixture当请求实现。

createLatestRequest先abort旧controller并增generation。只有最新代且未取消才返回结果，其余null；活动错误抛出，过期/取消错误忽略。finally只清属于本次的controller，旧任务不能夺走新任务cancel句柄。cancel可重复调用；组件使用者仍需在自己的卸载cleanup调用cancel，本条没有组件生命周期证明。它不会强行结束忽略AbortSignal的底层操作，null也不能作为所有业务返回类型的无歧义状态模型。

## 时钟和清理

advanced第一项用100ms/10ms模拟定时器，advanceTimersByTimeAsync(110)推进；abort清旧timer，成功/abort都移除该fixture自己注册的listener，末尾getTimerCount()为0。afterEach恢复真实时钟，避免泄漏到后续文件。其余用手动resolve/reject控制promise，不任意sleep；不是测真实网络耗时。

不要只断言signal.aborted而不检查结果，或无条件catch return null吞活动错误。不要把业务模块vi.mock替换掉后宣称测了它；本条真实import domain。不要请求短信网关、真实外部主机或写密钥。

## 官方资料和证据

固定v5.0.5 commit `7a825db43e2beca0b219d2eadaec334cb81af0c7` 根README/LICENSE原字节存official；固定树只有英文根README，无中文候选，语言en。实际包version/license/engines/peer及哈希URL在source-evidence.json。官网实际GET200但`X-Frame-Options: DENY`，不能嵌Lab，metadata标blocked并保留直达。

真实CLI分文件6/9/4均exit0，原始verbose stdout/stderr在validation，命令/cwd/exit见commands.json。scopedBiome和严格复制编译单列；不拿锁文件/旧Actions当执行证据。正式verification无recorder仍NOT_RUN。后续浏览器只需验证三个命令/源码/官方来源展示，不能宣称网页执行Vitest或浏览器SDK PASS。
