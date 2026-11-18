# 2026-11-18 主控闭环补充

六项本地质量PASS。策略4仅fixture；非作者实际源码/迁入编译及delta复核通过。浏览器4项含来源：SVG真实decode尺寸、core动态加载、Enter打开后实际焦点转移/返回、左右切换、撤项及卸载外层core destroy事件、打开动画中卸载回归从destroy0失败转destroy1且overlay移除。候选31及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E13.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E13 本地整改与稳定证据

仅E13目录，未改shared/依赖锁/e2e/生成/队列/build/fulltypecheck/commit；PhotoSwipe5.4.4。原创data SVG非照片/远程图床。提取完整artwork.mjs及声明，所有sourceFiles包含真实fixture与policy；补SVG显式width/height，不再凭viewBox推naturalWidth。

| 六项 | 状态 / 层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS：实际SDK源码/类型静态+policy | Lightbox init/destroy、window.pswp、core destroy事件/keyboard默认trapFocus和returnFocus据实装5.4.4。visible稳定memo驱动React锚点与effect重建；锚点点击实际走SDK传入的gallery DOM数据源，集合改变销毁重建；显式1200×800 SVG固有尺寸与元数据匹配。 |
| 解释清楚 | PASS：静态自检 | 选型→两层模块与尺寸/素材→完整迁入→单图/多图caption键盘/动态撤项三个目标→清理与真实证据；不虚构远程图库或生产照片。 |
| Demo有用 | NOT_RUN：DOM待主控 | 实际Lightbox/lazy core、caption开关、第四张增删可见；browser proposal覆盖全部目标、图片decode/尺寸、方向键Esc焦点、集合变更及外层core destroy事件。 |
| 源码可迁移 | PASS：静态+fixture policy | example、gallery-policy及声明、artwork及声明齐全；exact pnpm依赖、React TSX ESM/CSS/dynamic import；必须PhotoSwipe CSS，无env/Provider/字体/服务。 |
| 官方来源可靠 | PASS：实装字段/固定原文/HTTP | v5.4.4→commitfd85184b450f451bc4aa2697f6d0a79304d13473的README/LICENSE原字节，安装包5.4.4/MIT核对；固定无中文README回退en，主页GET200未Lab嵌入确认unknown。 |
| 结果可复核 | NOT_RUN：policy有记录，DOM未跑 | 纯policy4/4与Biome/official合同原始argv/cwd/exit/log齐，未伪造Node SDK PASS。DOM/decode/keyboard/真实destroy未执行，formal verification维持NOT_RUN。 |

## 实际必要检查

cwd `/home/lambert/githubRepos/lambert/ReactLoom`：

- `node --test packages/library-lab/entries/E13-photoswipe/examples/gallery-policy.test.mjs` exit0，4项纯policy/fixture，validation/policy.log。选1/3/4、重复ID/坏字段拒绝、实际SVG显式尺寸/禁止脚本模板验证，不加载DOM SDK。
- package scoped Biome check/write examples/browser/metadata/verification：首次exit1，原effect依赖仅以level/includeExtra隐式表明数据变化。初次改为memo visible；非作者指出点击覆盖options.dataSource后，主控移除无效数组配置，visible驱动JSX与空集合/effect边界，最终exit0；原失败日志保留biome.log，最终biome-final.log。模板信息另按等义字符串修正。
- 安装包package.json直接读取5.4.4/MIT；实装src/js/lightbox/lightbox.js将真实core置window.pswp，on destroy删除，Lightbox.destroy调用core.destroy并解绑gallery；shouldOpen防迟到import打开。keyboard.js默认trapFocus/returnFocus，非手写焦点假象。
- 官方tag API/tree/raw README+LICENSE与homepage真实GET，原字节和完整响应头/摘要保存official/source-evidence.json；没有官方中文README，不自译冒充。来源contract/hash另记validation。

## 交棒与边界

metadata不再写Canvas，fixture只有SVG。SVG显式width1200/height800与viewBox表示固有显示尺寸/坐标，不是实拍栅格像素。policy不证明任意SVG安全，只有作者受控模板；生产替换图源需单独校验和授权。

Basic首开提案观察core资源请求名photoswipe.esm（排除lightbox），由主控结合实际构建chunk名核对；源码动态import本身不是加载时机PASS。图片需要浏览器decode/naturalWidth真正执行，policy正则不是图像解码。

Business caption为React figcaption，不注入灯箱HTML；键盘/焦点由SDK默认并待browser。Advanced modal遮住页面控件，测试程序点击已有按钮代表外部集合更新，不冒充用户能穿透遮罩。现visible memo变化作为明确资源重建边界，先close请求，再effect cleanup destroy旧Lightbox。

外层通过官方window.pswp取真实core，公开on('destroy')计数，分别观察打开时撤第四张及卸载；不是只看.pswp节点消失。实际Lightbox自身gallery监听退订据源码，browser不宣称遍历所有内部监听或泄漏数字。动态import不能物理取消下载，destroy只阻止迟到打开。

未跑共享browser，不安装DOM环境、不写伪SDK测试。触摸/真实辅助技术/减少动态均NOT_RUN。作者STABLE后停写，交非作者及主控候选执行。

主控复核修正：真实浏览器在打开动画中卸载，destroy事件计数仍0（candidate31/opening-regression-red.txt），证实单次destroy不足。已添加公开openingAnimationEnd兜底后重试core.destroy，原失败trace保留，最终回归由主控候选记录。
