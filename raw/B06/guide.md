# Ant Design：让表单、表格和反馈遵循同一套契约

管理页不只是堆按钮：字段要先校验，成功数据进入列表，冲突要回到对应输入，弹层和提示还要继承同一主题。`antd` 提供 Form store、Table、Modal、App 反馈上下文和 Token，让这些组件共同工作。业务数组、重复身份与撤销仍由应用负责，组件库不会自动提供后端或持久化。

本例固定 **antd6.6.7 / React19.3.0，MIT**。安装包peer为React/ReactDOM>=18。在线官网已显示6.7.0，本例的关键API以安装6.6.7类型/源码和固定tag核对。antd自身依赖@ant-design/icons，本例没有额外直接引入图标；Pro、Mobile、Charts和X是其它产品，不把它们算成本例已接入。

适合成套中后台表单、筛选、表格和反馈。要完全自有视觉/原子交互可比较无头组件；超大网格需要另评估表格/虚拟化方案。MIT只说明组件库源码许可，不等于默认满足完整辅助技术、品牌隔离或生产服务要求。

## 三个实验

### ① 受控确认与局部Token

basic输入“项目名称”，用按钮确认，Alert显示修剪后的名称；再编辑立即清除成功态。全空白时按钮原生disabled。Tab/Enter操作真实Input与Button，这里没有Form，输入中Enter不会替你提交。

外层ConfigProvider给本例提供colorPrimary=#21654f与borderRadius=8，App在它里面建立message/notification/modal上下文。基础按钮使用真实主题色，不通过私有.ant-*选择器改样式。本例固定浅色，没有暗色切换。

```tsx
<ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#21654f', borderRadius: 8 } }}>
  <AntApp><Workspace level={level} /></AntApp>
</ConfigProvider>
```

Workspace里`AntApp.useApp()`取得message，成功/错误反馈能继承主题。不要用上下文之外的静态message方法替代这条接线。

### ② Form输入成为同源Table数据

business初始“工程实践”和“每日新闻”两行。填写“订阅名称”“RSS HTTPS 地址”“分类”，提交通过客户端规则后才执行onFinish。名称不能全空白、最多50字符；地址使用本例normalizeHttpsFeedUrl：trim、URL解析、仅HTTPS、拒绝嵌入账号密码、去fragment并规范化host/默认端口。大小写域名或默认443不应制造重复订阅；query仍保留。它不抓取地址，也不是生产RSS抓取器的SSRF防护。

```tsx
const [form] = Form.useForm<Values>()
<Form form={form} noValidate onFinish={addFeed}>
  <Form.Item name="url" label="RSS HTTPS 地址" rules={rules}>
    <Input />
  </Form.Item>
</Form>
```

Form.Item通过name接管字段value/onChange、错误与label关联；不再用另一份useState同步输入。noValidate让校验由Form统一处理。initialValues用于初始化/resetFields，不是后续props更新协议。setFields回填字段错误，resetFields恢复草稿。字段预留空间减少常见校验文案引起的布局移动，不强行跳过正常提交事件。

成功创建稳定feed-N ID并插入数组，真实Table从同一数组派生过滤结果。rowKey=id，启用Switch直接更新业务数组，详情Modal只读。表头“订阅标题”用本地比较器排序；Table每页4行，单页时隐藏分页。这里排序/分页面向完整内存fixture，不是服务端分页，也没有请求URL中的RSS。

搜索草稿draft原样保存，只有onSearch把trim后的query提交给过滤，不在输入每个字时重排表。6.6.7 Input.Search内置composition状态阻止组合中的Enter；本例还监听其转发的compositionstart/end，组合中点击搜索也不提交。这是合成事件/键盘路径可验证的协议，真实中文输入法仍需设备验收。

### ③ 一次冲突、恢复与一步撤销

advanced先点“下一次有效提交注入409”，页面显示已准备。非法草稿只停在客户端错误，不消耗注入；下一次通过规则的onFinish消耗一次标记，把本地409 fixture错误经form.setFields写回url，并显示上下文message。此时业务数组不增加。

保持相同草稿再提交：Form重新校验，注入已消费，成功写入列表并resetFields。这个409是同步本地分支，不是发过HTTP、服务端判重或故意延时的网络请求。重复已有规范地址同样写回字段且不新增。

feed-history把rows和previous放在同一函数式状态更新中；成功追加或启用开关同时保存上一份快照，无变化操作不覆盖它。撤销恢复上一份rows并清空previous，只能退一步；冲突本身没有列表变动，因此不会创建撤销记录。新增ID计数不随撤销回退。

Modal显示所选记录当时的只读值，SDK负责Portal、Escape和焦点返回；本例使用6.6.7的`focusable={{focusTriggerAfterClose:true}}`与destroyOnHidden，未使用旧的弃用focusTriggerAfterClose顶层属性。关闭详情不代表取消网络，因为这里根本没有请求。

## 状态与资源归属

| 对象 | 所有者 |
| --- | --- |
| 输入、校验、错误与reset | Ant Form store |
| rows/previous、query/draft、一次冲突标记 | 本例React state |
| 排序/分页展示、受控Switch、Modal交互 | antd组件；数据仍由本例提供 |
| message holder与弹层生命周期 | 本例AntApp/Modal子树，卸载随子树清理 |

本例没有自建timer/Worker/全局监听或请求。composition事件由React持有，ref不构造资源；不需要“卸载时全局destroy所有message”。getPopupContainer有trigger时用父元素，无trigger时回到body；Modal采用SDK默认Portal。移植到overflow容器需按真实布局验弹层，不要全局修改其它实例。

## 迁移路径与常见错误

复制example.tsx、feed-history.ts、feed-url.ts、styles.css；demo.tsx仅Lab默认重导出。保留CSS import、ConfigProvider→AntApp→Workspace顺序、zhCN locale、稳定业务ID、Form.useForm和App.useApp。样式只定义本例类，没有宿主alias或深层私有结构选择器。Form name含useId，避免迁入多实例后label/input id相撞。

将START替换成已有数据层时，服务端要重新校验与规范化；真实冲突/异步回填需要验证请求身份并取消/丢弃旧结果。当前没有revision、AbortController、Drawer、服务器排序/分页或请求epoch，不将这些未实现能力写成Demo结果。Form与React Hook Form只保留一个字段所有者。

| 容易出错 | 本例做法 |
| --- | --- |
| 只toast错误，输入旁没有定位 | form.setFields回到url，message提供摘要 |
| Form字段和React state各维护一份value | 字段归Form，列表归单一feed-history |
| Table用index或给服务端单页再本地sorter | 稳定id；本地比较器只用于当前完整fixture |
| 把destroyOnHidden当作请求取消 | 当前仅只读内容；未来网络自行取消/防旧响应 |

没有使用zeroRuntime静态CSS模式。主题生成、CSS变量、Portal、焦点和响应式都需要在实际浏览器核对，不能靠SSR HTML或包名证明。

## 官方原文与验证边界

固定tag6.6.7 commit `dc3a92dcf2fd4d707418c2288901ecc86f26f647`，完整tree只发现README.md与README-zh_CN.md，优先官方简体中文原文，12801字节。SHA-256 `9459513f975ed488f297ea22a0d724000fa039b6c0c5991e991f59587d00de06`，path/lang/version/time与完整候选保存在official/source-audit.json，原文未改写。

官网官方中文入口https://ant.design/index-cn实际GET200，完整头在official/homepage-response.json；该次未见XFO/CSP，尚未从Lab origin测试iframe，unknown并保留直达，不能写allowed。

Node真实SDK2项只覆盖theme.getDesignToken与React SSR中真实Input/Button/Alert/Form初始绑定/Table行key；7项纯policy覆盖原子撤销和URL规则，不证明Form客户端提交、Portal、键盘、样式或IME。完整真实浏览器提案在validation/browser-proposal.txt，实际命令和六项在local-validation.md，formal三项始终NOT_RUN。
