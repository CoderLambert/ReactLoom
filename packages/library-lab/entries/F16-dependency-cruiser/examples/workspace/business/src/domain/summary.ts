// 反例：领域层反向引用UI渲染，是明确违反架构规则的源码。
import { badge } from '../ui/badge';

export function summarize(text: string) {
  return badge(text);
}
