import {Document,Page,Text,View,StyleSheet} from '@react-pdf/renderer';
import type {FeedRow} from './report-policy.mjs';
export type {FeedRow} from './report-policy.mjs';
export {validatedRows} from './report-policy.mjs';
const css = StyleSheet.create({
 page: {padding:36,fontFamily:'Helvetica',fontSize:11,color:'#243229'},
 title: {fontSize:22,marginBottom:12},
 intro: {fontSize:10,marginBottom:18,color:'#526259'},
 row: {flexDirection:'row',paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#dce2dc'},
 name: {flexGrow:1},
 value: {width:70,textAlign:'right'},
 footer: {position:'absolute',bottom:22,left:36,right:36,fontSize:9,textAlign:'center',color:'#526259'},
});
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
