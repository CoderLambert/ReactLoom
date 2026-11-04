// 显式动态import后才会进入当前运行路径；用于真实chunk分割实验。
export function fibonacci(value: number): number {
  let previous = 0;
  let current = 1;
  for (let i = 0; i < value; i += 1) {
    const next = previous + current;
    previous = current;
    current = next;
  }
  return previous;
}
