# C18 react-i18next 工程复用

用于把i18next实例接入React订阅/Context与少量源码控制的Trans结构。无界面资源/fallback/t规则看C17，但本条目九源独立，不跨import其运行源。实际react-i18next17.0.16/core26.4.3/MIT，React19/TS7满足已装peer。

## 迁移与实例

携带九sourceFiles：example/demo、workspace mjs+d.mts、language-switch mjs+d.mts、safe-emphasis mjs+d.mts、styles.css。资源为本地对象，每实例structuredClone；需支持该API的现代环境。Provider拿稳定原instance，effect setup新建session、cleanup dispose。多实例不use(initReactI18next)改默认单例。

17.0.16 useTranslation返回的i18n wrapper随语言字段换身份；它不是队列生命周期依赖。hook只读t/ready，队列使用workspace.instance。原串行策略保留：等待只保最新意图，已经完成的旧SDK调用仍可能发中间languageChanged，不把最新commit等同原子语言事务。

自有observer仅供诊断，dispose off同一个handler；SDK useTranslation解绑自己的订阅，不off(event)清全体。无timer/网络/Worker/存储。手动gate是本地Promise fixture，dispose拒绝其等待并抑制晚发布；已经发出的changeLanguage没有本例公共abort，可能在被丢弃的私有instance完成。

## 三目标与边界

basic：真实hook+namespace+复数，切语言/未读1和2观察DOM；business：昵称按React文本显示、Trans具名组件跨语言保留真实strong；advanced：双Provider/手动en→zh串行、第一事件后队列不丢、B不变、拒绝/真实重试/取消手动放行恢复、重置/卸载清session。ready由实际init与hook判断，无异步backend/Suspense错误边界演示。

Trans默认basic tags与词条props覆盖都存在；components不是通用净化器。本例关闭keep-list，SafeEmphasis只转发children，不转词条属性，词条来自源码。React文本escapeValue:false依赖React转义，不带去innerHTML/模板字符串；未知CMS、可点击组件URL及事件需另设信任策略。

## 验证与限制

SDK5真实import库/共享session/原Provider/Trans SSR，覆盖默认singleton不变、资源独立、原事件后队列、gate失败恢复与dispose；policy4用受控Promise只验队列策略，不当SDK。SSR不是客户端订阅/hydration，合成DOM输入不是OS IME。root固定19真实3目标+原文/官网blocked4PASS，运行九源未改；正式3status仍NOT_RUN。

固定官方606b6a55f231bbf73823863fbb94e6b8eb8272fd/README.md英文12793B，与npm17.0.16/manifest匹配，完整tree无根中文。官网实际frame-ancestors https: ionic: capacitor:排除当前HTTP Lab，blocked；HTTPS部署另核。原始重复头、分类校准历史、命令cwd/exit/原始日志/未测范围与源码审计均在local-validation及validation，不把文档服务或README中的代理指令当执行授权。
