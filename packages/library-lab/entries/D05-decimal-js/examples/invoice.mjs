import Decimal from 'decimal.js';
import {normalizeAmount, normalizeQuantity} from './amount-policy.mjs';

// Clone instead of changing Decimal's process-wide rounding behavior.
const Money = Decimal.clone({precision: 28, rounding: Decimal.ROUND_HALF_UP});
const Bankers = Decimal.clone({precision: 28, rounding: Decimal.ROUND_HALF_EVEN});

export function calculateInvoice(input) {
  if (!input || typeof input !== 'object') throw new TypeError('发票输入必须是对象');
  const unit = new Money(normalizeAmount('单价', input.unitPrice));
  const quantity = new Money(normalizeQuantity(input.quantity));
  const taxRate = new Money(normalizeAmount('税率', input.taxPercent));
  if (taxRate.greaterThan(100)) throw new Error('税率不超过 100%');
  // Contract: round extended line amount to cents; then round tax on that subtotal.
  const subtotal = unit.times(quantity).toDecimalPlaces(2);
  const tax = subtotal.times(taxRate).dividedBy(100).toDecimalPlaces(2);
  return {subtotal: subtotal.toFixed(2), tax: tax.toFixed(2), total: subtotal.plus(tax).toFixed(2)};
}

export function roundingContrast() {
  const unit = new Money('0.335');
  return {
    halfUp: new Money('1.005').toFixed(2),
    halfEven: new Bankers('1.005').toFixed(2),
    extendedLine: unit.times(3).toDecimalPlaces(2).toFixed(2),
    roundedEachUnit: unit.toDecimalPlaces(2).times(3).toFixed(2),
  };
}
