# D05 decimal.js 目录注意事项

先读取上级规范、agent.md、verification.json。真实示例 examples/example.tsx 是唯一源码来源；不要将 Decimal 实例/金额隐式转 Number。版本、精度、舍入模式变化必须补对账黄金用例。根包依赖与锁文件由 PLATFORM 独占，未执行真实 SDK 不标 PASS。
