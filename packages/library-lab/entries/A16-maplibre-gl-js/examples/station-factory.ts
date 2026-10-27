export const MAX_EXTRA_STATIONS = 40;
export type LocalStation = {id:string;label:string;longitude:number;latitude:number;healthy:boolean};
export function makeLocalStation(sequence:number):LocalStation {
  if(!Number.isSafeInteger(sequence)||sequence<1||sequence>MAX_EXTRA_STATIONS)throw new RangeError('sequence out of range');
  return {id:`local-${sequence}`,label:`本地站点 ${sequence}`,longitude:115+sequence*.12,latitude:38.4,healthy:true};
}
