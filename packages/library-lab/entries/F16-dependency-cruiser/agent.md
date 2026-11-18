# F16 dependency-cruiser工程复用

18.5.0/MIT，源码模块边/方向/环，不是Knip未用依赖或bundle体积。隔离workspace，不能扫生产树。先读guide/verification/实际sourceFiles。

入口三level固定basic/src/main.js、business/src/domain/summary.js、advanced/src/first.js。原TS fixture在TS7解析不可用导致modules0（真红日志），现等价原生ESM JS；18.5要求typescript>=2<7，成功不证明TS7/类型导入/别名。Node engines ^22||^24||>=26。

pnpm add -D dependency-cruiser@18.5.0；保留run.mjs/cli.mjs/workspace/config.cjs/所选src；verify还需verify.mjs/result-policy.mjs及全部3src，13运行文件。无React/env/server/浏览器。复制结构后node examples/run.mjs basic；Lab cwd packages/library-lab前缀entries/F16-dependency-cruiser，根再前加packages/library-lab。

cli从installed main定位真实manifest.bin.depcruise，以process.execPath执行且cwd固定workspace；避免深目录pnpm exec找不到bin，版本非18.5立即拒绝。level/reporter白名单，无任意shell。每次60s/maxBuffer8M，子进程退出无常驻资源。

from.domain→to.ui禁止，main→domain/ui合法；from{}→to.circular是真环。json本次三个进程都0（包含错误），run透传json不等于架构通过。verify每level json结构+独立err退出，basic0/business1/advanced1是预期；外层verify0表示合同匹配。保留双报告器/非空modules/summary计数和确切rule名。raw记录全stdout/stderr/command/cwd/status，不拿purepolicy当CLI。

formalNOT_RUN，实际六CLI/策略与迁入raw在local-validation；主控网页仅展示配方不是运行。官方固定原文/license/HTTP见official；公开JSON前检查绝对路径/环境，勿上传业务私有图。
