set -eu
lab="$PWD/packages/library-lab"
consumer=$(mktemp -d /tmp/reactloom-f14-consumer.XXXXXX)
trap 'rm -rf -- "$consumer"' EXIT
cp -a "$lab/entries/F14-storybook/examples/.storybook" "$lab/entries/F14-storybook/examples/components" "$lab/entries/F14-storybook/examples/stories" "$consumer"
ln -s "$lab/node_modules" "$consumer/node_modules"
cat > "$consumer/stories/independent.stories.tsx" <<'TS'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { StatusCard } from '../components/StatusCard'
const meta = { component: StatusCard, args: { onArchive: fn() } } satisfies Meta<typeof StatusCard>
export default meta
export const NewConsumer = {
  args: { title: 'Orion manual review', tone: 'blocked' },
} satisfies StoryObj<typeof meta>
TS
cd "$lab"
printf 'cwd=%s consumer=%s\n' "$PWD" "$consumer"
pnpm exec tsc --ignoreConfig --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --skipLibCheck "$consumer"/.storybook/{main,preview}.ts "$consumer"/components/StatusCard.tsx "$consumer"/stories/*.tsx
