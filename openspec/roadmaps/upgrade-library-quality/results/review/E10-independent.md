# E10 DOMPurify 非作者独立复核

2026-11-18，当前E10-dompurify，安装dompurify3.4.17。仅写本报告，不改entry/shared、不运行完整作者套件、共享检查或浏览器。按catalog→metadata→agent→全部sourceFiles→verification→guide检索，另读local-validation、提案、实装purify.ts与官方材料。

结论：Spec、静态质量、隔离迁入严格编译与独立policy/double消费PASS；未发现实质漏洞或实施缺陷。没有执行真实DOMPurify sanitize，SDK/security/browser仍NOT_RUN，不能从helper或编译推断DOM净化效果。

## 新policy/helper消费者

cwd `/home/lambert/githubRepos/lambert/ReactLoom`，`node --input-type=module`内联ESM，exit0。新输入`<h4 data-private="fixture">new approval</h4>`，注入double返回不同的已知输出，确认helper仅使用purifier返回字符串、传入实际共享policy；超12000不调用sanitizer，unsupported、抛错与非字符串返回均空html。另核对data/aria false、普通属性仅href/title、无profile覆盖；独立非法端口例证明正则匹配不等完整URL可解析。

```json
{"trial":"POLICY_DOUBLE_PASS","successUsesReturnedHTML":true,"oversizeSkippedSanitizer":true,"unsupportedFailsClosed":true,"throwClears":true,"nonStringClears":true,"dataAria":false,"URIIsPrefixOnly":true,"realDOMPurifyExecuted":false}
```

这不加载真实浏览器DOM、不证明double输出真的被净化。作者policy7也分为配置/控制流，不计SDK。本次没有重复作者完整7项。

## 五文件严格迁入编译

将实际example.tsx、html-policy.mjs/.d.mts、sanitize-preview.mjs/.d.mts复制到独有tmp，node_modules链接现有Lab依赖。独立consumer同时导入真实createDOMPurify类型、helper和组件，约束返回{html,error}并渲染advanced JSX；未执行window代码。

cwd `/home/lambert/githubRepos/lambert/ReactLoom`，argv：

```text
pnpm exec tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --skipLibCheck /tmp/e10-independent-wlmvz7hk/consumer.tsx
```

exit0、stdout/stderr空。检查复制的实际UI/声明使用，第三方声明内部skipLibCheck，不是完整工作区typecheck或真实SDK运行。最后只清除自建tmp，没有新依赖或共享文件。

## 六项分层

|要求|结论与依据|
|---|---|
|技术准确|静态/类型/policy PASS，真实SDK NOT_RUN。3.4.17 factory私有闭包、配置默认/覆盖、unsupported和字符串返回控制流与安装源码对应；不夸大URI正则能力。|
|解释清楚|PASS，静态：CMS有限HTML选型→唯一sink→标签/属性/URI区别→三目标→错误/迁移/生产边界，明确净化后改DOM的新风险。|
|Demo有用|静态设计PASS，真实DOM NOT_RUN。合法格式、公告窄属性、攻击/清空恢复各有独立目标，提案同时检查DOM/无害执行标记/请求，不只目视正常。|
|源码可迁移|PASS，五原件严格consumer编译。精确依赖与DOM/ReactTSX/Bundler前提、无Provider/env/CSS/账号明确；SSR不支持且不虚构Node DOM接线。|
|官方来源可靠|PASS，字节与实际许可。固定cure53/DOMPurify commita77a3e78b59f72fa4d1c83f22e121ad9cc7d3575 README独立raw与本地SHA均565e6a29192b5dbb94b172ef5e4b90759994eb34874da22bb8e9be5c3e894969，与metadata相同。实装package3.4.17/(MPL-2.0 OR Apache-2.0)与保留Apache2 LICENSE.txt、MPL2 LICENSE-MPL.txt吻合，OR双许可未误写MIT或AND。无官方中文README的固定树记录，保留en。仓库头XFO deny/CSP frame-ancestors none与blocked一致。|
|结果可复核|policy/编译PASS，SDK/DOM/security/browser/formal NOT_RUN。输出/argv/cwd在上，纯double明确标注。作者原始日志与正式receipt分开，没有由静态规则或版本pin给安全通过。|

## 实装配置与唯一sink检查

已核对安装src/purify.ts：createDOMPurify内创建新的DOMPurify函数、removed、hooks和配置变量；无DOM环境将isSupported=false。UI每挂载useMemo调用factory，不使用被其他消费者setConfig/addHook的默认共享实例。本例自己没有setConfig/addHook/计时器/全局订阅，释放引用即可，不发明destroy。

实装ALLOW_ARIA_ATTR/ALLOW_DATA_ATTR默认true，读取cfg时只有显式false才关闭；USE_PROFILES分支会重建允许表。因此当前两false和不设置profile对“仅href/title”合同必需。保留标签仅section/h3/h4/p/强调/列表/引用/代码/a；无script/style/svg/math/img/iframe/form/object、无事件/style/target/data/aria。URI正则只是HTTPSauthority前缀约束，href仍可外部导航；不是域名ACL或完整URL验证，指南给了非法端口反例。

sanitizePreview在长度/unsupported前置检查后才调用purifier.sanitize，失败/非字符串结果给空html。React结果由dirty/purifier同步派生，错误不保留旧成功结果；原文只textarea，pre是文本。唯一dangerouslySetInnerHTML prop的精确Biome行级豁免位于净化结果sink，理由与实际来源相符，没有共享lint放宽、dirty旁路或净化后用户字符串拼接。helper不捕获实例创建/模块加载/任意React错误，这个限制已明确。

## 浏览器剩余范围

提案保留合法结构与精确href/title、真实剥离恶意DOM/事件、无害标记不变、唯一远程src探针无请求，以及程序化超textarea上限时旧sink与pre清空后可恢复。重点必须同时成立：script即使因innerHTML规则不执行，若残留DOM仍失败；CSP阻止也不能替代净化。unsupported与sanitize抛错目前只有double路径，不声称在旧浏览器复现。

浏览器由主控执行；无新Node DOM平台、无危险导航或真实账户。独立报告完成，停止写入。
