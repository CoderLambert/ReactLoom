import Fuse from 'fuse.js'
export declare function createArticleIndex<
  T extends { title: string; summary: string; tags: string[] },
>(documents: T[], threshold?: number): Fuse<T>
