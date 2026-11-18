# F12 Vitest 5.0.5 检索迁入

适用：纯函数、注入式请求分支、fake timers与取消竞态；真实Vitest CLI测试业务，不是HTTP连通/浏览器/IME/无障碍。固定5.0.5 MIT，Node ^22.12 || ^24 || >=26并满足Vite peer；现有依赖已安装无需改shared。

迁入vitest.config.ts + examples/domain.ts +所需三test.ts（全量五份），保持目录。配置root指向自身，include仅三文件，environment=node；不继承宿主Vite配置。domain不import Vitest，只有测试/配置依赖它。

仓库根实际命令：`pnpm --filter @reactloom/library-lab exec vitest run --config entries/F12-vitest/vitest.config.ts examples/basic.test.ts --reporter=verbose`，替换basic为business/advanced。迁出cwd自己项目根，`pnpm exec vitest run --config ./vitest.config.ts examples/basic.test.ts`。Lab 的 Demo 命令同样带条目专用配置，可在 packages/library-lab 中直接运行。

basic6验证URL；business9用进程内Response/部分double和vi.fn验证200/422/503/403/JSON形状/取消，after3写死非Retry-After；advanced4验证fake timer、晚到结果/错误与旧finally不能清新controller。真实runner总19，不另把业务policy重复计数。ts转译不是类型检查，独立strict-copy见validation。

保留signal调用前/请求后/JSON后检查、generation和controller身份finally，cancel重复安全但底层忽略abort可继续；组件集成者卸载需自己cancel。fake timers afterEach恢复；fixture timer和abort listener完成时清理，timer count0。不是SDK生产任务destroy或服务取消证明。URL仅HTTPS/无凭证，不是SSRF/ACL。

official固定7a825db…原字节README/LICENSE/包字段；无中文候选en。官网实200但XFO DENY所以blocked。实际CLI6/9/4、迁入编译和Biome证据local-validation，正式NOT_RUN；网页仅源码/命令展示，由主控检查，不启动CLI。
