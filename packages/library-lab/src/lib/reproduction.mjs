import {safeRelativePath} from './catalog.mjs';
const DIRECTORY=/^[A-F]\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const LEVELS=new Set(['basic','business','advanced']);
const hasPackage=(entry,name)=>entry.packages?.some(pkg=>pkg.name===name)??false;
/** Only produce copyable commands for checked-in recipes; never execute in the browser. */
export function reproductionCommand(entry,demo){
 if(!entry||!demo||demo.executionKind!=='node-ci'||typeof entry.directory!=='string'||!DIRECTORY.test(entry.directory)||
  !safeRelativePath(demo.entryPoint)||!/^[a-zA-Z0-9_./-]+$/u.test(demo.entryPoint)||
  !Array.isArray(demo.sourceFiles)||!demo.sourceFiles.includes(demo.entryPoint))return null;
 const relative=`entries/${entry.directory}/${demo.entryPoint}`;
 if(/\.test\.[cm]?js$/u.test(demo.entryPoint))return `node --test ${relative}`;
 if(/\.(?:test|spec)\.tsx?$/u.test(demo.entryPoint)&&hasPackage(entry,'vitest'))return `pnpm exec vitest run ${relative}`;
 if(/\.spec\.tsx?$/u.test(demo.entryPoint)&&hasPackage(entry,'@playwright/test')&&demo.sourceFiles.includes('examples/playwright.config.ts'))
  return `pnpm exec playwright test --config=entries/${entry.directory}/examples/playwright.config.ts ${relative}`;
 if(/^examples\/stories\/[a-zA-Z0-9_.-]+\.stories\.[jt]sx?$/u.test(demo.entryPoint)&&
  hasPackage(entry,'storybook')&&hasPackage(entry,'@storybook/react-vite')&&
  demo.sourceFiles.includes('examples/.storybook/main.ts'))
  return `pnpm exec storybook dev --no-open -p 6029 --config-dir entries/${entry.directory}/examples/.storybook`;
 const knip=demo.entryPoint.match(/^examples\/workspace\/knip\.(basic|business|advanced)\.json$/u);
 if(knip&&hasPackage(entry,'knip')&&demo.sourceFiles.includes('examples/workspace/package.json'))
  return `pnpm exec knip --directory entries/${entry.directory}/examples/workspace --config knip.${knip[1]}.json${knip[1]==='advanced'?' --production':''}`;
 if(/\.[cm]?js$/u.test(demo.entryPoint)&&LEVELS.has(demo.level))return `node ${relative} ${demo.level}`;
 return null;
}
