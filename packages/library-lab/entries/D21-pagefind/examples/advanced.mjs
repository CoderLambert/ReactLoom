import * as pagefind from 'pagefind';
import {runWorkshop} from './workshop.mjs';
try {
  const result = await runWorkshop('advanced', {keepOutput: true});
  console.log(JSON.stringify(result, null, 2));
  console.log('Generated Pagefind bundle is on disk; no browser search was started.');
} finally {
  await pagefind.close();
}
