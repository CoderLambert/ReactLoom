import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-a11y',
    'msw-storybook-addon',
    '@storybook/addon-vitest',
    {
      name: '@storybook/addon-mcp',
      options: {
        endpoint: '/mcp',
        toolsets: { dev: true, docs: true, test: true },
      },
    },
  ],
  framework: '@storybook/react-vite',
  features: { componentsManifest: true },
  staticDirs: ['../public'],
}

export default config
