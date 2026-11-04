export const MAX_EXTRA_LOCATIONS = 40;
export type OfflineLocation = {id:string;label:string;city:string;center:[number,number];status:'online'};
/** Limit the number of live demo locations, not the lifetime allocation counter. */
export function canAddLocalLocation(items: readonly {id:string}[]): boolean {
  return items.filter(item => /^site-[1-9]\d*$/u.test(item.id)).length < MAX_EXTRA_LOCATIONS;
}
export function makeLocalLocation(sequence:number):OfflineLocation {
  if(!Number.isSafeInteger(sequence)||sequence<1)throw new RangeError('sequence must be a positive safe integer');
  const slot = ((sequence - 1) % MAX_EXTRA_LOCATIONS) + 1;
  return {id:`site-${sequence}`,label:`备用源 ${sequence}`,city:'Chicago',center:[41.8781+slot*.1,-87.6298],status:'online'};
}
