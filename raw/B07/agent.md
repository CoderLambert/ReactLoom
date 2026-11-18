# B07 MUI 9.5.0工程入口

真实@mui/material9.5.0 + Emotion react11.14.0/styled11.14.1，React19.3.0。Core/Emotion为MIT，未安装icons-material或MUI X；不要把Core许可/版本套到X商业包。对应安装类型、固定commit和当前v9.5.0官方资料核对，不套旧InputProps接口。

三目标：basic模块级稳定浅/深主题、useTheme真实值、TextField受控输入与htmlInput slot；business本地Table/Switch筛选/空态/一步undo；advanced真实Portal form、字段错误、一次409与重试、Snackbar和焦点恢复。业务fixture不是HTTP。

迁移六sourceFiles：example、demo适配、theme、feed-history、draft-policy、styles。无Lab alias/远程素材或字体；cssVariables:false和不使用CssBaseline让本例主题不接管全站。Portal在body仍继承React主题，不依赖宿主CSS后代样式。SSR另配Emotion/媒体查询/水合，SSR SDK标记不证明整应用。

保留约定：

- history.rows为权威，before只有一步，nextId撤销也不回退；稳定id行key，无效/同值不覆盖快照。筛选不写history，Snackbar关闭不undo。
- event.checked先捕获为布尔值再进updater；不延迟重读可变DOM。
- Draft单独state。noValidate实际form提交走本地helper，字段error/helperText + Alert留框并聚焦首错。有效后才消费一次模拟409；再次同值可成功，重复地址仍拒绝。没有下载URL。
- 取消/Escape/背景关只清错误/注入、保留草稿；成功才清稿加行。useId关联Dialog标题/说明，不禁Portal、trap/restore。
- Snackbar真实3000ms timer由SDK清理，聚焦/失焦等影响时钟；notice key/id guard保护新通知，clickaway不关。没有自建timer或异步请求。
- 六文件与CSS齐；默认字体回退，不声称所有第三方动画或辅助技术都验收。

观察：b07-workshop/theme-state/preview/name/count/empty/history与row-s-1等；switch仅本例深色主题、按标题的订阅状态；搜索订阅、撤销、新增订阅、下一次保存注入409；Dialog添加 RSS 订阅、订阅名称/HTTPS 地址、取消/保存本地记录。完整提案见validation/browser-proposal.txt。

Node SDK2只真实主题与SSR标记，policy6为原history4+draft2，不能当Portal/focus/DOM PASS。完整日志/六项见local-validation，formal三项NOT_RUN。

固定目标包英文README2284B、commit1c3f8b4903f21cfad12c102edb3db4ceba2e8c8c，root/target均无中文候选。官网XFO SAMEORIGIN但enforced CSP frame-ancestors *优先，未Lab-origin实测→unknown，不机械blocked/allowed。官方全部头/sha/date在official。
