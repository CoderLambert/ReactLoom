import Fuse from 'fuse.js'
// SDK options shared by the actual React demo and SDK verification.
export function createArticleIndex(documents, threshold = 0.35) {
  return new Fuse(documents, {
    includeScore: true,
    includeMatches: true,
    ignoreLocation: true,
    threshold,
    keys: [
      { name: 'title', weight: 0.65 },
      { name: 'summary', weight: 0.25 },
      { name: 'tags', weight: 0.1 },
    ],
  })
}
