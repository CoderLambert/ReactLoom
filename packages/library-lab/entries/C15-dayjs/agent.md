# C15 Day.js工程入口

真实dayjs1.11.23/MIT，适合链式格式/严格输入与显式时区；数据是本地RSS示意。先读guide/examples/verification，不继承旧CI/研究PASS。三目标：basic strict/不可变/实例中文weekday；business两天中午独立构造的NY23/25与UTC/上海24小时；advanced显式offset两fold与春季gap拒绝。

携带7源：example/demo、date-operations.mjs/.d.mts、offset-instant.mjs/.d.mts、styles.css。实际UI/SDK检查共用纯计算模块，example原三个函数导出保留。模块顶层先utc/timezone再customParseFormat，locale词典只登记、展示用实例locale；不能在render/每请求改全局locale或tz.setDefault，不能在卸载假装取消全局插件。不要加载badMutable破坏默认不可变语义。

不可删边界：strictDate正则+实际UTC strict parse，true保留；UTC只用于稳定日历标签加日。civilWindow重新构造下一天中午，不把日历日写成恒等24小时，也不靠add后保留的旧offset。时区规则来自宿主Intl，不是插件内置TZDB；现代样例不承诺全部低年/极限历史范围。

显式事件先校验秒/offset（拒-00:00、超±14:00、0000），dayjs(input).tz(zone)后按完整秒与format Z往返；Z规范为+00。静态dayjs.tz无offset01:30会猜歧义，不得替换该路径；.tz(zone,true)会改变instant，本例不用。定时服务器任务/HTTP/权限/幂等不在实现范围。

level独立Session，advanced不读隐藏civil；输入/zone/preset变化立即清旧结果/error，显式reset恢复种子。原区域“Day.js 官方插件实际运算”、日历日期/IANA时区/纽约带偏移的绝对事件、两preset、计算按钮与dayjs-result保留；新增c15-workshop/data-level、c15-status、重置当前目标。控件原生Tab/Enter按钮可操作，不把合成事件算OS IME。

应用无timer/请求/存储/全局监听/Worker，不造destroy或清其他模块的全局插件。输入节点断开仅证明所属React树卸载，非全SDK缓存泄漏普查。局部CSS包括max-width/min-width和长JSON/offset断行，保留迁移。

官方中文docs/zh-cn/README.zh-CN.md来自iamkun/dayjs@4549b8d03307891143e8a50d39fcdab1f16f77cf，3882B/SHA3f4c6e9edd42554b8c6a1e111daafb568b4eba3e8b9da31a9296abebb8aae2c5。npm1.11.23 gitHead与v1.11.23 tag一致；该源码manifest真实0.0.0-development，安装版本1.11.23，不伪造一致。附根英文原文与安装README同字节。中文官网实际原文链接https://day.js.org/zh-CN/，GET头无XFO/CSP但Lab-origin未测→unknown。

抓取必须全部获取/校验成功后暂存再replace，异常独立failed保留旧成功原文+附英文+证据；维护fixture与HTTP/SDK分开。SDK6为实际共享计算（含混合guard/真实往返），非客户端PASS；完整3case提案在validation/browser-proposal.txt，root统一运行。formal三项NOT_RUN，实际命令/六项见local-validation，不自行content_done。
