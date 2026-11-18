import assert from 'node:assert/strict'
import test from 'node:test'
import { Alert, App, Button, ConfigProvider, Form, Input, Table, theme } from 'antd'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('real antd theme token generation and basic components render with React SSR', () => {
  const token = theme.getDesignToken({ token: { colorPrimary: '#21654f', borderRadius: 8 } })
  assert.equal(token.colorPrimary, '#21654f')
  assert.equal(token.borderRadius, 8)
  const html = renderToStaticMarkup(
    h(
      ConfigProvider,
      { theme: { token: { colorPrimary: '#21654f' } } },
      h(
        App,
        null,
        h(Input, { 'aria-label': '项目名称', defaultValue: 'ReactLoom' }),
        h(Button, { type: 'primary', disabled: true }, '确认项目'),
        h(Alert, { type: 'success', title: '已确认：ReactLoom' }),
      ),
    ),
  )
  assert.equal(typeof document, 'undefined')
  assert.match(html, /aria-label="项目名称"/)
  assert.match(html, /disabled=""/)
  assert.match(html, /已确认：ReactLoom/)
  console.log('Real antd SSR basic bytes:', Buffer.byteLength(html))
})
test('real Form field bindings and stable Table rowKey render from the same fixture', () => {
  const rows = [{ id: 'feed-sdk', title: '工程实践' }]
  const html = renderToStaticMarkup(
    h(
      ConfigProvider,
      null,
      h(
        App,
        null,
        h(
          Form,
          { name: 'b06-sdk', initialValues: { title: rows[0].title } },
          h(Form.Item, { name: 'title', label: '订阅名称' }, h(Input)),
        ),
        h(Table, {
          rowKey: 'id',
          dataSource: rows,
          columns: [{ title: '订阅标题', dataIndex: 'title' }],
          pagination: false,
        }),
      ),
    ),
  )
  assert.match(html, /for="b06-sdk_title"/)
  assert.match(html, /value="工程实践"/)
  assert.match(html, /data-row-key="feed-sdk"/)
  assert.match(html, /订阅标题/)
  console.log('Real antd SSR Form/Table bytes:', Buffer.byteLength(html))
})
// SSR/token evidence only: no browser validation, message Portal, focus or IME claim.
