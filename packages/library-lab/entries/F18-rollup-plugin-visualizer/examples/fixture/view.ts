import { summarize } from './helper'

type Calculator = { fibonacci: (value: number) => number }

export function mountCalculator(label: string, load: () => Promise<Calculator>) {
  const root = document.querySelector<HTMLElement>('#root')
  if (!root) throw new Error('Missing #root')
  root.innerHTML = `
    <h1>同功能入口的加载边界实验</h1>
    <p id="variant"></p>
    <p>输入 4、5、6 的统计结果：<output id="summary"></output></p>
    <form id="calculator">
      <label for="value">Fibonacci n（0–40）</label>
      <input id="value" type="number" min="0" max="40" value="12" required />
      <button id="calculate" type="submit">计算 Fibonacci</button>
    </form>
    <p id="status" role="status">等待计算。请在 Network 面板观察 JS 请求。</p>
    <p>计算结果：<output id="result">尚未计算</output></p>
  `
  const variant = root.querySelector<HTMLElement>('#variant')
  const summary = root.querySelector<HTMLOutputElement>('#summary')
  const form = root.querySelector<HTMLFormElement>('#calculator')
  const input = root.querySelector<HTMLInputElement>('#value')
  const button = root.querySelector<HTMLButtonElement>('#calculate')
  const status = root.querySelector<HTMLElement>('#status')
  const result = root.querySelector<HTMLOutputElement>('#result')
  if (!variant || !summary || !form || !input || !button || !status || !result) {
    throw new Error('Calculator markup is incomplete')
  }
  variant.textContent = label
  const data = summarize([4, 5, 6])
  summary.value = `${data.count} 个数字，总和 ${data.sum}`
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const value = Number(input.value)
    if (!Number.isInteger(value) || value < 0 || value > 40) {
      status.textContent = '请输入 0–40 的整数。'
      return
    }
    button.disabled = true
    status.textContent = '获取计算模块并计算中…'
    try {
      const calculator = await load()
      result.value = `Fibonacci(${value}) = ${calculator.fibonacci(value)}`
      status.textContent = '计算完成。模块是否由网络加载，请核对 Network 请求。'
    } catch (error) {
      result.value = '未得到结果'
      status.textContent = `加载或计算失败：${error instanceof Error ? error.message : String(error)}。恢复网络后可重试；浏览器可能缓存失败的模块请求，必要时刷新。`
    } finally {
      button.disabled = false
    }
  })
}
