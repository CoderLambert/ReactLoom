import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y', 'msw-storybook-addon'],
  framework: '@storybook/nextjs',
  staticDirs: ['../public'],
}

export default config
