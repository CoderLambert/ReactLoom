import {Document,Page,Text,View,StyleSheet} from '@react-pdf/renderer';
export type FeedRow={id:string;name:string;articles:number};
const css=StyleSheet.create({
  page:{fontFamily:'Helvetica',fontSize:10,paddingTop:52,paddingBottom:52,paddingHorizontal:44,color:'#244436'},
  title:{fontSize:22,marginBottom:10,fontFamily:'Helvetica-Bold'},
  intro:{fontSize:10,color:'#5c7165',marginBottom:24},
  row:{flexDirection:'row',borderBottomWidth:.6,borderBottomColor:'#dae6d8',paddingVertical:8},
  name:{width:'75%'},value:{width:'25%',textAlign:'right'},
  footer:{position:'absolute',bottom:24,left:44,right:44,fontSize:8,color:'#607c6c'}
});
export function validatedRows(rows:FeedRow[]):FeedRow[]{
 if(!Array.isArray(rows)||rows.length===0||rows.length>140)throw new Error('Row count must be 1..140');
 const ids=new Set<string>();
 return rows.map(r=>{
  if(!r.id||ids.has(r.id)||r.id.length>48)throw new Error('duplicate or invalid id');ids.add(r.id);
  if(typeof r.name!=='string'||r.name.length>70||!(/^[\x20-\x7e]+$/u.test(r.name)))throw new Error('Standard PDF fonts require ASCII-only names in this fixture');
  if(!Number.isSafeInteger(r.articles)||r.articles<0||r.articles>1e6)throw new Error('invalid article count');
  return {...r};
 });
}
export function ReportDocument({title,rows}:{title:string;rows:FeedRow[]}){
 // Only render with already validated rows; do not fetch external images or fonts here.
 return <Document title={title} author="ReactLoom Library Lab" subject="Offline feed summary">
  <Page size="A4" wrap style={css.page}>
   <Text style={css.title}>{title}</Text>
   <Text style={css.intro}>Offline research dashboard - generated locally</Text>
   <View style={css.row}><Text style={css.name}>Feed</Text><Text style={css.value}>Articles</Text></View>
   {rows.map(row=><View wrap={false} style={css.row} key={row.id}>
    <Text style={css.name}>{row.name}</Text><Text style={css.value}>{row.articles}</Text>
   </View>)}
   <Text style={css.footer} fixed render={({pageNumber,totalPages})=>'ReactLoom lab  -  Page '+pageNumber+' of '+totalPages}/>
  </Page>
 </Document>;
}
