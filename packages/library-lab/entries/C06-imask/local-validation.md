# C06 IMask 本地质量整改

实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`；定向检查cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，官方fetch和final/diff在仓库根。HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`；原11文件干净，原SHA与状态见[baseline](validation/baseline.json)。本条目owner=/root/quality_f05，保留他人工作；未改公共src/scripts/e2e/依赖锁/索引/queue/results，未install/提交/推送，未全目录生成/类型/构建或隐式浏览器build。主控candidate15中间点后明确release才继续。

正式[verification](verification.json) sdk/build/browser全部 **NOT_RUN**。本轮Node模型SDK4与公历策略3、静态来源/类型/提案检查分开；真实React视图/输入/光标/生命周期与整库运行均待root匹配候选。作者稳定不等于content_done。

## 目标、问题与实现

保留三个独立目标：basic固定编号的显示与业务值/中间编辑；business Number外观、归一化与精度；advanced Pattern填满与真实公历、普通中文备注。没有造第四业务层、后端、财务账本、RHF、async或持久化。

原代码真实onAccept/Pattern/Number与有效UTC公历helper保留。问题是原讲解容易把React“认一份值”读成value受控，实际上IMaskInput并未传value；几种值与complete没有真实观察，level可能沿用旧状态，源码排版/必要样式/官方原文缺失。本轮明确**SDK拥有输入DOM/光标，React仅存事件快照**，不把快照反写DOM；加入真实maskRef.value/unmaskedValue/typedValue/masked.isComplete与真实accept/complete计数，初始null，不伪造结果。

外层MaskSession key=level隔离状态，显式reset才增加input generation；普通按键保持节点。reset清本轮值/快照/计数/备注/组合观察，会重挂DOM，不承诺保焦点。Number/Pattern通过场景重新创建，未原地硬切模型。输入type=text与numeric/decimal inputMode显式，中文备注普通受控文本不套mask，组合协议只是观察，无提交快捷键，blur清状态。日期空/未满允许继续，完整但无效才aria-invalid。

五必要sourceFiles包含demo/example/calendar-policy.mjs/.d.mts/styles；正常排版、局部border-box/最大宽度/焦点/换行，不依赖Lab reset或alias。calendar仍setUTCFullYear回读，保留0–99年/闰世纪/0000规则，无机械算法重写。

## 六项检查点

| 维度 | 状态/证据层级 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（实际安装源码/类型与限定模型SDK） | 7.6.1两包/MIT，wrapper peer>=0.14仅声明；真实onAccept/unmask/complete/defaultNumber/destroy匹配源码。SDK4包括实际日期Pattern填满但公历失败，非React视图运行。 |
| 解释清楚 | PASS（作者静态核对） | 从输入问题→模型/视图/三值→三个操作目标→owner/迁移/清理；URL/数字外观不冒充业务有效、Number complete不当付款信号，维护历史移到本记录。 |
| Demo有用 | NOT_RUN（真实浏览器） | 三目标实现与完整三条提案齐，真实输入/光标/blur commit/字段语义/监听清理待root执行。Node不证明这些交互。 |
| 源码可迁移 | PASS（静态/有效严格入口类型） | 5文件及明确双包依赖，无Lab alias/网络/资产；SDK拥有maskedDOM，应用无timer/全局listener，wrapper源确实destroy自有mask。完整迁移宿主与hydration未测。 |
| 官方来源可靠 | PASS（固定双原文/完整HTTP） | v7.6.1/双npm gitHead/固定双包manifest同commit；完整tree八README无中文，主React原文2371B、附核心原文901B且安装README同sha。10实际200全头；官网无XFO/CSP但Lab-origin未测unknown。 |
| 结果可复核 | NOT_RUN（整体真实运行）；局部证据可复核 | SDK4/policy3/入口strict/完整提案strict/13文件Biome/metadata均exit0；具体cwd/argv/UTC/exit/log齐，不从模型或共享candidate15推正式PASS。 |

## 官方与实际SDK依据

[SDK源码审计](validation/sdk-source-audit.json)记录实际路径、两manifest与核心/React源码/类型8文件SHA及摘录。react-imask esm/mixin.js的maskValue按unmask选value/unmaskedValue/typedValue，_onAccept/_onComplete将真实maskRef交调用者；组件卸载destroyMask调用maskRef.destroy。核心InputMask.destroy只解绑view监听并删除el引用，HTMLMaskElement绑定/移除同身份keydown/input/beforeinput/compositionend/drop/click/focus/blur八种直接监听。其_listeners为对象，length=0不等于删除accept/complete键；destroy不调用_abortUpdateCursor，已排10ms cursor任务可能短暂存续，晚到由if(!this.el)return跳过。本例不长期保留maskRef，不能把卸载说成所有内部订阅/计时器立即清空。应用不全局删监听、不伪派事件清理。静态路径不是实际浏览器资源普查。

Number默认normalizeZeros=true/padFractionalZeros=false，真实模型测试1234.50→显示1,234.5/unmasked1234.5/typed1234.5；补显示零不改变归一化数据。Pattern日期真实模型接受2026-02-30且isComplete=true，helper拒绝，2024-02-29则两者均真。模型没有DOM资源，不调用并不存在的model.destroy。

实际官方仓库 **uNmAnNeR/imaskjs**，tag **v7.6.1**解引用commit **a02a14b642f70b335e24789e8a187857473a21a5**，双npm7.6.1 gitHead与固定双包manifest均一致。完整未截断tree八README无官方中文，优先React目标包，另存核心包，不拿根介绍替代两包文档。

- [主React原文](official/readme.md)：packages/react-imask/README.md，英文2371B，SHA256 `6d2a1d25943c4b0f0831d55a7cb566604db9d188a76767aba5efda5c9ba5460c`。
- [附核心原文](official/core-readme.md)：packages/imask/README.md，英文901B，SHA256 `c3bd23f1220ce2d6ea8c82c8e16748d0afc2d3a7f4b2c34218ffc49022d931ae`。

两快照与各安装README独立重算一致；原文未交格式器/翻译/拼接。同步日期、repo/ref/path/lang/version/hash与10请求的最终URL/status/完整响应头在[source-evidence](official/source-evidence.json)。匿名响应cookie值脱敏保留属性/valueSHA，没有发送或复用cookie、读取.env或使用凭据；脚本网络失败不替换成功快照。

官网https://imask.js.org/实际GET200，只取得完整头/正文NOT_READ，不捏造bodyhash；无XFO/强制CSP，未真实Lab-origin iframe所以unknown并保留直达。原预审web registry接口不可达但本次实际匿名GET成功，未把旧失败当版本事实。

## 实际命令、cwd与结果

[local-runs](validation/local-runs.json)保存完整argv/UTC起止/cwd/exit/log。除标注仓库根，以下cwd均Lab；类型参数完整保留，临时提案.check.ts核对后删除，仅.txt为提案交付。

| 实际命令 | exit/原始结果 |
| --- | --- |
| `pnpm exec -- biome check --write entries/C06-imask/examples entries/C06-imask/library.json` | 0，6文件，[format-intermediate](validation/format-intermediate.txt)。 |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C06-imask/examples/demo.tsx` | 0，实际入口，[types-intermediate](validation/types-intermediate.txt)；之后入口API/逻辑未变，复用有效结果。 |
| `python3 packages/library-lab/entries/C06-imask/validation/fetch-official.py`（仓库根） | 0，10匿名GET/双原文，[official-fetch](validation/official-fetch.txt)。 |
| `pnpm exec -- biome check --write`（examples/tests/library/verification/官方证据/SDK审计/metadata/临时完整提案） | 0，13文件，[format-final](validation/format-final.txt)，完整路径见local-runs。 |
| `node --test entries/C06-imask/tests/sdk.test.mjs` | 0，4PASS/0SKIP，[sdk](validation/sdk.txt)，原3模型+日期真实模型1。 |
| `node --test entries/C06-imask/tests/calendar-policy.test.mjs` | 0，3PASS/0SKIP，[policy](validation/policy.txt)，仅自建公历规则。 |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C06-imask/validation/browser-proposal.check.ts` | 0，[proposal-typecheck](validation/proposal-typecheck.txt)。后仅将open等待app/run明确可见，直接受影响提案格式/strict再0：[proposal-format](validation/proposal-format.txt)、[proposal-typecheck-final](validation/proposal-typecheck-final.txt)。 |
| `node entries/C06-imask/validation/metadata-check.mjs` | 0，[metadata](validation/metadata.txt)；共享schema/gate、3目标5源、双7.6.1/MIT、双README安装同hash、真实SDK审计与unknown/正式NOT_RUN。 |

最后只读范围核对与scope diff均exit0：[final-check](validation/final-check.txt)核5源/3提案/链接/双原文/无临时二进制，[diff-check](validation/diff-check.txt)为`git diff --check -- packages/library-lab/entries/C06-imask`；两条cwd仓库根、精确argv/UTC在local-runs。

一次检查编排最初在仓库根误用Lab相对entries路径，准备提案副本时FileNotFoundError，尚未启动任何SDK/类型命令；随后显式正确cwd才执行上述检查，不伪计SDK失败或重复PASS。没有隐藏失败后套正式绿状态。共享candidate15在中间点已由root构建，通过仅为主控证据，不替代本条目SDK/browser收据。

## 完整浏览器交接与剩余

[三条browser源码](validation/browser-proposal.txt)是NOT_RUN提案，root统一接公共e2e。basic真实键盘输入、maskRef三值/complete、setSelectionRange仅设置实际选区后真实Backspace/插入，证明同节点与业务值；显式reset验证旧input断开与其八种直接view监听归零、新控件可输入。business真实Number输入/Tab blur commit，比较显示/字符串/number，非model.resolve替代浏览器。advanced真实日期完整与公历/ARIA，普通中文备注无SDK监听、composition仅明确协议探针，390px真实overflow与停止/重跑默认状态。

监听观察在每个Playwright私有页面context里，仅包装原生add/remove调用来记录target/type/callback/capture同身份；原函数/回调照常执行，WeakMap不额外保留旧DOM。没有mock SDK、回调/返回值替换、合成masked输入、全局资源清空或browser force；这不是生产功能。只统计八种直接view事件，不能外推完整所有timer/订阅普查。

保留旧区域“IMask真实SDK示例”、编号/金额/事件日期/中文备注、重置当前控件与imask-value；新增c06-workshop data-level/generation、c06-events、c06-snapshot、c06-date/ime。SDK值不是JSON里预设成功串；null明确尚无事件。

仍NOT_RUN：以上真实React输入/光标/监听归零、实际OS IME/移动键盘、可信剪贴板粘贴/自动填充、原生undo/redo、SSR hydration和超出八事件的完整资源普查。没有后端/RHF/async请求/持久化或精确财务运算，不算已实现能力。独立六项复核与真实browser由root安排，formal三NOT_RUN；授权干净提交/正式收据未执行，不提交推送。

## 文件与稳定交付

原example/demo/calendar helper/声明/两测试正常排版，保留算法并增加一个真实日期模型对照；新增scoped CSS、固定双README与来源、fetch/metadata/SDK源码审计、完整三case提案与命令日志/摘要，重写guide/agent/library/verification但不升级formal。AGENTS未改。旧中间点记录保留[intermediate-validation](validation/intermediate-validation.md)；完整文件清单与输入摘要在validation/final-files.txt和validation/input-hashes.json。

FINAL STABLE：UTC `2026-11-10T15:56:59.797714+00:00`。全部C06写入（含guide/log/metadata）停止，无后台任务；真实browser与formal仍NOT_RUN，交root独立复核与匹配候选。

独立复核P2限定修正（UTC `2026-11-10T15:58:50.642324+00:00`）：quality_e11核实上述destroy事实后，经root明确release，只收窄guide/agent/本记录与SDK审计结论，记录完整DOM监听解绑与内部订阅/已排cursor任务的不同边界；示例、官方原文与SDK/策略输入未变，不重跑有效检查。更新摘要后再次停止全部作者写入，待独立复读。


## candidate16真实移动溢出：作者定向修复

UTC `2026-11-10T16:19:14.597049+00:00`，root明确暂停C12后交回原作者C06，仅修390px真实横溢出。C12已保存INTERMEDIATE并全部停写，不交叉变更。

主控candidate16的basic/business/官方展示PASS保留；advanced在原严格 `scrollWidth <= clientWidth + 1` 断言FAIL（完整原日志在docs/library-lab/evidence/quality-upgrade/candidate-16/browser.txt），当时后续卸载断言尚未执行，不能称advanced整目标已通过。

作者用[mobile-overflow-probe.mjs](validation/mobile-overflow-probe.mjs)在现有固定candidate16 dist/127.0.0.1:4319、私有真实Chromium context重现同输入/视口，无build/SDK mock。真实app x41/right349/clientWidth308，scrollWidth324；唯一越界元素是含value/unmaskedValue/typedValue/isComplete连续英文API名的普通p，段落client308/scroll324/overflowWrap normal，输入/label均未越界。[原始真实red](validation/mobile-overflow-red.txt) exit1保留准确元素/几何和严格断言。

源码仅增加 `.c06-workshop { overflow-wrap: anywhere; }`，通过继承使该连续说明可断行；没有overflow:hidden、裁切说明、缩小测试视口或放宽断言。对同固定dist叠加**实际新entry CSS**的单变量因果探针为[mobile-overflow-css-green](validation/mobile-overflow-css-green.txt) exit0：相同app client308/scroll308、overflow元素为空、computed overflowWrap anywhere。它证明CSS根因/局部修复有效，**是旧dist+新CSS诊断，不冒充新构建完整advanced PASS**；root下一候选真实回归仍必要。

实际命令cwd仓库根：`node /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab/entries/C06-imask/validation/mobile-overflow-probe.mjs` exit1；同命令加`--candidate-css` exit0。首次准备探针时cwd误用路径、MODULE_NOT_FOUND在浏览器前发生，单独保留[准备失败](validation/mobile-probe-cwd-failure.txt)，不当bug red。全部argv/UTC/cwd/exit在local-runs。

受影响检查仅局部CSS/诊断脚本Biome exit0见[mobile-fix-format](validation/mobile-fix-format.txt)，入口strict exit0见[mobile-fix-types](validation/mobile-fix-types.txt)。Biome只正常排版探针，不改其断言；诊断原始输出与命令保留。没有重跑不变SDK4/policy3/已PASS的两个浏览器目标；未改公共e2e/依赖/锁/正式状态。探针浏览器finally关闭，未启服务、未隐式build。

六项增量：技术/解释/迁移仅CSS断行范围修正，旧真实移动FAIL保留；局部诊断GREEN可复核，新构建完整browser仍NOT_RUN。正式sdk/build/browser不改。该回修写毕再次FINAL STABLE，停止全部C06写入，交root真实新候选验证；随后按已授权恢复C12。


## candidate17 本地六项闭环（2026-11-10T16:43:53.991630+00:00）

主控在固定candidate17 dist真实执行受影响advanced，整次命令12PASS中C06仅1项，该项完整PASS：390px严格无横溢出、日期完成与公历拒绝/ARIA、中文备注/合成协议边界、所属八DOM事件解绑、reset/unmount。真实日志/命令与entry生产源绑定见[本地绑定](validation/browser-binding.json)，公共原日志candidate-17/browser.txt，exit0、implicitBuild=false。candidate16的basic/business/官方展示三项PASS继续复用，未重复SDK4/policy3或另两场景。旧candidate16移动FAIL与旧dist+CSS因果诊断保留，后由新构建完整advanced关闭。

六项本地结论：技术准确、中文讲解、三个真实目标、必要源码迁移、双官方固定原文/官网unknown、可复核结果均已完成作者与非作者检查及对应本地运行闭环；这不是正式提交收据。官网unknown展示PASS不意味着官网允许iframe。先前“真实三目标NOT_RUN”的历史记录由本节新证据更新，OS IME/移动键盘/触摸/读屏/SSR与超出八事件完整资源普查仍NOT_RUN。formal sdk/build/browser全部维持NOT_RUN，无源码改动或复测。记录收口后全部C06写入停止，恢复C12。
