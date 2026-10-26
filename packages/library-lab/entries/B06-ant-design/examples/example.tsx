import { useMemo, useRef, useState } from 'react';
import { App as AntApp, Alert, Button, Card, ConfigProvider, Form, Input, Modal, Select, Space, Switch, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

type Level='basic'|'business'|'advanced';
type Feed={id:string;title:string;url:string;category:'tech'|'news';enabled:boolean};
type Values={title:string;url:string;category:'tech'|'news'};
const START:Feed[]=[
  {id:'feed-1',title:'工程实践',url:'https://example.com/engineering.xml',category:'tech',enabled:true},
  {id:'feed-2',title:'每日新闻',url:'https://example.com/daily.xml',category:'news',enabled:false},
];
function Workspace({level}:{level:Level}) {
  const [form]=Form.useForm<Values>();
  const {message}=AntApp.useApp();
  const sequence=useRef(START.length);
  const [rows,setRows]=useState<Feed[]>(START);
  const [query,setQuery]=useState('');
  const [draft,setDraft]=useState('');
  const [failOnce,setFailOnce]=useState(false);
  const [editing,setEditing]=useState<Feed|null>(null);
  const [history,setHistory]=useState<Feed[]|null>(null);
  const [project,setProject]=useState('ReactLoom');
  const [confirmed,setConfirmed]=useState(false);
  const filtered=useMemo(()=>rows.filter(r=>[r.title,r.url,r.category].join(' ').toLowerCase().includes(query.toLowerCase())),[rows,query]);
  function addFeed(values:Values) {
    const normalized=values.url.trim();
    if(failOnce && level==='advanced'){
      setFailOnce(false);
      form.setFields([{name:'url',errors:['模拟 HTTP 409：订阅地址已被其他成员占用']}]);
      message.error('模拟服务端冲突：请检查地址');
      return;
    }
    if(rows.some(r=>r.url===normalized)){
      form.setFields([{name:'url',errors:['该 RSS 地址已经存在']}]);
      return;
    }
    setHistory(rows);
    sequence.current+=1;
    setRows(old=>[{id:`feed-${sequence.current}`,title:values.title.trim(),url:normalized,category:values.category,enabled:true},...old]);
    form.resetFields();
    message.success('本地新增成功；未发出外部请求');
  }
  const columns:TableColumnsType<Feed>=[
    {title:'订阅标题',dataIndex:'title',key:'title',sorter:(a,b)=>a.title.localeCompare(b.title,'zh-CN')},
    {title:'分类',dataIndex:'category',key:'category',render:(value:Feed['category'])=><Tag>{value==='tech'?'技术':'资讯'}</Tag>},
    {title:'启用',key:'enabled',render:(_unknown,record)=><Switch checked={record.enabled} aria-label={`${record.title} 启用`} onChange={enabled=>{setHistory(rows);setRows(old=>old.map(r=>r.id===record.id?{...r,enabled}:r));}}/>},
    {title:'操作',key:'actions',render:(_unknown,record)=><Button size="small" onClick={()=>setEditing(record)} aria-label={`查看 ${record.title}`}>详情</Button>},
  ];
  if(level==='basic')return <Card title="基本组件与主题" variant="outlined">
    <Space direction="vertical" size="middle" style={{width:'100%'}}>
      <Typography.Paragraph>ConfigProvider主题对当前示例生效，文本和操作均有原生语义。</Typography.Paragraph>
      <Input aria-label="项目名称" maxLength={50} value={project} onChange={e=>{setProject(e.target.value);setConfirmed(false);}}/>
      <Button type="primary" disabled={!project.trim()} onClick={()=>setConfirmed(true)}>确认项目</Button>
      {confirmed&&<Alert type="success" showIcon title={`已确认：${project.trim()}`}/>}
    </Space>
  </Card>;
  return <Card title={level==='business'?'RSS订阅管理':'服务器校验错误与恢复'} variant="outlined">
    <Space direction="vertical" size="middle" style={{width:'100%'}}>
      <Typography.Paragraph>表单状态归 Form，业务列表归React状态；本地fixture演示响应逻辑，并非真实HTTP后端。</Typography.Paragraph>
      <Form form={form} layout="vertical" initialValues={{title:'',url:'',category:'tech'}} onFinish={addFeed}>
        <Form.Item label="订阅名称" name="title" rules={[{required:true,message:'请输入名称'},{max:50,message:'最多50字符'}]}>
          <Input placeholder="示例：浏览器工程" autoComplete="off"/>
        </Form.Item>
        <Form.Item label="RSS HTTPS 地址" name="url" rules={[{required:true,message:'请输入地址'},{type:'url',message:'请输入合法URL'},{validator:async(_,value:string)=>{
          if(value && !value.startsWith('https://'))throw new Error('本示例只允许HTTPS');
        }}]}>
          <Input placeholder="https://example.com/feed.xml" autoComplete="off"/>
        </Form.Item>
        <Form.Item label="分类" name="category"><Select options={[{label:'技术',value:'tech'},{label:'资讯',value:'news'}]}/></Form.Item>
        <Space wrap>
          <Button htmlType="submit" type="primary">新增本地订阅</Button>
          {level==='advanced'&&<Button onClick={()=>setFailOnce(true)}>下一次提交注入 409</Button>}
          <Button disabled={!history} onClick={()=>{if(history){setRows(history);setHistory(null);message.info('撤销上一项列表修改');}}}>撤销修改</Button>
        </Space>
      </Form>
      <Input.Search aria-label="查找RSS" value={draft} onChange={e=>setDraft(e.target.value)}
        onSearch={value=>setQuery(value.trim())} placeholder="输入中文关键词后点击搜索（IME安全）" enterButton="搜索"/>
      <Table<Feed> rowKey="id" columns={columns} dataSource={filtered} pagination={{pageSize:4,hideOnSinglePage:true}} size="small" scroll={{x:570}}/>
      <p role="status">本地记录 {rows.length} · 当前匹配 {filtered.length}。修改即更新列表，不访问真实订阅API。</p>
      <Modal title="订阅详情" open={Boolean(editing)} onCancel={()=>setEditing(null)} onOk={()=>setEditing(null)} okText="关闭" cancelButtonProps={{style:{display:'none'}}}>
        {editing&&<><p>名称：{editing.title}</p><p>地址：{editing.url}</p><p>分类：{editing.category}</p></>}
      </Modal>
    </Space>
  </Card>;
}
export default function AntDesignExample({level}:{level:Level}){
  return <ConfigProvider theme={{token:{colorPrimary:'#21654f',borderRadius:8}}}
    getPopupContainer={node=>node?.parentElement??document.body}>
    <AntApp><Workspace level={level}/></AntApp>
  </ConfigProvider>;
}
