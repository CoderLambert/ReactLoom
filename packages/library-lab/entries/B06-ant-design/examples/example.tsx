import type { TableColumnsType } from 'antd'
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  ConfigProvider,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useId, useMemo, useRef, useState } from 'react'
import { appendFeed, type FeedHistory, toggleFeed, undoFeed } from './feed-history'
import { normalizeHttpsFeedUrl } from './feed-url'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
type Feed = { id: string; title: string; url: string; category: 'tech' | 'news'; enabled: boolean }
type Values = Pick<Feed, 'title' | 'url' | 'category'>
const START: Feed[] = [
  {
    id: 'feed-1',
    title: '工程实践',
    url: 'https://example.com/engineering.xml',
    category: 'tech',
    enabled: true,
  },
  {
    id: 'feed-2',
    title: '每日新闻',
    url: 'https://example.com/daily.xml',
    category: 'news',
    enabled: false,
  },
]

function Workspace({ level }: { level: Level }) {
  const [form] = Form.useForm<Values>()
  const formName = `b06-feed-${useId()}`
  const { message } = AntApp.useApp()
  const sequence = useRef(START.length)
  const composing = useRef(false)
  const [feedState, setFeedState] = useState<FeedHistory<Feed>>({ rows: START, previous: null })
  const rows = feedState.rows
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [failOnce, setFailOnce] = useState(false)
  const [editing, setEditing] = useState<Feed | null>(null)
  const [project, setProject] = useState('ReactLoom')
  const [confirmed, setConfirmed] = useState(false)
  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        [row.title, row.url, row.category].join(' ').toLowerCase().includes(query.toLowerCase()),
      ),
    [rows, query],
  )

  function addFeed(values: Values) {
    const normalized = normalizeHttpsFeedUrl(values.url)
    if (!normalized) {
      form.setFields([{ name: 'url', errors: ['请输入不含账号密码的 HTTPS 地址'] }])
      return
    }
    if (failOnce && level === 'advanced') {
      setFailOnce(false)
      form.setFields([{ name: 'url', errors: ['本地409 fixture：地址已被其他成员占用，请重试'] }])
      void message.error('本地冲突已回填地址字段；没有发出 HTTP 请求')
      return
    }
    if (rows.some((row) => row.url === normalized)) {
      form.setFields([{ name: 'url', errors: ['该 RSS 地址已经存在'] }])
      return
    }
    const feed: Feed = {
      id: `feed-${++sequence.current}`,
      title: values.title.trim(),
      url: normalized,
      category: values.category,
      enabled: true,
    }
    // Atomic functional state owns both the new rows and the previous snapshot.
    setFeedState((state) => appendFeed(state, feed))
    form.resetFields()
    void message.success('本地新增成功；未发出外部请求')
  }
  const columns: TableColumnsType<Feed> = [
    {
      title: '订阅标题',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title, 'zh-CN'),
    },
    {
      title: 'RSS 地址',
      dataIndex: 'url',
      key: 'url',
      render: (value: string) => <span className="b06-url">{value}</span>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (value: Feed['category']) => <Tag>{value === 'tech' ? '技术' : '资讯'}</Tag>,
    },
    {
      title: '启用',
      key: 'enabled',
      render: (_unknown, record) => (
        <Switch
          checked={record.enabled}
          aria-label={`${record.title} 启用`}
          onChange={(enabled) => setFeedState((state) => toggleFeed(state, record.id, enabled))}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_unknown, record) => (
        <Button size="small" onClick={() => setEditing(record)} aria-label={`查看 ${record.title}`}>
          详情
        </Button>
      ),
    },
  ]
  return (
    <section
      className="b06-workshop"
      data-testid="b06-workshop"
      data-count={rows.length}
      data-query={query}
      data-conflict-armed={failOnce}
    >
      {level === 'basic' ? (
        <Card title="受控确认与局部主题" variant="outlined">
          <div className="b06-stack">
            <Typography.Paragraph>
              本例 Token 由 ConfigProvider
              提供；确认不发请求。空白名称不能确认，再编辑会清除成功态。
            </Typography.Paragraph>
            <Input
              aria-label="项目名称"
              maxLength={50}
              value={project}
              onChange={(event) => {
                setProject(event.target.value)
                setConfirmed(false)
              }}
            />
            <Button type="primary" disabled={!project.trim()} onClick={() => setConfirmed(true)}>
              确认项目
            </Button>
            {confirmed && <Alert type="success" showIcon title={`已确认：${project.trim()}`} />}
          </div>
        </Card>
      ) : (
        <Card
          title={level === 'business' ? 'Form 到同源 Table' : '字段冲突、恢复与一步撤销'}
          variant="outlined"
        >
          <div className="b06-stack">
            <Typography.Paragraph>
              Form 管字段；业务数组和上一份快照由 React 管。全部为本地 fixture，不抓取 RSS
              或模拟网络时延。
            </Typography.Paragraph>
            {level === 'advanced' && (
              <p role="status" data-testid="b06-conflict">
                {failOnce
                  ? '已准备：下一次通过客户端校验的提交注入一次409'
                  : '冲突注入未准备；可正常提交'}
              </p>
            )}
            <Form<Values>
              name={formName}
              form={form}
              layout="vertical"
              noValidate
              initialValues={{ title: '', url: '', category: 'tech' }}
              onFinish={addFeed}
            >
              <Form.Item
                className="b06-field"
                label="订阅名称"
                name="title"
                validateFirst
                rules={[
                  { required: true, whitespace: true, message: '请输入非空白名称' },
                  { max: 50, message: '最多50字符' },
                ]}
              >
                <Input placeholder="示例：浏览器工程" autoComplete="off" maxLength={50} />
              </Form.Item>
              <Form.Item
                className="b06-field"
                label="RSS HTTPS 地址"
                name="url"
                validateFirst
                rules={[
                  { required: true, message: '请输入地址' },
                  {
                    validator: async (_, value: string) => {
                      if (value && !normalizeHttpsFeedUrl(value))
                        throw new Error('请输入不含账号密码的 HTTPS 地址')
                    },
                  },
                ]}
              >
                <Input placeholder="https://example.com/feed.xml" autoComplete="off" />
              </Form.Item>
              <Form.Item label="分类" name="category">
                <Select
                  options={[
                    { label: '技术', value: 'tech' },
                    { label: '资讯', value: 'news' },
                  ]}
                />
              </Form.Item>
              <div className="b06-controls">
                <Button htmlType="submit" type="primary">
                  新增本地订阅
                </Button>
                {level === 'advanced' && (
                  <Button onClick={() => setFailOnce(true)}>下一次有效提交注入409</Button>
                )}
                <Button
                  disabled={!feedState.previous}
                  onClick={() => {
                    setFeedState((state) => undoFeed(state))
                    void message.info('撤销上一项列表修改')
                  }}
                >
                  撤销修改
                </Button>
              </div>
            </Form>
            <Input.Search
              aria-label="查找RSS"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onCompositionStart={() => {
                composing.current = true
              }}
              onCompositionEnd={() => {
                composing.current = false
              }}
              onSearch={(value) => {
                if (!composing.current) setQuery(value.trim())
              }}
              placeholder="草稿不立即过滤，完成组合输入后提交搜索"
              enterButton="搜索"
            />
            <div data-testid="b06-table">
              <Table<Feed>
                rowKey="id"
                columns={columns}
                dataSource={filtered}
                pagination={{ pageSize: 4, hideOnSinglePage: true }}
                size="small"
                scroll={{ x: 760 }}
              />
            </div>
            <p role="status" data-testid="b06-records">
              本地记录 {rows.length} · 当前匹配 {filtered.length}。排序和分页只处理内存全量
              fixture。
            </p>
            <Modal
              title="订阅详情"
              open={Boolean(editing)}
              onCancel={() => setEditing(null)}
              onOk={() => setEditing(null)}
              okText="关闭详情"
              cancelButtonProps={{ style: { display: 'none' } }}
              destroyOnHidden
              focusable={{ focusTriggerAfterClose: true }}
            >
              {editing && (
                <>
                  <p>名称：{editing.title}</p>
                  <p className="b06-url">地址：{editing.url}</p>
                  <p>分类：{editing.category === 'tech' ? '技术' : '资讯'}</p>
                </>
              )}
            </Modal>
          </div>
        </Card>
      )}
    </section>
  )
}
export default function AntDesignExample({ level }: { level: Level }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{ token: { colorPrimary: '#21654f', borderRadius: 8 } }}
      getPopupContainer={(node) => node?.parentElement ?? document.body}
    >
      <AntApp>
        <Workspace level={level} />
      </AntApp>
    </ConfigProvider>
  )
}
