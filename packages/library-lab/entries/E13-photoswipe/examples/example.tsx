import { useEffect, useRef, useState } from 'react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

type Level = 'basic' | 'business' | 'advanced';
type Props = { level: Level };
const W = 1200;
const H = 800;
const palettes = [
  ['#234e51', '#92d2ba', '#f7efdb'],
  ['#594b73', '#d1acd7', '#f4ddec'],
  ['#6e583d', '#e7c694', '#eff0d4'],
  ['#355d78', '#8ab6d7', '#f9ead1'],
] as const;

function localArtwork(index: number): string {
  const [dark, light, paper] = palettes[index % palettes.length];
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">' +
    '<rect width="1200" height="800" fill="' + paper + '"/>' +
    '<circle cx="' + (320 + index * 60) + '" cy="360" r="260" fill="' + light + '"/>' +
    '<path d="M0 620 Q250 300 540 650 T1200 500 V800 H0Z" fill="' + dark + '"/>' +
    '<circle cx="930" cy="175" r="75" fill="' + light + '"/>' +
    '<text x="75" y="130" fill="' + dark + '" font-size="46" font-family="sans-serif">ReactLoom ' + (index + 1) + '</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const artwork = palettes.map((_, index) => ({
  id: index + 1, src: localArtwork(index), alt: '原创抽象景观 ' + (index + 1),
}));

export default function PhotoSwipeExample({ level }: Props) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [includeExtra, setIncludeExtra] = useState(false);
  const [showCaption, setShowCaption] = useState(true);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    // Container-scoped selector prevents the lab shell from becoming a gallery.
    const lightbox = new PhotoSwipeLightbox({
      gallery,
      children: 'a',
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.88,
      showHideAnimationType: 'fade',
    });
    lightbox.init();
    return () => {
      lightbox.destroy();
    };
  }, []);

  const visible = level === 'basic' ? artwork.slice(0, 1)
    : artwork.slice(0, level === 'advanced' && includeExtra ? 4 : 3);

  return (
    <section aria-label="PhotoSwipe 真正图库示例">
      <h2>{level === 'basic' ? '单图灯箱' : level === 'business' ? '文章配图预览' : '动态图库与销毁边界'}</h2>
      <p>素材由页面内原始 SVG 生成，没有外部图床请求；灯箱核心在用户首次打开时按需 import。</p>
      {level !== 'basic' && (
        <label>
          <input type="checkbox" checked={showCaption} onChange={e => setShowCaption(e.target.checked)} />
          显示图片说明
        </label>
      )}
      {level === 'advanced' && (
        <button type="button" onClick={() => setIncludeExtra(value => !value)}>
          {includeExtra ? '移除第四张' : '添加第四张'}
        </button>
      )}
      <div ref={galleryRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 20 }}>
        {visible.map(item => (
          <figure key={item.id} style={{ margin: 0 }}>
            <a href={item.src} data-pswp-width={W} data-pswp-height={H} aria-label={'打开大图：' + item.alt}>
              <img src={item.src} alt={item.alt} loading="lazy" width={300} height={200}
                style={{ width: '100%', height: 'auto', aspectRatio: '3 / 2', objectFit: 'cover', borderRadius: 10 }} />
            </a>
            {showCaption && <figcaption style={{ fontSize: 12 }}>图 {item.id} · 原创本地图像 · {W}×{H}</figcaption>}
          </figure>
        ))}
      </div>
      <p>点击图片后使用方向键切换、Esc 关闭；离开 Demo 时执行 lightbox.destroy()，不清理其他图库或页面存储。</p>
    </section>
  );
}
