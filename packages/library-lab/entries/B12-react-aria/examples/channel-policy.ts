export type Channel = {id: string; name: string; category: string; disabled?: boolean};

export function filterChannels(rows: readonly Channel[], query: string): Channel[] {
  const needle = query.trim().toLocaleLowerCase('zh-CN');
  return rows.filter(row => (row.name + ' ' + row.category).toLocaleLowerCase('zh-CN').includes(needle));
}

export function confirmedChannel(rows: readonly Channel[], key: string | null, input: string): Channel | null {
  const row = rows.find(item => item.id === key);
  return row && !row.disabled && row.name === input ? row : null;
}

export function queryRows(rows: readonly Channel[], input: string, completedQuery: string, isBusy: boolean): Channel[] {
  return !isBusy && completedQuery === input ? filterChannels(rows, input) : [];
}
