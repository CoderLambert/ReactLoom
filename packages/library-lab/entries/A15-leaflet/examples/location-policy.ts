export type LocationRecord={id:string;status:'online'|'paused';center:readonly [number,number]};
export function selectedVisibleId<T extends LocationRecord>(items:readonly T[],onlyOnline:boolean,preferredId:string):string {
  const visible=items.filter(item=>!onlyOnline||item.status==='online');
  return visible.some(item=>item.id===preferredId)?preferredId:(visible[0]?.id??'');
}
/** Leaflet accepts [latitude,longitude]; clamp demo updates to finite world coordinates. */
export function shiftLocation<T extends LocationRecord>(items:readonly T[],id:string,amount:number):T[] {
  if(!Number.isFinite(amount)||!Number.isFinite(items.find(x=>x.id===id)?.center[0]))return [...items];
  return items.map(item=>{
    if(item.id!==id)return item;
    const lat=Math.min(85,Math.max(-85,item.center[0]+amount));
    const lng=Math.min(180,Math.max(-180,item.center[1]+amount));
    return {...item,center:[lat,lng] as [number,number]};
  });
}
