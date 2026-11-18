# 2026-11-18 主控闭环补充

六项本地质量PASS。策略7仅配置与double；非作者五文件严格编译/新输入通过。浏览器4项含来源：真实DOM净化保留合法格式、剥离多通道恶意节点/属性与URL、无远程探针或执行标记、程序化12001字符清旧输出后重置。候选31及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E10.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E10 DOMPurify 本地质量复核（2026-11-18）

独占E10，先落NOT_RUN再整改。未改shared/依赖锁/e2e/队列/生成，未跑共享build/fulltypecheck/browser，未commit。不新增Node DOM依赖；本轮**没有执行真实DOMPurify sanitize SDK**，纯策略/注入double控制流不能冒充SDK。真实DOM/攻击/网络行为由主控浏览器闭环，正式sdk/build/browser/security均NOT_RUN。

|六项|状态/证据层级|证据与边界|
|---|---|---|
|技术准确|PASS：实装源码/类型+纯policy|3.4.17默认data/aria为true、profile重建标签/属性表、URI regex默认/返回语义从src/purify.ts核对。显式两false使既有窄属性表实际成立；policy7项通过。真实sanitize效果尚未运行。|
|解释清楚|PASS：正文/源码对照|三个不同目标格式、公告窄属性/链接、攻击与失败边界；private实例、唯一sink、正则非完整URL、unsupported/异常、净化后改DOM风险均说明。|
|Demo有用|NOT_RUN：真实DOM待验|保留原tag/attr/URI范围，三个实际输入目标；browser提案3例覆盖真实格式/链接、危险DOM/标记/远程探针、重置与程序化超限清旧结果，未执行。|
|源码可迁移|PASS：隔离复制源严格编译|example.tsx、html-policy.mjs/.d.mts、sanitize-preview.mjs/.d.mts完整列入所有sourceFiles；demo可省。安装/ESM/TSX/DOM前提，无CSS/Provider/env/账号，无Node/SSR接线。|
|官方来源可靠|PASS：固定原文/许可与实际响应头|固定3.4.17 peeled a77a3e78b59f72fa4d1c83f22e121ad9cc7d3575的README；完整tree无官方中文对应README，en。安装3.4.17/(MPL-2.0 OR Apache-2.0)，固定LICENSE/APACHE及LICENSE-MPL原文保存。仓库GET200明确deny/frame-ancestors none=blocked。|
|结果可复核|NOT_RUN：policy/compiler已完成，SDK/DOM未执行|精确argv/cwd/exit/raw日志齐全；policy7/7、Biome11files、隔离编译、官方合同通过，不推成真实净化、网络、安全或正式receipt PASS。|

## 实际命令和原始日志

cwd `/home/lambert/githubRepos/lambert/ReactLoom`。validation/*-command.json存精确argv/cwd/exitCode/UTC时间；*.log为实际合并stdout/stderr。不是verify:record收据。

- `node --test packages/library-lab/entries/E10-dompurify/examples/html-policy.test.mjs packages/library-lab/entries/E10-dompurify/examples/sanitize-preview.test.mjs`：exit0，7tests/7pass/0skip，policy.log。5项配置/URI正则+2项注入double控制流；double不是DOMPurify SDK。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/E10-dompurify/examples entries/E10-dompurify/library.json entries/E10-dompurify/verification.json entries/E10-dompurify/validation/browser.spec.ts`：最终exit0，11files，无诊断，biome-final.log。
- `pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e10-portable-duqbuk20/tsconfig.json`：exit0，无诊断，portable-typecheck.log。复制5必需文件及browser提案、独立React consumer；ES2022/ESNext/Bundler/react-jsx/strict，依赖symlink已安装包，无新install或全workspace typecheck。
- `node --input-type=module -`：exit0，official-metadata.log；command.json保存stdin，真实共享validateOfficialSources返回[]，原文字节SHA匹配metadata。

首次Biome的通用noDangerouslySetInnerHtml会拦合法净化器示例唯一sink，保留biome.log；首个放在元素前的JSX suppression未命中，保留biome-suppression-attempt.log。最终仅对该prop添加精确行级注释，理由是html唯一来自私有真实DOMPurify路径、unsupported/异常返回空；没有修改共享规则或放宽标签/属性。最终Biome通过。这项静态豁免不表示DOM安全已经运行通过。

## 关键技术修正

- 标签/普通属性/URI正则保持原范围。实装ALLOW_DATA_ATTR/ALLOW_ARIA_ATTR默认true，旧“ALLOWED_ATTR只有href/title所以不会有其它属性”结论不成立；现在显式两false收紧实际范围，business fixture包含target/data-track/aria-label使边界可见。
- useMemo每挂载createDOMPurify(window)私有实例；没有setConfig/addHook。共享default实例上的setConfig可能让调用参数不再按预期生效，因此不能只声称每次传policy就不受别处影响。
- 新sanitize-preview为唯一输入/unsupported/异常控制流。长度12000UTF16单元在helper也检查，unsupported不调用净化器，不返回dirty；错误或非字符串结果清空html，不留旧成功。创建实例/加载模块/其它React错误在该helper范围外，正文不伪造全部异常恢复。
- URI表达式是前缀约束，`https://example.com:99999/path`正则true但new URL抛错，已有纯policy真实反例。不是完整URL/host验证或可信域证明。safe HTTPS仍能导航外站，未经许可不点击。
- 原文仅textarea，pre只同一结果文本；唯一HTML sink不接原文。sanitize后拼接/改DOM、交第二个解释器是新的安全边界。没有全局清理或虚构destroy，private实例仅随React引用释放；未宣称站点已部署Trusted Types/CSP。
- 删除原指南未经本轮核实的特定安全发行/漏洞史，不用版本pin替代回归。实际浏览器3.4.17净化/网络仍待验证。

## 官方取证

- `git ls-remote https://github.com/cure53/DOMPurify.git 'refs/tags/3.4.17*'` exit0：tag object a307c2ac04d751cde8870191d6af503141e8c58a，peeled a77a3e78b59f72fa4d1c83f22e121ad9cc7d3575。
- Python urllib实际GET固定commit tree/README.md/LICENSE/LICENSE-MPL，exit0；official/tree.json/source-evidence.json/readme.md/LICENSE.txt/LICENSE-MPL.txt保留原文与选择依据。固定树无官方中文根README，en回退；没有自编中文冒充原文。
- README SHA256 `565e6a29192b5dbb94b172ef5e4b90759994eb34874da22bb8e9be5c3e894969`。安装包字段3.4.17与(MPL-2.0 OR Apache-2.0)，固定LICENSE是Apache2.0、LICENSE-MPL是MPL2.0，两份原文字节已保存。
- `curl -fsSL -D packages/library-lab/entries/E10-dompurify/official/homepage-headers.txt -o /dev/null https://github.com/cure53/DOMPurify` exit0，HTTP200，X-Frame-Options deny、CSP frame-ancestors none，明确blocked，不以iframe load猜测。

## 稳定交棒/独立复核重点

validation/browser.spec.ts三例由主控复制执行：basic格式和重置；business合法HTTPS+title及属性精确仅href/title；advanced真实子树无script/svg/img/事件/style/危险协议，点击无害标记事件未执行、远程src探针无请求；程序化超过textarea上限时旧结果清空再恢复。默认sample和攻击均无读取凭据/破坏性操作。

必须同时验DOM剥离/标记/网络，不能仅靠innerHTML中的script未执行、CSP阻止或目视检查。浏览器还没有运行，超限是实际UI路径提案；unsupported/sanitize异常仅pure controlflow，不声称已在旧浏览器触发。没有Node DOM执行，不能填写SDK PASS。

独立review重点：实际data/aria默认与false、profile覆盖、private实例/API类型、URI regex的非完整验证、唯一sink/错误清空、五文件迁入、双许可与固定原文、真实恶意DOM/网络闭环。正式各项保持NOT_RUN，STABLE后停写交主控与非作者。
