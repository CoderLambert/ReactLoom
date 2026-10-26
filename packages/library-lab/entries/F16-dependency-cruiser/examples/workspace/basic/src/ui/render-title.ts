export function renderTitle(title: string) {
  return '<h1>' + title.replaceAll('<', '&lt;') + '</h1>';
}
