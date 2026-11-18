# 2026-11-18 主控闭环补充

六项本地质量PASS。策略8与五文件strict迁入、新非作者consumer/源码核对通过；浏览器3项含来源：真实按钮与根Enter文件对话框、根click不打开、DataTransfer drop及安全文本、类型/大小/数量拒绝和两个同名文件；真实读取持有后clear/新选择/level/unmount不回写旧内容。数量限制测试按实际20.1.4改为接受前2拒第3，保留首次失败并单项重跑通过。候选34及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F02.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F02 本地整改与稳定证据

仅F02目录，无shared/pkg/lock/e2e/队列结果/生成/build/fulltypecheck/commit。真实react-dropzone20.1.4；Node只测自建preview/代次，不实例化Hook，不把policy当SDK。

| 六项 | 状态 / 层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS：实装API/类型+policy；SDK NOT_RUN | 20.1.4/MIT，useDropzone root/input getters、noClick不等noKeyboard、默认根Enter/Space、传统input/取消启发已核对。preview8KiB/UTF8/1600UTF16、accept/size/count UX和非上传边界明确。 |
| 解释清楚 | PASS：静态自检 | 需求/选型→Hook输入→三个独立目标→截断/读取失效→完整迁入/安全边界；不虚构物理取消或可靠全平台dialog cancel。 |
| Demo有用 | NOT_RUN：真实DOM待主控 | 基础chooser/drop/拒绝，业务受限UTF8文本预览，advanced2×1KiB及迟到结果/同名列表。browser3例覆盖实际路径，未执行。 |
| 源码可迁移 | PASS：隔离strict+静态 | example.tsx、preview.mjs/.d.mts、preview-session.mjs/.d.mts全sourceFiles；exact依赖/React>=18/TSX ESM/Blob+TextDecoder，无Provider/env/CSS/网络/账号；strict复制compile exit0。 |
| 官方来源可靠 | PASS：实装字段/固定原文/HTTP | v20.1.4→commitb9a3e10cee6b15b6850e240caac94be80f5c7e0d的README/LICENSE原字节；实际版本MIT，固定无中文README采用en；官网200未Lab嵌入确认unknown。 |
| 结果可复核 | NOT_RUN：policy/compile有日志，真实SDK待验 | policy8与SDK0分列，raw argv/cwd/exit/time、Biome/compile/official日志保存；未把NodeBlob/受控Promise当chooser/drag/browser安全PASS，formal均NOT_RUN。 |

## 实质整改

同名同size的React key已改每次接受时单调唯一id，当前快照稳定，非持久服务器ID/去重哈希。noClick仅禁根鼠标，保留root键盘Enter/Space；外置open按钮不嵌套，FileDialogOpen/Cancel独立反馈并明确传统取消检测启发限制。

preview先slice8192bytes.arrayBuffer后UTF8 stream decode且不flush，截断的不完整尾序列不输出；内部非法UTF8可U+FFFD，非严格编码验证。显示≤1600UTF16码元并丢末尾孤立高代理项，不能称1600码点。文本仅pre，不执行HTML/CSV公式，不读整文件后截断，不上传/读path/建objectURL。

preview-session是UI同源失效逻辑：新drop/read、clear、level key重建、unmount使旧generation失效，迟到成功/失败不能写。Blob.arrayBuffer本身仍完成，不称取消I/O。key=level使Hook/session独立，自己的effect invalidate；库内部文件提取/窗口事件按实装Hookcleanup管理。删冗余level passive reset effect，避免依赖警告与重复状态重置，独立会话key已表达重置所有权。

## 真实定向检查

cwd `/home/lambert/githubRepos/lambert/ReactLoom`，validation/commands.json含精确argv/cwd/exitCode/UTC/log：

- `node --test packages/library-lab/entries/F02-react-dropzone/examples/preview.test.mjs packages/library-lab/entries/F02-react-dropzone/examples/preview-session.test.mjs`：最终exit0，8纯policy，policy-final.log。原前6用例日志保留policy.log；新增内部坏UTF8和读取失败恢复，不给SDK增加计数。覆盖slice字节/中文/1600代理对/坏输入、旧A晚于B、invalidate清空/卸载、后续恢复。
- package scoped Biome examples/browser/metadata/verification初次exit1，原level effect对level仅有意图依赖；采用key=level重建后删除冗余effect，最终exit0，biome-final.log。未全局关规则，初始日志biome.log保留。
- 5原件+browser提案复制自有tmp，严格ESNext/Bundler/react-jsx/ES2022DOM与Node类型（仅Playwright Buffer），`pnpm --filter @reactloom/library-lab exec tsc -p /tmp/f02-portable-…/tsconfig.json` exit0/output空，portable-types.log；不等fullworkspace或Hook执行，tmp定向移除。
- 安装package实际20.1.4/MIT/React>=18、src/index.tsx的noClick/noKeyboard/onFileDialog/getter/处理信号与cleanup核对。官方tag/tree/raw README/LICENSE和主页真实HTTP头保存official/source-evidence.json，元数据/hash合同另记official-contract.log。没有执行README命令。

## 浏览器交棒/剩余

validation/browser.spec.ts：实际button Enter chooser/根Space chooser，noClick鼠标不打开、计数防双开；真实DataTransfer drop与invalid-type/too-large/too-many codes、两同名同size独立行无React key警告；受控慢文件slice.arrayBuffer后选择B/clear/换level/卸载再释放旧A，预览保持最新或空，新挂载不残留。

受控hold实际Blob.slice结果的arrayBuffer Promise用于观察回写边界，不等于文件系统速度或物理取消。传统dialog cancel不因测试注入假事件就声称真实取消验收。生产type/extension检查只是UX，服务端验证独立。未跑共享browser，真实指针/触屏/辅助技术仍未验。作者STABLE停写交非作者和主控，formalNOT_RUN至匹配receipt。
