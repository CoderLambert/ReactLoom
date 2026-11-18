/** The fixture is a trusted application model, not text supplied by a visitor. */
export function flowDefinition(showDeduplication: boolean) {
  return [
    'flowchart LR',
    '  accTitle: RSS文章处理流程',
    '  accDescr: 从RSS源抓取正文并建立索引，可开启重复文章的跳过分支。',
    '  A[RSS源] --> B[正文抓取]',
    ...(showDeduplication
      ? ['  B --> D{重复文章?}', '  D -->|否| C[文章索引]', '  D -->|是| S[跳过入库]']
      : ['  B --> C[文章索引]']),
  ].join('\n')
}

export function sequenceDefinition(useCache: boolean) {
  return [
    'sequenceDiagram',
    '  accTitle: 新闻列表请求时序',
    '  accDescr: 浏览器请求API，由应用选择从缓存或Worker取得摘要后返回。',
    '  participant UI as 浏览器',
    '  participant API as NewsHub API',
    '  participant W as Worker',
    '  UI->>API: 请求新闻',
    ...(useCache
      ? ['  Note over API: 命中缓存', '  API-->>UI: 返回缓存摘要']
      : ['  API->>W: 获取已处理结果', '  W-->>API: 返回摘要', '  API-->>UI: 渲染列表']),
  ].join('\n')
}

export const stateDefinition = [
  'stateDiagram-v2',
  '  accTitle: 列表加载状态',
  '  accDescr: Idle进入Loading；成功结束，失败可以重试。',
  '  [*] --> Idle',
  '  Idle --> Loading: 开始',
  '  Loading --> Success: 成功',
  '  Loading --> Failed: 失败',
  '  Failed --> Loading: 重试',
  '  Success --> [*]',
].join('\n')

export const invalidDefinition = 'stateDiagram-v2\n  ThisIsNot -->'
