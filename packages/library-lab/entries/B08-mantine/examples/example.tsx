import {
  Alert,
  Badge,
  Button,
  Card,
  createTheme,
  Group,
  MantineProvider,
  Modal,
  NumberInput,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useId, useMemo, useRef, useState } from 'react'
import '@mantine/core/styles.layer.css'
import type { Feed } from './feed-history'
import { initialFeedHistory, toggleFeed, undoFeed, updateQuota, validQuota } from './feed-history'
import { createLocalColorSchemeManager } from './local-color-scheme'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
const theme = createTheme({ primaryColor: 'teal', fontFamily: 'system-ui, sans-serif' })
function FeedManager({ level, portalTarget }: { level: Level; portalTarget: string }) {
  const [workspace, setWorkspace] = useState('ReactLoom')
  const [feedHistory, setFeedHistory] = useState(initialFeedHistory)
  const { rows, before } = feedHistory
  const [filter, setFilter] = useState('')
  const [debouncedFilter] = useDebouncedValue(filter, 150)
  const [selected, setSelected] = useState<string | null>(null)
  const [quotaDraft, setQuotaDraft] = useState<number | string>(15)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const visible = useMemo(
    () =>
      rows.filter((row) =>
        row.title.toLocaleLowerCase().includes(debouncedFilter.toLocaleLowerCase()),
      ),
    [rows, debouncedFilter],
  )
  function closeEditor() {
    setSelected(null)
    setError('')
  }
  function edit(row: Feed) {
    setSelected(row.id)
    setQuotaDraft(row.quota)
    setError('')
    setNotice('')
  }
  function saveQuota() {
    if (!selected) return
    // The default NumberInput generic returns number | string, preserving incomplete input.
    if (!validQuota(quotaDraft)) {
      setError('限额必须是1–100整数；空值、短横线、小数和越界值不能保存')
      return
    }
    const unchanged = rows.find((row) => row.id === selected)?.quota === quotaDraft
    setFeedHistory((previous) => updateQuota(previous, selected, quotaDraft))
    closeEditor()
    setNotice(unchanged ? '配额未变化，没有生成撤销点' : '本地配额已更新（没有调用服务器）')
  }
  return (
    <Stack
      gap="md"
      data-testid="b08-workshop"
      data-filter={debouncedFilter}
      data-selected={selected ?? ''}
    >
      <Title order={3}>
        {level === 'basic'
          ? '局部主题与受控确认'
          : level === 'business'
            ? '防抖筛选与一步撤销'
            : '数字中间态、校验与配额提交'}
      </Title>
      {level === 'basic' ? (
        <Card shadow="xs" withBorder p="lg">
          <Stack gap="sm">
            <TextInput
              label="工作区"
              value={workspace}
              maxLength={60}
              onChange={(event) => {
                setWorkspace(event.currentTarget.value)
                setNotice('')
              }}
            />
            <Group gap="xs">
              <Badge color={workspace.trim() ? 'teal' : 'orange'}>
                {workspace.trim() ? '可使用' : '名称不能为空'}
              </Badge>
              <Text size="sm" component="output">
                {workspace || '（空）'}
              </Text>
            </Group>
            <Button
              disabled={!workspace.trim()}
              onClick={() => setNotice(`本地工作区：${workspace.trim()}`)}
            >
              确认工作区
            </Button>
            {notice && (
              <Alert color="teal" role="status">
                {notice}
              </Alert>
            )}
          </Stack>
        </Card>
      ) : (
        <>
          <Group justify="space-between" align="end" gap="sm" wrap="wrap">
            <TextInput
              label="筛选订阅"
              placeholder="前端、AI…"
              value={filter}
              onChange={(event) => setFilter(event.currentTarget.value)}
            />
            <Button
              variant="outline"
              disabled={!before}
              onClick={() => {
                setFeedHistory(undoFeed)
                setNotice('已撤销最近一次变更')
              }}
            >
              撤销上一次
            </Button>
          </Group>
          <Text size="sm">
            草稿：<output data-testid="b08-filter-draft">{filter || '（空）'}</output>；已生效：
            <output data-testid="b08-filter-applied">{debouncedFilter || '（空）'}</output>（150ms
            debounce，不是请求）。
          </Text>
          <div className="b08-table-scroll">
            <Table striped highlightOnHover withTableBorder data-testid="b08-table">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th scope="col">RSS 订阅</Table.Th>
                  <Table.Th scope="col">每小时限额</Table.Th>
                  <Table.Th scope="col">启用</Table.Th>
                  {level === 'advanced' && <Table.Th scope="col">编辑</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visible.map((row) => (
                  <Table.Tr
                    key={row.id}
                    data-feed-id={row.id}
                    data-quota={row.quota}
                    data-enabled={row.enabled}
                  >
                    <Table.Th scope="row">{row.title}</Table.Th>
                    <Table.Td>{row.quota}</Table.Td>
                    <Table.Td>
                      <Switch
                        size="sm"
                        checked={row.enabled}
                        label={row.enabled ? '启用' : '暂停'}
                        aria-label={`${row.title} 状态`}
                        onChange={(event) => {
                          const enabled = event.currentTarget.checked
                          setFeedHistory((previous) => toggleFeed(previous, row.id, enabled))
                        }}
                      />
                    </Table.Td>
                    {level === 'advanced' && (
                      <Table.Td>
                        <Button
                          size="xs"
                          variant="light"
                          aria-label={`编辑 ${row.title} 配额`}
                          onClick={() => edit(row)}
                        >
                          编辑配额
                        </Button>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
          <Text size="sm" role="status" data-testid="b08-count">
            当前筛选 {visible.length}/{rows.length}；这里只更新内存数据。
          </Text>
          {visible.length === 0 && <Text>没有匹配订阅；清空筛选可恢复。</Text>}
          {notice && (
            <Alert color="teal" role="status">
              {notice}
            </Alert>
          )}
        </>
      )}
      <Modal
        opened={Boolean(selected)}
        onClose={closeEditor}
        title={`编辑配额：${rows.find((row) => row.id === selected)?.title ?? ''}`}
        centered
        portalProps={{ target: portalTarget }}
        returnFocus
        closeButtonProps={{ 'aria-label': '关闭配额编辑' }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            saveQuota()
          }}
        >
          <Stack gap="md">
            <NumberInput
              data-autofocus
              label="每小时请求上限"
              description="提交时只接受1–100整数；草稿保留中间态"
              min={1}
              max={100}
              clampBehavior="none"
              decimalScale={2}
              value={quotaDraft}
              error={error || undefined}
              onChange={(value) => {
                setQuotaDraft(value)
                setError('')
              }}
            />
            <Text size="sm">
              实际onChange草稿：
              <output data-testid="b08-quota-draft">
                {typeof quotaDraft}: {JSON.stringify(quotaDraft)}
              </output>
            </Text>
            {error && (
              <Alert color="red" role="alert">
                配额未保存，请检查限额字段。
              </Alert>
            )}
            <Group justify="end">
              <Button type="button" variant="default" onClick={closeEditor}>
                取消编辑
              </Button>
              <Button type="submit">保存配额</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}
export default function MantineExample({ level }: { level: Level }) {
  const host = useRef<HTMLElement>(null)
  const scopeId = useId()
  const selector = `[data-b08-root="${scopeId}"]`
  const [manager] = useState(createLocalColorSchemeManager)
  return (
    <section
      ref={host}
      className="b08-root"
      data-b08-root={scopeId}
      aria-label="Mantine 真实组件与状态演示"
    >
      <MantineProvider
        theme={theme}
        forceColorScheme="light"
        colorSchemeManager={manager}
        cssVariablesSelector={selector}
        getRootElement={() => host.current ?? undefined}
        withGlobalClasses={false}
      >
        <Text size="sm" c="dimmed" mb="md">
          真实core/hooks，本地fixture，无网络。主题变量和Portal收束在本例根；导入的官方CSS基础层仍属于文档级样式。
        </Text>
        <FeedManager level={level} portalTarget={selector} />
      </MantineProvider>
    </section>
  )
}
