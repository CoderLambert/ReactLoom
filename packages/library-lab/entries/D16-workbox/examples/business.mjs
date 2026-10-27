import {runWorkshop} from './workshop.mjs';
const result = await runWorkshop('business', {keepOutput: true});
console.log(JSON.stringify(result, null, 2));
console.log('Artifacts stay in the dedicated temporary directory. No SW registration occurred.');
