/** Fixed data only: the playground does not evaluate user-supplied JavaScript. */
export const comparisonPresets = [
  {
    id: 'strings',
    title: '字符串与条件结果',
    explanation: '条件表达式先由 JavaScript 求值。字符串会保留，false 和空字符串会被两者丢弃。',
    inputs: ['card', 'is-selected', false, ''],
  },
  {
    id: 'object',
    title: '对象状态映射',
    explanation: '完整版按对象值的真值选择键名；lite 忽略整个对象，因此不能直接替换卡片的调用。',
    inputs: ['card', { 'is-selected': true, 'is-disabled': false }],
  },
  {
    id: 'array',
    title: '嵌套数组',
    explanation: '完整版递归展开数组；lite 忽略整个数组，只保留外层的字符串参数。',
    inputs: ['card', ['is-selected', ['tone-success'], false]],
  },
  {
    id: 'number',
    title: '数字与空值',
    explanation: '完整版把真值数字 1 转为类名，数字 0 和空值被丢弃；lite 只保留字符串。',
    inputs: ['card', 0, 1, null, undefined, false],
  },
  {
    id: 'utilities',
    title: '重复与 Tailwind 冲突',
    explanation: '两者都原样保留重复类和相互覆盖的工具类。此处只观察字符串，不加载 Tailwind。',
    inputs: ['px-2', 'px-4', 'px-4'],
  },
]
