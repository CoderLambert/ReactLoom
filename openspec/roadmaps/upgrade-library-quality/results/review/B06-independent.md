# B06 Ant Design 独立六项复核

复核者主控（非条目实现者），实际工作区，2026-11-10。只读检查example/feed-history/feed-url/CSS、guide/agent、library/verification、固定来源、SDK/policy日志和完整浏览器提案；没有把作者返回视作验收。

| 项 | 结论 | 证据与边界 |
| --- | --- | --- |
| 技术准确 | PASS 静态 | 6.6.7匹配安装/固定manifest；Form独占字段，setFields回填，真实App.useApp上下文，Table稳定rowKey，Modal新focusable配置，无伪造HTTP。 |
| 解释清楚 | PASS | 三目标分别局部Token确认、Form到Table、一次409/撤销；onFinish输入、规范化、数组结果与fixture边界逐段对应源码。 |
| Demo有用 | 待真实浏览器 | SDK SSR2只初始HTML/token，policy7只规则；客户端Form/Portal/焦点必须按主控候选运行。 |
| 源码可迁移 | PASS 静态 | 必要5源/CSS/locale齐，无Lab alias；Form name useId；state原子rows+previous，无全局资源清理误伤。 |
| 官方来源可靠 | PASS | 独立重算原文12801B SHA9459513f975ed488f297ea22a0d724000fa039b6c0c5991e991f59587d00de06，固定dc3a92dcf2fd4d707418c2288901ecc86f26f647中文原文，完整tree候选。官网GET200无XFO/CSP只支持unknown，非allowed。 |
| 结果可复核 | 待真实浏览器 | 原始命令/cwd/exit齐，普通Node自然退出；公共候选前尚未确认实际交互，formal全NOT_RUN。 |

定向风险检查：URL仅HTTPS且拒绝credentials、去hash保query，没有抓取和SSRF承诺；表单校验不过不耗409，成功前冲突不造撤销；重复规范地址拒绝；ID不随撤销回退。搜索draft/query分离，composition守卫是事件协议不等于OS IME。只读Modal不涉及请求取消。应用没有自建timer/Worker/全局listener，SDK子树拥有Portal和message，不全局destroy。

未确认P1/P2。技术静态PASS不能替代后续三项browser实测；真实浏览器及整体六项结论由主控结果记录补齐。
