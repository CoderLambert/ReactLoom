# Mantine：局部主题、延迟筛选和数字草稿

订阅表里的配额是已保存整数，编辑框却需要容许用户先删空、输入减号或小数。Mantine提供主题、输入、Modal与hooks；应用仍要区分草稿、提交值和一次撤销。这里用同一份本地三行fixture贯穿 **主题确认→防抖表格→配额编辑**，没有服务器或模型调用。

固定 `@mantine/core` / `@mantine/hooks` **9.7.3**，MIT，实际peer React/ReactDOM `^19.2.0`，宿主19.3.0满足。官网在线已9.8.0，关键API按安装9.7.3和固定tag核对。未使用@mantine/form、notifications或modals包；这是组件与hooks示例，不是表单状态库或服务端表格。

## 实验一：局部Provider与受控确认

basic输入“工作区”，Badge和output显示原草稿，按钮在trim后为空时原生disabled。确认后Alert显示修剪名称，再编辑清掉成功态。颜色不是唯一反馈，文字仍说明是否可使用。真实Button由primaryColor=teal的主题生成样式。

本例Provider有自己的根节点，而不是借forceColorScheme修改Lab页面根：

```tsx
<MantineProvider
  theme={theme}
  forceColorScheme="light"
  cssVariablesSelector={selector}
  getRootElement={() => host.current ?? undefined}
  colorSchemeManager={manager}
  withGlobalClasses={false}
>
  <FeedManager portalTarget={selector} />
</MantineProvider>
```

selector以useId生成的data-b08-root唯一定位。cssVariablesSelector收束可配置变量，getRootElement收束颜色方案属性；公开的内存colorSchemeManager不读写宿主localStorage，没有外部事件源，因此订阅方法无需注册资源。它是SDK正式扩展接口，不是替换组件。浅色只属于当前实例，不跟系统暗色切换。

仍需导入`@mantine/core/styles.layer.css`；这份官方CSS含文档级基础样式/默认变量，不能把它说成Shadow DOM或完全CSS隔离。当前修正只收束本例配置与Portal；生产应用通常在应用根放一次Provider与样式，不每个卡片重复挂。

宿主若有无层的button/input规则，会优先于@layer mantine。Lab真实浏览器已发现其background/border/padding/font覆盖SDK层。本例CSS在自有根的公开mantine-UnstyledButton-root/ mantine-Input-input类上，只对实际冲突的属性用revert-layer恢复SDK层；没有all重置、硬编码主题色或改全局宿主。迁入没有这种宿主覆盖的应用时可按实际级联删掉这段兼容规则。焦点outline仍由本例明确保留；disabled/hover依SDK样式。

## 实验二：草稿、防抖值与原子撤销

business初始前端实践/AI与工程/安全公告三行。输入筛选草稿立即显示，`useDebouncedValue(filter,150)`在停止变化后延迟约150ms发布，表格才按标题过滤；清空恢复，零匹配有明确空态。这是本地timer，不是网络防抖请求，也不承诺浏览器恰好150ms绘制。

Table只是有语义的表格。行key/data-feed-id取永久ID，Switch由当前row.enabled受控。切换一行后可“撤销上一次”，rows与before在同一函数式更新里提交。无变化操作保留已有撤销点，撤销只恢复一份并清空before。过滤不修改业务数组，也不生成撤销记录。

SDK hook拥有debounce timeout，源码确认新值会清旧timer且卸载return cancel；应用没有另外建timer或全局监听。长列表/服务端分页/排序没有实现，不用这三行的结果冒充大数据能力。

## 实验三：保留中间态，提交才写整数

advanced在目标行点击“编辑配额”，真实Modal标题和NumberInput带订阅身份。打开时从当前行复制quota到局部草稿；取消、Escape或遮罩关闭丢弃草稿，再开重新从行载入。没有未保存确认对话框。

默认number模式的NumberInput回调是`number | string`。空值或`'-'`可以是字符串，不能用`Number(value)||0`归成已保存数字。本例把回调实际草稿类型/JSON显示在弹层中。`decimalScale=2`让小数也能真正进入草稿；保存用validQuota拒绝，而不是宣称组件已自动保证整数。

```ts
function validQuota(value: number | string): value is number {
  return typeof value === 'number'
    && Number.isSafeInteger(value)
    && value >= 1 && value <= 100
}
```

min/max为1/100，`clampBehavior="none"`不在失焦时偷偷夹成边界。清空、减号、0、101、1.5都不能保存，错误关联NumberInput并有Alert摘要，弹层保持打开，业务行和before不变。输入合法1–100整数后，实际form submit调用updateQuota，保存并关闭；同值保存不制造新撤销点。

Modal保留真实Portal，target指向本例根，使变量可继承；未用env=test或关闭Portal。SDK负责focus trap、Escape、returnFocus和滚动锁；本例只负责selected/draft/error和提交守卫。保留data-autofocus与关闭按钮中文标签。SDK滚动锁会在打开时影响body，这种暂时副作用应由对应子树清理，不等于主题变量可以写全局。

## 迁移所需文件

复制example.tsx、feed-history.ts、local-color-scheme.ts、styles.css，demo.tsx只是Lab重导出。core/hooks同版本且React满足peer；保留官方CSS入口、实例根选择器、getRootElement与Portal目标整套配置。迁入完整应用可改为唯一根Provider及产品的颜色方案manager，但不能只删除Portal的主题继承前提。

React state拥有工作区、筛选、rows/before、配额草稿；Mantine拥有组件DOM/焦点和hook timer。没有额外资源、HTTP、revision、全局清存储或独立通知容器。若接真实后端，要在服务端再校验、区分保存失败与关闭，不把内存撤销当服务端回滚。

| 误用 | 本例选择 |
| --- | --- |
| 空串/减号强转0，输入中间态丢失 | 回调原样存，提交守卫只接受安全整数 |
| min/max默认夹紧后声称拒绝了越界 | clampBehavior=none，0/101明确失败 |
| 强制浅色却默认改documentElement | 自有getRootElement/cssVariablesSelector/内存manager |
| Portal移出变量范围后丢主题，或禁Portal伪通过 | target为实例根，保留真实Modal行为 |

## 官方原文与验证边界

官方tag9.7.3固定commit `2d0a040f42011e791caf0bc56b9fbdd36ce55cef`，完整tree无官方中文README。优先目标core包原文343字节，另存hooks334字节与项目3799字节；原文各自完整，不拼接或翻译覆盖。repo/path/version/lang/time/hash及全部实际候选在official/source-audit.json和library.json。

官网实际GET200完整响应头在official/homepage-response.json；该次未见XFO/CSP，但Lab origin iframe未测，unknown而非allowed。

Node真实SDK2只覆盖Provider变量和组件SSR、NumberInput静态值及useDebouncedValue初值；4项policy仅配额/history和本地manager隔离，不证明计时、输入、Portal或焦点。完整真实Playwright提案在validation/browser-proposal.txt，由主控稳定候选运行；正式verification三项NOT_RUN，实际命令/日志/六项在local-validation.md。
