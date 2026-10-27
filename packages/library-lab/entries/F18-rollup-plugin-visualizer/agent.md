# F18 rollup-plugin-visualizer — Agent的Bundle排查手册

适用于Vite/Rollup/部分Rollup API构建产物体积分析；不替代Vite编译器、浏览器性能测量或静态依赖分析。精确基线rollup-plugin-visualizer@7.1.1 / MIT，结合实际Vite版本确认选项。

## 可迁移最小文件

examples/vite.config.ts 作为隔离配置示例，examples/fixture/{main.ts,helper.ts,heavy.ts}提供静态/动态import差异，examples/verify.mjs验证真实输出。生产项目只引入visualizer plugin和报告路径，不复制fixture或让主构建受到Lab测试配置影响。

## 有证据的实施流程

1. 明确是入口体积、分路由加载、重复依赖还是CSP/Worker问题。
2. 针对生产配置开启报告，open:false，不强迫CI启动浏览器。
3. 阅读treemap与raw-data构成，不先下性能结论。
4. 根据归属定位源码中的静态import与真实动态import；调整后重新构建并在浏览器测网络请求/执行。
5. 仅记录真实报告和工具版本；报告包含可能敏感的源码路径与chunk名称，避免公开共享。
6. 对本例执行 verify.mjs，检查真实vite build、HTML/Markdown/JSON存在和动态chunk分离；没有真实运行不可填PASS。

## 禁忌

不能把所有lazy chunk求和等于首屏大小，不能把Raw JSON字段未经版本锁定放进长久稳定API，不能在没有合适测试时直接硬编码manualChunks，不能提交生成reports巨型文件，不能使用假体积图或手写报告冒充SDK输出。

与F16源码依赖规则、F15未用依赖识别互补。验证状态见verification.json；目前真实构建仍BLOCKED。官方：https://github.com/btd/rollup-plugin-visualizer

**可迁移的报告验收**：运行 `examples/verify.mjs` 前只清理工具自己的受控reports，必须重新构建再校验生成文件、版本与chunk，不得借用旧产物。纯Node `report-policy.test.mjs` 只验证解析断言，不能升级build或SDK状态。
