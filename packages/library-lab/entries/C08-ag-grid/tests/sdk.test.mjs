import assert from 'node:assert/strict'
import test from 'node:test'
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import {
  createColumns,
  GRID_THEME,
  getSourceId,
  MODULES,
  makeRows,
  STATUSES,
} from '../examples/grid-contract.ts'

test('actual React adapter and Community modules match the shared Demo contract', () => {
  assert.equal(typeof AgGridProvider, 'function')
  assert.equal(typeof AgGridReact, 'function')
  assert.deepEqual(MODULES, [AllCommunityModule])
  assert.equal(typeof ModuleRegistry.registerModules, 'function')
  const columns = createColumns()
  const status = columns.find((column) => column.field === 'status')
  assert.equal(status.editable, true)
  assert.equal(status.cellEditor, 'agSelectCellEditor')
  assert.deepEqual(status.cellEditorParams.values, STATUSES)
  const rows = makeRows(12)
  assert.equal(getSourceId({ data: rows[0] }), 'feed-0001')
  assert.equal(new Set(rows.map((row) => getSourceId({ data: row }))).size, 12)
})

test('the actual shared SDK theme composes immutably through the public Theming API', () => {
  assert.notEqual(GRID_THEME, themeQuartz)
  const changed = GRID_THEME.withParams({ accentColor: '#123456' })
  assert.notEqual(changed, GRID_THEME)
  assert.equal(typeof changed.withParams, 'function')
  assert.notEqual(changed.withoutPart('checkboxStyle'), changed)
  assert.equal(typeof GRID_THEME.withPart, 'function')
  // These are real SDK configuration operations, not createGrid, Canvas or DOM execution.
})
