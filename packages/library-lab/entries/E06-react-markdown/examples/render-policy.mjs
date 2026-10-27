import {createElement} from 'react';

// Shared by the real React demo and the actual SDK SSR suite.
const UNSAFE_URL_CHARACTERS = /[\u0000-\u0020\u007f]/u;
export function safeMarkdownURL(value) {
  if (typeof value !== 'string' || UNSAFE_URL_CHARACTERS.test(value)) return '';
  if (value.startsWith('#')) return /^#[a-z0-9_.:-]+$/iu.test(value) ? value : '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return '';
    return url.href;
  } catch {
    return '';
  }
}

// Never spread untrusted Markdown AST props into real DOM nodes.
export const markdownComponents = {
  a: ({href, children}) => {
    const safe = safeMarkdownURL(href);
    if (!safe) return createElement('span', {title: '已移除不安全链接'}, children);
    return createElement('a', {
      href: safe, target: safe.startsWith('#') ? undefined : '_blank',
      rel: safe.startsWith('#') ? undefined : 'noopener noreferrer',
    }, children);
  },
  img: ({alt}) => createElement('span', null, '[图片外链被禁用：' + (alt ?? '无描述') + ']'),
};
