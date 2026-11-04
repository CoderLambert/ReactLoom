import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {
  flip, offset, shift, useFloating, useClick, useDismiss,
  useRole, useInteractions,
} from '@floating-ui/react';

// This runs the real React SDK hooks during SSR. DOM positioning, Escape,
// IME and focus return must still pass the independent browser suite.
function FloatingFixture() {
  const {refs, floatingStyles, context, placement} = useFloating({
    open: true,
    onOpenChange: () => {},
    placement: 'bottom-start',
    middleware: [offset(8), flip(), shift()],
  });
  const click = useClick(context);
  const dismiss = useDismiss(context, {escapeKey: true, outsidePress: true});
  const role = useRole(context, {role: 'dialog'});
  const {getReferenceProps, getFloatingProps} = useInteractions([click, dismiss, role]);
  assert.equal(placement, 'bottom-start');
  return React.createElement('section', null,
    React.createElement('button', {
      ...getReferenceProps({'aria-label': 'Open article'}),
      type: 'button',
      ref: refs.setReference,
    }, 'Open article'),
    React.createElement('div', {
      ...getFloatingProps({'aria-label': 'Article actions'}),
      ref: refs.setFloating,
      style: floatingStyles,
    }, 'Article actions'),
  );
}

test('B17 real Floating UI React hooks compose semantic reference and dialog props', () => {
  const markup = renderToStaticMarkup(React.createElement(FloatingFixture));
  assert.match(markup, /Open article/u);
  assert.match(markup, /Article actions/u);
  assert.match(markup, /role="dialog"/u);
  assert.match(markup, /aria-label="Article actions"/u);
});
