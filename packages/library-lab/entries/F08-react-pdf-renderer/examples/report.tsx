import {Document,Page,Text,View,StyleSheet} from '@react-pdf/renderer';
import type {FeedRow} from './report-policy.mjs';
export type {FeedRow} from './report-policy.mjs';
export {validatedRows} from './report-policy.mjs';
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
