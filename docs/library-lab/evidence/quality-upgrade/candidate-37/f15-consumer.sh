set -eu
lab="$PWD/packages/library-lab"
consumer=$(mktemp -d /tmp/reactloom-f15-consumer.XXXXXX)
trap 'rm -rf -- "$consumer"' EXIT
cp -a "$lab/entries/F15-knip/examples/workspace/." "$consumer"
printf 'export const independentEntryProbe = 17\n' > "$consumer/src/independent.ts"
ln -s "$lab/node_modules" "$consumer/node_modules"
cd "$lab"
pnpm exec knip --version
set +e
pnpm exec knip --directory "$consumer" --config knip.basic.json --reporter json > "$consumer/report.json"
status=$?
set -e
printf 'cwd=%s consumer=%s knip_exit=%s\n' "$PWD" "$consumer" "$status"
test "$status" = 1
node --input-type=module - "$consumer/report.json" <<'JS'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const report = JSON.parse(readFileSync(process.argv[2], 'utf8'))
assert(report.issues.some(row => row.file === 'src/independent.ts' && row.files?.some(item => item.name === 'src/independent.ts')))
console.log(JSON.stringify(report))
JS
