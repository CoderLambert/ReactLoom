/** Pure local NewsHub article fixture; the cmdk SDK owns search and keyboard selection. */
export type DemoArticle = {
  readonly saved: boolean;
  readonly read: boolean;
  readonly citation: string | null;
  readonly refreshCount: number;
};
export const INITIAL_ARTICLE: DemoArticle = Object.freeze({
  saved: false, read: false, citation: null, refreshCount: 0,
});
export type DemoActionId = 'save' | 'read' | 'copy' | 'refresh';

export function applyDemoAction(article: DemoArticle, action: DemoActionId): DemoArticle {
  switch(action) {
    case 'save': return {...article, saved: !article.saved};
    case 'read': return article.read ? article : {...article, read: true};
    case 'copy': return {...article, citation: 'NewsHub / 前端工程资讯 / 本地示例文章'};
    case 'refresh': return {...article, refreshCount: article.refreshCount + 1};
  }
}
