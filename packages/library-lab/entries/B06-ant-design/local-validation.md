# B06 Ant Design 本地质量整改记录

当前检查点：**STABLE，停止条目所有写入，交主控独立review与真实浏览器**。正式verification的sdk/build/browser均为NOT_RUN，没有以局部日志伪造正式收据。

## 范围、基线与变动

- 实际仓库 `/home/lambert/githubRepos/lambert/ReactLoom`，定向检查cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。
- 原9文件开始无本条目diff；相对路径排序、路径NUL/原文NUL摘要 `f61ba2e79fe54a3a1a6c65274c7074fd362e482869385b181290b4cbd65d0b37`，见validation/baseline.json。
- 独占entries/B06-ant-design，保留其它工作者修改。未改公共src/scripts/e2e、依赖锁、索引、队列results；无提交/推送。没有全目录generate/typecheck/build或隐式浏览器build。
- 已读适用AGENTS与library/agent/guide/全部实际examples/tests/verification，以及COORDINATION/IMPLEMENTATION/REPAIR、质量roadmap和quality skill三份references。历史研究仅作为资料；保留recreated/ORIGINAL_RECOVERED与原来源事实。
- 修改example.tsx、guide.md、agent.md、library.json、verification.json；原feed-history.ts/demo.tsx和history suite仅正常排版。新增feed-url.ts、styles.css、tests/sdk.test.mjs与feed-url.test.mts、official原文/来源/官网头、validation检查脚本/原始txt日志/完整提案、本记录。AGENTS不改。

## 六项结论

| 项目 | 状态与层级 | 依据与限制 |
| --- | --- | --- |
| 技术准确 | PASS（匹配类型/源码、局部真实SSR/token） | 安装与tag均6.6.7；实际Form/setFields、Table rowKey、App.useApp、Modal focusable匹配；Node2仅真实token/SSR，不证明客户端行为。 |
| 解释清楚 | PASS（静态） | 中文按项目确认、Form到Table、一次冲突与撤销三个目标；输入/操作/API/输出/fixture界限对应源码，去除未实现网络/Drawer等堆砌。 |
| Demo有用 | NOT_RUN（实际浏览器） | 3真实目标/控件/数据观察齐，定向严格类型通过；Form提交/Portal/焦点/真实CSS仍待主控。 |
| 源码可迁移 | PASS（静态/类型） | 5必要sourceFiles齐，独立CSS、locale、ConfigProvider→AntApp→Workspace、Form useId命名和原子快照；无Lab alias。 |
| 官方来源可靠 | PASS（固定原文与完整HTTP头） | 实际中文README候选优先，12801B/hash正确；tag/package版本对应；官网中文200但无iframe检查，unknown。 |
| 结果可复核 | NOT_RUN（整体交互） | 原始命令/cwd/exit日志与完整3条Playwright提案齐；SSR与policy分离，不用静态/策略替代浏览器结果。 |

## 保留的业务与最小修正

1. basic仍为项目受控输入→确认Button→成功Alert。空白原生disabled，编辑清成功态；局部Token实际由ConfigProvider提供，没有新增暗色模式。
2. business仍为真实Form到内存Table。名称拒绝全空白；新增normalizeHttpsFeedUrl，URL trim/解析、仅HTTPS、拒绝账号密码、规范host/default port、去fragment作为重复身份，query保留。Table补显示实际URL；Form store单独拥有字段，rowKey=id，Switch改业务state，详情只读。
3. advanced保留同步本地409与一次撤销：注入状态可见，只有下一次通过客户端规则的onFinish才消费标记；form.setFields回填url，message摘要，数组不变。同草稿再提交成功，rows/previous同一个函数式更新。没有真实HTTP或计时网络模拟，冲突不创建撤销快照，ID不因撤销回退。

原history策略保持：重复ID/URL拒绝、无变化开关不覆盖快照、撤销一步且幂等。搜索draft与query分离，6.6.7 Input.Search内部composedRef阻止组合Enter；本例在转发composition事件后也守护onSearch，组合中点击搜索不提交。合成事件检查不等于实际OS中文输入法验收。

配置与资源：ConfigProvider局部Token/zhCN；App.useApp取得有上下文message；Modal使用当前focusable.focusTriggerAfterClose、destroyOnHidden。Form name使用useId，独立样式预留字段错误空间，保留正常onFinish和原生交互。没有自建timer、Worker、全局监听或请求。SDK子树拥有自己的Portal/holders；应用只卸载自己子树，不全局destroy message或清其它实例。

## 匹配版本与官方来源

实际antd6.6.7、MIT，React/ReactDOM peer>=18，宿主19.3.0。antd自身依赖@ant-design/icons，本例不额外直接导入；旧文“不安装图标包”已改为准确依赖边界。在线官网显示6.7.0，关键API以安装6.6.7及固定commit类型/源码核对：Form.Item rules/validateFirst/setFields、Input.Search composition转发、App/useApp、Alert title、Modal focusable等。不沿用已弃用Space direction或Modal顶层focusTriggerAfterClose。

仓库ant-design/ant-design，tag6.6.7固定commit **`dc3a92dcf2fd4d707418c2288901ecc86f26f647`**，上游package.json实际版本6.6.7且peer>=18。完整递归tree truncated=false，README.md和README-zh_CN.md两候选，选择上游简体中文。原文路径README-zh_CN.md，12801字节，SHA-256 **`9459513f975ed488f297ea22a0d724000fa039b6c0c5991e991f59587d00de06`**，同步`2026-11-10T12:59:54.671643+00:00`。未翻译改写；精确repo/path/version/lang/time/hash及package来源见official/source-audit.json和library.json。

官网官方中文入口https://ant.design/index-cn，`2026-11-10T12:59:59.581513+00:00`实际GET200，最终URL同请求，完整响应头存official/homepage-response.json，XFO/CSP均null代表该次未出现对应头。未读取body，未从Lab origin测iframe；unknown而非allowed。原文和官网各自来源，不用官网HTML替代README。

## 实际命令、退出码与日志

cwd全部为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。Node普通命令自然退出，没有force-exit/process.exit/SDK mock。按影响检查，没有重复不受影响套件。

| 命令 | exit / 结果 | 日志 |
| --- | --- | --- |
| `node --test entries/B06-ant-design/tests/sdk.test.mjs` | 0，2/2 | validation/sdk.txt |
| `node --test entries/B06-ant-design/tests/feed-history.test.mts entries/B06-ant-design/tests/feed-url.test.mts` | 0，7/7 policy | validation/policy.txt |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B06-ant-design/examples/demo.tsx` | 0 | validation/typecheck.txt |
| `pnpm exec biome check --write entries/B06-ant-design/examples entries/B06-ant-design/tests entries/B06-ant-design/validation/check-entry.mjs entries/B06-ant-design/library.json entries/B06-ant-design/verification.json entries/B06-ant-design/official/source-audit.json entries/B06-ant-design/official/homepage-response.json` | 0，13文件 | validation/biome.txt |
| `node entries/B06-ant-design/validation/check-entry.mjs` | 0，3目标5source、metadata/原文hash | validation/metadata.txt |
| `pnpm exec biome format --stdin-file-path=entries/B06-ant-design/validation/browser-proposal.ts < entries/B06-ant-design/validation/browser-proposal.txt` | 0 | validation/proposal-format.txt |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node entries/B06-ant-design/validation/.browser-proposal-check.ts` | 0，临时同内容.ts删除 | validation/proposal-typecheck.txt |
| `git diff --check -- entries/B06-ant-design` | 0 | validation/diff-check.txt |

真实SDK2只执行theme.getDesignToken和真实React renderToStaticMarkup下的Input/Button/Alert/Form初始绑定/Table稳定行key，输出静态HTML字节；没有执行当前TSX的Form客户端提交、message展示、Portal或浏览器CSS。7项policy仅纯history和URL规则。生产入口strict tsc证明接线类型；格式仅修改排版，不重跑有效SDK/policy。无运行失败隐藏；早期只读package信息one-liner有一次括号错误，改用JSON读取已核实版本，不当SDK失败/通过证据。

## 真实浏览器提案与未测

validation/browser-proposal.txt三项完整@B06源码已格式/类型检查，主控接公共e2e和冻结候选。无page.route、SDK mock或伪造后端：

1. basic观察真实主题CSS、空白disabled、键盘确认与Alert清除。
2. business实际无效→有效Form/aria-invalid、HTTPS规范化/重复拒绝、分类Select键盘、Table稳定ID、草稿/组合事件协议/搜索、Switch与撤销、Modal Escape回焦、真实排序与第2页。
3. advanced非法提交不耗一次注入、有效提交回填409/不增行/不造快照、同草稿重试成功和一步撤销；先从Agent页签进入Demo，Modal打开时真实browser Back经同文档SPA history回Agent，观察React卸载Portal/反馈，再重进与停止。未用page.goto重载假装组件清理，也不穿透Modal遮罩点击宿主。

路径`/libraries/ant-design?tab=demo&example=basic|business|advanced`。b06-workshop的data-count/query/conflict-armed；b06-table内真实tr[data-row-key]；b06-records、b06-conflict。控件名称与guide/agent一致，提案不强制点击或替换SDK结果。

尚未执行真实browser：Form动态错误/成功、主题CSS、Select/Table/Switch交互、Modal焦点与卸载、message holder移除、composition协议、真实OS IME、触摸/读屏、对比/缩放、SSR hydration或服务端API。表单URL不抓取也不提供SSRF防护；真实RSS抓取需在服务端另外实现。本次无公共接线/依赖新增需求。formal仍全NOT_RUN，交主控独立review后再按候选运行。

## 主控candidate10真实浏览器闭环

真实Ant Design三场景+官方展示4项通过：局部Token真实CSS、受控确认、Form无效/有效/URL规范化和重复错误、真实Select/Table/排序/分页/Switch、组合输入事件协议与提交式搜索、Modal Escape回焦；有效提交一次409、同草稿恢复、原子一步撤销、真实SPA Back卸载打开Portal与通知。真实SDK SSR/token2与policy7有效局部结果分开记录。

主控非作者完整六项复核无P1/P2。两次定向失败均是测试观察：Input.Search原生role为searchbox，antd默认双汉字按钮名为“搜 索”；按实际role及/^搜\s*索$/匹配后该完整业务case1PASS，无生产改动。OS中文输入法仍未测，合成composition协议不冒充设备IME。

候选2182输入SHA25b58acba7305fb7dc70bd492e23c6056c21064e81cf07098cd339a5786297bf：lint/type/build/catalog0且changed=[]。原始和定向日志在docs/library-lab/evidence/quality-upgrade/candidate-10，均有实际argv/cwd/exit/dist绑定和产物副本；不隐式build。非作者六项与源码/文档/官方已闭环，本地content_done；正式sdk/build/browser仍NOT_RUN待干净授权提交及recorder。
