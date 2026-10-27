export type ArticleActionState = {saved: boolean; read: boolean};

export const ARTICLE_TITLES = [
  'React 浮层焦点管理',
  '新闻阅读中的键盘操作',
  '中文输入法与搜索提交',
  'Floating UI 视口碰撞与滚动',
] as const;

export function toggleArticleAction(state: ArticleActionState, kind: 'saved' | 'read'): ArticleActionState {
  return kind === 'saved' ? {...state, saved: !state.saved} : {...state, read: !state.read};
}

export function filterArticleTitles(titles: readonly string[], query: string): string[] {
  const terms = query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
  return titles.filter(title => {
    const normalizedTitle = title.normalize('NFKC').toLocaleLowerCase();
    return terms.every(term => normalizedTitle.includes(term));
  });
}
