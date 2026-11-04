import {useEffect,useRef,useState} from 'react';
import Dexie from 'dexie';
import {sameFeedSnapshot} from './rollback-policy.mjs';

type Props={level:'basic'|'business'|'advanced'};
type Feed={id:string;group:string;updatedAt:number;read:boolean};
const seed:Feed[]=[
 {id:'rss-a',group:'技术',updatedAt:100,read:false},
 {id:'rss-b',group:'技术',updatedAt:200,read:true},
 {id:'rss-c',group:'商业',updatedAt:300,read:false},
];
const oldSchema='&id,group,updatedAt';
const newSchema='&id,group,updatedAt,[group+updatedAt]';
function configure(name:string,upgrade=false){
 const db=new Dexie(name);
 db.version(1).stores({feeds:oldSchema});
 if(upgrade) db.version(2).stores({feeds:newSchema}).upgrade(tx=>
   tx.table('feeds').toCollection().modify(item=>{if(item.read===undefined)item.read=false;})
 );
 return db;
}
export default function DexieWorkshop({level}:Props){
 const [status,setStatus]=useState('未执行');
 const [output,setOutput]=useState('');
 const [busy,setBusy]=useState(false);
 const epoch=useRef(0);
 const opened=useRef<Dexie|null>(null);
 const names=useRef(new Set<string>());
 const activeLevel=useRef(level);
 useEffect(()=>()=>{
  epoch.current++;
  opened.current?.close();
  // Best effort on unmount; each running session also closes and deletes its own database.
  for(const name of names.current)void Dexie.delete(name).catch(()=>{});
 },[]);
 useEffect(()=>{
  if(activeLevel.current===level)return;
  activeLevel.current=level;
  epoch.current++;
  opened.current?.close();
  opened.current=null;
  setBusy(false);
  setOutput('');
  setStatus('场景已切换；旧数据库连接被关闭，旧结果不会回写');
 },[level]);
 async function execute(){
  if(typeof indexedDB==='undefined'){setStatus('浏览器未提供IndexedDB');return;}
  const token=++epoch.current;
  setBusy(true);setStatus('正在使用真实 IndexedDB');
  const name='reactloom-lab-d15-'+crypto.randomUUID();
  names.current.add(name);
  let db=configure(name);
  opened.current=db;
  try{
    await db.open();
    const table=db.table<Feed,string>('feeds');
    await table.bulkPut(seed);
    if(level==='basic'){
      const feeds=await table.where('group').equals('技术').sortBy('updatedAt');
      if(token===epoch.current)setOutput(JSON.stringify({group:'技术',feeds},null,2));
    } else if(level==='business'){
      const before=await table.toArray();
      let rollback='未触发';
      try{
       await db.transaction('rw',table,async()=>{
         await table.put({id:'rss-d',group:'技术',updatedAt:400,read:false});
         // Duplicate primary key via add causes the entire transaction to reject.
         await table.add({id:'rss-a',group:'技术',updatedAt:500,read:true});
       });
      }catch(error){rollback=error instanceof Error?error.name:String(error);}
      const after=await table.toArray();
      if(token===epoch.current)setOutput(JSON.stringify({before:before.length,after:after.length,rollback,unchanged:sameFeedSnapshot(before,after),feeds:after},null,2));
    } else {
      // A real v1 record without `read` proves that the v2 upgrade fills missing fields.
      await db.table('feeds').put({id:'rss-legacy',group:'技术',updatedAt:250});
      db.close();
      db=configure(name,true);
      opened.current=db;
      await db.open();
      const upgraded=db.table<Feed,string>('feeds');
      const items=await upgraded.where('[group+updatedAt]').between(['技术',0],['技术',Number.MAX_SAFE_INTEGER]).toArray();
      if(token===epoch.current)setOutput(JSON.stringify({dbVersion:db.verno,index:'[group+updatedAt]',migratedLegacyRead:items.some(row=>row.id==='rss-legacy'&&row.read===false),items},null,2));
    }
    if(token===epoch.current)setStatus('查询已完成；示例库将被删除，不会保存任何真实用户数据');
  }catch(error){
    if(token===epoch.current)setStatus('FAILED: '+String(error));
  }finally{
    db.close();
    if(opened.current===db)opened.current=null;
    // Delete only this demo's database, never enumerate or delete other origin storage.
    let cleanupError:unknown=null;
    try{await Dexie.delete(name);names.current.delete(name);}
    catch(error){cleanupError=error; /* keep the name for unmount retry */}
    if(token===epoch.current){
      setBusy(false);
      if(cleanupError)setStatus('临时数据库清理失败，请检查本站存储：'+String(cleanupError));
    }
  }
 }
 return <section aria-label="Dexie真实IndexedDB示例">
  <h2>{level==='basic'?'建立索引并读取RSS':level==='business'?'事务回滚与唯一主键':'v1→v2 Schema 升级与复合索引'}</h2>
  <p>独立临时数据库、固定 fixture。所有示例执行结束删除本示例的数据库，不访问其他站点数据。</p>
  <button type="button" disabled={busy} onClick={()=>void execute()}>执行 IndexedDB 场景</button>
  <p role="status">{status}</p><output className="demo-output" data-testid="dexie-output">{output||'尚无查询结果'}</output>
  {level==='advanced'&&<p>升级演示在同一个数据库上先存 v1，再关闭旧连接并以 v2 打开；旧 Schema 声明仍需保留。</p>}
 </section>;
}
