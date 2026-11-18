# C17 i18next：整改进行中

原11文件无diff，基线validation/baseline.json；实际安装26.4.3/MIT，TypeScript peer5/6/7，使用核心SDK而不引入C18绑定。保留现有串行latest队列及4策略测试。目标：基本实例t/插值/复数；实际本地namespace bundle与独立资源所有权；returnDetails回退/快速请求与生命周期。资源全为自写双语fixture，不是机器翻译、网络加载或服务端租户能力。

现有代码off了从未on的languageChanged，且文案“销毁实例”需收窄；新增真实事件订阅将逐一off所属callback。queue.dispose只阻止后续/晚commit，不取消SDK/网络；不提供不存在destroy。保留正式NOT_RUN，只写自有entry、不install/共享构建/公共/依赖锁/e2e/提交。最终六项/真实日志待补。

## 可编译INTERMEDIATE检查点（2026-11-10T17:44:09.159035+00:00）

7源/metadata已一致：独立factory复制资源、实际i18next languageChanged与store added注册和逐callback解绑、真实addResourceBundle双语channel fixture、committed-language getFixedT、保留原串行latest helper。实例不再宣称destroy；level/reset换所属Session。SDK内部事件数与UI commit分开，内嵌词典不冒充机器翻译/HTTP后端。

实际Lab cwd pnpm exec -- biome check --write只本条examples/tests/library，exit0/10文件；显式tsc入口ignoreConfig/noEmit/strict/bundler/react-jsx exit0；node --test tests/sdk.test.mjs真实5PASS/0SKIP；language-switch.test.mjs纯策略4PASS/0SKIP。日志/完整argv/cwd/UTC在local-runs。测试直接共享当前factory/fixture/observer，验证资源隔离/固定语言/SDK latest/所属解绑，policy只用自建deferred调队列，不当mock SDK通过。无客户端执行或全局资源普查。

尚未完成：guide/agent旧内容同步、官方固定README与raw头、安装源审计、metadata最终检查、完整3case浏览器提案/六项终稿。formal三status仍NOT_RUN；这是可编译中间点，不content_done。

**INTERMEDIATE STABLE：停止全部C17写入含源码/文档/日志/metadata，无后台任务。先限定接回C15链接/记录，之后按root授权恢复C17；候选冻结另听root明确release。**

## 19 release后来源/策略中间点（2026-11-10T17:54:35.403325+00:00）

源7文件/SDK5/policy4输入未动，复用有效结果。匿名固定来源捕获exit0/6真实GET，v26.4.3 tag/npm gitHead/manifest/安装版本一致，commit0d2845a2360dcc236fe9681f849781f5dfdd35c4；英语README.md5593B/SHA3964fe947138fb6369c58bbc7779eacc8877cf220d41db7647c9e4bd7c466966，无匹配中文候选，原文/完整raw头已保存。后续metadata/审计/中文/提案仍待补。

官网实际CSP frame-ancestors https: ionic: capacitor: 排除当前HTTP Lab4319，两HTTP目标写入派生解释；初工具只识self/none在原stdout记unknown，已依据同份raw头修正派生blocked及未来classifier，不重抓HTTP，不补造/改变原始headers。校正前后raw头sha相同记录在homepage-policy-correction.json；MDN frame-ancestors支持按scheme匹配父源。该结论不外推HTTPS部署，正式browser仍NOT_RUN。Python新脚本AST只读有效，完整维护传输fixture待后续，不冒称已通过。

**再次INTERMEDIATE STABLE：全部C17写入暂停，无后台任务，先限定收口C15已实际通过的官网展示记录，再按root授权恢复。**

## candidate20前带完整提案的中间检查点（2026-11-10T17:59:20.808967+00:00）

C15最终本地记录已另外收口停写；现恢复C17后补完整三Playwright case：basic真实t/插值/复数/转义文本/reset，business真实namespace双语fixture/added事件/新实例资源重置，advanced真实returnDetails回退、level新Session、两次快速请求/SDK事件与应用commit分开、390px/卸载重挂。没有SDK/后端/Intl/时钟/DOM mock或直接调用handler；真实OS IME/HTTP后端取消不在当前提案范围。proposal-format与proposal-types实际exit0，原始argv/cwd/UTC已在local-runs，浏览器仍NOT_RUN。

官方metadata已绑定26.4.3/固定0d2845a2360dcc236fe9681f849781f5dfdd35c4根英文README5593B/SHA3964fe947138fb6369c58bbc7779eacc8877cf220d41db7647c9e4bd7c466966。当前HTTP Lab被实际CSP https:/ionic:/capacitor:排除，metadata blocked；HTML200或iframe load不当allowed。新派生解释修正/raw头不变与future classifier AST有效，不重复HTTP。official metadata三JSON格式0、实际共享validateEntry单库schema0。

只读SHA核7生产源与candidate19完全一致；SDK5/policy4/入口类型复用有效结果，未重复。提案可交root随20真实运行，官方原文/blocked展示如接入也仍未执行。完整guide/agent终稿、14/更多安装源审计、维护传输fixture、最终metadata/publisher检查/六项/总摘要尚待release，不计content_done。

**INTERMEDIATE STABLE：现在停止全部C17输入写入（含guide/logs/metadata），C11/C15亦全部停写，无后台任务，供candidate20。等待root明确release后继续完整收尾。**
