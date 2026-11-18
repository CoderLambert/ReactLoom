import { getArticle } from './domain/get-article.js'
import { renderTitle } from './ui/render-title.js'

export function run() {
  return renderTitle(getArticle('hello').title)
}
