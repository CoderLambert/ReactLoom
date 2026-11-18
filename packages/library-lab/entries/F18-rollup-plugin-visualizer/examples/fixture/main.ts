import { fibonacci } from './heavy'
import { mountCalculator } from './view'

mountCalculator('static import：计算模块随入口进入静态依赖闭包', async () => ({ fibonacci }))
