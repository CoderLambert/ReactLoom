# MSW：让真实客户端请求得到可控响应

前端正在开发验证码表单：请求成功后显示验证完成，输入错误时显示字段提示，服务暂时不可用时允许恢复。如果直接替换页面的fetch函数，测试很容易只验证自己的替身；MSW把响应规则放在网络拦截层，让应用仍使用原来的HTTP客户端。本例使用真实 **msw 3.0.3**，依次观察请求、handler匹配、响应状态与恢复。

MSW适合开发联调、组件场景与客户端测试，同一套handler可用于Node与浏览器。它模拟的是客户端收到的响应，不证明真实后端、数据库、鉴权或部署连通。文章、验证码与临时503都是本地fixture，不含真实账号；纯函数计算没有网络边界时不必引入MSW。

## 先理解请求经过哪里

```text
客户端调用 fetch / HTTP client
        ↓
MSW 的 Node 适配或浏览器 Service Worker 适配
        ↓
按 method + URL 匹配 createHandlers(urls)
        ↓
resolver 读取参数/JSON → HttpResponse.json
        ↓
客户端得到标准 Response（200 / 422 / 503）
```

[`handlers.mjs`](examples/handlers.mjs) 是唯一的业务响应工厂：GET文章读取`:id`，POST验证码读取JSON，GET重试路径默认200。handler本身不启动拦截；Node把它交给`setupServer`，浏览器交给`setupWorker`。`http`与`HttpResponse`来自3.0.3的`msw/http`，两个宿主适配分别来自`msw/node`和`msw/browser`。

[`routes.mjs`](examples/routes.mjs) 负责把一个绝对目录URL变成这些端点。Node用 `https://library-lab.invalid/`，不应产生外部网络流量；浏览器用当前会话目录下的`api/`。相同的是响应规则和路径契约，不是把Node的域名原样搬到浏览器。

**Service Worker scope选择它能控制的页面/client，不是请求URL白名单。**受控页面发出的请求可以指向别的路径甚至别的origin，是否模拟响应由handler匹配决定。本Lab另用独立origin和每次会话的URL命名空间限制影响范围，不能把路径前缀本身当成跨域安全沙箱。

## 先用Node追踪一条请求

在仓库根运行三个完整配方：

```sh
node packages/library-lab/entries/F11-msw/examples/node-runner.mjs basic
node packages/library-lab/entries/F11-msw/examples/node-runner.mjs business
node packages/library-lab/entries/F11-msw/examples/node-runner.mjs advanced
```

在`packages/library-lab`目录则使用`node entries/F11-msw/examples/node-runner.mjs business`。执行前需要已安装`msw@3.0.3`、Node至少22.12；本轮实际执行版本与输出保存在维护记录中，不把展示出来的命令当执行结果。

[`node-runner.mjs`](examples/node-runner.mjs) 用`setupServer(...handlers)`创建拦截，`listen({ onUnhandledFrame: 'error' })`拒绝未处理流量，然后执行真正的fetch。输出包含：

- `requests`：真实请求的方法、URL、响应status与解析后的body。
- `matches`：真正`request:match`事件给出的requestId、method、url；runner断言匹配事件与完成请求逐项对应。
- 场景摘要：文章body，或422/200，或503/200。

`matches`是观察记录，不是项目的正式验证收据。最后在finally中resetHandlers并close，避免进程内拦截影响后续工作；没有把globalThis.fetch改成手写假函数。

## 三个独立实验

### 1. GET：路由参数怎样变成响应

执行basic，或在Demo选择“GET参数与响应匹配”。Node输出200、`id: "42"`与固定标题，并有一条匹配记录。浏览器面板点击“运行 MSW 浏览器场景”，实际响应表同样显示GET200和文章JSON。

请求URL末尾是`articles/42`，handler使用`articles/:id`并把参数转成字符串。改变客户端参数前先看实际路由契约；URL不匹配时应发现未处理请求，避免静默请求生产。关键源码是routes的articlePattern、handlers的GET resolver和runner的第一条fetch。

### 2. 422：字段错误后用正确输入恢复

business先提交错误验证码，再提交`123456`。Node与当前隔离浏览器都依次得到 **422 → 200**：第一条body是`error.code=INVALID_CODE`及中文消息，第二条是`verified:true`。Node的两条request:match事件证明这两个真实请求都进入了handler。

422是业务校验响应，fetch仍正常返回Response，不会自动抛网络异常。产品客户端应按状态与body映射字段提示，允许修改后再次提交；本例自动执行这两个固定输入，没有交互验证码表单或真实验证码服务。handler解析失败的JSON也进入422分支，不能把任意客户端输入当作已验证对象。

### 3. 一次503：临时覆盖后恢复基线

advanced给重试端点临时加一个`server.use(http.get(..., { once: true }))`覆盖。第一条请求503，覆盖只消费一次；第二条显式发出的请求回到canonical handler的200。浏览器runner使用同样的once模式。

这里的503仍是HTTP响应，不是断网；**MSW没有替客户端自动重试**。两次请求由配方顺序执行，用来观察临时handler优先于初始handler以及once的恢复语义。finally的resetHandlers移除运行时覆盖，close恢复Node适配。生产重试需另定义次数、退避与幂等条件，不能对验证码等操作盲目重发。

## 当前Lab的真实浏览器操作

每个场景都保留Node复现区域，下面另有“真实浏览器请求拦截”面板。应用从 `http://127.0.0.1:4319` 打开，点击“运行 MSW 浏览器场景”，面板通过独立端口4320的隐藏iframe执行，不在主站注册Worker。结果中的状态码是实际请求响应，不是前端预填的成功文字。

1. 宿主生成UUID会话，iframe URL与scope为 `http://127.0.0.1:4320/lab-runners/msw/sessions/<uuid>/`。当前实现源码是公共`runners/msw/main.mjs`及`src/lib/frame-session.mjs`。
2. runner复用本条目的canonical handlers/routes，await worker.start后请求本会话的api端点，返回受限结果。
3. 父子消息同时核对origin、Window来源、协议和session；这是Lab自建隔离协议，不是MSW提供的API。
4. 点击“停止 MSW 并清理”，runner中止自己尚未完成的请求，await worker.stop，再核对这次scope/script并注销自己的registration，回传停止ACK。
5. 面板只有收到有效清理确认才显示“已停止，本次作用域已清理”。ACK超时为“清理未确认”；不能据iframe移除或load事件就宣布清理通过。离开页签也走会话释放，pagehide只是尽力处理，不保证进程被强杀后立刻删除注册。

两会话scope互不相同；清理一个不能注销另一个，也不能清空全局存储/注册。`worker.stop()`停止当前client的拦截，**不是**unregister；3.0.3类型允许返回Promise或void，统一await以覆盖异步清理。Node的server.close不注册Service Worker，两种生命周期不能互相替代验收。

### 脚本预检与历史适配器

当前公共prepare/server链会检查生成Worker资产不是HTML、非空且不超过512KiB，并仅在合法session脚本路径供应，设置精确Service-Worker-Allowed。它已经接线，不再是历史“等PLATFORM”的阻塞。资产检查不是浏览器控制或请求拦截证明，仍须真实浏览器。

源码面板保留的[`browser-worker.mjs`](examples/browser-worker.mjs)是**旧固定scope适配参考**，未被当前面板导入；当前服务不会供应它的固定脚本路径。它自己的同步session gate、受限流式预检、精确registration与共享stop Promise仍需保留，但不能把它当当前UUID runner的第二份实现，或复制后注册全站Worker。其[`worker-script-preflight.mjs`](examples/worker-script-preflight.mjs)确实发请求并检查MIME/重定向/实际字节；策略测试使用受控Response fixture，只证明这些检查分支。

## 迁入业务项目

```sh
pnpm add --save-dev msw@3.0.3
```

Node复现复制handlers.mjs、routes.mjs和node-runner.mjs，保留相对导入；按真实API契约改端点及响应。测试宿主通常在beforeAll listen、afterEach resetHandlers、afterAll close。本例为每次配方单独创建server并在finally归还。

浏览器产品需按官方流程生成匹配版本的Worker资产，在自己的开发/测试入口启动`setupWorker`并await start，再渲染会请求网络的应用。`serviceWorker.url/options.scope`与HTTP(S)、CSP、脚本响应必须匹配；需要root scope的产品应由其自己的应用拥有者决定，不把Lab的受限会话策略改成注册全站。这里没有迁出Lab私有runner或替目标项目初始化CLI。

生产应用保留自己的HTTP客户端、Response解析和错误语义；MSW handler只提供可控的网络边界。把handler带到Vitest/Storybook时注意宿主和生命周期，Playwright的page.route是另一种拦截，不能拿它当MSW Worker执行证明。

## 官方资料与证据边界

官方README原文固定到 `mswjs/msw` tag `v3.0.3` / commit `3560a94e00ae2054ce0ea3aaad9fc6fb3892b6bf`。该树只有根README和测试README，没有中文README，选择英文根原文，保存摘要、版本、日期与来源。官网GET响应的完整头已记录，未见嵌入限制头，但没有从Lab origin验证iframe，状态保持unknown和直达入口。

[官方Quick start](https://mswjs.io/docs/quick-start)、[start API](https://mswjs.io/api/setup-worker/start)与[固定发行源码](https://github.com/mswjs/msw/tree/3560a94e00ae2054ce0ea3aaad9fc6fb3892b6bf)共同用于核对；实际3.0.3类型确认msw/http、onUnhandledFrame和stop返回值。旧rest示例与先前大版本的选项名应按匹配版本重查。

本轮真实Node SDK和策略、浏览器运行与正式收据分别记录。局部Node通过不证明Service Worker、CSP、多会话隔离或清理ACK；公共历史CI也不替代当前逐条收据。未测项保持准确状态。
