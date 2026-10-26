import { getArticle } from './domain/get-article';
import { renderTitle } from './ui/render-title';

export function run() {
  return renderTitle(getArticle('hello').title);
}
