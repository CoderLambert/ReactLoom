import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {useFieldArray, useForm} from 'react-hook-form';

test('real RHF registers an array field through its public hooks', () => {
  function Fixture() {
    const {control, register} = useForm({defaultValues: {group:'技术', sources:[{name:'前端',url:'https://example.com/rss'}]}});
    const {fields} = useFieldArray({control, name:'sources'});
    assert.equal(fields.length, 1);
    assert.equal(typeof fields[0].id, 'string');
    return React.createElement('form', null, fields.map((row,index) =>
      React.createElement('input', {key:row.id, ...register(`sources.${index}.url`)})));
  }
  const markup = renderToStaticMarkup(React.createElement(Fixture));
  assert.match(markup, /name="sources\.0\.url"/);
});
