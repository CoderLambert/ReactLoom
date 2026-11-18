# B06 Ant Design 工程入口

antd6.6.7 / React19.3.0，MIT，peer React/ReactDOM>=18。在线官网已6.7.0，关键API按安装类型和固定6.6.7核对。antd自己依赖icons；当前示例不额外直接引入。适合成套后台Form/Table/反馈，不把Pro/Mobile/Charts/X算本例功能。

三目标：basic受控项目确认和局部Token；business真实Form校验→规范URL→同源Table/搜索/详情；advanced一次本地409回填、有效重试和一步撤销。没有HTTP或RSS抓取，fixture与SDK分清。

迁移example.tsx、feed-history.ts、feed-url.ts、styles.css；demo只是适配。保留ConfigProvider(locale/token/getPopupContainer)→AntApp→Workspace，App.useApp反馈不换静态方法。Form name带useId避免多实例id冲突。

不可删约定：Form store只拥有字段；noValidate与rules让组件库统一校验。title拒绝全空白，URL仅HTTPS/无账号密码，URL规范化host/端口并去fragment作为重复身份，query保留；这不是SSRF保护。onFinish才消耗一次failOnce，并把本地409用setFields回填url；非法提交不消耗。成功rows/previous同一次函数式更新，undo仅一步且不回退id计数。

Table rowKey=id，本地sorter/pagination仅完整内存fixture。启用Switch直接改业务数组，不另包Form。draft不trim/不过滤，onSearch才提交query；6.6.7 Input.Search有组合Enter保护，本例转发composition事件并守护点击搜索。不能把合成composition测试写成真实OS输入法已通过。

Modal只读快照，destroyOnHidden与focusable.focusTriggerAfterClose使用当前类型；SDK拥有Portal/焦点/holders，停止卸载本子树，不全局destroy反馈。无自建timer/请求/全局监听。不要声称关闭弹层会取消请求。

定位：b06-workshop data-count/query/conflict-armed；b06-table真实Table，tr[data-row-key]；b06-records与b06-conflict。控件项目名称/确认项目、订阅名称/RSS HTTPS 地址/分类/新增本地订阅、下一次有效提交注入409、撤销修改、查找RSS/搜索、查看+标题、关闭详情；Switch标题+启用。

反例：双重注册字段、index行key、只toast不回填、仅用initialValues更新新record、服务端单页本地排序、局部卸载清全局message、从SSR推断Portal/焦点PASS。无Drawer/revision/真实网络/异步竞态/服务端分页，不加入未实现教学段落。

Node SDK2只真实token/SSR组件与初始绑定；policy7只纯规则。entry类型和提案在validation，实际浏览器主控按browser-proposal.txt验收；正式sdk/build/browser均NOT_RUN。

官方中文README-zh_CN.md固定6.6.7 commitdc3a92dcf2fd4d707418c2288901ecc86f26f647，原文12801B和hash/path/lang/time见official/source-audit.json。完整官网中文GET200头未见XFO/CSP，iframe未测unknown。详细六项/命令/边界见local-validation。
