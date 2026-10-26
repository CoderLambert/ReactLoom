import type {Preview} from '@storybook/react-vite'

const preview:Preview = {
  parameters:{
    controls:{expanded:true},
    a11y:{test:'todo'}, // 指引人工复查，不能把addon报告自动当完整WCAG认证
  },
}
export default preview
