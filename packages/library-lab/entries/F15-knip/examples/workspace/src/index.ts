import {formatJob} from './tasks'
export const report = formatJob({id:1,title:'Feed sync'})
// export publicly on purpose; advanced config checks entry exports.
export const unusedPublic = () => 'possibly public to downstream users'
if(import.meta.url===`file://${process.argv[1]}`) console.log(report)
