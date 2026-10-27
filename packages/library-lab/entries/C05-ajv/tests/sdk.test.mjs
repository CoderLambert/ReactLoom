import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv';
import {validateFeedBoundaries} from '../examples/rss-policy.mjs';

test('real Ajv strict validator validates shape without implicit conversion', () => {
  const ajv = new Ajv({strict: true, allErrors: true, coerceTypes: false, removeAdditional: false});
  const check = ajv.compile({type: 'object', required: ['id'], additionalProperties: false,
    properties: {id: {type: 'integer', minimum: 1}}});
  assert.equal(check({id: 2}), true);
  assert.equal(check({id: '2', secret: true}), false);
  assert.ok(check.errors?.some(error => error.keyword === 'type'));
  assert.ok(check.errors?.some(error => error.keyword === 'additionalProperties'));
});

test('real Ajv checks conditional required field and bounded concurrency', () => {
  const check = new Ajv({strict: true, allErrors: true}).compile({
    type: 'object', required: ['enabled'], additionalProperties: false,
    properties: {enabled: {type: 'boolean'}, maxConcurrent: {type: 'integer', minimum: 1, maximum: 8}},
    if: {properties: {enabled: {const: true}}, required: ['enabled']},
    then: {required: ['maxConcurrent']},
  });
  assert.equal(check({enabled: false}), true);
  assert.equal(check({enabled: true}), false);
  assert.ok(check.errors?.some(error => error.keyword === 'required'));
  assert.equal(check({enabled: true, maxConcurrent: 3}), true);
  assert.equal(check({enabled: true, maxConcurrent: 0}), false);
});

test('real Ajv uniqueItems accepts distinct objects with duplicate canonical RSS URLs; boundary rejects', () => {
  const schema = {type: 'object', required: ['feeds'], additionalProperties: false,
    properties: {feeds: {type: 'array', minItems: 1, uniqueItems: true, items: {
      type: 'object', required: ['id', 'url'], additionalProperties: false,
      properties: {id: {type: 'string'}, url: {type: 'string'}}
    }}}};
  const validate = new Ajv({strict: true, allErrors: true}).compile(schema);
  const payload = {feeds: [{id:'one', url:'https://EXAMPLE.COM:443/Feed?q=A'},
    {id:'two', url:'https://example.com/Feed?q=A#section'}]};
  assert.equal(validate(payload), true); // Distinct objects, despite identical fetch identity.
  const issues = validateFeedBoundaries('business', payload);
  assert.deepEqual(issues.map(issue => issue.path), ['/feeds/1/url']);
});
