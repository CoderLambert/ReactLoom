/** Pure route contract: Node uses an unroutable fixture host, browser uses runner-local URLs. */
export const NODE_SCENARIO_BASE = 'https://library-lab.invalid/';
export const BROWSER_RUNNER_SCOPE = '/lab-runners/msw/';

export function scenarioEndpoints(base) {
  const url = new URL(base);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password ||
      url.search || url.hash || !url.pathname.endsWith('/')) {
    throw new Error('Scenario base must be an absolute HTTP(S) directory URL');
  }
  const endpoint = (name) => new URL('api/' + name, url).href;
  return Object.freeze({
    article: endpoint('articles/42'),
    articlePattern: endpoint('articles/:id'),
    verify: endpoint('verify'),
    retry: endpoint('retry'),
  });
}
