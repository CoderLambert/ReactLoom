import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';

export async function createNote(label: string): Promise<Uint8Array> {
  const book=await PDFDocument.create();
  book.setTitle('ReactLoom '+label);
  const page=book.addPage([595,842]);
  const font=await book.embedFont(StandardFonts.Helvetica);
  page.drawText('ReactLoom Library Lab - '+label.slice(0,60),{x:45,y:780,size:17,font,color:rgb(0.12,0.34,0.25)});
  page.drawText('Generated locally - no network', {x:45,y:745,size:10,font});
  return book.save();
}

export async function combineNotes():Promise<Uint8Array>{
  const target=await PDFDocument.create();
  for(const name of ['Weekly summary','Technical review']){
    const source=await PDFDocument.load(await createNote(name));
    const copied=await target.copyPages(source,source.getPageIndices());
    for(const p of copied)target.addPage(p);
  }
  if(target.getPageCount()!==2)throw new Error('merge must produce exactly two pages');
  return target.save();
}

export async function stampOwnPdf(bytes:Uint8Array):Promise<Uint8Array>{
  if(bytes.byteLength<10||bytes.byteLength>2*1024*1024)throw new Error('PDF must be 10 bytes–2 MiB');
  if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Error('Not a PDF header');
  const book=await PDFDocument.load(bytes,{ignoreEncryption:false});
  const page=book.getPages()[0];if(!page)throw new Error('Document has no pages');
  const font=await book.embedFont(StandardFonts.Helvetica);
  page.drawText('Reviewed locally',{x:48,y:50,size:11,font,color:rgb(0,0.4,0.2)});
  return book.save();
}
