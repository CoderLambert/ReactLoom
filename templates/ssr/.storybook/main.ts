import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-a11y',
    'msw-storybook-addon',
    {
      name: '@storybook/addon-mcp',
      options: {
        endpoint: '/mcp',
        toolsets: { dev: true, docs: true, test: true },
      },
    },
  ],
  framework: '@storybook/nextjs',
  features: { componentsManifest: true },
  staticDirs: ['../public'],
}

export default config
