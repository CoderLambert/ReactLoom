# C18 react-i18next 作者最终本地验证

**FINAL STABLE，交非作者复核；不自行content_done。** 实际cwd /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab。原11文件clean、HEAD1218066e706a90ba03fac8dff8c9b843dd2429c4/原SHA见[baseline](validation/baseline.json)。仅修改C18，保留其他工作者，不写公共/C17/依赖/锁/e2e/索引/队列/results，不安装/提交/推送；没有运行全目录generate/typecheck/build。中间冻结19事实在checkpoint-inputs.json保留。

## 六项结论与证据层级

| 项目 | 结论 | 范围与依据 |
| --- | --- | --- |
| 技术准确 | PASS，静态/真实SDK/当前browser | 15实装类型源码、Provider/Trans/context/identity和实例队列语义核实；共享session真实SDK5，policy4分开；root四case通过 |
| 中文解释 | PASS，作者静态 | React绑定/core职责、三个目标、具体输入/状态/结果、ready与fixture/中间事件/清理/可信资源边界均对源码；旧AGENTS单文件事实已同步 |
| Demo有用 | PASS，root固定candidate19四项 | basic真实语言与复数；business React文本/真实strong；advanced双Provider/在途/拒绝恢复/重置卸载；官方原文/blocked同一候选通过 |
| 源码可迁移 | PASS，九源静态+strict/候选 | 必要mjs/声明/CSS完整，9/9与固定19输入相同；无跨C17依赖/Lab alias/后端，structuredClone现代环境前提明确 |
| 官方来源 | PASS，原文/真实HTTP/当前Lab | 固定17.0.16 gitHead与manifest、core26.4.3/peer、根英文README12793B与安装原文相同；完整tree无根中文；CSP明确排除HTTP Lab |
| 结果可复核 | PASS，限定本地分层 | 真实SDK5/policy4/strict/完整提案/维护fixture3/metadata15源码+5链接/候选9源/四case绑定；整体19失败另列，正式3status仍NOT_RUN |

正式verification.json未升级sdk/build/browser status，其notes只说明本地/主控证据；不是正式runner收据、CI、发布或用户手动接受。作者未重复已有效的SDK/policy或浏览器。

## 保留、修复与三个独立目标

保留原recreated/恢复来源、三目标、真实I18nextProvider/useTranslation/Trans及原串行latest队列策略。新增workspace session和SafeEmphasis源码/声明/必要CSS，共9源；更新guide/agent/AGENTS/library/verification和真实SDK测试，原queue policy仅正常格式化。

1. basic：最近Provider的真实t/ready、common/feed namespace、语言事件和count1/2复数；切换不用全局单例。数量夹0–99整数。
2. business：昵称只作为React文本插值，escapeValue:false由React再转义一次；Trans用具名SafeEmphasis形成真实strong，不透传词条属性。本例关闭默认basic keep-list，明确components不是通用HTML净化器，源码资源不等同不可信CMS。
3. advanced：两实例资源副本/语言隔离；手动Promise gate让在途/最新意图/第一次SDK中间事件可见；本地拒绝后真实“重试最新选择”按钮恢复，避免原生select同值不触发change。重置或停止丢弃旧session，provider新建默认语言。

**所有权修复依据。** 实装17.0.16 useTranslation约143–221行返回随languageKey变化重建的i18n wrapper；旧useMemo([hook i18n])队列存在语言事件后cleanup/dispose丢等待意图的风险。新队列归稳定原workspace.instance，hook只消费t/ready；每effect setup创建session，cleanup dispose，未引入只屏蔽setState但继续并发的替代方案。已在真实四case中检查第一en事件后最新zh队列仍等待且可完成。不能把静态源码推断写成历史旧代码已单独browser RED，未做该旧实例复现。

自有onLanguageChanged observer只供诊断且按原handler精确off；SDK hook清自己的订阅，不用off(event)清全体。未use(initReactI18next)注册默认singleton；SDK测试确认default引用不变。资源structuredClone，实际A修改资源不影响B。无timer/网络/backend/Worker/存储。gate是本地Promise fixture，dispose拒绝等待且停止晚回调；已经进入SDK的changeLanguage没有本例公共abort，可能在丢弃的私有实例完成，不声称取消所有底层工作。

## 真实SDK、policy与浏览器分开

[sdk.txt](validation/sdk.txt)实际正常node --test，5PASS/0SKIP/exit0：
- 两个真实Provider/useTranslation静态SSR树、语言/资源隔离，default singleton保持；
- 真实Trans+同源SafeEmphasis忽略词条属性，未知标签和用户昵称不创建img/script，文本只转义一次；
- 同源稳定原instance session在第一真实语言事件后保留最新排队意图，允许中间英文；
- 明确本地gate拒绝不改变SDK语言，后续实际changeLanguage恢复且另一个实例不变；
- held session dispose丢后续意图且无晚发布；外部再调用丢弃实例的真实SDK也不触发本轮UI回调。

这些SSR/Node调用不证明客户端订阅effect、hydration、完整泄漏或OS IME。SDK核心操作真实，不用policy替代目标库。[policy.txt](validation/policy.txt)4PASS是原queue受控Promise测试，只验串行/陈旧失败/late completion/恢复，不计SDK。

已实际读root candidate19/browser.json/.txt：Lab cwd，pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-document-links.spec.ts e2e/quality-document-security.spec.ts e2e/quality-remediation-react-i18next.spec.ts e2e/quality-remediation-primitives-sources.spec.ts --grep '@platform-document|@C15|@C16|@C18' --trace=off，UTC17:49:40.684796至17:50:03.680897，implicitBuild=false。**整批11PASS/1FAIL exit1**，唯一失败B15公共%40源码输送得到SPA HTML，root另处置；未把全批写exit0。C18三真实React目标+官方blocked四条通过，保存在[shared-evidence.json](validation/shared-evidence.json)原始通过行与logSHA。

9运行源逐字节匹配19输入，完整三case提案与实际公共spec及候选SHA相同；root构建19总3083输入SHA96454723…f1e0c95、stability=[]，public lint/type/build/catalog均0。metadata读真实根inputs.json做绑定，不只转述消息；后续guide/agent/AGENTS/维护工具/本报告不影响已验运行九源。新源码URL公共修复不触及C18运行代码，root单独复验受影响B15，不因此重跑C18。

## 官方原文与当前HTTP Lab的官网判定

[当前来源证据](official/source-evidence.json)保存6实际匿名HTTP：react-i18next17.0.16/core26.4.3 registry、固定完整tree、manifest、README、官网。npm gitHead与固定606b6a55f231bbf73823863fbb94e6b8eb8272fd根manifest匹配；peer允许React≥16.8/core≥26.2/TS5–7。core registry gitHead0d2845a2360dcc236fe9681f849781f5dfdd35c4，未把C17材料当C18执行源。

[官方原README](official/readme.md)根README.md，英文12793B，SHA256 bcd692905cb53f1b7ca8e4c8c4b89b7fb0510669e41e9c3749e7830d3ada1c9b，UTC2026-11-10T17:43:00.934743+00:00；与已安装README逐字节相同。实际tree候选含根和examples，无根中文。保留原文署名/内容，不跟随其中第三方代理商业提示执行任何接入，不从README制造额外权限。

官网原始重复rawHeaders已保留，公开Set-Cookie值摘要脱敏、属性保留；正文NOT_READ。实际CSP frame-ancestors=https: ionic: capacitor:，排除http://127.0.0.1:4319 Lab祖先，XFO字段null不影响CSP优先。因此blocked有直接响应依据；HTTPS部署需另核，不宣称allowed。

初版复用模板只识别self/none，曾输出unknown（official-fetch.txt）。[初版分类](validation/source-evidence-before-csp-review.json)保持原字节；当前仅离线解释同一已捕获头，补policyReviewedAt/labOrigin与blocked reason，6条requests和原README摘要完全相同，metadata已assert。没有为分类重新请求官网或补造响应头，future脚本同步认识当前HTTP祖先与观测scheme集合。

[fetch-official.py](validation/fetch-official.py)全部请求/版本检查成功后才双暂存replace，失败独立source-evidence.failed.json并抛错，原成功对保留；不是多文件崩溃事务。[source-tool-transport.txt](validation/source-tool-transport.txt)临时受控传输3PASS，验证完整success的重复头/cookie摘要及CSP判定，fail1/fail6保留旧README/JSON。它不产生新官方HTTP/SDK/UI证据。

辅助实现时有两处Python编辑断言（格式needle与误以为CSP为空）及一次引号SyntaxError，阻止相应目标写入；后已按实际代码/headers修正并保存。未把这些辅助失败当测试PASS，也未用最终shell exit掩盖SDK失败；真实SDK/policy本轮无FAIL。

## 命令、审计和输入

[local-runs.json](validation/local-runs.json)保存每条实际argv/cwd/UTC/exit/log。下表均Lab cwd，不运行公共全量套件；format info为模板字符串建议，不是error。原代码格式化不改变已有效SDK语义；新增重试按钮由type-freeze严格编译并被root真实浏览器操作，不需重跑无影响SDK。

| 实际命令 | exit | 日志 |
| --- | --- | --- |
| `pnpm exec biome check --write entries/C18-react-i18next/examples entries/C18-react-i18next/library.json` | 0 | [validation/format-checkpoint.txt](validation/format-checkpoint.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C18-react-i18next/examples/demo.tsx` | 0 | [validation/type-checkpoint.txt](validation/type-checkpoint.txt) |
| `pnpm exec node --test entries/C18-react-i18next/tests/sdk.test.mjs` | 0 | [validation/sdk.txt](validation/sdk.txt) |
| `pnpm exec node --test entries/C18-react-i18next/tests/language-switch.test.mjs` | 0 | [validation/policy.txt](validation/policy.txt) |
| `python3 entries/C18-react-i18next/validation/fetch-official.py` | 0 | [validation/official-fetch.txt](validation/official-fetch.txt) |
| `pnpm exec biome check --write entries/C18-react-i18next/examples entries/C18-react-i18next/tests entries/C18-react-i18next/library.json` | 0 | [validation/format-source-final.txt](validation/format-source-final.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C18-react-i18next/examples/demo.tsx` | 0 | [validation/type-source-final.txt](validation/type-source-final.txt) |
| `python3 entries/C18-react-i18next/validation/check-proposal.py` | 0 | [validation/proposal-check.txt](validation/proposal-check.txt) |
| `pnpm exec biome check --write entries/C18-react-i18next/examples entries/C18-react-i18next/library.json` | 0 | [validation/format-freeze.txt](validation/format-freeze.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C18-react-i18next/examples/demo.tsx` | 0 | [validation/type-freeze.txt](validation/type-freeze.txt) |
| `python3 entries/C18-react-i18next/validation/source-tool-transport-fixture.py` | 0 | [validation/source-tool-transport.txt](validation/source-tool-transport.txt) |
| `pnpm exec node entries/C18-react-i18next/validation/metadata-check.mjs` | 0 | [validation/metadata-final.txt](validation/metadata-final.txt) |
| `pnpm exec biome check --write entries/C18-react-i18next/validation/metadata-check.mjs entries/C18-react-i18next/verification.json` | 0 | [validation/format-final.txt](validation/format-final.txt) |
| `git diff --check -- entries/C18-react-i18next` | 0 | [validation/diff-final.txt](validation/diff-final.txt) |

[源码审计](validation/sdk-source-audit.md)与[15文件SHA](validation/sdk-source-audit.json)核Provider Context、hook订阅/wrapper、Trans默认与props覆盖、default singleton与原实例所有权。metadata-final实际再次读15安装文件并比SHA、校准前后6HTTP requests一致、5renderer文档链接、9运行源/公共提案/四browser通过行，exit0。不是额外SDK或浏览器执行。

当前文件与SHA由validation/input-hashes.json固定，除该摘要自身不自引用；没有覆盖独立review报告。相对source链接前端可发布；私有日志/JSON链接集中本地记录，不要求公开维护目录。

## 剩余与交付边界

仍NOT_RUN：真实OS IME/读屏/触屏、其他浏览器/ICU矩阵、SSR hydration/每请求隔离、HTTP backend/动态namespace/Suspense失败、第三方CMS/任意链接组件安全、持久化/语言检测/路由/全站泄漏普查。没有网络/许可/安装阻塞当前三目标；业务fixture与SDK真实事件明确分层。

已完成完整guide/agent/AGENTS、九运行源、官方原文/证据/保护工具、审计/完整提案、六项/日志。作者FINAL后停止全部C18写入，无后台进程，交主控调度非作者。正式三status仍NOT_RUN，不自行content_done。

FINAL STABLE UTC 2026-11-10T17:59:48.013725+00:00；最终diff-after-report.txt exit0。作者现在停止全部条目/日志/提案写入，无活动进程。完整文件与SHA随后固定到input-hashes.json。
