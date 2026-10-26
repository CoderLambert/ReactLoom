# dotLottie React 0.20.0：离线动画和可控播放

## 使用目标
Lottie/dotLottie用于视觉反馈和轻量品牌动效，不是业务流程状态机。若需要真实产品级状态机交互，另评估 B05 Rive；布局过渡使用 B01 Motion通常更直接。不要因为一个简单成功提示就引入大量外部动画素材。

## 安装与使用
`pnpm add @lottiefiles/dotlottie-react@0.20.0`，`import {DotLottieReact} from '@lottiefiles/dotlottie-react'`。本示例`examples/pulse.json`为已审查的本地矢量JSON，通过`data={JSON.stringify(pulse)}`传入，无需运行时外网。实例通过`dotLottieRefCallback`获取，不能依赖DOM querySelector碰运气查找Canvas。

## 分层学习
**基础**：受控播放、暂停、停止，检查player的load事件后才允许控制。**业务**：模拟本地订阅确认，业务成功与动画播放解耦；加载失败不会影响成功文本。**进阶**：速度选项、页面visibilitychange、系统减少动态偏好、人工明确覆盖和事件/定时器卸载。

## 生命周期
播放器可能异步加载WASM/worker资源；大资源必须由用户进入Demo并点击运行后才加载。监听`load/loadError/renderError`应在effect内注册、cleanup精准移除；`DotLottieReact`销毁其内部画布，外部timeout和visibilitychange必须由宿主清理。本例加载成功时使用`player.isLoaded`避免错过首次事件。

## 五个生产反例
1. **页面隐藏仍持续无限循环**：无价值且耗电；监听visibilitychange并暂停。
2. **用户选择减少动态，仍autoplay**：违反体验预期；默认静态首帧，只有显式opt-in才播放。
3. **从未知CDN热链**：版权、CSP、下线、隐私泄漏；仅从审核通过的本地资源加载，记录许可证与来源。
4. **动画结束才标业务成功**：业务状态应基于真实提交结果而非动画回调。
5. **实例事件在每次render重复注册**：导致旧回调状态污染；监听采用effect cleanup并避免保留过期实例。

## 可靠性、性能与权限
动画素材选择比播放器复杂。资源中不能嵌入任意HTML/脚本；导入外部设计素材前校验大小/授权。限制devicePixelRatio以降低移动端Canvas开销。不把播放器示例当浏览器安全沙箱，未经授权不能请求付费素材或密钥。关注Safari/低端Android的WebAssembly能力与CSP。

## 验收与官方来源
SDK/typecheck/build/browser仍未执行，本轮只落地源码；验证需检查loadError恢复、隐藏暂停、reduced-motion覆盖、Tab切换事件移除、离线素材可解析与最终业务状态不依赖动画。没有真实运行不得PASS。

官方：https://docs.lottiefiles.com/en/runtimes/distributions/react/v0.x · https://docs.lottiefiles.com/en/runtimes/distributions/react/v0.x/api-reference 。MIT。
