export interface DocumentHeading { depth:number; title:string; line:number; id:string; }
export function extractDocumentHeadings(markdown:unknown):DocumentHeading[];
export function resolveDocumentUrl(value:unknown,entryId:string,basePath?:string):string;
