# A03 Chart.js 接入与所有权

先读library/guide、actual examples和verification。Chart.js4.6.1（MIT）直接管理Canvas，适合有界柱线统计；React拥有数字和选择，图表副本不是业务缓存。无react-chartjs-2包装器、网络、存储或PNG/CSV页面功能。

## 核心模型

chart-model.ts按需注册Bar/Line controllers、对应elements、Category/Linear scale、Legend/Tooltip。共同模块支持两图，不宣称basic单独只打包Bar或已测包体。createReadingConfig拷贝labels/data、关闭动画、启用父容器响应式。chart-stream-policy固定7个整数、revision0..10000；初值总1127，每步+42。

example effect只在effectiveKind/稳定plugin变化创建，当前counts ref保证类型重建不退回旧数据。数据effect写dataset+update('none')；选择effectsetActiveElements，类型重建后继续应用选择。cleanup先清自己的ref再destroy，不操作其他实例registry。数字变化保留chartId；类型变化先销毁再建。

自有plugin读取真实实例id/type/data/active、width/height和BarElement/PointElement中心点，累计实际SDK回调；不是mock、替代坐标或公开SDK资源计数。centers可为null，不以类型断言或Number转换伪造数值；浏览器点选先核有限坐标并结合DOM尺寸换算。

## 三目标和迁移

basic验证真实Canvas点选与表格双向选择；business验证同Chart更新后的数字/合计/ID；advanced验证柱线重建、父容器70%/100%尺寸变化、选择保留和采样清理。原按钮/Canvas名称/表格键盘路径保留。新增a03-workshop/canvas/chart-container/total/selection/sdk-state用于观察。

带走example.tsx、chart-model.ts、chart-stream-policy.ts、workshop.css；demo.tsx只重导出。专用容器position:relative且310px高，Canvas独占，responsive/maintainAspectRatio由配置处理；不另加ResizeObserver或改DPR。浏览器window/document仅effect使用，SSR需客户端边界。

保留visibilitychange/media change清理；400ms采样显式勾选，后台/离开advanced/达到上限停，系统reduced motion默认暂停且须另允许。动画始终关闭。上界是revision而不是数据窗口；当前固定7点，不声明FPS/海量性能。

## 证据层级

SDK Node检查真实Chart+原生@napi-rs/canvas1.1.0（来自当前已锁定pdfjs-dist可选依赖）生成PNG；不新增共享依赖，无mock Canvas/SDK。该fixture仅测试环境前提，缺可选原生库时必须报告具体前提缺口，不能伪造替代图或自动安装。它验证实际构造/update/命中/选择/重建/resize/destroy，但不证明DOM事件、CSS响应式或浏览器字体。

纯策略5项和SDK2项分开；类型/格式/metadata原始日志见local-validation。validation/browser-proposal.txt是三目标Playwright源码提案，未接公共e2e、未运行。正式sdk/build/browser仍NOT_RUN。

官方v4.6.1固定commit76d8cf895a7485dc838c90ef37e2bc9d9e388fcb，真实package版本匹配；完整tree仅英文根README，无中文候选。原文2605B/hash/date、官网完整GET头见official；无XFO/CSP但未实际Lab iframe，unknown。不要把历史研究或仓库CI当本条目PASS。
