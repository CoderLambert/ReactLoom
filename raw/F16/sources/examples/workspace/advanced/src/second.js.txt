import { first } from './first.js'

// 不调用，避免真实执行栈递归；AST导入足以让工具发现循环。
export function second() {
  return first()
}
