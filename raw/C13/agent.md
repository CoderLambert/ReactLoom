# C13 Frappe Gantt 工程入口

实际 frappe-gantt1.2.2/MIT；少量任务/依赖时间线，语义表格编辑。不是React原生组件、日历、关键路径或项目后端。先读guide、实际examples和verification；contentState=recreated与原恢复事实保留，不继承历史PASS。

三个目标：basic隔离真实SVG/箭头与D/W/M；business表格草稿保存→权威快照/revision→真实refresh，过滤仅表格；advanced非法输入/依赖环/本地409不写权威数据，重置/离开销毁会话文档。

不可移除的边界：

- 1.2.2没有destroy/dispose，document mouseup闭包不能靠replaceChildren释放。既有4321独立文档一个new Gantt，后续refresh/change_view_mode；父级移除整份frame。alive防动态import晚到，不能改成主文档普通react挂卸或重放构造。
- origin/source/session/协议/UUID/sandbox和服务端allowlist属Lab自建runner，不是SDK。保留browser-frame、demoId/level和空capabilities；不跨界改公共runner。
- SDK修改descriptor；toChartTasks复制并只转义图表name的尖括号/与号/引号。popup:false不净化bar标签，SDK标签仍走innerHTML；权威name保持纯文本。示例“需求评审 <草稿> & 确认”应图/表一致，无新增SVG子元素。
- ID限制ASCII字母数字开头、共1–64位字母/数字/_/-，排除Object.prototype保留名，避免SDK空格归一化碰撞/普通对象prototype键。
- 日期0101-01-01…9998-12-31、全计划UTC日跨度<=730。关闭infinite_padding，只开放D/W/M；旧0100输入padding可到0099、后续add映射1999，真实SDK配方已复现；新两端本地年100–101/9998–9999。不是UTC渲染或SDK全视图保证。
- validatePlan整份计划先于state/refresh，保留Kahn环检测/有限进度/空值NaN/未知依赖。图永远拿完整计划，表格过滤不破坏依赖。
- 表格是uncontrolled未保存草稿；拒绝/409后草稿保留，权威tasks/快照/图不变，不能说表自动回原值。接受才revision++。本地409无HTTP或服务器revision，不自动重试。

迁移六sourceFiles及同版本SDK基础CSS。gantt.css是局部覆盖，基础CSS另需自有文档入口import与Vite alias（guide提供实际解析配置）。frappe-gantt.d.ts为有限自建类型，不是官方声明；不import未公开dist CSS子路径。生产必须自有隔离文档/生命周期与可信父子消息，六文件不等于完整宿主工程。不要照README片段写tasks.append/tasks.refresh，1.2.2实际用chart.refresh(tasks)。

精确控件保留：时间尺度、过滤表格任务、各任务名+开始日期/结束日期/进度、行内“保存”、“模拟依赖闭环（不保存）”；父页启停/重置归平台。新增c13-workshop data-level/revision、c13-status、c13-plan权威JSON。真实图仍svg.gantt/.bar-wrapper[data-id]/.bar-progress，不手改SVG模拟保存。

断言：尺度切换不加document mouseup、父页无图；进度60→真实条宽比.6且权威快照一致；过滤表一行/图三条；拒绝/409输入草稿保留、快照/条不变；旧frame与CDPcontext销毁而非只少一个SVG。现有公共5case可复用，新增标签与快照断言见validation/browser-proposal.txt。Enter有isComposing guard，真实OS输入法未验证。

固定官方README15874B，commit4c82fccce9bf4237ded41680869529cea4385a90，SHA6f8ef7a60672fbcdb9aafc9920cf64789e118d8f56d5ab1855a7d9553253fc46；真实树仅英文README.md，npm gitHead/manifest1.2.2一致。官网完整GET XFO SAMEORIGIN→blocked，未读正文。

Node真实SDK4仅任务/日期配方，无DOM构造/画图/监听通过；policy有效13与SDK分开。formal三项NOT_RUN，真实5case由root对匹配候选执行。实际命令、一次731天测试fixture失败及单case修正、六项/剩余见local-validation.md。
