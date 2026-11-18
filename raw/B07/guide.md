# Material UI：主题负责样式，业务状态负责数据

一个RSS设置面板需要统一输入外观、筛选订阅、编辑草稿和回填错误。Material UI提供带样式的表单、表格、Dialog、Snackbar和主题；业务数组、校验规则、冲突与撤销由应用决定。它适合接受Material交互的管理页面；需要完全自定义外观和DOM时可比较无样式原语，已有另一套主组件体系时先评估引入成本。

本例固定 `@mui/material@9.5.0`、`@emotion/react@11.14.0`、`@emotion/styled@11.14.1`，React19.3.0。安装包的React/ReactDOM peer覆盖17/18/19，不等于这些版本或所有浏览器都已验收。Core与Emotion为MIT；没有安装图标包、MUI X或商业网格，Core许可不能替代其它产品的许可。没有新闻接口或远程素材。

## 先分清四份状态

```text
稳定主题 → ThemeProvider → MUI组件/Emotion生成样式
权威history.rows → 同步过滤 → Table / 受控Switch
Dialog草稿 → 本地字段校验/一次模拟409 → 成功后addFeed
通知 → Snackbar计时/关闭     撤销 → history.before
```

通知关闭不会恢复数据，Dialog取消也不改列表。表格只显示数据，不承担请求、缓存或授权。页面没有DataGrid、服务端分页、后台同步或真实HTTP409，不能把这些本地fixture写成网络验收。

## 目标一：看见主题怎样到达组件

打开“局部主题与受控输入”。修改“工作区名称”，TextField是受控输入，原字符串写回React；Chip根据trim后的值显示“工作区已命名”或“请输入名称”，下方output同时说明输入与有效名称。`slotProps.htmlInput.maxLength=60`把约束交给真实HTML input；它不是MUI业务校验器。

```tsx
<ThemeProvider theme={themes.light}>
  <TextField label="工作区名称" value={workspace}
    onChange={event => setWorkspace(event.target.value)}
    slotProps={{ htmlInput: { maxLength: 60 } }} />
</ThemeProvider>
```

勾“仅本例深色主题”，Card/Paper、文字与输入外观应变，站点其余区域不换主题。展开“查看实际主题”，JSON直接读useTheme返回的mode、primary、paper、text、圆角和spacing；不是预填另一套颜色。主色固定#2b674e，圆角10，spacing(2)为16px。

两个主题在theme.ts模块级创建，重渲染不会反复createTheme。此例显式cssVariables:false，通过React context选择浅/深主题，不使用全局颜色存储、color-scheme控制器或CssBaseline。没有覆盖页面body/reset；这是一种便于独立迁移的接入选择，不是所有MUI项目都必须关闭CSS变量。

## 目标二：表格、开关和一步撤销

打开“订阅筛选、开关与一步撤销”。初始三行，工程实践/设计系统启用，资讯观察暂停。搜索标题或地址会同步过滤本地数组；无匹配有明确空态，清空搜索恢复。筛选不删除数据，也不记录撤销。

键盘或鼠标切换“工程实践 订阅状态”，真实Switch的checked和该行文字变化，history.before保存上一份数组；点“撤销”只回退最近一次有效写入。连续改两行后撤销，前一次改动保留；再撤销按钮禁用。关闭成功通知不影响rows或before。

```ts
setHistory(previous => toggleFeed(previous, id, enabled));
setHistory(undoFeed);
```

event里的checked先作为布尔值传入，不在延迟state updater里重读可变DOM。行key是稳定id，不是数组下标；无效id或重复同值不覆盖before。新增local-N使用单调序号，撤销后也不回退nextId。它是一步快照，不是无限撤销栈或数据库事务。

## 目标三：Dialog草稿、错误与恢复

打开“Dialog草稿、错误与恢复”，点“新增订阅”。真实Dialog默认Portal到body，同时保留React主题context；名称自动聚焦。标题和说明分别用useId关联，Tab应留在弹层、Escape关闭后焦点返回触发按钮。没有关闭MUI的focus trap或restore功能；这些结果仍须真实浏览器验收。

内部是实际form，按钮type=submit，Enter与鼠标走同一保存路径。noValidate让本地校验结果可观察：名称trim后1–60（按JS length），URL必须可解析且是HTTPS，成功时使用URL.href规范化。本例只校验字段，不会抓取用户地址。

空保存会在TextField的error/helperText和Alert显示错误，焦点转到首个错误字段，草稿留在框内。修正后重试；“下一次保存注入409”只让下一次**通过字段校验**的保存失败一次，不清草稿、不改列表。注入被消费后同值重试可成功；真正的本地重复地址仍须换地址。这是自建业务fixture，不是Dialog自动生成的HTTP结果。

成功才addFeed、关闭Dialog、清空草稿并显示Snackbar。取消、Escape或背景关闭保留草稿，清错误和未消费的注入标记，不修改history。再次打开可继续编辑。保存后“撤销”回到保存前数组，新id计数仍前进。

Snackbar由MUI的3000ms计时器管理，悬停/聚焦或页面失焦可能暂停/重设剩余时长；不要把它当精确业务时钟。每条新通知有独立key；关闭按通知id校验，迟到的旧close不能抹掉新通知。点击外部不关闭，显式“关闭通知”或SDK timeout只改通知，绝不执行撤销。

## 迁移与所有权

复制六个sourceFiles：demo.tsx、example.tsx、theme.ts、feed-history.ts、draft-policy.ts、styles.css。demo只重导出，源码无Lab alias；MUI组件用sx与主题，少量CSS仅作用本条目。默认字体栈有Roboto/Helvetica/Arial等回退，本例不下载字体，不保证与官网字体完全相同。

保留Emotion运行依赖、ThemeProvider位置、slotProps和稳定id。Dialog Portal的物理DOM可在body，React context仍来自Provider；只用宿主CSS后代选择器不能假定会命中Portal。不要把默认焦点管理改成手写timeout聚焦，也不要让MUI和另一套组件库同时拥有同一弹层。

应用没有自建timer、监听或网络任务；Dialog/FocusTrap/Portal/过渡与Snackbar timer/窗口监听由SDK拥有并清理。卸载打开的Dialog后应无Portal残留，重新运行回到三行默认值，body滚动限制和焦点行为需要浏览器观察。减少动态通过真实useMediaQuery读取，Dialog transitionDuration为0；没有假称所有第三方过渡都已完成减动验收。

宿主是客户端SPA。SSR迁移需要单独配置Emotion缓存/插入顺序、媒体查询与hydration策略，本文的静态SSR标记测试不等于完整应用SSR已通过。MUI旧教程的inputProps/InputProps不能替换本例9.5.0的slotProps；也不要因Core有Table就假定已经安装或授权MUI X。

## 官方原文与验收范围

官方v9.5.0解引用到commit [`1c3f8b49`](https://github.com/mui/material-ui/blob/1c3f8b4903f21cfad12c102edb3db4ceba2e8c8c/packages/mui-material/README.md)。检查该提交根目录与目标包，只有英文README候选，主快照是目标包原文2284B。版本/路径/语言/时间/sha与全部HTTP头见official元数据；本页中文教学与原文分开。

官网此次HTTP200同时含XFO SAMEORIGIN与enforced CSP frame-ancestors *。按 [CSP与XFO优先级](https://w3c.github.io/webappsec-csp/#frame-ancestors-and-frame-options)，有效frame-ancestors覆盖XFO，不能只看XFO就判blocked；也未从实际Lab origin确认可用，所以保留unknown和直达。没有放宽公共iframe策略。

真实Node SDK2项检查主题计算和真实TextField服务端HTML，纯业务策略6项另记；它们不证明Dialog/Portal、键盘焦点、浏览器Emotion样式或Snackbar真实时间。三目标的完整真实浏览器源码在validation/browser-proposal.txt，主控运行，正式verification仍NOT_RUN。日志和六项结论见local-validation.md。
