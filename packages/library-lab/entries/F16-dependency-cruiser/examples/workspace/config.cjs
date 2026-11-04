/** 供三个隔离fixture共用；只扫描传入的src路径 */
module.exports = {
  forbidden: [
    {
      name: 'domain-must-not-import-ui',
      comment: '领域层不应反向引用表示层',
      severity: 'error',
      from: { path: '(^|/)domain/' },
      to: { path: '(^|/)ui/' },
    },
    {
      name: 'no-circular-dependencies',
      comment: '循环依赖会使模块初始化难以推理',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: 'node_modules' },
  },
};
