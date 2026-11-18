# B07 Material UI 非作者独立复核

reviewer主控，作者quality_e05；实际只读核对全部6运行源、guide/agent、SDK/policy范围、官方原文及metadata，未改作者源码。

| 六项 | 结论与依据 |
| --- | --- |
| 技术准确 | 静态PASS：真实9.5.0/Emotion theme，slotProps与Portal context，受控Switch值先读再进updater；业务数组/通知/草稿独立，无伪HTTP。 |
| 解释清楚 | PASS：局部主题、一步撤销、Dialog错误恢复3目标，关键输入→处理→输出逐段对应源码；SSR和商业产品边界明示。 |
| Demo有用 | 待主控真实3case：SDK2 SSR/theme与policy6不证明客户端。 |
| 源码可迁移 | 静态PASS：6source齐，局部class/ThemeProvider无CssBaseline/宿主alias；useId关联Dialog、SDK拥有Portal/FocusTrap/Snackbar timer，应用不误清全局。 |
| 官方来源 | PASS：独立重算2284B SHA7101439d2715daf9687af1c610051cfc01f393b1a83d52b6d8c0d10e8a6e1227，固定1c3f8b4903f21cfad12c102edb3db4ceba2e8c8c目标包英文README。实际头同有XFO SAMEORIGIN和enforced CSP frame-ancestors *，按CSP3有效frame-ancestors优先；没有Lab iframe确认，只能unknown，记录正确。 |
| 结果可复核 | 待runtime：原始15日志+16输入摘要/metadata/完整3项提案齐，正式NOT_RUN不伪绿。 |

定向核查无P1/P2：字段校验不过不耗注入，取消清错误/注入但留草稿；冲突不变rows且同值可重试，真实重复URL另拒绝；一步before和nextId不随撤销回退；Snackbar key/id防旧close覆盖新通知，关闭不撤销；减少动态仅Dialog过渡0，不宣称覆盖所有过渡/OS输入法/读屏。

candidate10固定dist的官方展示已PASS，3项真实客户端运行由主控随后结果补齐。不把作者返回或公共build作为整库验收。
