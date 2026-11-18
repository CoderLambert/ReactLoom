import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    a11y: { test: 'error' }, // Ordinary story afterEach reports axe; CI must assert reports or use a test runner.
  },
}
export default preview
