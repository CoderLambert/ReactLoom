export function renderTitle(title) {
  return `<h1>${title.replaceAll('<', '&lt;')}</h1>`
}
