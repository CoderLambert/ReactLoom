# B08 Mantine 工程入口

core/hooks9.7.3，MIT；实际React/ReactDOM peer^19.2.0，宿主19.3.0。官网已9.8.0，API按安装与tag。未引入form/notifications/modals包，无服务端功能。

三个目标：basic局部主题与受控工作区确认；business150ms真实useDebouncedValue筛选、稳定ID表格Switch与原子一步撤销；advanced真实Modal/NumberInput草稿、提交校验和回焦。只用三行本地fixture。

迁移example.tsx、feed-history.ts、local-color-scheme.ts、styles.css与demo适配器。保留styles.layer.css。Provider自有root(useId)，cssVariablesSelector/getRootElement配置与Modal portalProps.target成套；内存colorSchemeManager不碰宿主localStorage。withGlobalClasses=false；官方导入CSS基础层仍文档级，不称ShadowDOM隔离。生产可统一根Provider，不重复每个组件。

NumberInput默认number模式onChange为number|string；保留空/减号等字符串。decimalScale2允许实际小数，validQuota仅1–100安全整数。min/max配clampBehavior=none，不偷偷夹紧。error关联输入，Alert摘要；非法不写before，合法form submit原子更新rows/before，同值不造历史。取消/Escape/遮罩丢草稿，edit重新加载，不声称脏检查保护。

Modal为真实Portal，保留trapFocus/returnFocus/data-autofocus。SDK拥有滚动锁/焦点/hook timer，应用只卸载自己的树，不清全局存储或共享资源。useDebouncedValue新值清旧timer、卸载cancel源码已核，未用env=test绕过Portal/过渡。

定位b08-workshop data-filter/selected；b08-table行data-feed-id/quota/enabled；b08-count、b08-filter-draft/applied；Modal内b08-quota-draft来自真实onChange。控件工作区/确认工作区、筛选订阅、撤销上一次、标题+状态Switch、编辑+标题+配额、每小时请求上限、保存配额/取消编辑/关闭配额编辑。

反例Number(value)||0、只收number、index key、无变化覆盖撤销点、默认Provider写页面root、Portal无主题继承、禁Portal假测。无useForm/HTTP/版本冲突/真实取消/分页/性能承诺。

SDK2为真实SSR/初值，policy4仅规则；不当实际数字输入/计时/焦点/PortalPASS。browser完整提案在validation，正式sdk/build/browser全NOT_RUN。

官方9.7.3 commit2d0a040f42011e791caf0bc56b9fbdd36ce55cef，core343B原文优先，hooks334B/root3799B另存，完整tree无中文候选，精确hash/path/version/lang/time见official/source-audit。官网200全头未见XFO/CSP、iframe未测unknown，详见local-validation。


候选10真实CSS发现Lab无层button规则覆盖mantine层；本例styles.css只在公开控件类/自有根对font、background、border、radius、padding、cursor、opacity逐属性revert-layer，保留SDK值和本例焦点环，不用all/硬编码teal。Switch在onChange内先捕获enabled再交给函数式updater，禁止延迟读取event.currentTarget。此修正影响B08三个场景，下候选三项定向browser复验，SSR/policy不重跑。
