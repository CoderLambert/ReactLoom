import {safeRelativePath} from './catalog.mjs';
const DIRECTORY=/^[A-F]\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const LEVELS=new Set(['basic','business','advanced']);
/** Only produce copyable commands for checked-in recipes; never execute in the browser. */
export function reproductionCommand(entry,demo){
 if(!entry||!demo||demo.executionKind!=='node-ci'||typeof entry.directory!=='string'||!DIRECTORY.test(entry.directory)||
  !safeRelativePath(demo.entryPoint)||!/^[a-zA-Z0-9_./-]+$/u.test(demo.entryPoint)||
  !Array.isArray(demo.sourceFiles)||!demo.sourceFiles.includes(demo.entryPoint))return null;
 const relative=`entries/${entry.directory}/${demo.entryPoint}`;
 if(/\.test\.[cm]?js$/u.test(demo.entryPoint))return `node --test ${relative}`;
 if(/\.(?:test|spec)\.tsx?$/u.test(demo.entryPoint)&&entry.packages?.some(p=>p.name==='vitest'))return `pnpm exec vitest run ${relative}`;
 if(/\.spec\.tsx?$/u.test(demo.entryPoint)&&entry.packages?.some(p=>p.name==='@playwright/test')&&demo.sourceFiles.includes('examples/playwright.config.ts'))
  return `pnpm exec playwright test --config=entries/${entry.directory}/examples/playwright.config.ts ${relative}`;
 if(/\.[cm]?js$/u.test(demo.entryPoint)&&LEVELS.has(demo.level))return `node ${relative} ${demo.level}`;
 return null;
}
