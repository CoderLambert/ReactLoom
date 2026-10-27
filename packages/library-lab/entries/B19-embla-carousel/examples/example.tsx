import {useEffect, useMemo, useRef, useState} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {allocateSlideId, boundedSnap} from './slide-policy';

type Level = 'basic' | 'business' | 'advanced';
type Slide = {id: number; title: string; description: string; category: string};
const originals: Slide[] = [
  {id: 1, title: 'React 性能与测量', description: '如何识别实际渲染瓶颈而不盲目优化。', category: '性能'},
  {id: 2, title: '请求的取消与重试', description: 'AbortSignal、timeout 和旧结果回写。', category: '网络'},
  {id: 3, title: '可访问交互', description: '触摸滑动和键盘控件同时存在。', category: '交互'},
  {id: 4, title: '契约化测试', description: '让 Playwright 验证真实业务场景。', category: '测试'},
];

export default function EmblaExample({level}: {level: Level}) {
  const [slides, setSlides] = useState<Slide[]>(originals);
  const [selected, setSelected] = useState(0);
  const [resetEpoch, setResetEpoch] = useState(0);
  const appliedReset = useRef(0);
  const lastAllocated = useRef(4);
  const slideSignature = slides.map(item => item.id).join(',');
  const [canPrevious, setCanPrevious] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const options = useMemo(() => ({
    align: 'start' as const,
    containScroll: 'trimSnaps' as const,
    loop: level === 'advanced',
  }), [level]);
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  useEffect(() => {
    if (!emblaApi) return;
    const sync = () => {
      setSelected(boundedSnap(emblaApi.selectedScrollSnap(),emblaApi.scrollSnapList().length));
      setCanPrevious(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    sync();
    emblaApi.on('select', sync);
    emblaApi.on('reInit', sync);
    return () => {
      emblaApi.off('select', sync);
      emblaApi.off('reInit', sync);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // Wait until React has committed the new slides before recalculating snaps.
    emblaApi.reInit();
    if (appliedReset.current !== resetEpoch) {
      appliedReset.current = resetEpoch;
      emblaApi.scrollTo(0, true);
    }
    setSelected(boundedSnap(emblaApi.selectedScrollSnap(),emblaApi.scrollSnapList().length));
    setCanPrevious(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi, slideSignature, resetEpoch]);

  function append() {
    if (slides.length >= 24) return;
    const id=allocateSlideId(lastAllocated.current,slides.map(item=>item.id));
    lastAllocated.current=id;
    setSlides(items => items.length >= 24 ? items : [...items, {
      id,
      title: '新的学习专题',
      description: '列表状态更新后需让引擎重新计算滚动吸附点。',
      category: '动态内容',
    }]);
  }

  return <section aria-label="Embla Carousel 真实轮播示例">
    <h2>{level === 'basic' ? '手动滑动新闻专题' :
      level === 'business' ? '内容推荐卡片' : '动态增删与循环吸附'}</h2>
    <p>触摸滑动与按钮导航均由真实 Embla v8 实例处理，内容只是离线 fixture。</p>
    <div ref={emblaRef} style={{overflow: 'hidden', borderRadius: 10, border: '1px solid #dbe3d8'}}>
      <div style={{display: 'flex', touchAction: 'pan-y pinch-zoom'}}>
        {slides.map(item => <article key={item.id} aria-label={item.title}
          style={{flex: '0 0 82%', minWidth: 0, minHeight: 178, marginRight: '3%',
            padding: '18px 20px', background: '#f0f7f1', borderRight: '1px solid #d6e4d7'}}>
          <small style={{color: '#456b55'}}>{item.category} · {item.id}</small>
          <h3 style={{marginTop: 16, fontSize: 19}}>{item.title}</h3>
          <p>{item.description}</p>
        </article>)}
      </div>
    </div>
    <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 15}}>
      <button type="button" disabled={!emblaApi || !canPrevious} onClick={() => emblaApi?.scrollPrev()}>
        ← 上一张
      </button>
      <button type="button" disabled={!emblaApi || !canNext} onClick={() => emblaApi?.scrollNext()}>
        下一张 →
      </button>
      <output aria-live="polite">当前第 {Math.min(selected + 1, slides.length)} 张 · 共 {slides.length} 张</output>
    </div>
    {level === 'advanced' && <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12}}>
      <button type="button" disabled={slides.length >= 24} onClick={append}>添加卡片</button>
      <button type="button" disabled={slides.length === 1}
        onClick={() => setSlides(items => items.length > 1 ? items.slice(0, -1) : items)}>移除最后一张</button>
      <button type="button" onClick={() => {
        setSlides(originals);
        setResetEpoch(epoch => epoch + 1);
      }}>恢复默认卡片</button>
    </div>}
    <p style={{fontSize: 12, color: '#597062', marginTop: 14}}>
      拖动区保留页面的纵向触摸滚动；导航按钮放置在拖动区之外。卸载时 React hook 销毁引擎，effect 对称注销事件。
    </p>
  </section>;
}
