import {useMemo, useState} from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, createTheme, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControlLabel, Paper, Snackbar, Stack,
  Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, ThemeProvider, Typography,
} from '@mui/material';
import {addFeed, initialFeedHistory, toggleFeed, undoFeed} from './feed-history';

type Level = 'basic' | 'business' | 'advanced';
const theme = createTheme({palette: {primary: {main: '#2b674e'}, secondary: {main: '#987a45'}}, shape: {borderRadius: 10}});

export default function MaterialUIExample({level}: {level: Level}) {
  const [workspace, setWorkspace] = useState('ReactLoom');
  const [query, setQuery] = useState('');
  const [feedHistory, setFeedHistory] = useState(initialFeedHistory);
  const {rows, before} = feedHistory;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [injectConflict, setInjectConflict] = useState(false);
  const [notice, setNotice] = useState('');
  const filtered = useMemo(() => rows.filter(row =>
    (row.title + ' ' + row.endpoint).toLocaleLowerCase().includes(query.toLocaleLowerCase())), [rows, query]);

  function toggle(id: string, enabled: boolean) {
    setFeedHistory(previous => toggleFeed(previous, id, enabled));
    setNotice('本地启用状态已更新');
  }
  function save() {
    const label = title.trim();
    let normalized = '';
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'https:') throw new Error('HTTPS required');
      normalized = parsed.href;
    } catch {
      setError('请输入完整 HTTPS 订阅地址');
      return;
    }
    if (!label || label.length > 60) {
      setError('名称必须为 1–60 个字符');
      return;
    }
    if (injectConflict || rows.some(row => row.endpoint === normalized)) {
      setInjectConflict(false);
      setError('模拟 HTTP 409：地址已存在，请更换（不会真实请求服务端）');
      return;
    }
    setFeedHistory(previous => addFeed(previous, label, normalized));
    setEditing(false);
    setTitle('');
    setUrl('');
    setError('');
    setNotice('已保存到本地状态；未发送网络请求');
  }

  return <ThemeProvider theme={theme}><Box component="section" aria-label="Material UI SDK 实战">
    <Typography variant="h6" component="h2" sx={{mb: 1}}>
      {level === 'basic' ? 'ThemeProvider / TextField / Chip' :
        level === 'business' ? 'RSS 订阅筛选与状态' : 'Dialog / 校验回填 / 撤销'}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
      所有输入和弹窗均来自真实 @mui/material 组件，业务数据为纯本地 fixture。
    </Typography>
    {level === 'basic' ? <Card variant="outlined"><CardContent>
      <Stack spacing={2}>
        <TextField size="small" label="工作区名称" value={workspace}
          onChange={event => setWorkspace(event.target.value)} inputProps={{maxLength: 60}}/>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip color={workspace.trim() ? 'success' : 'warning'}
            label={workspace.trim() ? '工作区已命名' : '请输入名称'}/>
          <Typography component="output" variant="body2">{workspace || '（空）'}</Typography>
        </Stack>
      </Stack>
    </CardContent></Card> : <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <TextField label="搜索订阅" size="small" value={query}
          onChange={event => setQuery(event.target.value)} sx={{flex: '1 1 200px'}}/>
        {level === 'advanced' && <Button variant="contained" onClick={() => {setEditing(true); setError('');}}>新增订阅</Button>}
        <Button disabled={!before} onClick={() => {if(before){setFeedHistory(undoFeed);setNotice('已撤销上一次修改');}}}>撤销</Button>
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label="RSS 订阅状态表">
          <TableHead><TableRow><TableCell>订阅</TableCell><TableCell>地址</TableCell><TableCell align="right">状态</TableCell></TableRow></TableHead>
          <TableBody>{filtered.map(row => <TableRow key={row.id} hover>
            <TableCell component="th" scope="row">{row.title}</TableCell>
            <TableCell sx={{overflowWrap: 'anywhere'}}>{row.endpoint}</TableCell>
            <TableCell align="right"><FormControlLabel label={row.enabled ? '启用' : '暂停'}
              control={<Switch size="small" checked={row.enabled}
                onChange={event => toggle(row.id, event.target.checked)}
                inputProps={{'aria-label': row.title + ' 订阅状态'}}/>}/></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </TableContainer>
      <Typography role="status" variant="body2">当前匹配 {filtered.length} / {rows.length}，状态仅存在本示例组件。</Typography>
      {level === 'advanced' && <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={() => {setInjectConflict(true);setEditing(true);setError('');}}>下一次保存注入 409</Button>
        <Chip variant="outlined" color="info" label="真实 UI · 模拟业务失败"/>
      </Stack>}
    </Stack>}
    <Dialog open={editing} onClose={() => setEditing(false)}
      fullWidth maxWidth="sm" aria-labelledby="mui-lab-dialog-title">
      <DialogTitle id="mui-lab-dialog-title">添加 RSS 订阅</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{pt: 1}}>
          <TextField label="订阅名称" autoFocus value={title} onChange={e => setTitle(e.target.value)} required/>
          <TextField label="HTTPS 地址" type="url" value={url} onChange={e => setUrl(e.target.value)} required/>
          {error && <Alert severity="error" role="alert">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={() => {setEditing(false);setError('');}}>取消</Button>
        <Button variant="contained" onClick={save}>保存本地记录</Button>
      </DialogActions>
    </Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={3000} onClose={() => setNotice('')}
      anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
      <Alert severity="success" variant="filled" onClose={() => setNotice('')}>{notice}</Alert>
    </Snackbar>
  </Box></ThemeProvider>;
