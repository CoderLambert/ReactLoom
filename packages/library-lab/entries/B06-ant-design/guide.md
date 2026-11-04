# Ant Design 6.6.7：企业组件的真实数据与状态边界

## 安装
`pnpm add antd@6.6.7`，引入`ConfigProvider、App、Form、Table、Modal`等。示例`examples/example.tsx`从真正ant-design SDK导入组件，不是仿制样式。`examples/demo.tsx`只是宿主出口。版本6.6.7和React19.3的兼容仍需由平台真正安装/类型测试，不能把 npm 页面声明当作完成证明。

## 三层Demo
**basic**：Input受控值+Button禁用语义、主题token与Alert结果。
**business**：RSS订阅列表+校验Form+Table稳定rowKey+搜索、排序、分页、启用Switch、Modal详情。
**advanced**：模拟“下一次提交HTTP409”，用`FormInstance.setFields`精准给url控件回填错误；保留查询状态、列表撤销与用户消息。这里的HTTP409仅是本地fixture行为，没有网络请求，不能记为后端或MSW集成通过。

## 状态所有权
Form实例管理表单值及校验；React状态管理后端快照、当前筛选、撤销和Modal。真正后端集成时还应使用独立API client/Query管理服务端状态、取消旧请求、规范HTTP错误；不能用`form.getFieldValue`当服务器真相。Stable rowKey必须是订阅ID，不能是数组index。

## 六项工程注意
1. **静态message/modal**：在React并发和Context下可能丢失主题/locale；示例使用`App.useApp()`。
2. **把字段规则当服务器唯一校验**：UI rules不能防止409/权限冲突；响应错误映射到Form字段并保留输入。
3. **重复缓存表格数据**：排序分页交给明确所有者；生产远程分页不应同时本地再分页。
4. **中文IME**：用户组合输入中不能误触提交；搜索使用原生Input.Search的提交而非全局keydown Enter。
5. **Portal与样式**：ConfigProvider不能自动隔离所有全局DOM/样式，Modal等挂载位置要检查焦点返回、遮罩层和宿主设计系统。示例未使用全局reset.css覆盖Lab。
6. **误认为CSS样式即无障碍**：Dialog需要正确标签、关闭后焦点恢复，按钮和错误消息可通过键盘/读屏获取；测试实际组件交互。

## 生产与许可
Ant Design UI自带模块体积较大，不应在Library Lab首页静态import。按Demo动态加载才引入本库。深色主题、定制token与国际化按产品需要加入，不要为一个独立按钮引入整个设计系统。MIT许可，不等于可不核对图标/素材许可。

## 替代与组合
与MUI（B07）和Mantine（B08）按企业主题需求、设计一致性、API习惯选择；React Hook Form（C01）与Ant Design Form是两种表单状态owner，叠用必须明确桥接协议，否则双重校验/状态丢失。

## 验证计划
当前只写源码；SDK/typecheck/build/Chromium NOT_RUN。后续验证字段校验、模拟409回填、撤销、分页排序、Modal键盘焦点、IME搜索、主题Portal、卸载后无残留Overlay，并在真实服务中补取消和竞态测试。

官方：https://ant.design/components/form/ · https://ant.design/components/table/ · https://ant.design/components/app 。

## 原子撤销快照（第10轮）

此前新增、Switch切换和撤销各自调用 `setRows` 与 `setHistory(rows)`，其中 `rows` 是事件闭包中的旧快照。快速连续操作或React批处理时，历史记录可能对应错误的状态。现用 `examples/feed-history.ts` 的纯状态转移，将当前rows和单层previous纳入**一次函数式 setFeedState**。重复订阅ID/URL不生成新的撤销快照，缺失的项目操作也不污染历史。Undo只撤销最近一次有效修改，不是完整多级历史或服务端事务；真实保存需等后端确认后纳入重试和回滚策略。

Node纯逻辑测试覆盖快速连续切换、重复新增、无效操作和单次撤销。该检查不代替 Ant Design Form/Table/Portal 在浏览器的交互测试。
