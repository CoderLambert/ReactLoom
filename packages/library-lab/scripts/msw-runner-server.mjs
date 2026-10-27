import {SESSION_ID} from '../src/lib/frame-session.mjs';
import {inspectScopedMswWorker} from './verify-msw-worker.mjs';
export function createWorkerMiddleware(bytes){
 inspectScopedMswWorker(bytes);
 return (request,response,next)=>{
  const pathname=new URL(request.url,'http://127.0.0.1:4320').pathname;
  const match=pathname.match(/^\/lab-runners\/msw\/sessions\/([^/]+)\/mockServiceWorker\.js$/u);
  if(!match){
   if(pathname.endsWith('/mockServiceWorker.js')){response.statusCode=404;response.end('Unknown worker scope');return;}
   next();return;
  }
  if(!SESSION_ID.test(match[1])){response.statusCode=400;response.end('Invalid session');return;}
  if(!['GET','HEAD'].includes(request.method)){response.statusCode=405;response.end();return;}
  response.setHeader('Content-Type','text/javascript; charset=utf-8');
  response.setHeader('Content-Length',String(bytes.length));
  response.setHeader('Cache-Control','no-store');
  response.setHeader('X-Content-Type-Options','nosniff');
  response.setHeader('Service-Worker-Allowed',`/lab-runners/msw/sessions/${match[1]}/`);
  response.statusCode=200;response.end(request.method==='HEAD'?undefined:bytes);
 };
}
