import * as Comlink from 'comlink';
const api={
 async summarize(values:string[]){
  const frequency:Record<string,number>={};
  for(const value of values)frequency[value]=(frequency[value]??0)+1;
  return {count:values.length,frequency};
 },
 async sumBytes(values:Uint8Array){return values.reduce((sum,value)=>sum+value,0);},
 async progress(total:number,report:(done:number)=>void){
  for(let index=1;index<=total;index++){
   await new Promise(resolve=>setTimeout(resolve,45));
   report(index);
  }
  return total;
 },
};
Comlink.expose(api);
export type WorkerAPI=typeof api;
