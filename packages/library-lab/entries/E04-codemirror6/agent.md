# E04 CodeMirror6 工程复用

嵌入源码/配置文本、光标、历史选CodeMirror；只读高亮Shiki、完整IDE服务Monaco。三包codemirror6.0.2/state6.7.6/lang-javascript6.2.5均MIT，独立版本不等于不兼容。

已有React/TSX DOM宿主运行`pnpm add codemirror@6.0.2 @codemirror/state@6.7.6 @codemirror/lang-javascript@6.2.5`。复制example.tsx、editor-config.mjs/.d.mts、draft-policy.mjs/.d.mts；demo可省。Bundler解析，无Provider/env/额外CSS/字体/Worker；basicSetup、typescript语言配置和View.theme齐全。

State不可变，View拥有DOM；创建只在level effect，updateListener仅docChanged更新展示长度。权威文本从view.state.doc读取，不逐键整篇React受控替换。每次effect创建自己的Compartment配置，切换readOnly只reconfigure同View，用户只读不阻止程序dispatch，重置可修改且不是权限控制。

sessionStorage仅reactloom:library-lab:E04:config-draft:v1，创建business和save/restore都检查字符串50000UTF16单元/NUL，读写catch。空字符串合法；非法恢复先拒绝再dispatch，不清空正文/其它key。没自动保存/网络/语言服务/代码执行。输入长度实时可超过恢复预算，不能宣称实时容量限制。

卸载清viewRef且destroy本次View；Node真实State事务不是EditorView证明。浏览器外层保存真实view观察destroyed，同View身份检查；内部cmTile探针只用于固定安装版本测试。真实IME/读屏需人工，不能把DOM消失当destroy或按键当真实IME。

官方README是codemirror/basic-setup6.0.2固定commit76462c05acb10fe77e0f04edd7fcddfeb9987abd原文，MIT；state/语言独立版本映射保留。首页unknown，无Lab嵌入确认。真实SDK State与policy分计，DOM/browser和formal receipt未跑保持NOT_RUN。
