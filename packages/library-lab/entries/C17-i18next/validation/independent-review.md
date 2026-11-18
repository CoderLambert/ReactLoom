# C17 i18next 独立非作者六项复核

Reviewer /root/quality_e11，UTC 2026-11-10T18:27:13.887848+00:00；实际cwd /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab。作者FINAL明确停写后开始只读，candidate21冻结期间未写Lab，root明确release后仅写本报告。未改被审源码/文案/元数据/工具/摘要，也未重跑有效SDK/policy/HTTP/UI或全目录检查。

## 结论

**未发现P1/P2，无阻断。** 三个目标实际调用核心SDK与共享工厂，字符串/资源/实例/应用队列分界准确。独立只读复算47/47作者文件、9/9安装文件、13/13受保护输入零差异；7运行源同时匹配candidate19与20。原始19三目标3PASS加20官方原文/HTTP Lab blocked1PASS有效，合计本条4PASS；20混合命令2PASS3FAIL/exit1保留，不写整批全绿。正式sdk/build/browser仍NOT_RUN，后续内容状态归root。

## 六项判定

| 维度 | 结论与层级 | 核对依据 |
| --- | --- | --- |
| 技术准确 | PASS，匹配源码/类型与真实SDK | 安装26.4.3/MIT，9文件实际比SHA；createInstance/init/t/getFixedT/returnDetails/addResourceBundle/on-off语义一致；共享SDK5不拿policy代替 |
| 解释清楚 | PASS，静态与操作对应 | 中文从实例/资源/键/参数/复数到3目标；escapeValue实体显示、回退usedLng、SDK事件和UIcommit、无abort/destroy均说明具体取舍 |
| Demo有用 | PASS，root真实三目标+官方 | 19三UI与20官方实测；输入/资源加入/回退/快速意图/重置/level/390px/真实卸载形成实际反馈，没有伪机器翻译或网络延迟 |
| 源码可迁移 | PASS，静态/入口与固定运行源 | 七源含共享工厂/队列/声明/CSS，无Lab别名；effect/原callback拥有资源，publisher19链接有效日志与当前实现对应 |
| 官方来源 | PASS，原文/真实响应/官方面板 | 固定tag/npm gitHead/manifest26.4.3，英语README5593B同安装；完整tree无中文，7rawHeaders列表真实，CSP仅排当前HTTP Lab |
| 结果可复核 | PASS，限定本地分层 | 原始SDK5/policy4/类型/提案/metadata/维护fixture和历史FAIL齐；19/20固定证据按case复用，正式收据与未测不夸大 |

## 核心源码与所有权

- examples/i18n-client.mjs:22工厂实际createInstance并await init，固定zh/fallback en/supported zh,en/defaultNS common，人工common/news资源structuredClone。每个实例独立，动态channel资源也复制后写入，原resources对象与下一会话不污染。
- 三层源是同一个工厂/组件但目标独立：basic为插值/真实count复数和React文本；business为addResourceBundle/hasResourceBundle/真实store added；advanced为returnDetails/defaultValue、队列最新意图与生命周期。不是只换文案的数据量三层。
- i18n-client.mjs:38双语bundle用deep=true/overwrite=true，SDK实际added两次；example的onResource只按事件更新观察，资源存在由hasResourceBundle读取。没有HTTP backend、机器翻译、检测器或下载，按钮和说明没有冒称远程成功。
- escapeValue:true的SDK结果包含&lt;Ada&gt;实体，React文本会显示实体字符，作者明确该可见取舍；不是把属性转义当HTML净化，也未dangerouslySetInnerHTML。count仅夹0–99，作者明确整数只是教学样本而非完整金额/数量校验，不假称严格整数schema。
- example.tsx:123每次渲染getFixedT(committedLanguage)，没有模块级缓存t结果；fallback的t也显式lng。快速真实SDK changeLanguage中间可发事件，但显示词条固定到应用最后提交语言，sdkObserved仍取真实实例。SDK事件2/UIcommit1是两种观测，没有把generation当SDK实例编号或把队列当原子SDK事务。
- language-switch.mjs串行等待，未开始目标保最新；陈旧成功/错误不覆盖最新提交。dispose使active=false/丢pending、禁止晚回调，不中止已开始的SDK Promise；没有虚构SDK destroy或取消网络IO。
- i18n-client.mjs:48每次observe创建独立language/resource wrapper；:57/58带原callback off，只清自己。实装dist/esm/i18next.js:252事件器用callback身份，省callback会清整个事件；共享SDK5实际证明stopFirst后第二observer仍接收事件、stop幂等。不会为清理破坏其他消费者。
- example.tsx:61起init返回先alive检查，未存活不注册应用订阅。成功后创建ownedSwitcher/ref，再发布instance；:109cleanup先alive=false，再dispose/ref归属检查/stopObserving。Strict effect重建每次有自己的闭包，不复用已dispose的memo队列。内嵌资源无backend句柄，私人实例随引用释放；未证明全局内存普查。
- wrapper以level/generation key重建Session，旧输入节点断开、新语言/词典/事件计数从默认开始。初始化事件在应用observer建立前发生，作者明确屏幕不计该初始事件，未用计数误报“SDK没有初始化事件”。

实装其他API已读定位：addResourceBundle在dist/esm/i18next.js:379、getFixedT:2068、returnDetails分支约559起；类型来自同安装index/TypeScript声明，不用别库类型或新版本文档代替。无需为源码静态复读再次运行SDK。

## 原始执行复用与候选绑定

1. validation/sdk.txt，Lab cwd node --test entries/C17-i18next/tests/sdk.test.mjs，真实5PASS/0SKIP exit0：插值/escaping/英文复数、回退详情、资源与固定t隔离、真实SDK+队列、所属callback解绑。测试真正导入共享factory与目标SDK，非自制字典查找冒充。
2. policy.txt为受控deferred Promise队列4PASS/0SKIP exit0，明确非SDK。dispose/陈旧错误恢复由该层负责；不外推真实网络abort。
3. checkpoint-types/format、proposal-types/format有效exit0，临时TS已删除。完整3case提案与root公共quality-remediation-i18next.spec.ts字节相同，SHA5f043b01c606b698130a70825c939ef8daba98f35d30fe3061b0317a8b0135ea。
4. candidate19/browser-i18next.txt实际3PASS/exit0：普通文本/复数/reset，Enter加入本地channel与fresh资源，真实fallback/两方向快速队列、level切换、390px、停止节点断开/重挂清状态。没有mock SDK/Intl/时钟/DOM，不直接调用handler。root c17-runtime-reuse及当前7源与19/20输入SHA一致。
5. candidate20/browser.txt实际整轮2PASS3FAIL/exit1；C17固定原文/blocked单项通过，另B15资源通过，3FAIL是C19当时失败。作者未隐藏其聚合exit1，也未因为C17通过就重跑其他有效case。root当前21处理后续条目不影响这份固定19/20证据。
6. candidate20全public/e2e lint/type/build/catalog exit0、3132输入SHA793aba254832cfac7345dd05141599a1cf3fe739b9cbc54ef2f017e80d7f9f4d、stability=[]。这是共享构建，不当本条独立正式build收据；最后guide/agent/AGENTS是其后静态终稿，未声称20已展示这些文案。

独立仅复算摘要不执行作者metadata脚本：47作者文件与input-hashes.files一致（其自身排除，原48文件数包含摘要本身）、9安装API/类型/README/LICENSE一致、13受保护输入与根路径对应；7运行源两候选相同。原作者摘要不因新增独立报告而追写。日志/收据完整绑定路径在shared-validation-binding.json，当前数据无内容差异。

## 官方原文、CSP与维护工具

实际i18next26.4.3发布tag v26.4.3是annotated tag，额外解析object后commit0d2845a2360dcc236fe9681f849781f5dfdd35c4，与npm gitHead、源manifest26.4.3及安装版本一致。实际未截断tree仅README.md，无官方中文候选。英语原文5593B，SHA3964fe947138fb6369c58bbc7779eacc8877cf220d41db7647c9e4bd7c466966，UTC2026-11-10T17:50:48.983395+00:00，保存字节与安装README完全相同；未翻译/截断冒充原文。

七实际HTTP的rawHeaders逐请求有序列表保留重复，headers字典只是便览；公开cookie值脱敏并保留属性/摘要，未读取/复用任何账号凭据。官网正文NOT_READ。原始CSP frame-ancestors https: ionic: capacitor:排除当前http://127.0.0.1/localhost:4319 Lab祖先，blocked合理；不外推HTTPS宿主，不以GET200/load升级allowed。初版stdout曾unknown，offline校准只改派生策略，policy-correction证明前后原始头相同SHA，未重抓或补造HTTP。

工具获取/校验完整后双暂存replace，异常独立failed并抛错，不在finally覆盖成功对。临时受控fixture实际3PASS/exit0：成功保重复CSP/cookie脱敏，首次失败/README后官网失败保旧哨兵pair。这是未来工具维护证据，fixture走直接commit tag故6请求，实际annotated tag7请求；作者将两者明确区分，没有伪造真实网络请求次数。

历史final-metadata误数6请求exit1、修7后green exit0与格式初次exit1均保留；这是元数据计数/排版失败，非SDK/UI失败。最终19个文档链接用实际publisher核，官方readme本地alias已由公共策略提供，未将私有日志/JSON硬开放给网页。

## 剩余范围与停写

OS IME、真实HTTP backend/错误/取消、检测器、SSR每请求隔离、完整全局SDK监听/内存/性能普查仍NOT_RUN，不把合成输入或单实例样本充当这些验证。没有实际P1/P2或需产品修复的阻断。reviewer不自行content_done，不改正式三状态。

本报告FINAL后停止全部C17写入；root独占队列/结果/后续公共验证，原作者如需修复另走交接。本报告新增文件不改变先前作者字节与冻结候选事实。
