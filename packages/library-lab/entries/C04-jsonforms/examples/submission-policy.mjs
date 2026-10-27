// The UI schema can hide fields, but must never determine the submitted payload.
export const subscriptionSchema = {
  type: 'object', additionalProperties: false,
  required: ['name', 'feedType'],
  properties: {
    name: {type: 'string', minLength: 2, maxLength: 60, title: '订阅名称'},
    feedType: {type: 'string', enum: ['rss', 'manual'], title: '订阅类型'},
    url: {type: 'string', title: 'RSS 地址'},
    enabled: {type: 'boolean', title: '启用订阅'},
  },
  if: {properties: {feedType: {const: 'rss'}}, required: ['feedType']},
  then: {required: ['url'], properties: {url: {type: 'string', minLength: 8, maxLength: 200, pattern: '^https://'}}},
};

export function toSubscriptionPayload(data) {
  const name = typeof data?.name === 'string' ? data.name.trim() : '';
  const enabled = data?.enabled === true;
  if (data?.feedType === 'manual') return {name, feedType: 'manual', enabled};
  return {name, feedType: 'rss', url: typeof data?.url === 'string' ? data.url.trim() : '', enabled};
}

// A second, *server-shaped* validation layer: JSON Schema alone does not
// reject https://user:password@host, malformed hosts, or fragment-bearing URLs.
export function validateSubmission(payload) {
  if (payload.name.length < 2 || payload.name.length > 60) return {field: 'name', message: '名称需为 2–60 个字符'};
  if (payload.feedType !== 'rss') return null;
  if (payload.url.length < 8 || payload.url.length > 200) return {field: 'url', message: 'RSS 地址长度不合法'};
  try {
    const url = new URL(payload.url);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || url.hash) {
      return {field: 'url', message: '仅允许无凭据、无片段的 HTTPS RSS 地址'};
    }
    return null;
  } catch {
    return {field: 'url', message: 'RSS 地址不是合法 URL'};
  }
}

export function toServerError(field, message) {
  if (field !== 'name' && field !== 'url') throw new TypeError('unsupported server error field');
  return {instancePath: `/${field}`, schemaPath: '#/server/validation', keyword: 'errorMessage', params: {}, message};
}
