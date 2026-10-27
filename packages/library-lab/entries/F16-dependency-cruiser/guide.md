# F16 dependency-cruiser：把架构边界写成能失败的规则

## 为什么需要

类型检查只能证明语法/类型规则，不能保证分层架构。例如domain模块 import UI组件仍可能通过 tsc；多个模块相互import也未必立即崩溃。dependency-cruiser分析真正存在的模块依赖图，可通过 forbidden 规则阻止不合理依赖并在CI报错。

本条目基线 dependency-cruiser 18.5.0 / MIT，CLI配方**不是在线运行服务**。直接查看 examples/workspace 的隔离fixture；真实CLI依赖和退出码须在可安装环境运行后再标PASS。

## 运行方式

```sh
pnpm add -D dependency-cruiser@18.5.0

# 在 ReactLoom 工作区内部，运行独立 fixture：
cd packages/library-lab
node entries/F16-dependency-cruiser/examples/run.mjs basic
node entries/F16-dependency-cruiser/examples/run.mjs business
node entries/F16-dependency-cruiser/examples/run.mjs advanced

# 真CLI完整验收（用退出码与JSON报告核对）
node entries/F16-dependency-cruiser/examples/verify.mjs
```

run.mjs只接受basic/business/advanced三个固定参数，通过 spawnSync 直接调用 pnpm exec depcruise，关闭任意shell拼接，不扫描你的其他生产仓库。

## 三个可复现的工程场景

| 场景 | 真实AST依赖 | 预期 |
|---|---|---|
| Basic | main→domain与ui | 规则不触发，真实depcruise exit 0 |
| Business | domain/summary.ts→ui/badge.ts | 触发 domain-must-not-import-ui（CLI应失败） |
| Advanced | first.ts→second.ts→first.ts | 触发 no-circular-dependencies（CLI应失败） |

配置 examples/workspace/config.cjs 使用 forbidden/from/to 与 to.circular:true。输入只在该目录，不引入真实产品代码。预期非零是**有意违反规则的教学用例**，不是“工具本身坏了”。

## API和规则设计

```js
{
  forbidden: [{
    name: 'domain-must-not-import-ui',
    severity: 'error',
    from: { path: '(^|/)domain/' },
    to: { path: '(^|/)ui/' },
  }, {
    name: 'no-circular-dependencies',
    severity: 'error',
    from: {},
    to: { circular: true },
  }],
}
```

规则路径匹配基于实际从扫描起点得到的模块路径；生产时应使用受控相对路径、排除node_modules和生成文件，先验证正例再上强制CI，避免错误匹配导致大面积噪声。

## 常见失败与纠正

1. **只画依赖图，不落实Severity**：存在反向依赖仍不阻断。设置严重程度与CI退出码，结合已有批准的例外列表。
2. **扫描node_modules/vendor/generated**：产生误报与成本膨胀。明确入口和ignore/exclude。
3. **把所有循环依赖都当成运行时崩溃**：静态循环不保证立即失效，但降低可推理性；应报告实际导入边、定位重构切口。
4. **依赖图运行顺序不受控**：不同cwd可能导致正则路径失配。CLI脚本固定工作目录和目标fixture。
5. **自动修正未知跨层依赖**：本工具发现不执行重构；评估引入接口、抽共享域模型或依赖反转，再修改代码。
6. **用测试文件造成虚假违规**：应用规则独立于测试规则；业务不同目录允许不同策略，而不是全局硬编码。

## 真实CI策略

建议单独job在受影响模块执行，不与lint/typecheck混为一谈。对故意违规的业务和高级fixture，在verify.mjs中断言确实出现对应规则名和非零退出码；basic必须零异常。跑正式项目时保留报告作为artifact，不自动替换用户代码或修改CI公共配置（PLATFORM拥有公共CI权限）。

## 与其他工具对比

F15 Knip侧重无效入口和unused文件；F18 visualizer侧重打包后chunk体积；dependency-cruiser侧重源码级方向性与环依赖。三个互补，不应当互相替代。

## 验证事实

所有源码和规则已写入GitHub，但没有实际调用18.5.0 CLI、未解析依赖锁文件，SDK/CLI NOT_RUN、build BLOCKED。任何预期非零都不能冒充“已检测到违规”。

官方：https://github.com/sverweij/dependency-cruiser

## CLI报告器分离验收（2026-10-27）

`node entries/F16-dependency-cruiser/examples/verify.mjs` 对每个场景执行两次真实depcruise：`--output-type json` 验证 `modules`、`summary.violations[].rule.name/severity` 与 `summary.error`；`--output-type err` 检查无违规exit 0和故意违规exit非0。此法不再仅靠JSON原文搜索规则关键字，也不把程序异常退出当成架构违规。参考 [官方 CLI](https://github.com/sverweij/dependency-cruiser/blob/main/doc/cli.md)。`node --test entries/F16-dependency-cruiser/examples/result-policy.test.mjs` 只是合成报表的纯逻辑负例测试，不算SDK/CLI PASS。
