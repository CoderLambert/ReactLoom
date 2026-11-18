# E10 DOMPurify 迁入指南

DOM浏览器中必须显示有限HTML时使用；纯文本用React子节点，Markdown/HTML AST分别考虑E06/E08。实装dompurify3.4.17，MPL-2.0 OR Apache-2.0。不要由版本号推成安全已验收。

## 完整迁入

已有React/TSX DOM宿主：`pnpm add dompurify@3.4.17`，复制example.tsx、html-policy.mjs/.d.mts、sanitize-preview.mjs/.d.mts；demo仅转发。ESM/TSX/DOM类型，无CSS/env/Provider/账号，无SSR或Node DOM接线。

useMemo每挂载createDOMPurify(window)私有实例，避免共享实例setConfig/addHook污染；只把sanitizePreview返回html送唯一dangerouslySetInnerHTML，同一字符串pre文本可查看。原文只textarea，禁止在clean后拼接/改DOM或进入未经审查的新sink。

## 安全约束

保留现有ALLOWED_TAGS/ATTR表，不加script/style/svg/math/img/iframe/form或事件。实装ALLOW_DATA_ATTR/ARIA默认true，单独ALLOWED_ATTR不是完整属性白名单；本例显式两者false，实际仅href/title。USE_PROFILES会重建标签名单，不与手写表组合。

URI正则保持HTTPSauthority前缀，不是完整URL/host验证；非法端口99999可匹配正则却被new URL拒绝。HTTPS不代表可信域/无追踪/无外部导航。不要为了链接好看放开javascript/data/相对协议或在净化后写回用户href。

maxLength/helper均12,000UTF16单元，不是字节/节点/CPU预算。unsupported不调用sanitize、不把dirty放sink；sanitize错误/非字符串也返回空html/可见错误，不留旧成功。helper不捕获模块/实例创建/任意React异常。没有hooks/订阅/计时器/网络资源需要销毁，只释放私有实例引用。

## 验证范围

policy测试与fake purifier只证明配置/控制流，不是SDK。DOMPurify真实调用需要DOM；本条不为Node测试新增平台依赖。validation/browser.spec.ts给主控跑：合法格式/链接及精确属性、实际危险DOM剥离、无害执行标记与远程src探针、重置/超限清旧结果。不能只靠script不执行（innerHTML脚本可能本来不执行），还须DOM不存在。

SDK/browser/security未执行保持NOT_RUN。官方固定原文/许可证及blocked仓库响应见official；完整argv/cwd/exit/raw日志与六项分层见local-validation.md。保持固定策略唯一源和所有helper/声明sourceFiles完整。
