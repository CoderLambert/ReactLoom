import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Bar, BarChart, Tooltip, XAxis, YAxis } from 'recharts'
import { sampleRows } from '../examples/chart-policy.ts'

const html = renderToStaticMarkup(
  createElement(
    BarChart,
    { width: 600, height: 300, data: sampleRows(7, 0), accessibilityLayer: false },
    createElement(XAxis, { dataKey: 'day' }),
    createElement(YAxis),
    createElement(Tooltip),
    createElement(Bar, { dataKey: 'reads', isAnimationActive: 'auto' }),
  ),
)
console.log('Actual SDK SSR markup:', html)
console.log('SVG elements:', (html.match(/<svg/gu) ?? []).length)
console.log('Bar rectangles:', (html.match(/recharts-bar-rectangle/gu) ?? []).length)
console.log(
  'NOT_RUN: browser SVG layout/data/interaction; wrapper output is not chart-rendering PASS.',
)
