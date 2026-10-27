import {readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
const entryPattern = /^[A-F]\d{2}$/u;
const groupPattern = /^[A-F]$/u;
const sdkSuitePath = /^entries\/([A-F]\d{2})-[a-z0-9-]+\/tests\/(?:sdk|node-scenarios)\.test\.mjs$/u;

/** Only explicitly named real-SDK suites count toward SDK test selection. */
export function isSdkSuiteName(name) {
  return name === 'sdk.test.mjs' || name === 'node-scenarios.test.mjs';
}

/** Find real, checked-in Node SDK suites in deterministic order. */
export async function discoverSdkTests(projectRoot = root) {
  const files = ['tests/sdk.test.mjs'];
  const entries = path.join(projectRoot, 'entries');
  for (const dir of (await readdir(entries, {withFileTypes: true}))
    .filter(item => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const directory = path.join(entries, dir.name, 'tests');
    let tests;
    try { tests = await readdir(directory, {withFileTypes: true}); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    for (const testFile of tests.filter(item => item.isFile() && isSdkSuiteName(item.name))
      .sort((a, b) => a.name.localeCompare(b.name))) {
      files.push('entries/' + dir.name + '/tests/' + testFile.name);
    }
  }
  return files;
}

/** Select isolated SDK entry suites; a missing target must never look like PASS. */
export function selectSdkTests(files, {entries = null, group = null} = {}) {
  if (entries !== null && group !== null) throw new Error('--entries and --group are mutually exclusive');
  if (entries !== null && (!Array.isArray(entries) || !entries.length ||
      entries.some(id => !entryPattern.test(id)))) throw new Error('Invalid --entries (expected A01,B17)');
  if (group !== null && !groupPattern.test(group)) throw new Error('Invalid --group (expected A-F)');
  // Even externally supplied file lists must not promote pure policy fixtures to SDK status.
  const approved = files.filter(file => file === 'tests/sdk.test.mjs' || sdkSuitePath.test(file));
  if (entries === null && group === null) return approved;
  const matches = approved.filter(file => {
    const match = sdkSuitePath.exec(file);
    return !!match && (entries !== null ? entries.includes(match[1]) : match[1][0] === group);
  });
  if (entries !== null) {
    const found = new Set(matches.map(file => file.slice(8, 11)));
    const missing = entries.filter(id => !found.has(id));
    if (missing.length) throw new Error('No SDK test suite for: ' + missing.join(', ') + '. Not claiming PASS.');
  }
  if (!matches.length) throw new Error('No matching SDK test suites. Not claiming PASS.');
  return matches;
}

/** Parse only explicit bounded selectors: avoid passing arbitrary paths to Node --test. */
export function parseSdkArguments(args = []) {
  const selected = new Set();
  let group = null;
  let list = false;
  for (const arg of args) {
    if (arg === '--list') {list = true; continue;}
    if (arg.startsWith('--entry=') || arg.startsWith('--entries=')) {
      const value = arg.split('=').slice(1).join('=');
      const ids = value.split(',');
      if (ids.some(id => !entryPattern.test(id))) throw new Error('Invalid SDK entry selector: ' + arg);
      for (const id of ids) selected.add(id);
      continue;
    }
    if (arg.startsWith('--group=')) {
      const value = arg.slice('--group='.length);
      if (!groupPattern.test(value) || group !== null) throw new Error('Invalid SDK group selector: ' + arg);
      group = value;
      continue;
    }
    throw new Error('Unknown SDK runner option: ' + arg);
  }
  if (group !== null && selected.size) throw new Error('--entries and --group are mutually exclusive');
  return {entries: selected.size ? [...selected].sort() : null, group, list};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const selector = parseSdkArguments(process.argv.slice(2));
  const files = selectSdkTests(await discoverSdkTests(), selector);
  console.log('Real SDK suites selected: ' + files.length + ' file(s)');
  if (selector.list) {
    console.log(files.join('\n'));
  } else {
    const result = spawnSync(process.execPath, ['--test', ...files], {cwd: root, stdio: 'inherit'});
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  }
}
