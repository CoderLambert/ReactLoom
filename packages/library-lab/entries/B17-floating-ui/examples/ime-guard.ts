export type EnterContext = {key:string;composing:boolean;nativeComposing:boolean;legacyKeyCode:number;suppressNextEnter:boolean};
export function shouldApplyFilterOnKeyDown(event:EnterContext):boolean {
  return event.key==='Enter' && !event.composing && !event.nativeComposing && event.legacyKeyCode!==229 && !event.suppressNextEnter;
}
