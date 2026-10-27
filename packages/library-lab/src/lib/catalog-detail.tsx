import {useEffect,useState} from 'react';
import type {CatalogEntry,Entry} from './types';
import {validateCatalogDetail} from './catalog-index.mjs';
import {readLimitedJsonResponse,JSON_RESPONSE_LIMITS} from './bounded-json.mjs';
import {requestGeneratedResource} from './resource-fetch.mjs';

type DetailState = {key:string; entry?:Entry; error?:string};

/** Only the selected library needs package manifests, demo paths and evidence. */
export function useCatalogDetail(summary?:CatalogEntry) {
  const [state,setState]=useState<DetailState>({key:''});
  const [attempt,setAttempt]=useState(0);
  const entryId=summary?.entryId??'';
  const slug=summary?.slug??'';
  const fingerprint=summary?.sourceFingerprint??'';
  const key=entryId+':'+slug+':'+fingerprint;
  useEffect(()=>{
    if(!summary)return;
    const controller=new AbortController();
    setState({key});
    requestGeneratedResource(import.meta.env.BASE_URL+'raw/'+entryId+'/detail.json',
      response=>readLimitedJsonResponse(response,JSON_RESPONSE_LIMITS.catalogDetail),{signal:controller.signal})
      .then((payload:unknown)=>{
        const entry=validateCatalogDetail(payload,summary);
        if(!controller.signal.aborted)setState({key,entry});
      })
      .catch(cause=>{
        if(!controller.signal.aborted)setState({key,error:String(cause)});
      });
    return()=>controller.abort();
  },[summary,key,entryId,attempt]);
  const current=state.key===key?state:undefined;
  return {
    entry:current?.entry,
    error:current?.error,
    loading:!!summary&&!current?.entry&&!current?.error,
    retry:()=>setAttempt(value=>value+1),
  };
}
