import {useMemo, useState} from 'react';
import {
  Alert, Badge, Button, Card, createTheme, Group, MantineProvider, Modal,
  NumberInput, Stack, Switch, Table, Text, TextInput, Title,
} from '@mantine/core';
import {useDebouncedValue} from '@mantine/hooks';
import '@mantine/core/styles.layer.css';
import {initialFeedHistory, toggleFeed, undoFeed, updateQuota, validQuota} from './feed-history';

type Level = 'basic' | 'business' | 'advanced';
const theme = createTheme({primaryColor: 'teal', fontFamily: 'system-ui, sans-serif'});

function FeedManager({level}: {level: Level}) {
  const [workspace, setWorkspace] = useState('ReactLoom');
  const [feedHistory, setFeedHistory] = useState(initialFeedHistory);
  const {rows, before} = feedHistory;
  const [filter, setFilter] = useState('');
  const [debouncedFilter] = useDebouncedValue(filter, 150);
  const [selected, setSelected] = useState<string | null>(null);
  const [quotaDraft, setQuotaDraft] = useState<number | string>(15);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const visible = useMemo(() => rows.filter(row => row.title.toLocaleLowerCase().includes(debouncedFilter.toLocaleLowerCase())), [rows, debouncedFilter]);

  function edit(row: Feed) {
    setSelected(row.id);
    setQuotaDraft(row.quota);
    setError('');
    setNotice('');
  }
  function saveQuota() {
    if (!selected) return;
    // Mantine NumberInput deliberately returns strings for intermediate values.
    if (!validQuota(quotaDraft)) {
      setError('请求限额必须是 1–100 的整数；空值、短横线不能被当作零');
      return;
    }
    setFeedHistory(previous => updateQuota(previous, selected, quotaDraft));
    setSelected(null);
    setNotice('本地配额已更新（没有调用服务器）');
  }
  function toggle(id: string, enabled: boolean) {
    setFeedHistory(previous => toggleFeed(previous, id, enabled));
  }

  return <Stack gap="md">
    <Title order={3}>{level === 'basic' ? '可配置主题与输入' :
      level === 'business' ? 'RSS 订阅状态和配额' : '中间输入态、校验与撤销'}</Title>
    {level === 'basic' ? <Card shadow="xs" withBorder p="lg">
      <Stack gap="sm">
        <TextInput label="工作区" value={workspace} maxLength={60}
          onChange={event => setWorkspace(event.currentTarget.value)}/>
        <Group gap="xs"><Badge color={workspace.trim() ? 'teal' : 'orange'}>
          {workspace.trim() ? '可使用' : '名称不能为空'}</Badge>
          <Text size="sm" component="output">{workspace || '（空）'}</Text></Group>
        <Button disabled={!workspace.trim()} onClick={() => setNotice('本地工作区：' + workspace.trim())}>确认工作区</Button>
        {notice && <Alert color="teal" role="status">{notice}</Alert>}
      </Stack>
    </Card> : <>
      <Group justify="space-between" align="end" gap="sm" wrap="wrap">
        <TextInput label="筛选订阅" placeholder="技术、AI…" value={filter}
          onChange={event => setFilter(event.currentTarget.value)}/>
        <Button variant="outline" disabled={!before} onClick={() => {
          if (before) {setFeedHistory(undoFeed);setNotice('已撤销最近一次变更');}
        }}>撤销上一次</Button>
      </Group>
      <div style={{overflowX: 'auto'}}>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead><Table.Tr><Table.Th scope="col">RSS 订阅</Table.Th>
            <Table.Th scope="col">每小时限额</Table.Th><Table.Th scope="col">启用</Table.Th>
            {level === 'advanced' && <Table.Th scope="col">编辑</Table.Th>}</Table.Tr></Table.Thead>
          <Table.Tbody>{visible.map(row => <Table.Tr key={row.id}>
            <Table.Th scope="row">{row.title}</Table.Th>
            <Table.Td>{row.quota}</Table.Td><Table.Td>
              <Switch size="sm" checked={row.enabled} label={row.enabled ? '启用' : '暂停'}
                aria-label={row.title + ' 状态'} onChange={event => toggle(row.id, event.currentTarget.checked)}/>
            </Table.Td>
            {level === 'advanced' && <Table.Td><Button size="xs" variant="light" onClick={() => edit(row)}>编辑配额</Button></Table.Td>}
          </Table.Tr>)}</Table.Tbody>
        </Table>
      </div>
      <Text size="sm" role="status">当前筛选 {visible.length}/{rows.length}；这里只更新内存数据。</Text>
      {notice && <Alert color="teal" role="status">{notice}</Alert>}
    </>}
    <Modal opened={Boolean(selected)} onClose={() => {setSelected(null);setError('');}}
      title={'编辑配额：' + (rows.find(row => row.id === selected)?.title ?? '')} centered>
      <Stack gap="md">
        <NumberInput label="每小时请求上限" description="仅接受1–100整数"
          min={1} max={100} clampBehavior="none" decimalScale={0}
          value={quotaDraft} onChange={value => setQuotaDraft(typeof value === 'bigint' ? String(value) : value)}/>
        {error && <Alert color="red" role="alert">{error}</Alert>}
        <Group justify="end"><Button variant="default" onClick={() => setSelected(null)}>取消</Button>
          <Button onClick={saveQuota}>保存配额</Button></Group>
      </Stack>
    </Modal>
  </Stack>;
}
export default function MantineExample({level}: {level: Level}) {
  // In a production application place this provider once at the app root.
  return <MantineProvider theme={theme} forceColorScheme="light">
    <section aria-label="Mantine 真实组件与状态演示" data-mantine-lab>
      <Text size="sm" c="dimmed" mb="md">
        实际 @mantine/core 控件；订阅是本地fixture，非真实网络请求。
      </Text>
      <FeedManager level={level}/>
    </section>
  </MantineProvider>;
}
