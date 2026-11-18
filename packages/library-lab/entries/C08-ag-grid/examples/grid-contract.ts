import {
  AllCommunityModule,
  type ColDef,
  type GetRowIdParams,
  themeQuartz,
} from 'ag-grid-community'

export type Status = 'active' | 'paused' | 'error'
export type Source = {
  id: string
  name: string
  category: string
  articles: number
  status: Status
  revision: number
}
export const STATUSES: Status[] = ['active', 'paused', 'error']
export const MODULES = [AllCommunityModule]
export const GRID_THEME = themeQuartz.withParams({
  fontFamily: 'system-ui',
  accentColor: '#296b51',
})
export const getSourceId = (params: GetRowIdParams<Source>) => params.data.id
export function makeRows(count: number): Source[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `feed-${String(index + 1).padStart(4, '0')}`,
    name: `${['Frontend Weekly', 'Open Source Radar', 'AI Engineering'][index % 3]} ${index + 1}`,
    category: ['前端', '开源', 'AI'][index % 3],
    articles: (index * 7) % 130,
    status: STATUSES[index % 3],
    revision: 1,
  }))
}
export function createColumns(): ColDef<Source>[] {
  return [
    { field: 'id', headerName: '来源 ID', minWidth: 130 },
    { field: 'name', headerName: '频道', minWidth: 190, flex: 1, filter: 'agTextColumnFilter' },
    { field: 'category', headerName: '分类', minWidth: 105, filter: 'agTextColumnFilter' },
    { field: 'articles', headerName: '文章数', minWidth: 100, filter: 'agNumberColumnFilter' },
    {
      field: 'status',
      headerName: '状态',
      minWidth: 145,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: STATUSES },
    },
    { field: 'revision', headerName: '版本', minWidth: 85 },
  ]
}
