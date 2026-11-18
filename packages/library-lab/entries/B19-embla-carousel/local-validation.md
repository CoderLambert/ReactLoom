# B19 Embla本地质量整改记录

Owner /root。原9文件基线SHA5a70ed09fd73a62c9366124fddf975ecfa0a64b14f503509033c87811ff56284，实际dirty工作区HEAD1218066e706a90ba03fac8dff8c9b843dd2429c4；保留他人改动，没有依赖/锁/模板变更或Git提交。正式三项全NOT_RUN。

## 工程问题与保留/修改

原basic/business仅标题不同，合并为基础完整实验+高级动态循环两个独立目标；保留真实useEmblaCarousel8.6.0、原创四卡、稳定ID分配、snap与card区别、减少动态导航jump、局部键盘和hook销毁。原拥挤源码/长维护历史重写为正常排版和具体输入→SDK→结果。

基础新增48%/82%真实CSS宽度选择，SDK ResizeObserver重新测量可观察trimSnaps合并；读数来自真实API/rootNode/containerNode/slideNodes，不手造引擎状态。高级保留24上限/至少1张/恢复代数，说明loop请求与单卡fallback；watchSlides:false让受控React列表reInit由一个effect拥有，默认watchResize仍工作。去掉手工reInit之后的重复状态同步，统一select/reInit回调读边界。

ARIA外层region包含所有控件/卡片，以useId对应可见标题；slide group参照W3C APG，不用误导为表单fieldset。局部viewport group专门接收自建方向键，只有自己持焦才处理，按钮不抢键；两处局部Biome说明是实际语义选择，不全局关规则。显式slide border-box保迁移尺寸，不依赖Lab reset。hook拥有destroy，应用成对off、清media监听；destroy只读观察旧viewport，不二次销毁。

三运行源齐：demo.tsx、example.tsx、slide-policy.ts，全部局部内联样式，无网络/图片/插件。5 pure policy有效，SDK核心依赖DOM，未造假layout或用SSR静态标记冒充引擎。真正SDK定向运行由公共真实浏览器完成；此刻仍NOT_RUN。

## 官方来源

npm8.6.0公开gitHead0fe65834136f1aa35e4c1a4a477e5ccb4bb5ee54，固定packages/embla-carousel-react/package.json=8.6.0，wrapper exact依赖核心/reactive-utils8.6.0，MIT。完整14 README候选无中文，选目标README13872B英文原文SHAd7b2b1227204396e7900e4f951df7a59c2266b565040927de74d86184f9998d0，未改写/拼接。仓库/ref/path/language/version/time/hash及全部GET头在official/source-audit.json和library.json。官网200无XFO/CSP，未Lab iframe确认，unknown+直达。

## 实际命令与证据

详细实际argv/cwd/exit在validation/local-runs.json及每个txt。cwd为repo根；pnpm --dir子命令实际cwd为packages/library-lab。

| 检查 | 实际结果 |
| --- | --- |
| python packages/library-lab/entries/B19-embla-carousel/validation/fetch-official.py | exit0，官方npm/tree/manifest/原文/主页5请求，完整headers/字节/摘要在source-audit。 |
| node --test packages/library-lab/entries/B19-embla-carousel/tests/slide-policy.test.mts | exit0，5PASS/0SKIP，policy.txt，仅索引/ID/键盘门禁。后续仅排版，不重跑。 |
| pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B19-embla-carousel/examples/demo.tsx | 初次/ARIA元素与新尺寸控制受影响复查全部0，typecheck/typecheck-final/basis-type.txt；未全量重复。 |
| pnpm exec biome check --write （精确文件参数见manifest） | 首次3个ARIA语义诊断exit1保留biome.txt；语义修正/精确说明后exit0，biome-fixed/format-final/final-lint.txt。无全局规则削弱。 |
| node packages/library-lab/entries/B19-embla-carousel/validation/check-metadata.mjs | exit0，2目标3源/原文SHA/官网schema，metadata.txt。 |

## 六项检查点

| 维度 | 状态 | 依据与限制 |
| --- | --- | --- |
| 技术准确 | 静态/类型PASS | 真实8.6.0 wrapper与核心源/类型；watchSlides/Resize、loop自动fallback、getter、jump/监听/销毁均匹配。 |
| 解释清楚 | 静态PASS | 两目标去掉重复，输入→CSS/DOM→SDK测量/状态，维护历史移出，真实fixture/键盘增强边界清楚。 |
| Demo有用 | NOT_RUN | 需真实原生pointer、宽度/RO、动态loop/IDs、卸载候选，不把policy当SDK。 |
| 源码可迁移 | 静态/类型PASS | 3源/内联资源/显式box-sizing，无Lab alias与transitive直导；媒体和SDK监听对称。 |
| 官方来源可靠 | PASS | 固定npm gitHead/同版本包原文/完整候选/哈希/头与unknown证据齐。 |
| 结果可复核 | NOT_RUN | 真实引擎+独立review待完成，命令/cwd/exit/日志均已落。 |

公共e2e/quality-remediation-embla.spec.ts三项精确@B19：真实CSS width→snap合并、可信pointer/实际transform与稳定DOM/边界；实际loopwrap、单卡fallback、reInit/ID不重用/恢复/24上限；局部键盘与动态减动jump、真实RO窄屏、hook destroy真实事件和重挂。无SDK/DOM测量/时钟mock。触摸硬件/读屏、完整WCAG、SSR hydration/性能不在本次范围。正式recorder条件未满足，不为记证擅自提交。

## 集成类型与静态review增量

非作者quality_e11指出SDK将末margin计入content，48%+3%步距51%仍可能保留4 snaps；已改唯一gap为2%以使目标步距50%，保留原snap<card断言留真实浏览器裁定。首candidate14全Lab类型发现入口只接2个level不满足宿主标准3值，尽管独立入口类型通过；已恢复兼容3值类型并把未列business分支按basic处理，metadata仍只列2独立目标，无新增演示。原失败输入/类型日志保留candidate14/initial-typecheck-failure，源文件定向lint0，未重复pure policy或公共e2e lint；受影响type及后续build/catalog继续。

## candidate15 主控本地质量闭环

本条目适用六项均已通过。candidate15输入f76964af6e3bfa520b3e9e1d78c67a00b09713e1987c8adcce994b46c3e53857，公共/e2e lint/type/build/catalog0且changed=[]；固定dist真实browser29项26PASS/3FAIL，三个失败只属于尚未完成B22。本条目实际通过范围和独立处置见路线图results/B19.md；旧作者摘要为各自阶段历史，新主控输入摘要见validation/controller-input-hashes.json。正式三收据仍NOT_RUN，不是生产/真人最终验收。
