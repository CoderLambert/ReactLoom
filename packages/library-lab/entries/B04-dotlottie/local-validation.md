# B04 本地质量整改与运行边界

主控独占B04，保留现有原创JSON和三目标；不改依赖/锁文件，不提交。完整组件浏览器挂载；React包0.20.0→Web0.81.0，peer17/18/19。正式sdk/build/browser均NOT_RUN，局部检查不冒充正式收据。

## 已实施

- 重排真实example、policy、tests，保留650ms本地业务fixture。新增当次SDK getter快照、合法帧定位、真实坏JSON/恢复；stop独立意图保留实际stopped语义。真实load/error监听；普通应用listeners对称清除，媒体/可见性/timer清除；wrapper拥有destroy，真实destroy只读标记旧Canvas，StrictMode替换同实例观察器。
- 中文围绕订阅成功动效，说明输入→播放器→实际结果，三实验目标独立，删除维护历史/未实现API堆砌。明示local JSON仍需固定版本CDN WASM、SSR完整客户端挂载前提；fixture/policy/SDK边界清楚。
- 实际官方根/目标目录只有README.md，包manifest0.20.0；固定react标签解引用commit e34f2cf2dc609ebae482615f64be4dee4218a4eb，选packages/react/README.md原文11735B，SHA5b8263be74ae7e5bd91155c66eb688f82954a7e3d6c205cc4949b86bfc86235c。官方GET与头/时间/package完整保存在official/source-audit.json，fetch脚本可复核；未翻译改写。
- 包manifest声明官网GET200，XFO DENY且无frame-ancestors覆盖，blocked+直达；不是iframe load推断。

## 实际命令与局部检查

| cwd | 命令 | exit / 证据 |
| --- | --- | --- |
| repo根 | python packages/library-lab/entries/B04-dotlottie/validation/fetch-official.py | 0，官方4项+官网请求，原始记录official/source-audit.json |
| repo根 | node --test packages/library-lab/entries/B04-dotlottie/tests/playback-policy.test.mts | 初次1(policy-red.txt)，clampFrame缺导出；实现后0，4/4，validation/policy.txt |
| packages/library-lab | pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B04-dotlottie/examples/demo.tsx | 0，validation/typecheck.txt |
| packages/library-lab | pnpm exec biome check --write entries/B04-dotlottie/examples entries/B04-dotlottie/tests entries/B04-dotlottie/library.json entries/B04-dotlottie/verification.json entries/B04-dotlottie/official/source-audit.json | 初次1(非法pre aria-label、scene依赖lint)保留biome.txt；改普通pre与说明scene依赖后0，8文件，biome-fixed.txt |
| repo根 | python packages/library-lab/entries/B04-dotlottie/validation/check-metadata.py | 0，validation/metadata.txt，4源/3目标 |

操作命令期间两次临时Python误用了repo相对路径而cwd在Lab，FileNotFoundError；已以正确cwd重做，未造成文件变更/覆盖。这些不是SDK通过或失败证据。

## 六项检查点

| 项 | 当前结论 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | PASS 静态/版本源码 | 实际包类型及0.81引擎源、同步普通实例API与WASM默认URL；stop/pause分离。 |
| 解释清楚 | PASS 静态 | 三实验输入/操作/getter输出与fixture界限对应真实源码。 |
| Demo有用 | NOT_RUN 待新候选浏览器 | 三目标已实现；旧candidate09环境探针仅证明旧版本本地JSON+CDN可运行，不代替新代码。 |
| 源码可迁移 | PASS 静态/类型 | 4源齐、原创JSON、无Lab alias、浏览器前提/清理完整；不硬编码.pnpm。 |
| 官方来源可靠 | PASS | 上游原文、版本、commit/path/语言/时间/hash及首页限制齐。 |
| 结果可复核 | NOT_RUN 待新候选浏览器和非作者复核 | policy4只规则；真实解码、Canvas/状态、错误恢复、timer取消/销毁需公共e2e实测。非作者quality_f05只读复核无P1/P2，P3命令表已改可执行脚本。 |

候选浏览器源：packages/library-lab/e2e/quality-remediation-dotlottie.spec.ts，真实WASM响应+Canvas绿像素/实际帧、播放暂停停止、业务减少动态/卸载timer、frame/speed/media/坏JSON恢复/destroy事件。不mock SDK/Canvas/时钟。默认Playwright焦点模拟让原生visibility探针持续visible；已定位并以独立临时Chromium+connectOverCDP noDefaults观测可信hidden/visible事件，公共第4项将验实际后台暂停/手动意图，不改写document.hidden或派发假事件。真实OS IME/设备/SSR/Worker/GPU均未覆盖。

## 主控candidate10真实浏览器闭环

真实Canvas/WASM四场景+官方展示5项通过：0.81.0 CDN实际200、原创JSON60帧/2秒/实际非空绿像素、play/pause/stop getter、业务减少动态与650ms任务卸载取消、frame30/speed1.5、动态偏好覆盖、真实坏JSON错误→恢复、旧Canvas真实destroy事件。独立临时Chromium native hidden暂停真实getter帧不前进，回来恢复且手动暂停不被覆盖，四次事件isTrusted均true。

非作者独立复核无P1/P2；P3命令表改成实际脚本。初始两项失败只是output隐含status导致测试role多匹配，改p[role=status]重跑2项通过，未改生产源码或削弱断言。

候选2182输入SHA25b58acba7305fb7dc70bd492e23c6056c21064e81cf07098cd339a5786297bf：lint/type/build/catalog0且changed=[]。原始和定向日志在docs/library-lab/evidence/quality-upgrade/candidate-10，均有实际argv/cwd/exit/dist绑定和产物副本；不隐式build。非作者六项与源码/文档/官方已闭环，本地content_done；正式sdk/build/browser仍NOT_RUN待干净授权提交及recorder。
