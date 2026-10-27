// Self-contained Workbox RouteMatchCallback: generateSW serializes this function into the worker.
// Keep it free of imported variables, captures, and application globals.
export function matchPublicRssRequest({url, request} = {}) {
  if (!url || !request || request.method !== 'GET' || request.credentials !== 'omit') return false;
  if (url.protocol !== 'https:' || url.origin !== 'https://lab.example.test' ||
      url.pathname !== '/__library_lab_workbox__/api/public/rss') return false;
  // Default same-origin credentials, Authorization, and explicit Cookie headers are forbidden.
  // Route matching is defense-in-depth; publish only independently reviewed public content.
  if (!request.headers || typeof request.headers.has !== 'function') return false;
  return !request.headers.has('authorization') && !request.headers.has('cookie') &&
    !request.headers.has('proxy-authorization');
}
