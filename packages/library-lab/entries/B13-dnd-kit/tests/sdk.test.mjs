import assert from 'node:assert/strict'
import test from 'node:test'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

function Handle({ id, disabled }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef } = useSortable({ id, disabled })
  return createElement(
    'li',
    { ref: setNodeRef, 'data-id': id },
    createElement(
      'button',
      {
        ...attributes,
        ...listeners,
        type: 'button',
        ref: setActivatorNodeRef,
        disabled,
        'aria-label': `拖动 ${id}`,
      },
      id,
    ),
  )
}

function Fixture() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  assert.equal(sensors[0].sensor, PointerSensor)
  assert.equal(sensors[0].options.activationConstraint.distance, 6)
  assert.equal(sensors[1].options.coordinateGetter, sortableKeyboardCoordinates)
  return createElement(
    DndContext,
    { sensors, collisionDetection: closestCenter },
    createElement(
      SortableContext,
      { items: ['tech', 'news'], strategy: verticalListSortingStrategy },
      createElement(
        'ol',
        null,
        createElement(Handle, { id: 'tech', disabled: false }),
        createElement(Handle, { id: 'news', disabled: true }),
      ),
    ),
  )
}

test('real core and sortable hooks render focusable handles with the selected sensor descriptors', () => {
  const html = renderToStaticMarkup(createElement(Fixture))
  assert.match(html, /aria-label="拖动 tech"/)
  assert.match(html, /tabindex="0"/)
  assert.match(html, /aria-roledescription="sortable"/)
  assert.match(html, /aria-describedby=/)
})

test('real useSortable exposes disabled semantics for the pinned handle', () => {
  const html = renderToStaticMarkup(createElement(Fixture))
  assert.match(html, /aria-disabled="true"[^>]*disabled=""[^>]*aria-label="拖动 news"/)
})

test('real closestCenter orders supplied candidate rectangles by their center distance', () => {
  const rect = (left, top) => ({
    left,
    top,
    width: 10,
    height: 10,
    right: left + 10,
    bottom: top + 10,
  })
  const collisions = closestCenter({
    collisionRect: rect(0, 0),
    droppableRects: new Map([
      ['near', rect(0, 20)],
      ['far', rect(0, 100)],
    ]),
    droppableContainers: [{ id: 'far' }, { id: 'near' }],
  })
  assert.deepEqual(
    collisions.map(({ id }) => id),
    ['near', 'far'],
  )
})
