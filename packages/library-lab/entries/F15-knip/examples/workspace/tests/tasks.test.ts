// Fixture only: illustrates why tests are included in a full project scan.
import {formatJob} from '../src/tasks'
if(formatJob({id:3,title:'Example'})!=='#3 Example') throw new Error('fixture assertion')
