# F13 Playwright独立CLI复用

真实@playwright/test1.64.0/Apache-2.0与Chromium，测试原创setContent HTML，不启动Lab/生产站，不访问账号。只展示命令的Lab页不是SDK执行；本条实际独立config启动浏览器才是SDK场景。

迁入五份fixtures.ts/playwright.config.ts/basic.spec.ts/business.spec.ts/advanced.spec.ts到workshop，pnpm add -D @playwright/test@1.64.0 typescript @types/node；已有Chromium可复用，否则pnpm exec playwright install chromium（宿主系统依赖另处理）。运行pnpm exec playwright test --config=workshop/playwright.config.ts workshop/basic.spec.ts，其余换business/advanced；Lab cwd packages/library-lab，实际前缀entries/F13-playwright/examples。不要node直接执行spec或并入主站config。无需React/env/CSS/server。

basic语义定位1条；business HTTP5+transport+坏JSON+挂起单飞=8条；advanced取消/旧route屏障1条，总10。retries0/workers1/headlessChromium；output隐式status，测试getByRole。HTTP非2xx不等于fetch拒绝，json格式/业务ok:true分别判定，响应仅文本；按钮finally恢复。routeMock不证明后端/MSW/真实网络。

屏障必须finally release；old必须先被截获，再new，release后等待oldhandler结束仍新结果。取消+generation组合合同，不把测试当独立隔离代次证明或服务器任务取消。挂起测试同步两次真实click，计数1。无waitForTimeout/retries补绿。保留api.lab.invalid/拦截，勿打生产地址或存HAR秘密。

Playwright fixture清context，trace retain-on-failure在本例.playwright-artifacts；trace存在不等于receipt。测试转译不代typecheck。实际三CLI/raw与隔离迁入见local-validation；纯policy0，目标Chromium SDK与Lab配方browser分层。official固定README/license/header原字节，formalNOT_RUN至匹配receipt。
