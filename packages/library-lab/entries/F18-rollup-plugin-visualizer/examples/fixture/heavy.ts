// Historical filename. This tiny pure module is not a realistic heavy dependency.
// Both entry variants call the same implementation with the same visible input.
export function fibonacci(value: number): number {
  let previous = 0
  let current = 1
  for (let i = 0; i < value; i += 1) {
    const next = previous + current
    previous = current
    current = next
  }
  return previous
}
