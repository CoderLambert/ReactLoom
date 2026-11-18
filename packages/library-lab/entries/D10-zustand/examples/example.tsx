import { useEffect, useState } from 'react'
import { useStore } from 'zustand'

import { createChannelStore, makeMemoryStorage, type Tenant, type View } from './store.mjs'

type Level = 'basic' | 'business' | 'advanced'
function PreferencePanel({ level }: { level: Level }) {
  const [memory] = useState(makeMemoryStorage)
  const [store, setStore] = useState(() => createChannelStore(memory.storage))
  const tenant = useStore(store, (state) => state.tenant)
  const view = useStore(store, (state) => state.view)
  const enabled = useStore(store, (state) => state.enabledByTenant[state.tenant])
  const tenantValues = useStore(store, (state) => state.enabledByTenant)
  const [message, setMessage] = useState('')
  useEffect(() => {
    void store.persist.rehydrate()
  }, [store])
  useEffect(
    () => () => {
      memory.dispose()
    },
    [memory],
  )
  async function reload(legacy = false) {
    if (legacy) memory.seed(JSON.stringify({ state: { enabled: false, view: 'grid' }, version: 1 }))
    const next = createChannelStore(memory.storage)
    await next.persist.rehydrate()
    setStore(next)
    setMessage(
      legacy ? '已执行 Zustand v1 → v2 migrate' : '通过真实 persist 重新 hydrate，仅恢复白名单状态',
    )
  }
  return (
    <section aria-label="Zustand 状态隔离与迁移">
      <h2>
        {level === 'basic'
          ? '最小 vanilla store + React selector'
          : level === 'business'
            ? '多租户频道状态与展示模式'
            : 'persist、partialize 和版本迁移'}
      </h2>
      <p>
        实际页面刷新和离开 Demo 会丢失私有
        Map；重建按钮仅在当前挂载内恢复。两个团队字段隔离是业务模型，不是权限隔离。
      </p>
      <p>
        真实 Zustand createStore、useStore、persist；存储使用本 Demo 私有 Map，不写浏览器全局
        localStorage。
      </p>
      {level !== 'basic' && (
        <div className="demo-controls">
          <label>
            工作区
            <select
              aria-label="工作区"
              value={tenant}
              onChange={(e) => store.getState().setTenant(e.target.value as Tenant)}
            >
              <option value="team-a">技术团队A</option>
              <option value="team-b">商业团队B</option>
            </select>
          </label>
          <label>
            视图{' '}
            <select
              aria-label="视图"
              value={view}
              onChange={(e) => store.getState().setView(e.target.value as View)}
            >
              <option value="list">列表</option>
              <option value="grid">网格</option>
            </select>
          </label>
        </div>
      )}
      <div className="demo-controls">
        <button type="button" onClick={() => store.getState().toggle()}>
          切换当前频道启用状态
        </button>
        <button type="button" onClick={() => void reload()}>
          重建 store / 从当前内存恢复
        </button>
        {level === 'advanced' && (
          <button type="button" onClick={() => void reload(true)}>
            导入旧版 v1 数据并迁移
          </button>
        )}
      </div>
      <p role="status">{message}</p>
      <pre data-testid="zustand-state">
        {JSON.stringify({ tenant, view, enabled, tenantValues }, null, 2)}
      </pre>
      {level === 'advanced' && (
        <details>
          <summary>查看实际序列化存储（不含函数和租户身份）</summary>
          <pre>{memory.inspect()}</pre>
        </details>
      )}
      <p>
        存储仅包含 view、enabledByTenant，tenant 与 action
        不持久化；切换团队不能把前一团队启用标记泄露给后一团队。
      </p>
    </section>
  )
}

export default function ZustandWorkshop({ level }: { level: Level }) {
  return (
    <div>
      <PreferencePanel level={level} />
      {level === 'business' && (
        <aside aria-label="独立实例 B">
          <h3>独立实例 B（同名键、独立内存）</h3>
          <PreferencePanel level={level} />
        </aside>
      )}
    </div>
  )
}
