// Structural validation of dependency-cruiser JSON; no CLI/SDK import.
const RULES={basic:null,business:'domain-must-not-import-ui',advanced:'no-circular-dependencies'};
export function checkCruiseReport(level,raw) {
  if (!(level in RULES)) throw Error('Unknown fixture');
  if (typeof raw!=='string'||Buffer.byteLength(raw)>8_000_000) throw Error('Missing/oversize JSON');
  let data;
  try {data=JSON.parse(raw)} catch {throw Error('Bad cruise JSON')}
  if (!data||!Array.isArray(data.modules)||!data.modules.length||
      !data.summary||!Array.isArray(data.summary.violations)||
      !Number.isInteger(data.summary.error)||data.summary.error<0)
    throw Error('Invalid cruise report structure');
  const errors=data.summary.violations.filter(v=>v?.rule?.severity==='error');
  if (errors.length!==data.summary.error) throw Error('Mismatch between summary.error and rules');
  if (RULES[level]===null ? errors.length!==0 : !errors.some(v=>v.rule.name===RULES[level]))
    throw Error('Expected error rules differ for '+level);
  return {modules:data.modules.length,errors:errors.length};
}
export function checkCruiseExit(level,run) {
  if (!(level in RULES)||run.error||run.signal||!Number.isInteger(run.status))
    throw Error('CLI failed to execute');
  if (level==='basic' ? run.status!==0 : run.status<=0)
    throw Error(level+' reporter exit code '+run.status+' is unexpected');
  return run.status;
}
