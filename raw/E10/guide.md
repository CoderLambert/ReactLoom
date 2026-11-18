# DOMPurify：有限HTML字符串的最后一道DOM边界

CMS公告必须保留段落、强调和少量链接，输入又可能来自不可信来源。DOMPurify使用真实DOM解析并按策略净化，再把返回值交给唯一HTML预览。它不解析Markdown、不实现编辑器、不提供ACL，也不替代CSP。纯文本用React子节点；Markdown优先react-markdown；HTML AST管线比较rehype-sanitize。

本例钉住DOMPurify3.4.17，安装包与固定许可核对为 **MPL-2.0 OR Apache-2.0**。三个目标分别是合法格式保留、公告链接的窄属性合同、攻击输入与失败边界。没有远程抓取、上传、商业扩展或服务端DOM实现。安全库版本应结合上游公告和实际回归维护，本页不凭版本号声称已复现/排除全部漏洞。

## 完整接入与唯一sink

在已有React/TypeScript的DOM浏览器宿主安装：

```sh
pnpm add dompurify@3.4.17
```

复制example.tsx、html-policy.mjs/.d.mts、sanitize-preview.mjs/.d.mts，保持相对导入；demo.tsx仅Lab转发可省。渲染 `<DOMPurifyExample level="business" />`。需要ESM/TSX打包器与DOM类型，无CSS、Provider、env、账号或Lab内部模块。不提供SSR接线；不能在没有window的服务端直接渲染本组件。

```tsx
const purifier = useMemo(() => createDOMPurify(window), [])
const result = useMemo(() => sanitizePreview(dirty, purifier), [dirty, purifier])
<div dangerouslySetInnerHTML={{__html: result.html}} />
<pre>{result.html}</pre>
```

每次挂载创建私有DOMPurify实例，避免其他消费者对同一个默认实例setConfig/addHook改变本例行为。仅每次传config不足以抵消同一实例上已设置的全局setConfig。本例不注册钩子/全局配置，不创建网络、定时器或订阅；卸载释放React引用，无虚构destroy调用。

原文只在textarea中；pre是普通React文本。仅result.html进入HTML sink，净化后不拼接、不修改、不交第二个会重新解释它的库。一个下游插件若再次写属性、拼HTML或切到SVG/CSS/脚本/邮件模板，是新的安全边界，不能沿用本次“已净化”。

## 保持窄标签与属性

html-policy保留既有标签：section、h3/h4、p、strong/em/b/i/br、ul/ol/li、blockquote/code/pre/a。允许普通属性仅href/title。**标签与属性表没有为演示放宽。** 这份公告合同不接受script/style/svg/math/img/iframe/form/object，也不接受事件、style、target/rel等属性。

DOMPurify默认 `ALLOW_DATA_ATTR` 和 `ALLOW_ARIA_ATTR` 都是true，**即使写了ALLOWED_ATTR，data-*和aria-*也可能额外通过**。本例现在明确设为false，使实际行为符合“仅href/title”的窄属性约定；这不是DOMPurify默认行为。如果产品需要无障碍属性，应单独审查语义与对应允许范围，而不是认为ALLOWED_ATTR已经控制所有默认例外。

不要设置USE_PROFILES与ALLOWED_TAGS组合：实装profile分支会重新建立标签表，覆盖手写标签表。不能为了“预览完整”开启html profile、ADD_TAGS/ADD_ATTR或钩子把删除的用户属性加回来。

## URL正则只是一层前缀约束

当前ALLOWED_URI_REGEXP仍是原有HTTPS主机/可选端口/路径起点正则，没有放宽协议。它拒绝普通http、javascript、data、相对路径、协议相对URL与直接凭据authority；但它**不是完整URL解析器**、域名允许列表或可信来源证明。

例如 `https://example.com:99999/path` 能匹配这段正则，但new URL会因非法端口拒绝。路径后续也不是由该前缀表达式完整校验。DOMPurify对属性另有内部检查与规范化，不能把单独regex.test结果冒充浏览器可导航性或完整SDK结论。只有本例声明的href语境适用；title是文本属性，不是URL。

合法HTTPS链接仍能把人带到外站。业务若只允许本站，需要独立URL解析/host规则与测试，不在sanitize之后把新用户URL拼回DOM。本示例不点击不可信链接，不宣称阻断所有外部导航或所有解析期间网络行为。

## 三个实际目标

### basic：合法格式保留

默认p/strong保留。输入带onclick的段落，预期正文和strong/em仍显示，事件消失；查看同一clean字符串的pre，而不只看外观。恢复场景回到原样例。输入变化同步重新净化，没有先把dirty临时写进预览。

### business：公告结构与链接属性

样例section/h3/p/em，链接带合法HTTPS/title以及不允许的target/data-track/aria-label。预期结构与href/title保留，后三者被删除。这展示真实的属性合同，不是“源内容可信”的同源证明，也没有图片加载能力。

### advanced：攻击输入与结果边界

script、SVG、事件、img、style与危险协议会被当前策略移除。载荷只设置本地无害布尔标记，不弹窗/读取凭据。浏览器提案会检查实际预览DOM，而不只检查字符串含不含关键词；HTML innerHTML中的script即便不执行也仍是失败，不能只靠布尔标记断言安全。

图片/iframe使用独立测试域探针，以观察净化和最终sink期间是否产生不期望请求；当前未运行浏览器，不能从标签表静态推成“网络测试通过”。CSP阻止脚本也不能掩盖预览DOM仍保留危险标签/属性的问题。

## 有界输入与失败处理

textarea限制12,000个JS UTF16单元，helper也在调用净化器前做同一上限，因此程序化超限不会依赖浏览器maxlength。它不是字节/深度/节点/CPU时间限制；生产仍需整体资源预算。

`isSupported !== true`时停用HTML预览，原文仅作为textarea文本保留，绝不把未净化dirty当兜底。sanitize抛错或异常返回非字符串时，也返回空html与可见错误，清空此前成功预览；恢复场景可再次尝试。该控制流已用纯策略测试检查，**不等于真实DOMPurify净化测试**。模块加载/实例创建/外层React错误不是helper捕获范围，需宿主错误边界；不能把所有错误都说成已安全恢复。

本例使用默认字符串返回，不启用RETURN_DOM/RETURN_DOM_FRAGMENT/RETURN_TRUSTED_TYPE；没有部署站点Trusted Types策略或CSP。DOMPurify.removed仅调试参考，不作安全分数、可信内容证据或业务审计日志。

## 迁移与维护

- 选定sink后再定允许标签/属性/URL；JSON、Markdown、HTML/CSS与邮件模板不是同一种解析器。
- 不用正则删script代替HTML净化，不先插入dirty再净化，不在clean后补img/a属性。
- private实例隔离配置，不在共享default实例上setConfig/addHook，也不依赖别的Demo未调用它们。
- Node路径必须另选维护中的DOM实现和匹配版本。本条没有新增jsdom/其他Node DOM依赖，也没有无DOMsanitize SDK通过。
- 升级复核版本/许可/上游安全说明及同样例的真实浏览器回归；不因API可编译就给安全PASS。

官方README使用固定3.4.17原文字节（对应树无官方中文则en）与本中文讲解分开。仓库响应明确deny/frame-ancestors none，官网区域使用直达入口而非可嵌入宣称。实际policy命令、官方取证和六项分层见local-validation.md；真实SDK/DOM/攻击网络验收交主控，正式verification仍NOT_RUN。
