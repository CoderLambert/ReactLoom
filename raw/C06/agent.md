# C06 IMask 7.6.1

固定位编号、金额外观与日期形状需要逐键选区维护时用本库；自由中文备注用普通input。imask/react-imask7.6.1均MIT，wrapper peer React>=0.14仅为声明，当前React19.3。无HTTP/账本/持久化/RHF/async schema。

三个独立目标：basic真实Pattern value/unmasked/complete与中间编辑；business Number分隔符/归一化/JS数值边界；advanced日期Pattern填满不等于真实公历、中文普通输入。

保留：

- IMaskInput未传value，SDK拥有masked输入DOM/光标，React只观察onAccept/onComplete；不要把本例说成value受控回写。第一参由unmask选择，maskRef四值直接来自SDK，null表示尚无事件。
- basic unmask=true的数字串与input连字符显示分开；金额Number radix='.'/scale2/逗号，默认normalizeZeros=true/padFractionalZeros=false。typedValue是JS number，非财务精度；complete非付款/业务成功。
- advanced mask='0000-00-00'，不是Date模型；unmask=false保留分隔符。完整Pattern仍须validCalendarDay，空/不完整可继续。原UTC setUTCFullYear与0–99年/闰年/0000规则保留。
- 外层key=level隔离状态，显式reset才增加generation重挂。不要每按键换key，也不要原地从Pattern硬换Number。reset清快照/计数/普通备注，焦点不保证保留。
- 备注普通受控input不套mask，composition状态只是事件观察，blur清状态；无提交快捷键。协议探针不能叫真实OS IME。
- type=text，numeric/decimal inputMode只提示键盘。onChange不作为masked业务入口，不手工写input.value。inputRef是真实input，包装器ref不是同一种对象。

迁移demo/example/calendar-policy.mjs/.d.mts/styles五文件，局部border-box/焦点/换行CSS必要。wrapper卸载destroy自有mask；实际InputMask只解绑八种直接view DOM事件并删除el引用，不主动清已排10ms cursor任务（晚到由!el守卫跳过）；_listeners对象赋length=0不清各accept/complete键。本例不长期保存maskRef，不承诺全部内部订阅/计时立即清空。应用无timer/全局listener，不全局清SDK资源。真实卸载/光标/输入法/SSR hydration待运行。

控件保留区域“IMask真实SDK示例”、编号/金额/事件日期/中文备注、“重置当前控件”；原imask-value保留。新增c06-workshop data-level/generation、c06-events、c06-snapshot真实四值、c06-date/ime。完整提案与精确命令见validation/local-validation；formal三NOT_RUN。

官方原文主React包、附核心包同固定7.6.1来源；不混官方中文教学与自行翻译。具体commit/hash/中文候选/完整官网头见official，缺实际Lab iframe确认不能allowed。SDK模型测试与calendar policy/React browser各自记录。

390px迁移边界：保留.c06-workshop的overflow-wrap:anywhere；连续API名说明段必须断行，不能以overflow:hidden掩盖。candidate16旧advanced曾324px内容溢出308px容器，实际测量和局部CSS对照见local-validation。
