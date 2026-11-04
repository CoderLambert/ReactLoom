import {useEffect, useId, useRef, useState} from 'react';
import {shouldApplyFilterOnKeyDown} from './ime-guard';
import {ARTICLE_TITLES, filterArticleTitles, toggleArticleAction, type ArticleActionState} from './business-policy';
import {
  autoUpdate, flip, offset, shift,
  FloatingFocusManager, FloatingPortal, useClick, useDismiss, useFloating,
  useInteractions, useRole,
} from '@floating-ui/react';

type Level = 'basic' | 'business' | 'advanced';

export default function FloatingExample({level}: {level: Level}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('未选择');
  const [query, setQuery] = useState('');
  const [clipboardError, setClipboardError] = useState('');
  const [article, setArticle] = useState<ArticleActionState>({saved: false, read: false});
  const [appliedQuery, setAppliedQuery] = useState('');
  const filteredArticles = filterArticleTitles(ARTICLE_TITLES, appliedQuery);
  const clipboardRequest = useRef(0);
  // Refs update synchronously even when React batches composition and key events.
  const composing = useRef(false);
  const suppressNextEnter = useRef(false);
  const id = useId();
  // Floating UI dismisses synchronously; revoke in-flight clipboard writes before React effects run.
  const setPopoverOpen = (nextOpen: boolean) => {
    if (!nextOpen) {
      ++clipboardRequest.current;
      setClipboardError('');
      composing.current = false;
      suppressNextEnter.current = false;
    }
    setOpen(nextOpen);
  };
  useEffect(() => () => { ++clipboardRequest.current; }, []);
  const {refs, floatingStyles, context, placement} = useFloating({
    open,
    onOpenChange: setPopoverOpen,
    placement: level === 'advanced' ? 'top-start' : 'bottom-start',
    middleware: [offset(10), flip({padding: 12}), shift({padding: 12})],
    // Both reference and floating elements are conditionally mounted while open.
    whileElementsMounted: autoUpdate,
  });
  const click = useClick(context);
  const dismiss = useDismiss(context, {escapeKey: true, outsidePress: true});
  const role = useRole(context, {role: 'dialog'});
  const {getReferenceProps, getFloatingProps} = useInteractions([click, dismiss, role]);
  const choose = (value: string) => {
    setSelected(value);
    setPopoverOpen(false); // invalidates a pending copy synchronously
  };
  const actOnArticle = (kind: 'saved' | 'read') => {
    setArticle(previous => toggleArticleAction(previous, kind));
    choose(kind === 'saved' ? '稍后阅读状态已变更' : '已读状态已变更');
  };
  const applyFilter = () => {
    const nextQuery = query.trim();
    setAppliedQuery(nextQuery);
    choose(nextQuery ? '已应用过滤：' + nextQuery : '已清空过滤');
  };
  async function copyCitation() {
    const request = ++clipboardRequest.current;
    setClipboardError('');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('当前环境不提供剪贴板写入能力');
      await navigator.clipboard.writeText('ReactLoom Library Lab / Floating UI 示例新闻引用（本地教学数据）');
      if (request === clipboardRequest.current) choose('已复制示例引用');
    } catch {
      // Keep the popover open so denied permissions cannot be mistaken for success.
      if (request === clipboardRequest.current)
        setClipboardError('复制未成功：请检查 HTTPS 安全上下文和剪贴板权限。');
    }
  }

  return <section aria-label="Floating UI 真实交互示例">
    <h2>{level === 'basic' ? '可定位的浮层' : level === 'business' ? '新闻操作 Popover' : '视口边缘、键盘和输入法'}</h2>
    <p>点击按钮打开真实 Floating UI 浮层；Escape 或点击外部关闭，关闭后焦点应返回触发按钮。</p>
    <div style={{height: level === 'advanced' ? 190 : 125, maxWidth: 530,
      overflow: level === 'advanced' ? 'auto' : 'visible', border: '1px dashed #aab5aa',
      padding: 18, borderRadius: 10}}>
      {level === 'advanced' && <p style={{margin: 0}}>此容器独立滚动。向下滚动后再打开面板，观察定位更新。</p>}
      <div style={{paddingTop: level === 'advanced' ? 85 : 8}}>
        <button
          ref={refs.setReference}
          type="button"
          {...getReferenceProps()}
          aria-haspopup="dialog"
          aria-controls={open ? id : undefined}
          aria-expanded={open}
        >
          {level === 'basic' ? '打开详情' : level === 'business' ? '新闻操作 ▾' : '编辑过滤条件 ▾'}
        </button>
      </div>
    </div>
    <p role="status">当前选择：{selected}；定位策略：{placement}</p>
    {level === 'business' && <p aria-live="polite">本地文章状态：{article.saved ? '已稍后阅读' : '未收藏'} · {article.read ? '已读' : '未读'}</p>}
    {level === 'advanced' && <div aria-live="polite"><p>本地筛选结果（{filteredArticles.length} 项）</p><ul>{filteredArticles.map(title => <li key={title}>{title}</li>)}</ul></div>}
    {open && <FloatingPortal>
      <FloatingFocusManager context={context} modal={false} returnFocus>
        <div
          id={id}
          ref={refs.setFloating}
          style={{...floatingStyles, zIndex: 9999, width: level === 'advanced' ? 300 : 260,
            padding: 16, background: '#fffefa', color: '#243a30',
            border: '1px solid #adc7b4', borderRadius: 10,
            boxShadow: '0 12px 28px #1d392b33'}}
          {...getFloatingProps()}
          aria-label={level === 'advanced' ? '过滤条件' : '文章浮层'}
        >
          {level === 'basic' ? <>
            <strong>按锚点定位的真实 Popover</strong>
            <p>通过 offset、flip、shift 处理偏移和视口碰撞。</p>
            <button type="button" onClick={() => choose('已查看')}>确认并关闭</button>
          </> : level === 'business' ? <>
            <strong>文章操作</strong>
            <div style={{display: 'grid', gap: 8, marginTop: 12}}>
              <button type="button" onClick={() => actOnArticle('saved')}>{article.saved ? '移出稍后阅读' : '加入稍后阅读'}</button>
              <button type="button" onClick={() => actOnArticle('read')}>{article.read ? '标记未读' : '标记已读'}</button>
              <button type="button" onClick={() => void copyCitation()}>复制示例引用到剪贴板</button>
              {clipboardError && <p role="alert">{clipboardError}</p>}
            </div>
          </> : <>
            <strong>搜索范围</strong>
            <label htmlFor={id + '-query'} style={{display: 'block', marginTop: 8}}>筛选关键词</label>
            <input
              id={id + '-query'}
              value={query}
              onChange={event => setQuery(event.target.value)}
              onCompositionStart={() => {composing.current = true; suppressNextEnter.current = true;}}
              onCompositionEnd={() => {composing.current = false; suppressNextEnter.current = true;}}
              onKeyDown={event => {
                if (shouldApplyFilterOnKeyDown({
                  key: event.key, composing: composing.current,
                  nativeComposing: event.nativeEvent.isComposing,
                  legacyKeyCode: event.nativeEvent.keyCode,
                  suppressNextEnter: suppressNextEnter.current,
                })) {
                  event.preventDefault();
                  applyFilter();
                }
              }}
              onKeyUp={event => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing && !composing.current) {
                  suppressNextEnter.current = false;
                }
              }}
              onBlur={() => {if (!composing.current) suppressNextEnter.current = false;}}
              placeholder="支持中文输入法"
              style={{display: 'block', width: '100%', border: '1px solid #cbd6cd', padding: 6}}
            />
            <p style={{fontSize: 12}}>中文输入法合成期间及刚完成合成的同一次 Enter 不提交；随后可正常 Enter 或点击确认。</p>
            <button type="button" onClick={applyFilter}>应用过滤</button>
          </>}
        </div>
      </FloatingFocusManager>
    </FloatingPortal>}
  </section>;
}
