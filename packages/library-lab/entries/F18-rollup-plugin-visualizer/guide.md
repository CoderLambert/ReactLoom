# F18 rollup-plugin-visualizer：让真实构建说出Bundle结构

## 使用目标

当Library Lab或正式项目出现入口体积过大、懒加载失效、重复第三方依赖时，用真实Rollup/Vite构建输出分析模块与chunk，而不是通过源码行数臆测字节大小。visualizer 只观察产物，不会自动优化导入或删除依赖。

基线 rollup-plugin-visualizer 7.1.1（MIT）、本仓库Vite 8.3.4。专用fixture位于 examples/fixture，不触发当前Lab主构建。已有ReactLoom SPA模板也使用同类插件但不表示可直接改现有配置——公共配置由PLATFORM独占。

## 安装和运行

```sh
pnpm add -D rollup-plugin-visualizer@7.1.1

# 在packages/library-lab内：
pnpm exec vite build --config entries/F18-rollup-plugin-visualizer/examples/vite.config.ts --mode basic
pnpm exec vite build --config entries/F18-rollup-plugin-visualizer/examples/vite.config.ts --mode business
pnpm exec vite build --config entries/F18-rollup-plugin-visualizer/examples/vite.config.ts --mode advanced
node entries/F18-rollup-plugin-visualizer/examples/verify.mjs
```

报告写入 examples/reports/（由本条目.gitignore排除）；不覆盖主站 dist，也不创建提交大体积自动产物。

## 三层真实演示

1. Basic：真实Vite构建输出 treemap HTML。可以浏览文件与chunk布局，但不自动打开浏览器。
2. Business：生成 markdown 模板的业务构建摘要，用于PR对比。报告字节大小来自当前构建，不预填任何假数据。
3. Advanced：输出 raw-data JSON；fixture/main.ts 通过动态 import('./heavy') 拆出额外JS chunk。verify.mjs必须检查JSON解析成功和>=2个JS chunk。

## API和生命周期

```ts
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [visualizer({
  filename: 'path/to/report.html',
  template: 'treemap',
  gzipSize: true,
  open: false,
})]
```

Raw-data格式含自己的version；不要把内部JSON字段当永远不变的公开协议。生成的HTML虽然不包含完整源码正文，但可能记录绝对路径、模块名称、依赖链等敏感元数据，**私有仓库的报告不要自动发布到公开CDN**。

### 懒加载与分块的区别

visualizer必须基于真实构建才能判断 chunk。源码写了动态import但配置/打包优化可能使结果不符合预期；本案例额外通过dist目录输出实测两份以上JS chunk。HTML可视化里的盒子大小也不等于真实浏览器首屏下载量，需要结合网络和缓存策略检查。

## 专属反例

- **把全仓all-chunk总大小当作首屏传输量**：应基于特定路由与网络瀑布、gzip/br比较。
- **把treemap漂亮等于性能提升**：性能还与JS执行、长任务、CSS、图片、Worker有关；要有受控测量。
- **把开发模式体积当生产值**：必须使用vite build，生产压缩规则和环境一致。
- **随意改shared manualChunks避免重复**：拆包策略可能破坏缓存与副作用顺序，应从真实模块依赖和回归验证入手。
- **向公开渠道上传私有路径报告**：报表含项目结构信息，必须审核再发布；源码和密钥永不放进构建报告。
- **CI每个文案修改都跑完整分析**：该工作适合受影响应用和指定定时性能检查。

## 与其他工具联用

F16 dependency-cruiser定位源码层级和循环；F15 Knip识别无效入口；E09 Shiki负责网站上的源码展示，不做bundle体积测量。优先改业务边界，再复核所有生产chunk实际构成，避免为降低数字牺牲可维护性。

## 验证计划与限制

输入已经有真实Vite配置/源码与verify.mjs，但本环境尚不能安装依赖或执行Vite8插件，**SDK/CLI NOT_RUN，build BLOCKED，浏览器NOT_RUN**。生成HTML/Markdown/JSON必须来自真实命令，不允许把本指南示意数值写成PASS。

官方：https://github.com/btd/rollup-plugin-visualizer
