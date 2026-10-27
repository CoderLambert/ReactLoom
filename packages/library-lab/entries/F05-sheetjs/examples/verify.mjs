import assert from 'node:assert/strict';
import {exportWorkbook,importWorkbook,fixture} from './core.mjs';
assert.deepEqual(importWorkbook(exportWorkbook(fixture)),fixture);
console.log('F05 SheetJS real SDK roundtrip: PASS (only when this CLI was actually executed)');
