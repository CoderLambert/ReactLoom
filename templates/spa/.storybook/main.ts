import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y', 'msw-storybook-addon'],
  framework: '@storybook/react-vite',
  staticDirs: ['../public'],
}

export default config
