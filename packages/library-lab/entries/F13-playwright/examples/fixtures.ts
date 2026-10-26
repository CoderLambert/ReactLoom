/** Standalone, inert HTML fixture. It uses no ReactLoom production server. */
export const basicPage = `
  <main><h1>任务编辑</h1>
    <label for="title">标题</label><input id="title" />
    <button id="save" type="button">保存</button>
    <output id="status" aria-live="polite">未保存</output>
  </main>
  <script>
    document.querySelector('#save').addEventListener('click', () => {
      document.querySelector('#status').textContent =
        document.querySelector('#title').value.trim() ? '保存完成' : '请输入标题'
    })
  </script>`

export const subscriptionPage = `
  <main><h1>订阅新闻源</h1>
    <label for="email">邮箱</label><input id="email" type="email" />
    <button id="subscribe" type="button">提交订阅</button>
    <output id="status" aria-live="polite">待提交</output>
  </main>
  <script>
    document.querySelector('#subscribe').addEventListener('click', async () => {
      const status = document.querySelector('#status')
      status.textContent = '发送中'
      try {
        const email = document.querySelector('#email').value
        const response = await fetch('https://api.lab.invalid/subscribe?email=' + encodeURIComponent(email))
        const result = await response.json()
        status.textContent = response.ok ? '订阅成功' : result.message
      } catch {
        status.textContent = '网络不可用'
      }
    })
  </script>`

export const racePage = `
  <main><h1>请求取消与过期更新</h1>
    <button id="old" type="button">旧版本</button>
    <button id="new" type="button">新版本</button>
    <output id="result" aria-live="polite">尚未请求</output>
  </main>
  <script>
    let controller, generation = 0
    async function load(q) {
      if (controller) controller.abort()
      controller = new AbortController()
      const id = ++generation
      try {
        const response = await fetch('https://api.lab.invalid/items?q=' + q, {signal: controller.signal})
        const data = await response.json()
        if (id === generation) document.querySelector('#result').textContent = data.label
      } catch (error) {
        if (id === generation && error.name !== 'AbortError') {
          document.querySelector('#result').textContent = '请求失败'
        }
      }
    }
    document.querySelector('#old').addEventListener('click', () => load('old'))
    document.querySelector('#new').addEventListener('click', () => load('new'))
  </script>`
