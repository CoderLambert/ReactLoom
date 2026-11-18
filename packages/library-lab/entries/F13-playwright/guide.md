# Playwright 1.64.0：真实Chromium上的定位、HTTP分支和取消竞态

需要验证用户交互、异步状态与浏览器请求时选择Playwright；纯函数用Vitest，应用层Mock用MSW。这里是独立CLI工坊，不启动Library Lab或生产应用；网页只展示配方。真实测试page.setContent原创HTML，page.route拦截保留域名api.lab.invalid，不访问账号/生产API。route通过不能称后端或MSW契约通过。

## 完整迁入与执行

```bash
pnpm add -D @playwright/test@1.64.0 typescript @types/node
pnpm exec playwright install chromium
```

Linux首次缺系统库时使用官方`pnpm exec playwright install --with-deps chromium`，这是宿主安装操作，已有浏览器无需重复。复制五份fixtures.ts、playwright.config.ts、basic.spec.ts、business.spec.ts、advanced.spec.ts到独立文件夹，例如workshop/。不要并入主站配置，避免误跑产品套件/启动服务。只依赖Playwright Test与Chromium，不需React/Provider/CSS/env/服务。Playwright CLI可转译TS执行测试，但不代替TypeScript检查；TS/Node类型用于编辑与独立strict检查。

```bash
pnpm exec playwright test --config=workshop/playwright.config.ts workshop/basic.spec.ts
pnpm exec playwright test --config=workshop/playwright.config.ts workshop/business.spec.ts
pnpm exec playwright test --config=workshop/playwright.config.ts workshop/advanced.spec.ts
```

本仓库Lab命令面板cwd是packages/library-lab，workshop替换为entries/F13-playwright/examples；从仓库根则前加packages/library-lab。入口spec不是`node basic.spec.ts`，必须用Playwright Test CLI及显式config。配置testDir当前文件夹、retries0/workers1/Chromium/headless；只跑自己的spec，失败trace保留在examples/.playwright-artifacts，成功不保证有trace文件。tests里无retries或waitForTimeout，靠可观察状态与Promise屏障同步。

## 三个独立目标

basic一条真实浏览器测试：先getByRole heading确认fixture，空标题点击保存得到“请输入标题”，填写“本地新闻摘要”再保存得到“保存完成”。角色与可访问名称来自label/button/output（output隐式status），不是CSS id。fixture内部querySelector用于实现自己的页面，不等于测试定位器依赖DOM样式。

business八条：五个HTTP数据组合（200 ok:true成功，422/503可用message显示，200 ok:false/空422错误体显示响应格式异常），另有route.abort传输错误、非法JSON和挂起请求单飞。HTTP错误是正常fetch Response，不等于网络拒绝；json解码失败/非对象/array/不合适message单独报“响应格式异常”。响应message长度1–160文本，不执行HTML。finally恢复按钮；测试HTTP矩阵与坏JSON显式检查回到enabled。badJSON显式拦截计数1；transport计数1且不同文案。无重试掩盖失败。

挂起测试由真实route请求触发started屏障，再检查按钮disabled；同一evaluate内对真实button同步click两次，调用次数仍1。放行route后成功且按钮恢复。release在finally，无论断言哪一步失败也放开Promise；route catch仅兼容浏览器上下文销毁，不产生假成功，正常成功状态仍须断言。

advanced一条：先等old真实请求被route截获，再点击new，fixture AbortController.abort旧fetch并递增generation；new响应显示“新结果”，放开旧route并等待handler结束后仍是新结果。只证明“取消+代次保护”的组合可见合同，没有独立隔离证明generation或网络服务器真正取消计算。route.fulfill在旧请求已取消时可以拒绝，因此finally标记旧handler结束，外层finally总释放屏障；没有sleep凑时序。

## 夹具与生命周期边界

fixtures.ts中的HTML是专为教学写的页面，不是ReactLoom产品代码或生产安全模板；subscription是本地演示请求，racePage只接受测试可控JSON，不能直接当真实API schema验证器。api.lab.invalid必须保留route，不改真实主机；没有HAR/凭据/密钥。测试context由Playwright fixture在每用例后关闭，应用请求禁用态由finally释放，屏障也由测试finally释放。没有手工全局browser singleton要销毁。

这组实际Chromium执行是目标SDK场景，不是纯Node策略；但不覆盖Lab网页、生产站、所有浏览器、触屏/读屏/视觉或axe。单worker为了确定性，不是性能结论。官方README里的跨浏览器能力不代表本例执行过Firefox/WebKit。

## 证据与官方来源

本地三CLI/10用例原始argv/cwd/exit与输出保存在validation；没有有效既有F13运行receipt可复用，只有全局输入指纹不是执行，所以本轮实际运行当前源码。正式verification保持NOT_RUN至匹配receipt；不要拿仓库历史45项、目录里的trace或spec存在填PASS。Lab网页配方/来源展示由主控验收，不以它替代这些实际CLI。

固定官方v1.64.0 README/LICENSE原字节、完整tree候选/实际版本许可与官网HTTP见official；无官方中文README候选采用en。官网GET200不是可嵌入证据，未Lab-origin确认保持unknown。详见local-validation.md分层六门槛。
