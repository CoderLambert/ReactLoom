import assert from 'node:assert/strict'
import test from 'node:test'
import Decimal from 'decimal.js'
import { calculateInvoice, roundingContrast } from '../examples/invoice.mjs'

test('actual decimal.js performs exact decimal addition', () => {
  assert.equal(new Decimal('0.1').plus('0.2').toString(), '0.3')
  assert.notEqual(String(0.1 + 0.2), '0.3')
})
test('real business rule rounds line subtotal first, tax second', () => {
  assert.deepEqual(calculateInvoice({ unitPrice: '19.99', quantity: '3', taxPercent: '7.5' }), {
    subtotal: '59.97',
    tax: '4.50',
    total: '64.47',
  })
  assert.deepEqual(calculateInvoice({ unitPrice: '0', quantity: '1', taxPercent: '0' }), {
    subtotal: '0.00',
    tax: '0.00',
    total: '0.00',
  })
})
test('half-up versus half-even and line versus unit rounding are observable', () => {
  assert.deepEqual(roundingContrast(), {
    halfUp: '1.01',
    halfEven: '1.00',
    extendedLine: '1.01',
    roundedEachUnit: '1.02',
  })
})
test('invalid amounts and quantities are rejected before decimals are created', () => {
  for (const input of [
    { unitPrice: '1e5', quantity: '1', taxPercent: '0' },
    { unitPrice: '0.00001', quantity: '1', taxPercent: '0' },
    { unitPrice: '1', quantity: '10000', taxPercent: '0' },
    { unitPrice: '1', quantity: '1', taxPercent: '100.0001' },
    { unitPrice: '-1', quantity: '1', taxPercent: '0' },
  ])
    assert.throws(() => calculateInvoice(input))
})

test('invoice clones preserve their rounding without changing the default constructor', () => {
  const before = { precision: Decimal.precision, rounding: Decimal.rounding }
  calculateInvoice({ unitPrice: '0.335', quantity: '3', taxPercent: '100' })
  roundingContrast()
  assert.deepEqual({ precision: Decimal.precision, rounding: Decimal.rounding }, before)
  assert.deepEqual(calculateInvoice({ unitPrice: '0.335', quantity: '3', taxPercent: '100' }), {
    subtotal: '1.01',
    tax: '1.01',
    total: '2.02',
  })
})

test('bounded largest inputs retain exact cents and transport strings', () => {
  assert.deepEqual(
    calculateInvoice({ unitPrice: '9999999999.9999', quantity: '9999', taxPercent: '100' }),
    { subtotal: '99989999999999.00', tax: '99989999999999.00', total: '199979999999998.00' },
  )
})
