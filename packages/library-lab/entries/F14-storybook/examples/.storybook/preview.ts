import type {Preview} from '@storybook/react-vite'

const preview:Preview = {
  parameters:{
    controls:{expanded:true},
    a11y:{test:'error'}, // CI须接入addon-vitest或test-runner方能真正执行；不代表全部WCAG合规
  },
}
export default preview
