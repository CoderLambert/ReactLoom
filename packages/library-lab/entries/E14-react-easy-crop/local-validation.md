# 2026-11-18 主控闭环补充

六项本地质量PASS。策略7与九文件strict迁入通过；非作者发现reset P2后核对实装组件更新分支及受控几何consumer，保留发现和修复。浏览器3项含来源：真实拖动x变化后reset坐标恢复/可导出、重复reset、方形与16:9坐标及PNGdecode/zoom尺寸、持有真实bitmap检查后释放恢复、非法文件拒绝、卸载后late bitmap.close与所有URL回收。候选32及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E14.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E14 本地质量整改

独占E14目录；无shared/依赖锁/e2e/生成/队列结果/build/fulltypecheck/commit。真实react-easy-crop6.2.4；Canvas实际执行待DOM浏览器，不新增DOM测试依赖。

| 六项 | 状态 / 层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS：实装API/类型与policy | 6.2.4/MIT实核；onCropComplete第二参数像素、默认样式注入/官方unmount据实装。输入4MiB、解码后1600万、分配Canvas前400万输出/整数几何分层；不称解码前像素保护。 |
| 解释清楚 | PASS：静态自检 | guide区分Cropper几何/自建预算/真实Canvas编码、SVG fixture/照片、独立检查与导出代次、三目标与失败恢复/资源所有权。 |
| Demo有用 | NOT_RUN：真实DOM待主控 | basic只几何；business16:9真实PNG；advanced本地预算/竞态/URL。浏览器提案覆盖三目标、实际decode/PNG尺寸、迟到编码、检查期间resize/控件禁用与恢复、URL revoke。 |
| 源码可迁移 | PASS：隔离严格编译+静态 | example及四组helpers/声明共9必需文件全sourceFiles；默认SVG/image-runtime/file-check不遗漏。exact依赖/React TSX DOM/样式/Canvas API列清，复制源码和browser提案strict编译exit0。 |
| 官方来源可靠 | PASS：固定原文/真实HTTP | v6.2.4→commit91bfd8f0928ead345e5126a539edab4657d82993，README/LICENSE原字节；安装6.2.4/MIT；固定无中文README回退en；官网GET200但未Lab嵌入确认unknown。 |
| 结果可复核 | NOT_RUN：policy/迁入已记证，DOM未跑 | policy7/7、Biome/隔离编译/官方合同原始argv/cwd/exit/log保存，不能当Cropper/Canvas SDK PASS。formal verification仍NOT_RUN。 |

## 修复与资源边界

原checkingFile与导出generation共用：检查期间几何改变会作废requestId，旧finally不清checkingFile而永久卡住。现在file-check epoch独立，只有新选图/卸载/恢复默认使旧校验过期，导出generation只管几何与输出。检查时屏蔽pointer/range/onCropComplete；失败保留旧area，不出现错误后area永久空且无法重试。新检查finally不会关掉更新检查。

level用子组件key，独立实验重建并使旧检查/导出失效。导出同步activeExport ref防重入；任何几何变化清旧结果，旧finally不释放新gate。已有Image.decode/Canvas.toBlob不会被代次物理取消，迟到结果仅丢弃。image-runtime finally移除Image src并置Canvas尺寸0；bitmap在检查路径finally.close；source/result各自effect createObjectURL/revoke，仅自己URL，无global clear。

文件4MiB先于createImageBitmap，但像素限制在第一次解码后才能检查，不能防第一次解码的所有内存成本。MIME声明非格式证明。输出400万像素和矩形范围在Canvas分配前。默认1200×800原创SVG不是实拍；输出真实栅格PNG，不保留EXIF/矢量。没有旋转、跨源下载、上传或代码执行。

## 实际检查

cwd `/home/lambert/githubRepos/lambert/ReactLoom`；validation/commands.json含真实argv/cwd/exitCode/UTC及日志：

- `node --test packages/library-lab/entries/E14-react-easy-crop/examples/crop-policy.test.mjs packages/library-lab/entries/E14-react-easy-crop/examples/file-check.test.mjs` exit0，7项纯policy，validation/policy.log。5项MIME/字节/像素/矩形/输出，2项独立文件代次及新选择/卸载失效。没有挂载Cropper、没有mock SDK后记PASS。
- package scoped Biome examples/browser/metadata/verification首次exit1，原geometry effect隐式依赖触发规则；最终将几何失效放在现有crop/zoom/接受文件/重置handler和key换层，删除会在子Cropper提交新area后再清空area的passive effect。最终Biome日志biome-final3.log，初始失败保留biome.log。
- 复制9必需原件及browser提案到自有tmp，已安装Lab依赖symlink，`pnpm --filter @reactloom/library-lab exec tsc -p /tmp/e14-portable-…/tsconfig.json` exit0无诊断，portable-types.log；strict/ESNext/Bundler/react-jsx/ES2022 DOM/Vite+Node类型，仅迁入，不是全Lab检查。tmp定向删除。
- 实装index.d.ts与bundle核对onCropComplete/roundCropAreaPixels/onMediaLoaded/disableAutomaticStylesInjection/unmount API。官方tag/tree/raw原文及demo HTTP响应原始证据在official/source-evidence.json；README原文hash/metadata合同另有日志。

## 主控浏览器交棒

validation/browser.spec.ts三个实际目标：basic方形像素随zoom变化；businessCanvas输出非空PNG decode尺寸等于area及近似16:9；受控toBlob延迟后几何改变，迟到结果不回写且后续可导出；advanced错误MIME恢复、有效自生成PNG（无外部照片）、受控createImageBitmap等待期间range禁用/resize后能完成、source/result URL在恢复默认与卸载归零。外层探针观测真实浏览器API，不只组件消失；测试恢复所改API或随独立page结束。

本作者未跑共享browser；真实触摸/键盘辅助技术/图像CORS/OS设备仍未验。没有文本IME控件，不虚构输入法结果。官网unknown不等于allowed。STABLE后停写，交非作者及主控。


## 定向delta：重复默认重置（2026-11-18）

主控指出默认source/crop0/zoom1下reset清area会永久禁用导出。实装index.module.mjs componentDidUpdate仅比较crop.x/y、zoom等实际值，不因新crop对象引用而发回调，已静态确认。reset现在在source===sample且crop0/zoom1时保留既有area，仍清导出/作废旧文件检查；真实几何变化继续清area等待SDK。changeCrop同值短路，避免受限拖动回传相同坐标却清空有效area。browser proposal补advanced连续两次reset仍可导出及真实PNG，主控另执行；此处只定向Biome，不重复policy/SDK全套。


## 定向delta：非零位置程序重置（2026-11-18）

非作者发现source=sample/zoom1/crop非零时reset仍可卡area。实装index.module.mjs的componentDidUpdate纯crop.x/y分支调用emitCropAreaChange；emitCropAreaChange只调用onCropAreaChange，而emitCropData同时调用complete和area-change。因此UI改由onCropAreaChange第二参数实时同步SDK pixels，检查文件时仍屏蔽，覆盖拖动/完成/程序reset，不手算矩形。guide/agent/最小代码同步。此处仅定向Biome，主控执行拖动→reset→导出真实浏览器回归；不重复全套或假称Node证明DOM回调。
