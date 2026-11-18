# C03 Valibot 1.4.2

unknown运行时边界、pipeline和字段路径适合Valibot；不是授权、SSRF/日期时区或表单状态库。MIT、TypeScript peer>=5，实装TS7.0.2；React19.3仅本例UI。无网络/存储/async schema。

三目标：basic trim/object去未知键与字段错误；business共享Feed的1–3项批量合同/feeds.1.url嵌套路径；advanced两端真实公历+partialCheck/forward到end，无关note类型错误不屏蔽顺序问题。UI和SDK测同一schemas.ts，禁止另写影子validator。

保留：

- JSON.parse只得到unknown；safeParse同步/abortEarly:false，成功只读output。JSON语法与schema错误分开；编辑不自动解析，清旧结果并标dirty。
- Feed.name先trim再minLength；普通object去未知键，不冒称strict模式/权限。URL v.url+canonicalHttpsFeedUrl布尔检查保留，先trim外围空白，禁止凭据/剩余地址中的控制字符/非HTTPS；未接transform，输出URL并未规范化/移fragment，不是SSRF。
- start/end都isoDate+真实公历helper。isoDate不判月天数，0000拒绝、闰世纪/0–99年不得Date.UTC重映射。无效日期先报自身，顺序predicate不追加误导问题。
- partialCheck只选start/end、forward到end；note独立类型错时仍能报end顺序。getDotPath+message用于UI，不输出/持久记录含input的issue整包。

迁移demo/example/schemas/boundary-policy.mjs及.d.mts/styles六文件，无Lab alias/资产。useId每实例textarea；同步state无额外资源可dispose。不要把未接入RHF/async/持久化/服务器约束写成当前能力。

控件“输入 JSON”“运行 safeParse”“恢复示例”；basic载入字段错误，business载入批量错误/载入超量批次，advanced载入非法结束日/载入联合错误/载入合法区间。c03-workshop data-level、c03-result data-status idle/dirty/json/success/schema；保留valibot-output，c03-issues为真实字段/消息表。完整浏览器提案在validation。

实际SDK6与pure policy2分开，日历red→green日志见local-validation；不当浏览器输入/ARIA PASS，formal全NOT_RUN。官方open-circle/valibot tag/npm1.4.2 commit0dc26ea88cf07a414653375f0da43f97e0eed607，目标library/README英文5343B，完整tree八候选无中文，date/sha/fullheaders在official；官网GET200无XFO/CSP未实测Lab iframe→unknown。
