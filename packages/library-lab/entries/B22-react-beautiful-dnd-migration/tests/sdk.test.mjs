import assert from 'node:assert/strict'
import test from 'node:test'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Actual replacement SDK and React19 SSR. No legacy import, DOM substitute or sensor simulation.
function board() {
  return h(
    DragDropContext,
    { onDragEnd() {} },
    h(Droppable, { droppableId: 'channels' }, (provided) =>
      h(
        'ol',
        { ref: provided.innerRef, ...provided.droppableProps },
        ['ai', 'frontend'].map((id, index) =>
          h(Draggable, { key: id, draggableId: id, index }, (drag) =>
            h(
              'li',
              { ref: drag.innerRef, ...drag.draggableProps },
              h('button', { type: 'button', ...drag.dragHandleProps }, id),
            ),
          ),
        ),
        provided.placeholder,
      ),
    ),
  )
}
test('replacement18.0.1 actually renders the stable IDs and separate drag handles in React19 SSR', () => {
  const html = renderToStaticMarkup(board())
  assert.equal(typeof document, 'undefined')
  assert.match(html, /data-rfd-droppable-id="channels"/)
  for (const id of ['ai', 'frontend']) {
    assert.ok(html.includes(`data-rfd-draggable-id="${id}"`))
    assert.ok(html.includes(`data-rfd-drag-handle-draggable-id="${id}"`))
  }
  assert.match(html, /<button[^>]*data-rfd-drag-handle-context-id=/)
})
test('replacement React19 context identities isolate equal item IDs within the same SSR tree', () => {
  const html = renderToStaticMarkup(h('main', null, board(), board()))
  const contexts = [...html.matchAll(/data-rfd-droppable-context-id="([^"]+)"/g)].map(
    (match) => match[1],
  )
  assert.equal(contexts.length, 2)
  assert.equal(new Set(contexts).size, 2)
  console.log('Actual replacement SSR context identities:', contexts)
  // This does not prove client hydration, sensors, placeholder dimensions or keyboard announcements.
})
