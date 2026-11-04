/** Keep only documents from the currently visible group *before* building any index. */
export function scopeSearchDocuments(documents, group) {
  return group === '全部' ? [...documents] : documents.filter(document => document.group === group);
}
