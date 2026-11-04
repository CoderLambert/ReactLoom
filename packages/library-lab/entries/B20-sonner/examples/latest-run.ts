/** A run identity guard; invalidation is not cancellation of external SDK work. */
export class LatestRunGuard {
  private generation = 0;
  start():number {return ++this.generation;}
  invalidate():void {this.generation++;}
  isCurrent(token:number):boolean {return token===this.generation;}
}
