# B04 dotLottie React — Agent 最佳实践

**意图**：离线矢量动效的组件接入、明确播放控制和减少动画保护。别拿播放器实现数据状态机或收费资产下载器。

**版本**：@lottiefiles/dotlottie-react@0.20.0 / MIT（npm 2026-10）；实际SDK运行仍NOT_RUN。

**迁移**：读`examples/example.tsx`和`examples/pulse.json`。保留实例ref callback、已加载标志与load/error监听清理；仅从获授权本地文件或受控来源读取JSON/.lottie。App状态和动画状态分别维护，不复制Demo的本地模拟业务提交到生产服务端。

**必须保留**：初始autoplay=false；prefers-reduced-motion默认停首帧；visibilitychange页面隐藏暂停；卸载移除监听与本地timer；图形下方有文本替代，canvas不是业务反馈唯一媒介。

**禁止**：在UI render里反复addEventListener；依赖播放结束作为保存成功；默认访问第三方素材URL；把一套播放器的setFrame兼容性直接套到其它大版本；通过复制动效掩盖API错误。

**测试指令**：`catalog:check/typecheck/build`后才是真实Chromium Playwright。验证加载、暂停、卸载、错误后退化、移动端DPR、系统减少动态；导入SDK可真实检查但历史摘要PASS不能继承。

**来源**：https://docs.lottiefiles.com/en/runtimes/distributions/react/v0.x/api-reference。