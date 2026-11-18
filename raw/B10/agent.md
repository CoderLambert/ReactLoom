# B10 Base UI复用指南

适合已有设计系统、需要无样式React交互原语的项目。当前三个目标仅覆盖Checkbox：基础label/Space；手工父级混合选择；禁用规则与浏览器FormData。不扩成Dialog/Popover教学，原生单个checkbox已足够时优先原生。

实际@base-ui/react1.9.0，React/DOM19.3.0，peer17/18/19，MIT。不是@mui/base或Uber baseui。按路径从@base-ui/react/checkbox导入；不要套用Radix asChild。

Root默认span role=checkbox，旁侧是CSS隐藏的原生type=checkbox input。onCheckedChange第一参严格boolean，indeterminate是独立prop；SDK写aria-checked=mixed和客户端DOM属性。保留外层label、input id/htmlFor、稳定aria-labelledby、说明aria-describedby、Indicator aria-hidden与CSS focus-visible。不自行重写Space/Enter，也不把hidden input加入Tab顺序。

复制library.json列出的4源：demo出口、example、permission-policy、checkbox.css。无Lab alias/外部资源/存储。SDK拥有自己的事件，应用仅用inputRef读真实属性；ref随卸载解除。本例没有全局listener/timer要自行清除。

手工父级由permissionSummary在eligible集合内推导，不传CheckboxGroup专用parent。子项保留name=permissions和value=真实id，提交直接new FormData(form).getAll，不拿React数组伪装浏览器结果。normalize/changePermission/bulk规则是本地业务fixture，不是授权服务；锁定同时删除manage并disabled，清除旧提交和诊断快照，解锁不自动恢复权限。服务端仍须重新授权。

b10-workshop带data-level；b10-parent/read/comment/manage是实际Root；b10-input-reading为inputRef当次DOM快照，b10-form-data为实际提交数组。按钮“读取实际输入”“提交本地 FormData”可观察。基础标签、三权限和原锁定语义保留，多个实例useId隔离。

真实SDK Node检查只做React SSR：role/mixed/native input name/value/checked/disabled，不证明DOM效果、键盘、FormData或hydration。原六policy只验业务规则。浏览器提案必须用真实库/label/Space/Tab和FormData，不mock SDK或写DOM checked；主控统一运行。

官方原文1856B来自v1.9.0固定commit ad7ecda5296b0295b41a51ecb01fce6204acd099/packages/react/README.md；根/包目录无中文候选，完整证据/hash见official和library.json。官网GET200、CSP frame-ancestors *覆盖XFO SAMEORIGIN的限制判断；没有真实iframe确认前unknown。六项和命令见local-validation，formal三项保持NOT_RUN，不从仓库CI或静态/SSR/policy推导整库PASS。
