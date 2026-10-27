import assert from 'node:assert/strict';
import test from 'node:test';
import {changeAllPermissions, changePermission, eligiblePermissions, normalizePermissions, permissionSummary} from '../examples/permission-policy.ts';

test('locked manage is never selected by bulk action', () => {
  assert.deepEqual(changeAllPermissions(true, true), ['read', 'comment']);
  assert.deepEqual(eligiblePermissions(true), ['read', 'comment']);
});
test('locked full selection is checked instead of permanently indeterminate', () => {
  assert.deepEqual(permissionSummary(['read', 'comment'], true), {checked: true, indeterminate: false, selectedCount: 2, eligibleCount: 2});
  assert.deepEqual(changeAllPermissions(false, true), []);
});
test('partial selection is mixed within eligible subset', () => {
  assert.deepEqual(permissionSummary(['read'], true), {checked: false, indeterminate: true, selectedCount: 1, eligibleCount: 2});
});
test('locked privilege cannot be injected by individual change', () => {
  assert.deepEqual(changePermission(['read'], 'manage', true, true), ['read']);
});
test('normalize removes stale/duplicate locked IDs deterministically', () => {
  assert.deepEqual(normalizePermissions(['manage', 'read', 'read'], true), ['read']);
  assert.deepEqual(normalizePermissions(['manage', 'read', 'read'], false), ['read', 'manage']);
});
test('unlocked full selection remains three independent permissions', () => {
  assert.deepEqual(permissionSummary(changeAllPermissions(true, false), false), {checked: true, indeterminate: false, selectedCount: 3, eligibleCount: 3});
  assert.deepEqual(changePermission(['read', 'comment'], 'comment', false, false), ['read']);
});
