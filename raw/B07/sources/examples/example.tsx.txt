import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ThemeProvider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useId, useMemo, useRef, useState } from 'react'
import { type DraftErrors, validateFeedDraft } from './draft-policy'
import { addFeed, initialFeedHistory, toggleFeed, undoFeed } from './feed-history'
import { themes } from './theme'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
function ThemeProbe() {
  const theme = useTheme()
  return (
    <details>
      <summary>查看实际主题</summary>
      <pre data-testid="b07-theme-state">
        {JSON.stringify(
          {
            mode: theme.palette.mode,
            primary: theme.palette.primary.main,
            paper: theme.palette.background.paper,
            text: theme.palette.text.primary,
            borderRadius: theme.shape.borderRadius,
            spacing2: theme.spacing(2),
          },
          null,
          2,
        )}
      </pre>
    </details>
  )
}

export default function MaterialUIExample({ level }: { level: Level }) {
  const [dark, setDark] = useState(false)
  const [workspace, setWorkspace] = useState('ReactLoom')
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState(initialFeedHistory)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [errors, setErrors] = useState<DraftErrors>({})
  const [error, setError] = useState('')
  const [injectConflict, setInjectConflict] = useState(false)
  const noticeSequence = useRef(0)
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const urlInput = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true })
  const { rows, before } = history
  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        `${row.title} ${row.endpoint}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      ),
    [rows, query],
  )
  function notify(message: string) {
    setNotice({ id: ++noticeSequence.current, message })
  }
  function closeNotice(id: number) {
    setNotice((current) => (current?.id === id ? null : current))
  }
  function toggle(id: string, enabled: boolean) {
    setHistory((previous) => toggleFeed(previous, id, enabled))
    notify('本地启用状态已更新')
  }
  function openDialog(conflict: boolean) {
    setErrors({})
    setError('')
    setInjectConflict(conflict)
    setEditing(true)
  }
  function closeDialog() {
    setEditing(false)
    setErrors({})
    setError('')
    setInjectConflict(false)
  }
  function save() {
    const result = validateFeedDraft(title, url)
    if (!result.valid) {
      setErrors(result.errors)
      setError('请修正标记的字段，草稿仍保留。')
      if (result.errors.title) nameInput.current?.focus()
      else urlInput.current?.focus()
      return
    }
    setErrors({})
    if (injectConflict || rows.some((row) => row.endpoint === result.endpoint)) {
      setInjectConflict(false)
      setError('模拟409：地址冲突。本次未写入；可修改后再次保存，不会请求服务端。')
      return
    }
    setHistory((previous) => addFeed(previous, result.title, result.endpoint))
    setTitle('')
    setUrl('')
    setError('')
    setEditing(false)
    notify('已保存到本地状态；未发送网络请求')
  }
  return (
    <ThemeProvider theme={dark ? themes.dark : themes.light}>
      <Box
        component="section"
        className="b07-workshop"
        aria-label="Material UI SDK 实战"
        data-testid="b07-workshop"
        sx={{ bgcolor: 'background.default', color: 'text.primary', p: 2, borderRadius: 2 }}
      >
        <Typography component="h2" variant="h6">
          {level === 'basic'
            ? '局部主题与受控输入'
            : level === 'business'
              ? '订阅筛选、开关与一步撤销'
              : 'Dialog草稿、错误与恢复'}
        </Typography>
        <Typography variant="body2" sx={{ my: 1 }}>
          真实MUI Core + Emotion；订阅数据和409均为本地fixture，没有HTTP、MUI X或外部素材。
        </Typography>
        <FormControlLabel
          control={<Switch checked={dark} onChange={(event) => setDark(event.target.checked)} />}
          label="仅本例深色主题"
        />
        <ThemeProbe />
        {level === 'basic' ? (
          <Card variant="outlined" data-testid="b07-preview">
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  size="small"
                  label="工作区名称"
                  value={workspace}
                  onChange={(event) => setWorkspace(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 60 } }}
                />
                <Chip
                  color={workspace.trim() ? 'success' : 'warning'}
                  label={workspace.trim() ? '工作区已命名' : '请输入名称'}
                />
                <Typography component="output" data-testid="b07-name">
                  输入：{workspace || '（空）'}；有效名称：{workspace.trim() || '（空）'}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: 'wrap', alignItems: 'center' }}
            >
              <TextField
                label="搜索订阅"
                size="small"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                sx={{ flex: '1 1 200px' }}
              />
              {level === 'advanced' && (
                <Button variant="contained" onClick={() => openDialog(false)}>
                  新增订阅
                </Button>
              )}
              <Button
                disabled={!before}
                onClick={() => {
                  setHistory(undoFeed)
                  notify('已撤销上一次修改')
                }}
              >
                撤销
              </Button>
            </Stack>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" aria-label="RSS 订阅状态表">
                <TableHead>
                  <TableRow>
                    <TableCell>订阅</TableCell>
                    <TableCell>地址</TableCell>
                    <TableCell align="right">状态</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id} hover data-testid={`b07-row-${row.id}`}>
                      <TableCell component="th" scope="row">
                        {row.title}
                      </TableCell>
                      <TableCell sx={{ overflowWrap: 'anywhere' }}>{row.endpoint}</TableCell>
                      <TableCell align="right">
                        <FormControlLabel
                          label={row.enabled ? '启用' : '暂停'}
                          control={
                            <Switch
                              size="small"
                              checked={row.enabled}
                              onChange={(event) => toggle(row.id, event.target.checked)}
                              slotProps={{ input: { 'aria-label': `${row.title} 订阅状态` } }}
                            />
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography data-testid="b07-empty">
                          没有匹配订阅；清空搜索可恢复本地数据。
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography role="status" data-testid="b07-count">
              当前匹配 {filtered.length} / {rows.length}；仅一步撤销，关闭通知不改变数据。
            </Typography>
            {level === 'advanced' && (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Button variant="outlined" onClick={() => openDialog(true)}>
                  下一次保存注入409
                </Button>
                <Chip variant="outlined" label="真实UI · 本地模拟业务失败" />
              </Stack>
            )}
            <details>
              <summary>查看本地权威数据</summary>
              <pre data-testid="b07-history">{JSON.stringify(history, null, 2)}</pre>
            </details>
          </Stack>
        )}
        {level === 'advanced' && (
          <Dialog
            open={editing}
            onClose={closeDialog}
            fullWidth
            maxWidth="sm"
            transitionDuration={reduced ? 0 : undefined}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
          >
            <Box
              component="form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                save()
              }}
            >
              <DialogTitle id={titleId}>添加 RSS 订阅</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <DialogContentText id={descriptionId}>
                    草稿与列表分离。取消或Escape保留输入、清除错误和注入标记；仅有效保存写本地状态。
                  </DialogContentText>
                  <TextField
                    label="订阅名称"
                    autoFocus
                    inputRef={nameInput}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    error={Boolean(errors.title)}
                    helperText={errors.title ?? '名称长度1–60；不会发送请求'}
                    slotProps={{ htmlInput: { maxLength: 60 } }}
                  />
                  <TextField
                    label="HTTPS 地址"
                    type="url"
                    inputRef={urlInput}
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    required
                    error={Boolean(errors.url)}
                    helperText={errors.url ?? '例如 https://example.org/feed.xml'}
                  />
                  {injectConflict && (
                    <Alert severity="info" role="status">
                      下一次通过字段校验的保存将模拟一次409；取消不会修改列表。
                    </Alert>
                  )}
                  {error && (
                    <Alert severity="error" role="alert">
                      {error}
                    </Alert>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button type="button" onClick={closeDialog}>
                  取消
                </Button>
                <Button type="submit" variant="contained">
                  保存本地记录
                </Button>
              </DialogActions>
            </Box>
          </Dialog>
        )}
        {notice && (
          <Snackbar
            key={notice.id}
            open
            autoHideDuration={3000}
            onClose={(_event, reason) => {
              if (reason !== 'clickaway') closeNotice(notice.id)
            }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              severity="success"
              variant="filled"
              role="status"
              action={
                <Button color="inherit" size="small" onClick={() => closeNotice(notice.id)}>
                  关闭通知
                </Button>
              }
            >
              {notice.message}
            </Alert>
          </Snackbar>
        )}
      </Box>
    </ThemeProvider>
  )
}
