复核UTC：2026-11-10T18:05:01.393478+00:00

# C18 react-i18next 独立六项复核

Reviewer quality_f05，非作者；独占仅本报告。按root要求保持C17/C15等输入停写，未修改C18运行源、官方资料、作者记录/摘要或公共文件，未运行SDK、policy、UI、HTTP、全目录检查或安装。已读实际九源、AGENTS/library/guide/agent/verification、两测试与原始结果、官方快照/前后CSP记录、安全抓取/受控传输、15安装文件审计、完整提案及root固定19日志。

**结论：无残留P1/P2；六项在当前本地已验证范围可接受。** 核心/React职责、稳定原实例所有权、SDK hook语言wrapper、Trans可信范围、手动gate与取消边界、官方版本与HTTP Lab阻止依据均对得上实现。正式sdk/build/browser三项NOT_RUN继续独立，不把本地SSR或四case升级为正式收据。

## 六项逐项

| 项 | 独立结论 | 证据/限制 |
| --- | --- | --- |
| 技术准确 | PASS，本地实际库与当前浏览器范围 | 实装react-i18next17.0.16/core26.4.3/MIT；真实Provider/useTranslation/Trans、原实例session与精确off；SDK5及policy4分层。 |
| 中文讲解 | PASS | 从core/React职责到三个具体目标，再ready/资源/实际中间语言/队列owner/Trans props/迁移/清理和未测范围；没把fixture当机器翻译或后端。 |
| Demo有用 | PASS，root固定19四项 | basic真实hook/复数；business React文本/实际strong；advanced两Provider隔离/在途/拒绝重试/reset/unmount；官方固定原文/blocked展示另1项。 |
| 源码可迁移 | PASS，九源/strict及源绑定 | workspace/queue/SafeEmphasis各mjs+d.mts、example/demo/CSS完整；不跨C17运行源，无Lab alias/远程资产，structuredClone前提清楚。 |
| 官方来源 | PASS，匹配原文与当前HTTP Lab限制 | 固定17.0.16 gitHead/manifest、英文README12793B、无根中文候选、安装字节一致；6原始HTTP/raw列表与派生blocked有依据。 |
| 结果可复核 | PASS，限定本地层级 | 作者摘要47记录/安装15文件/候选9源独立SHA0差异；SDK5/policy4/严格类型/提案/维护3场景原日志有效；19全批exit1与C18四PASS分开。 |

## 实际代码与SDK根因

1. workspace.mjs的createWorkspace每次createInstance，resources结构化复制，两实例语言/资源互不共用。Provider拿workspace.instance，LocalizedPanel只消费useTranslation返回t/ready；没use(initReactI18next)去改变默认module singleton。SDK测试实际比较getI18n前后及A资源修改不影响B，不以两个不同浏览器realm替代同进程实例隔离。
2. 实装src/useTranslation.js:143–221的languageKey包含language/resolvedLanguage/languages，createI18nWrapper用原实例property descriptors建wrapper，语言状态变动会换identity。队列不能以hook wrapper作为effect owner。当前queue/session从稳定原workspace.instance创建，effect每setup新建、cleanup dispose，真实候选测试在第一en事件发生后仍保留最新zh等待意图。作者没有伪称旧实现已单独browser RED。
3. hook自己用useSyncExternalStore，src/useTranslation.js:70–75给bindI18n/store注册wrappedCallback并在cleanup以同一handler逐事件off。应用observer在workspace里只onLanguageChanged一条，dispose用同一引用off；不off(event)清全体。SDK5最后项对已丢弃实例再真实changeLanguage不产生应用notify，证明该callback边界；不外推SDK所有资源泄漏已测。
4. 手动gate是目标SDK调用前的本地Promise。第一次请求en/后续zh串行，释放en后SDK会发真实中间en事件，React hook随之显示English；最新commit仍等待zh。该行为不是原子语言事务或服务端版本回滚。reject是fixture在调用SDK前拒绝，不说成网络/SDK服务故障。重试最新选择是实际按钮重新request，避免select同值不会onChange；关闭manual同时放行已held请求，源码与实际测试相符。
5. dispose先active=false、queue.dispose、精确off，再reject所属held Promise，switcher已有catch/active保护无晚UI发布。已经进入changeLanguage的调用无本例可用公共abort，可能在丢弃私有实例继续；文档未把alive/dispose当全部底层取消。应用无timer/backend/网络/Worker/存储，不全局清任务。

## Trans与文本边界

实际TransWithoutContext会cloneElement，翻译节点attrs可能覆盖映射组件props；默认basic标签支持也不是安全白名单。workspace显式transSupportBasicHtmlNodes=false、keep-list空；SafeEmphasis仅解构children并返回源码固定strong/data-testid，完全不转发翻译属性。用户昵称只进入普通t的React文本，escapeValue:false由React转义一次；不把此选项带去innerHTML或任意HTML模板。

SDK第二项实际以Provider/Trans SSR渲染同源SafeEmphasis，用词条title属性与未知img、用户img字符串验证无DOM img/script/属性透传且文本未双重编码。它不是通用HTML净化器证明，代码与文档始终限定源码词条和少量受控组件；不可信CMS、链接URL/事件或任意组件映射需另定信任规则。真实browser business又检查昵称literal文本、STRONG节点和跨语言内容，不靠SSR代替客户端。

## 验证层级与实际运行

原SDK日志正常node --test exit0/5PASS/0SKIP：两个实际Provider/hook SSR与单例/资源隔离；真实Trans+同源安全组件；原实例session经过真实语言事件保留队列；本地gate拒绝与真实SDK恢复；dispose后实际调用不晚发布。SSR不运行客户端订阅effect，也不证明hydration/请求隔离。policy4为原deferred队列策略，不初始化或替换i18next后冒称SDK。

本审查标准库只读SHA复算作者input-hashes中47记录全部0差异；15个实际安装源码/类型文件0差异；九sourceFiles与candidate19 inputs全0差异；entry提案与实际公共spec逐字节相同。只读复制/哈希不是重跑套件。

root candidate19/browser.txt SHA **2ac374c02a400a494e97bd7473c230a4a9edf4834d6ec46cdde310dc231cfc22**，实际Lab cwd、固定dist/implicitBuild=false。整轮11PASS/1FAIL、exit1，公共B15源码URL失败不冒称全批绿；**C18真实三目标+原文/blocked展示四条均PASS**，不混入C15/C16/公共项。shared-evidence记录与原日志通过行吻合。advanced实际检查first en事件后最新zh继续等待、B完整snapshot不变、本地拒绝后真实retry恢复、held reset、390px与卸载重挂；不以无pageerror当完整泄漏证明。

## 官方与抓取证据

根README.md为i18next/react-i18next@**606b6a55f231bbf73823863fbb94e6b8eb8272fd**，npm17.0.16 gitHead与固定manifest17.0.16匹配，core registry26.4.3另核，不把C17执行记录借来充数。完整tree优先根候选只有README.md，无根中文。原文**12793B**、SHA256 **bcd692905cb53f1b7ca8e4c8c4b89b7fb0510669e41e9c3749e7830d3ada1c9b**，本次与安装README逐字节相同；原文未格式化/翻译/拼接。guide使用固定官方URL和已允许源码路径，metadata已有实际publisher五链接检查，不把私有维护文件伪装成网页链接。

6次实际GET状态均200，原始重复rawHeaders/匿名Cookie值hash与属性、最终URL/日期/body READ或NOT_READ均保存。官网https://react.i18next.com/实际强制frame-ancestors **https: ionic: capacitor:**，排除当前http://127.0.0.1:4319的祖先；XFO缺失不覆盖CSP。因此blocked可由真实头支持；HTTPS部署需重核，blocked展示PASS不等于已测iframe正文。

初版stdout的unknown解释保留；source-evidence-before-csp-review与当前证据的**6条requests完整对象完全相同**，只更新离线策略解释/当前Lab origin，未重抓或补造header。未来fetch同步识别观测scheme集合。脚本完整获取/校验后双暂存replace，异常独立failed保旧对，不宣称跨文件OS事务。

维护fixture真实exit0/3场景只跑临时目录/受控传输：成功验证重复头/脱敏/blocked，首请求失败及README后官网失败保旧成功README/JSON。它不产生新官方HTTP/SDK/UI证据，作者没有虚构该层级。辅助Python编辑断言/引号错误按记录保留，不换算SDK失败或PASS。

## 剩余与交付

无需要原作者修复的P1/P2。仍未测的OS IME、触屏/读屏、SSR hydration/真实请求隔离、远程backend故障/取消、任意CMS/链接组件安全、独立迁入和全局泄漏/性能保持NOT_RUN；当前fixture与九源没有上述能力或承诺。实际网站策略与SDK运行也分层记录。

只写本报告，不改作者输入摘要、源码、官方数据或其他entry。**FINAL INDEPENDENT REVIEW STABLE：停止全部C18报告写入；C17/C15/C11亦停写，无后台任务，供candidate20。**
