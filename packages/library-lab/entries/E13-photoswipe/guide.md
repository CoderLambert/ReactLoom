# PhotoSwipe 5.4.4｜按容器初始化的灯箱，离开时 destroy

`library.json` 钉住 `photoswipe@5.4.4`，MIT。PhotoSwipe 负责图库灯箱：打开、缩放、键盘和关闭。它不裁剪（E14）、不缩放编码（E15）、也不托管图片数据库。本示例的图片是页面里生成的 SVG data URL，没有图床请求。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。张数选择在 [`examples/gallery-policy.mjs`](examples/gallery-policy.mjs) 的 `visibleArtwork`。

用户点开 Demo 后才 `new PhotoSwipeLightbox`。核心模块要等用户第一次打开灯箱才 `import('photoswipe')`。没有 `localhost:5173`。

```tsx
const lightbox = new PhotoSwipeLightbox({
  gallery,
  children: 'a',
  pswpModule: () => import('photoswipe'),
  bgOpacity: 0.88,
  showHideAnimationType: 'fade',
})
lightbox.init()
return () => { lightbox.destroy() }
```

`gallery` 是这一块 div 的 ref。选择器限制在容器里，避免把 Lab 外壳的链接收进图库。

每张图是 1200×800 的原创 SVG，缩略图 `loading="lazy"`，链接上有 `data-pswp-width` 和 `data-pswp-height`。说明文字是 React `<figcaption>`，不是 HTML 字符串。

| 层 | `visibleArtwork` | 额外控件 |
| --- | --- | --- |
| basic | 1 张 | 无 |
| business | 3 张 | 显示说明的复选框 |
| advanced | 3 张，可变成 4 张 | 先 `pswp.close()` 再切换张数 |

effect 依赖 `level` 和 `includeExtra`。张数变化会 destroy 再 init。清理函数只销毁这一次创建的实例。

`visibleArtwork` 检查 id 唯一、src、非空 alt、宽高为不超过 32768 的正整数。它不验证 SVG 字节是否安全。图片来自本地模板字符串，不是用户上传。

没有挂载：远程 URL、`preload` 全库、服务端 caption 的 innerHTML、把 dataSource 当数据库、失败时的普通链接以外的重试队列。

键盘和 Esc、焦点回到触发器，写在页面说明里，**没有浏览器收据**。

## 1. 定位

| 任务 | 判断 |
| --- | --- |
| 文章配图要点开放大、缩放、方向键 | 适合，并提供宽高 |
| 要裁剪导出 | E14 |
| 要高质量缩小文件 | E15 |
| 只有一张装饰图、不需要灯箱 | 普通 img |
| 用户提供任意 URL | 先做允许列表。本示例没有这条路径 |

官方：[入门](https://photoswipe.com/getting-started/)、[选项](https://photoswipe.com/options/)、[仓库](https://github.com/dimsemenov/PhotoSwipe)。

## 2. 对象

```text
图库 div（ref）
    └─ a[data-pswp-width][data-pswp-height] > img
            │ 用户点击
            ▼
PhotoSwipeLightbox.init
            │ 首次打开
            ▼
import('photoswipe') → 灯箱实例
            │ 卸载 / 张数变化
            ▼
destroy()
```

Lightbox 拥有监听。React 拥有有哪些 `<a>`。不要在 render 里 `new PhotoSwipeLightbox`。

`preload` 选项指的是当前张附近的预载，不是把整个媒体库下载下来。本示例没有设置预载张数，不要在文档里写成已预载四张原图。

## 3. 三层

在 Library Lab 打开 E13 再运行，然后点击图片。

### 基本

只有一张。打开后应出现灯箱而不是浏览器直接导航到 data URL（PhotoSwipe 会拦截该链接）。关闭后缩略图还在。若灯箱打不开，先看核心模块是否在点击后才出现在网络面板。

### 业务

三张说明可以开关。说明不进灯箱的 HTML 注入。方向键是否切换，要在浏览器里看，本指南不记为已通过。

### 进阶

「添加第四张」会先关闭已打开的灯箱，再让 effect 重建。这是为了避免旧实例还指着已经卸下的锚点。移除第四张同样重建。

## 4. 反例（带代码）

### 反例 1：每次 render 都 init

```tsx
const lightbox = new PhotoSwipeLightbox({ gallery: '#app', children: 'a' })
lightbox.init()
```

监听会叠，外壳的链接也会被选中。放进 effect，选择器限于 ref，清理时 `destroy()`。

### 反例 2：不给原始像素

```html
<a href={src}><img src={src} /></a>
```

没有 `data-pswp-width` / `height` 时，开场动画和比例会错。Lab 写的是 1200 和 800，和 SVG 的 viewBox 一致。不要填一个拍脑袋的 100 冒充原图尺寸。

### 反例 3：进页面就 import 核心

```tsx
import PhotoSwipe from 'photoswipe'
```

Lab 把核心放在 `pswpModule: () => import('photoswipe')`。样式表 `photoswipe/style.css` 是静态引入，核心 JS 仍按第一次打开加载。不要为了「快」在路由入口同步导入核心却声称按需。

### 反例 4：caption 用 innerHTML

```ts
lightbox.on('uiRegister', () => {
  el.innerHTML = item.captionHtml
})
```

说明来自不可信 CMS 时这是 XSS。Lab 用 React 文本。若灯箱里要说明，先净化或只用文本节点。

### 反例 5：dataSource 充当数据库

灯箱的数据是打开时的视图。文章 id、权限和原图 URL 的权威在你们的数据层。不要只把 PhotoSwipe 的 items 数组存进数据库。

### 反例 6：preload 当成整库下载

```ts
preload: [1, 20]
```

这会按窗口去取邻近张，不是离线包。本示例没有设这个选项。

### 反例 7：没有可打开的链接

灯箱初始化失败时，用户仍应能打开图片。Lab 的 `<a href>` 指向同一 SVG。不要用空 `href="#"` 且只靠点击脚本。

### 反例 8：任意 URL 都当幻灯片

远程地址会发请求，也可能不是图片。本示例只使用自己生成的 data URL。产品接入上传时要有类型、大小和主机名单。

### 反例 9：用数组下标当 React key

```tsx
{visible.map((item, index) => <figure key={index}>)}
```

增删第四张时下标会串。Lab 用 `item.id`。

## 5. 选项与迁移

常用且本示例真正设置了的：`gallery`、`children`、`pswpModule`、`bgOpacity`、`showHideAnimationType`。其余选项以 [options](https://photoswipe.com/options/) 为准，不要从 v4 的 jQuery 初始化抄 `items` 数组到 v5。

| 选项 | 本示例 | 不要误读成 |
| --- | --- | --- |
| `gallery` + `children: 'a'` | 只扫描这块 div 里的链接 | 全页所有 `<a>` |
| `pswpModule` | 函数返回动态 `import` | 页面加载时的同步核心 |
| `bgOpacity: 0.88` | 遮罩透明度 | 图片本身的不透明度 |
| `showHideAnimationType: 'fade'` | 开合动画 | 已读取 `prefers-reduced-motion` |
| `data-pswp-width` / `height` | 1200 与 800，和 SVG viewBox 一致 | 缩略图 CSS 的 300×200 |

缩略图的 `width={300}` 只影响布局。灯箱用的是 data 属性上的原始像素。把两者写成同一个数会让开场比例错。

焦点：打开灯箱后，键盘循环应留在对话框里；关闭后应回到刚才的链接。本示例没有手写焦点恢复代码，依赖 PhotoSwipe 的默认行为。没有浏览器记录之前，只把它列为待查，不写已通过。

`loading="lazy"` 只影响缩略图。它不阻止用户打开灯箱时再解码同一份 data URL。不要把它写成带宽优化的证据。

v5 的生命周期是 Lightbox 加动态 import。卸载必须 `destroy()`，它会关掉还开着的对话框并解绑。不要只删 DOM 节点。

`prefers-reduced-motion`：本示例把动画设为 `fade`，没有读取系统减少动态的设置。需要时再改选项，并在浏览器里看。

## 6. 组合（未挂载）

**E14。** 灯箱负责看大图。裁剪导出是另一条 Canvas 路径。不要让 PhotoSwipe 的缩放比例冒充裁剪像素。

**E15。** 缩略图可以用 pica 生成。灯箱的 `href` 仍应指向你们允许的原图或预览图，并带真实宽高。

## 7. 故障

| 现象 | 先看 |
| --- | --- |
| 点了直接下载或打开 SVG | 灯箱是否 init，点击是否发生在 `a` 上 |
| 比例不对 | data 属性是否等于真实像素 |
| 换层后灯箱还在 | effect 是否 `destroy` |
| 外壳链接被当成图片 | gallery 是否限定在 ref |
| 第四张点了没反应 | 是否仍持有已关闭的旧实例。Lab 会重建 |
| 说明里出现 HTML | 不应。figcaption 是文本 |

## 8. 练习（未挂载）

1. 灯箱说明只用文本节点，内容来自 alt。验收：字符串里的 `<script>` 不成为元素。
2. 连续打开关闭 10 次后，页面上只有一个 lightbox 监听集。没有测量工具就不要写泄漏数字，只记录 destroy 是否被调用。

## 9. 验收

清单，未执行则不能写通过：

1. 点运行前没有 photoswipe 核心请求；第一次打开才有。
2. basic 只一张；business 三张；advanced 可在 3 和 4 之间切换。
3. 离开 Demo 后灯箱关闭，监听不再响应外壳上的 Esc。
4. 缩略图有宽高和 alt。
5. 键盘切换和焦点返回要有浏览器记录才算做过。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E13 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目通过。

## 10. 资料

- https://photoswipe.com/getting-started/
- https://photoswipe.com/options/
- https://github.com/dimsemenov/PhotoSwipe
- https://www.npmjs.com/package/photoswipe
