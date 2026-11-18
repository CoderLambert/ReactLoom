# E10 DOMPurify 条目维护

不要修改平台公共 Markdown viewer 或Vite全局配置；保留真实SDK调用与攻击样例。变更 policy 必须更新 guide/agent 和验证用例。HTML profile 与允许标签不可因为演示方便随意放宽，安全门禁未运行则状态保持 NOT_RUN。

显式ALLOW_DATA_ATTR/ALLOW_ARIA_ATTR=false保持实际仅href/title的窄合同；默认两者true不能忽略。sanitize-preview是输入/unsupported/异常控制流唯一实现，声明和policy均完整展示；fake purifier只计policy。每挂载私有createDOMPurify(window)，结果唯一sink，不在clean后加用户DOM。URI正则只限前缀不是完整URL验证。无Node DOM依赖时真实SDK/browser等待主控，不能由pure policy推成PASS。

唯一净化结果sink的Biome行级豁免须保留明确来源解释；不用于任何dirty/拼接HTML路径，也不修改共享lint规则。实际DOMPurify/危险DOM与网络未运行时，policy/编译不能替代SDK/security/browser证据。
