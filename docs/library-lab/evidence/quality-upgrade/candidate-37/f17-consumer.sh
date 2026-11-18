set -eu
lab="$PWD/packages/library-lab"
consumer=$(mktemp -d /tmp/reactloom-f17-consumer.XXXXXX)
trap 'rm -rf -- "$consumer"' EXIT
cp "$lab"/entries/F17-axe-core/examples/{example.tsx,audit-queue.mjs,audit-queue.d.mts} "$consumer"
ln -s "$lab/node_modules" "$consumer/node_modules"
cat > "$consumer/consumer.tsx" <<'TS'
import AxeAuditExample from './example'
export function FeedFormAudit() { return <AxeAuditExample level="business" /> }
TS
cd "$lab"
printf 'cwd=%s consumer=%s\n' "$PWD" "$consumer"
pnpm exec tsc --ignoreConfig --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --skipLibCheck "$consumer/consumer.tsx"
