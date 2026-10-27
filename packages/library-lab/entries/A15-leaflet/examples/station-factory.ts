export const MAX_EXTRA_LOCATIONS = 40;
export type OfflineLocation = {id:string;label:string;city:string;center:[number,number];status:'online'};
export function makeLocalLocation(sequence:number):OfflineLocation {
  if(!Number.isSafeInteger(sequence)||sequence<1||sequence>MAX_EXTRA_LOCATIONS)throw new RangeError('sequence out of range');
  return {id:`site-${sequence}`,label:`备用源 ${sequence+3}`,city:'Chicago',center:[41.8781+sequence*.1,-87.6298],status:'online'};
}
