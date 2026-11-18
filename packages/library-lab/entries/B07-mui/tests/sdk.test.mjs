import assert from 'node:assert/strict'
import test from 'node:test'
import { TextField, ThemeProvider } from '@mui/material'
import { getContrastRatio } from '@mui/material/styles'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { themes } from '../examples/theme.ts'

// Real theme computation and actual server rendering. No fake document/Portal/focus claim.
test('real MUI themes resolve light/dark surfaces and stable custom tokens', () => {
  assert.equal(themes.light.palette.mode, 'light')
  assert.equal(themes.dark.palette.mode, 'dark')
  assert.notEqual(themes.light.palette.background.paper, themes.dark.palette.background.paper)
  assert.equal(themes.light.palette.primary.main, '#2b674e')
  assert.equal(themes.light.shape.borderRadius, 10)
  assert.equal(themes.light.spacing(2), '16px')
  assert.ok(
    getContrastRatio(
      themes.light.palette.primary.main,
      themes.light.palette.primary.contrastText,
    ) >= 4.5,
  )
})

test('real TextField server output links label/helper and forwards htmlInput slot constraints', () => {
  const html = renderToStaticMarkup(
    createElement(
      ThemeProvider,
      { theme: themes.light },
      createElement(TextField, {
        id: 'b07-sdk-name',
        label: '订阅名称',
        value: '本地',
        onChange: () => {},
        helperText: '名称上限60',
        slotProps: { htmlInput: { maxLength: 60 } },
      }),
    ),
  )
  assert.match(html, /for="b07-sdk-name"/)
  assert.match(html, /id="b07-sdk-name"/)
  assert.match(html, /aria-describedby="b07-sdk-name-helper-text"/)
  assert.match(html, /id="b07-sdk-name-helper-text"/)
  assert.match(html, /maxlength="60"/i)
  assert.match(html, /value="本地"/)
})
