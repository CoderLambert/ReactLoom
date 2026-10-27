// Validate actual Knip v6 JSON reporter data. This pure parser does not run Knip.
export function checkKnipReport(level, status, stdout) {
  if (!['basic','business','advanced'].includes(level)) throw Error('Unknown scenario');
  if (status !== 0 && status !== 1) throw Error('Knip CLI/config error (exit ' + status + ')');
  if (typeof stdout !== 'string' || Buffer.byteLength(stdout) > 2_000_000) throw Error('Missing or oversized report');
  let report;
  try { report = JSON.parse(stdout); } catch { throw Error('Invalid Knip JSON output'); }
  if (!report || !Array.isArray(report.issues)) throw Error('Missing issues array');
  let count = 0, orphan = false;
  for (const issue of report.issues) {
    if (typeof issue?.file !== 'string') throw Error('Issue missing file');
    for (const [type, items] of Object.entries(issue)) {
      if (type === 'file' || type === 'owners') continue;
      if (!Array.isArray(items)) throw Error('Invalid issue category');
      for (const item of items) {
        if (typeof item?.name !== 'string') throw Error('Invalid issue item');
        count++;
        if (type === 'files' && item.name.replaceAll('\\','/').endsWith('src/unused.ts')) orphan = true;
      }
    }
  }
  if ((count > 0) !== (status === 1)) throw Error('Exit code and findings disagree');
  if (level === 'basic' && !orphan) throw Error('Expected unused fixture not reported');
  if (level === 'business' && orphan) throw Error('ignoreIssues did not suppress unused fixture');
  return { count, orphan };
}
