import {useCallback, useEffect, useRef, useState} from 'react';
import {JsonForms} from '@jsonforms/react';
import {vanillaRenderers, vanillaCells} from '@jsonforms/vanilla-renderers';
import type {ErrorObject} from 'ajv';

// 入门 / RSS 订阅设置 / 409、取消与防旧响应覆盖，共用同一真实 SDK。
type Level = 'basic' | 'business' | 'advanced';
type Subscription = {name: string; feedType: 'rss' | 'manual'; url: string; enabled: boolean};
const initial: Subscription = {name:'Frontend Weekly',feedType:'rss',url:'https://example.org/feed.xml',enabled:true};
export const subscriptionSchema = {
  type:'object', additionalProperties:false,
  required:['name','feedType'],
  properties:{
    name:{type:'string',minLength:2,maxLength:60,title:'订阅名称'},
    feedType:{type:'string',enum:['rss','manual'],title:'订阅类型'},
    url:{type:'string',minLength:8,maxLength:200,title:'RSS 地址'},
    enabled:{type:'boolean',title:'启用订阅'}
  },
  if:{properties:{feedType:{const:'rss'}},required:['feedType']},
  then:{required:['url']}
};
const uiSchema = {
  type:'VerticalLayout',
  elements:[
    {type:'Control',scope:'#/properties/name'},
    {type:'Control',scope:'#/properties/feedType'},
    {type:'Control',scope:'#/properties/url',rule:{effect:'HIDE',condition:{scope:'#/properties/feedType',schema:{const:'manual'}}}},
    {type:'Control',scope:'#/properties/enabled'}
  ]
};
const basicSchema = {
  type:'object',additionalProperties:false,required:['name'],
  properties:{name:{type:'string',minLength:2,title:'工作区名称'},enabled:{type:'boolean',title:'启用'}}
};
const basicUi = {type:'VerticalLayout',elements:[
  {type:'Control',scope:'#/properties/name'},
  {type:'Control',scope:'#/properties/enabled'}
]};

export function toSubscriptionPayload(data: Subscription) {
  // UI 隐藏不等于数据删除。手动渠道绝不能将旧 url 继续送到服务器。
  return data.feedType==='rss'
    ? {name:data.name.trim(),feedType:'rss',url:data.url.trim(),enabled:data.enabled}
    : {name:data.name.trim(),feedType:'manual',enabled:data.enabled};
}
function abortableDelay(ms:number,signal:AbortSignal) {
  return new Promise<void>((resolve,reject)=>{
    if(signal.aborted){reject(new DOMException('Aborted','AbortError'));return;}
    const onAbort=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};
    const timer=window.setTimeout(()=>{signal.removeEventListener('abort',onAbort);resolve();},ms);
    signal.addEventListener('abort',onAbort,{once:true});
  });
}
export default function JsonFormsExample({level}:{level:Level}) {
  const [data,setData]=useState<Subscription>({...initial});
  const [errors,setErrors]=useState(0);
  const [serverErrors,setServerErrors]=useState<ErrorObject[]>([]);
  const [status,setStatus]=useState('可修改表单并观察 Schema 校验');
  const [saving,setSaving]=useState(false);
  const request=useRef<AbortController|null>(null);
  const generation=useRef(0);
  const [basic,setBasic]=useState({name:'Library Lab',enabled:true});
  useEffect(()=>()=>{generation.current++;request.current?.abort();},[]);
  const onDataChange=useCallback(({data:nextData,errors:validation}: {data:Subscription;errors:ErrorObject[]})=>{
    if(!nextData)return;
    setData(old=>JSON.stringify(old)===JSON.stringify(nextData)?old:nextData);
    setErrors(validation?.length??0);
    setServerErrors([]);
  },[]);
  async function submit() {
    generation.current++;const id=generation.current;
    request.current?.abort();const controller=new AbortController();request.current=controller;
    setSaving(true);setServerErrors([]);setStatus('正在保存到内存模拟服务…');
    try{
      await abortableDelay(level==='advanced'?500:160,controller.signal);
      if(id!==generation.current)return;
      const payload=toSubscriptionPayload(data);
      if(payload.name.toLowerCase()==='duplicate'){
        const serverError:ErrorObject={instancePath:'/name',schemaPath:'#/server/uniqueName',keyword:'errorMessage',params:{},message:'该订阅名已存在（模拟 HTTP 409）'};
        setServerErrors([serverError]);setStatus('HTTP 409：服务端字段错误已回填');return;
      }
      if(payload.feedType==='rss'&&!/^https:\/\//i.test(payload.url)){
        setStatus('HTTP 422：演示服务端策略仅接受 HTTPS RSS');return;
      }
      setStatus('保存成功：仅内存模拟响应，未发起真实网络请求。');
    }catch(error){
      if(id===generation.current)setStatus(controller.signal.aborted?'请求已取消':'保存失败：'+String(error));
    }finally{if(id===generation.current){setSaving(false);request.current=null;}}
  }
  if(level==='basic')return <section aria-label="JSON Forms 入门">
    <h2>Schema 驱动表单</h2>
    <JsonForms schema={basicSchema} uischema={basicUi} data={basic} renderers={vanillaRenderers} cells={vanillaCells}
      onChange={({data:next,errors:issues})=>{setBasic(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);setErrors(issues?.length??0);}}/>
    <p role="status">客户端 Schema 错误数：{errors}</p>
    <pre>{JSON.stringify(basic,null,2)}</pre>
  </section>;
  return <section aria-label="JSON Forms 订阅配置">
    <h2>{level==='business'?'RSS 订阅配置':'服务器错误、竞态和取消'}</h2>
    <p>切换 manual 后地址输入会隐藏；提交时由明确的 payload 策略删除 url，隐藏 UI 本身不会清空数据。</p>
    <JsonForms schema={subscriptionSchema} uischema={uiSchema} data={data}
      renderers={vanillaRenderers} cells={vanillaCells} additionalErrors={serverErrors}
      validationMode="ValidateAndShow" onChange={onDataChange}/>
    <p>Schema 错误：{errors} · 服务端错误：{serverErrors.length}</p>
    <div className="demo-controls">
      <button type="button" disabled={saving||errors>0} onClick={()=>void submit()}>保存内存草稿</button>
      <button type="button" disabled={!saving} onClick={()=>{generation.current++;request.current?.abort();request.current=null;setSaving(false);setStatus('已取消，旧结果不会回写');}}>取消进行中的操作</button>
      <button type="button" onClick={()=>{generation.current++;request.current?.abort();setSaving(false);setData({...initial});setErrors(0);setServerErrors([]);setStatus('已重置当前示例');}}>重置</button>
    </div>
    <p role="status">{status}</p><details><summary>查看最终 payload</summary><pre>{JSON.stringify(toSubscriptionPayload(data),null,2)}</pre></details>
    {level==='advanced'&&<p>将名称改为 duplicate 触发模拟 409；保存期间取消或重置，验证旧请求没有资格更新界面。生产环境必须由服务器重新校验和鉴权。</p>}
  </section>;
}
