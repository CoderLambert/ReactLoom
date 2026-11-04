# E13 PhotoSwipe：图片灯箱不是普通的图片弹框

## 解决哪些问题

对于新闻文章配图、商品图集、文档截图预览，PhotoSwipe 5 提供滑动切换、缩放、键盘导航和弹出/关闭过渡。它不是图库数据源，也不负责上传、缩略图生成或图像裁剪。React 只控制图片列表数据，PhotoSwipe 管理灯箱 DOM 与触控状态；两者的所有权必须明确。

研究基线：photoswipe 5.4.4，MIT。新版示例由官方 Getting Started API 独立重建；历史研究文件可参考，但**本次尚未完成浏览器实际运行验证**。

## 安装和关键 API

```sh
pnpm add photoswipe@5.4.4
```

```tsx
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

useEffect(() => {
  const lightbox = new PhotoSwipeLightbox({
    gallery: galleryRef.current,
    children: 'a',
    pswpModule: () => import('photoswipe'),
  });
  lightbox.init();
  return () => lightbox.destroy();
}, []);
```

完整可复制源码：examples/example.tsx；Lab 入口 examples/demo.tsx 只做导出。代码面板由真实文件生成，不维护文档展示副本。

## 三层实战

| 场景 | 业务任务 | 操作和预期 |
|---|---|---|
| Basic | 单图预览 | 点击一张本地SVG，按需加载PhotoSwipe核心，Escape关闭 |
| Business | 文章配图 | 多图缩略图、图片说明、左右方向键、触屏滑动 |
| Advanced | 动态图集 | 追加/移除第四张图片，不重复创建全页面灯箱；离开时destroy |

本示例图像均来自页面内构造的原创 SVG Data URL，不请求远程图片、也不借用未许可的摄影素材。图像宽高通过 data-pswp-width/data-pswp-height 告诉PhotoSwipe；这些值必须和真实原图尺寸一致。

## 机制和资源所有权

1. PhotoSwipeLightbox 初始化时绑定 gallery 作用域的点击委托，避免监听整个 document。
2. pswpModule 返回 Promise，核心只有首次需要时才会通过 bundler 加载；外部图片本身仍需按资源策略加载。
3. React 控制缩略图集合；PhotoSwipe 控制弹出层和内置事件；组件卸载必须显式调用 destroy()。
4. 生产缩略图应有可读 alt、尺寸信息和直接URL作为非JS降级；不能只绘制无语义背景。

## 实际项目必须避免的错误

### 反例一：useEffect每次渲染都重复实例化

灯箱反复绑定监听器、多个Popup互相争抢。正确做法：稳定gallery Ref、明确effect依赖、清理同一实例，并在React StrictMode双重挂载中检查重复行为。

### 反例二：用缩略图尺寸冒充原图尺寸

图片打开动画与缩放定位错误。正确做法：明确数据源提供原始width/height；如要响应式srcset，官方 data-pswp-srcset 不能缺最大的真实尺寸。

### 反例三：未经验证的跨站图片

直接使用第三方 URL 会引起可用性、鉴权、CORS及内容版权问题。生产中通过合法图床/签名URL及许可管理；本实验统一使用本地SVG。不能因为图片能在img显示就推断Canvas可读取其像素。

### 反例四：卸载后遗留DOM与快捷键

离开详情后仍出现按键响应与样式层叠。使用 lightbox.destroy；同时进行真实浏览器检查。库内部资源是否完全释放不能仅凭开发者代码推断。

## 与其他库组合

与 E14 react-easy-crop：PhotoSwipe负责“看”，Cropper负责“选”；不要把裁剪逻辑写入灯箱事件。与 E15 pica：大图预览可先生成合适像素的缩略图，但原图应能按需打开，不必预先解码全部图片。若图集很大，用浏览器资源加载策略、分页与虚拟化处理缩略图DOM，不要简单把所有原图一次性下载。

## 验证命令与人工检查

安装依赖后由PLATFORM执行 pnpm --filter @reactloom/library-lab typecheck/build，然后通过Chromium检查：点击打开、Esc关闭、左右导航、动态增删、切换Tab退出、StrictMode重挂、移动端焦点与触摸。浏览器网络面板确认首页不主动加载photoswipe核心。**当前SDK NOT_RUN，build BLOCKED，browser NOT_RUN**，不采用历史结果冒充通过。

## 官方资料

- https://photoswipe.com/getting-started/
- https://photoswipe.com/options/
- https://github.com/dimsemenov/PhotoSwipe

## 动态图集生命周期加固（EF wave19）

新增 `examples/gallery-policy.mjs` 作为场景选择和原始尺寸/重复ID的**同源业务约束**；Node测试 `examples/gallery-policy.test.mjs` 只覆盖纯数据契约，绝不表示PhotoSwipe已在Chromium运行。示例在 `level` 或动态图片集合变化时销毁旧 `PhotoSwipeLightbox` 并重新初始化该gallery作用域；移除第四张前显式 `pswp.close()`，避免持有已经退出React列表的slide。官方说明 `destroy()` 可关闭已打开灯箱并取消绑定；不能推断所有内核懒加载已在浏览器验证。SVG data URL是**本地代码生成的可信固定素材**，此policy不做不可信SVG净化，生产接入应使用已审查的媒体资产和正确的CSP `img-src`。

重现实测：`node --test packages/library-lab/entries/E13-photoswipe/examples/gallery-policy.test.mjs`。PLATFORM后续在真实Chromium按 Esc/焦点恢复/动态移除正在查看的第四张/StrictMode卸载重挂/CSP检查；仅文档和数据测试通过不更改 `verification.json` 中SDK/browser状态。
