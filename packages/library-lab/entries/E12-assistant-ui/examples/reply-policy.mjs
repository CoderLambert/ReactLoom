/** Offline fixture only: read bounded user text, never execute commands or fetch resources. */
export function recentUserText(messages) {
  if (!Array.isArray(messages)) return '';
  const last = [...messages].reverse().find(message => message?.role === 'user');
  const pieces = Array.isArray(last?.content) ? last.content : [];
  const text = pieces.filter(part => part?.type === 'text' && typeof part.text === 'string')
    .map(part => part.text).join(' ').replace(/[\u0000-\u001f\u007f]/gu,' ').trim();
  return Array.from(text).slice(0,160).join('');
}
export function makeLocalReply(messages, level) {
  const question = recentUserText(messages) || '（没有可处理的文本消息）';
  if (level === 'basic') return `本地演示已收到：${question}。这是确定性回复，不是模型推理。`;
  if (level === 'business') return `本地研究任务：${question}\n建议先核验RSS来源、文章时间与重复内容。本示例没有检索实时新闻。`;
  if (level === 'advanced') return `取消与流式实验：${question}\n本地回复将逐段显示；可按“停止响应”观察 AbortSignal。`;
  throw new Error('未知实验层级');
}
export function cumulativeChunks(text, width = 24) {
  if (typeof text !== 'string' || !Number.isSafeInteger(width) || width < 1) throw new Error('invalid chunk size');
  const chars = Array.from(text), chunks=[];
  for(let i=width;i<chars.length;i+=width) chunks.push(chars.slice(0,i).join(''));
  if(chars.length) chunks.push(text);
  return chunks;
}
