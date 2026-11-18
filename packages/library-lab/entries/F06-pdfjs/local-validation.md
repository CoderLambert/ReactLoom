# 2026-11-18 主控闭环补充

六项本地质量PASS。Node 实际解析2/2、策略9/9，独立320×200一页新输入。Chromium实测原生Worker和已绘制Canvas、提取文本、损坏文件保留、巨页拒绝清旧画布、迟到读取失效及逐项Worker终止。候选35及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F06.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F06 本地质量证据（作者 STABLE）

范围仅本条目。未运行 shared generate/build/full typecheck、共享浏览器、提交或安装依赖。正式 `verification.json` 三项仍 NOT_RUN；本地成功不能替代 recorder。父控后续独立试用/浏览器另记。

## 六门槛

| 维度 | 本次证据 / 边界 |
| --- | --- |
| 技术准确 | 实装6.3.289，真实 getDocument/getPage/render/getTextContent；Worker 同版本地 ?url。Node legacy SDK2真实解析/文字通过，不是浏览器Worker或Canvas。标准字体warning原样保留。 |
| 可理解 | guide解释生成/编辑/OCR边界、候选保留与预算失败清画布的区别、两种独立预算、active/代次/gate/destroy职责。 |
| 实验有效 | 基本真实一页绘制、业务分页+文字、进阶缩放/本地候选/独立损坏探测，目标不同；真实UI浏览器由主控待验。 |
| 可迁入 | 六运行源文件含全部mjs类型；demo为可省宿主。复制六源后调用三个level严格编译PASS；?url依赖Vite/client已说明。sourceFiles不再夹测试。 |
| 官方资料 | v6.3.289固定commit 1c8020a7d4e43668ac287a3ecf9a8dbea17e4c56 README/LICENSE原字节与SHA256；固定树只有英文根README。实装包version/license/engines字段保存。官网HTTP200无XFO/CSP，未知嵌入结果保持unknown。 |
| 可复现验收 | commands.json保存cwd/argv/exit/output；SDK2、policy9、严格迁入、scopedBiome均PASS。browser.spec.ts只提案，正式NOT_RUN。 |

## 已修复的真实边界

- keyed level隔离会话；任何File选择在校验前增加fileGeneration，非法选择也使旧读取失效。File.arrayBuffer无法真正取消，过期完成只忽略。
- accepted/candidate/probe三类loadingTask分别拥有；候选成功才替换；失败不覆盖已接受PDF。旧accepted在提交时cancel render并destroy。WeakMap缓存destroy promise避免同任务重复销毁；捕获异常不冒称释放已完成。
- render.cancel后通过gate等待settled；过期getPage/文字/排队绘制不提交。渲染失败排队清零canvas；新渲染先清旧文字，超预算不展示旧页成功假象。
- 3 MiB=3,145,728bytes，空文件也拒绝。CSS/背板4096边长、8,000,000像素和DPR≤2都在非零分配前检查。

## 原始验证

所有下列命令 cwd=`/home/lambert/githubRepos/lambert/ReactLoom`，退出码均0：

```sh
node --test packages/library-lab/entries/F06-pdfjs/examples/sdk.test.mjs
node --test packages/library-lab/entries/F06-pdfjs/examples/render-gate.test.mjs packages/library-lab/entries/F06-pdfjs/examples/render-budget.test.mjs packages/library-lab/entries/F06-pdfjs/examples/worker-version.test.mjs
pnpm --filter @reactloom/library-lab exec biome check --write entries/F06-pdfjs/examples entries/F06-pdfjs/validation/browser.spec.ts entries/F06-pdfjs/library.json entries/F06-pdfjs/official/source-evidence.json
pnpm --filter @reactloom/library-lab exec biome check entries/F06-pdfjs/examples entries/F06-pdfjs/validation/browser.spec.ts entries/F06-pdfjs/library.json entries/F06-pdfjs/verification.json entries/F06-pdfjs/official/source-evidence.json
```

原始 stdout/stderr：`validation/sdk.log`（2/2）、`policy.log`（9/9：gate3、budget4、静态版本/路径2）、`biome-initial.log`、`biome-final.log`。初次Biome只格式化本目录14文件，无规则失败；最终15文件通过。测试执行后仅格式化，无逻辑变更，不重复相同套件。

SDK实际import `pdfjs-dist/legacy/build/pdf.mjs`，使用Node内置测试运行器和已安装环境。`standardFontDataUrl`警告与坏输入`Indexing all PDF objects`警告保留；不添加DOM补丁/依赖。Node路径使用本进程fake worker，不计真实Worker、terminate、Canvas、DPR或用户File控件PASS。

严格复制编译命令包含临时绝对路径，见 `validation/strict-copy-command.json`（cwd、argv、六文件、exitCode0），原始空输出 `strict-copy.log`。配置strict、ES2022、Bundler、react-jsx、vite/client、DOM，skipLibCheck仅跳第三方声明；实际复制源码与消费三个level均检查，不是全仓检查。

官方获取：GitHub API `git/ref/tags/v6.3.289`解析固定commit，递归tree查询README候选；两个raw固定commit URL下载原字节。实际包字段、URL、哈希、字节数见 `official/source-evidence.json`。官网命令 `curl -L --max-time 30 -D .../official/homepage.headers -o .../official/homepage.body https://mozilla.github.io/pdf.js/` exit0，最终URL相同，HTTP200；无XFO/CSP字段，不据此宣称可嵌入。

## 浏览器与剩余限制

`validation/browser.spec.ts`为主控提案，未在作者环境执行。主控需适配现有Lab路由/启动控件，观测真实Worker逐实例构造/请求/terminate，不以DOM消失或自建事件替代。重点包含真实Canvas非白像素、两页文字、快速切换、坏候选保留、巨大MediaBox拒绝，以及held File读取后非法选择/切场景/卸载的迟到结果。

未实现CMap/标准字体/WASM资源、复杂中文PDF/加密/表单/注释层/任意远程文档；本地原创夹具成功不推广至这些条件。3 MiB和像素预算不限制解析器全部CPU/内存，不能当安全沙箱。完整来源指纹在 `validation/source-fingerprints.json`。

主控接线修正：官方快照文件名按平台固定契约改为 `official/readme.md`，原文 SHA 不变；修复检索入口 metadata 拒绝。
