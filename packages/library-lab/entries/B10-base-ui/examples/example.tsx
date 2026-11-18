import { Checkbox } from '@base-ui/react/checkbox'
import { type FormEvent, useId, useRef, useState } from 'react'
import {
  changeAllPermissions,
  normalizePermissions,
  type Permission,
  permissionSummary,
  changePermission as updatePermission,
} from './permission-policy'
import './checkbox.css'

type Level = 'basic' | 'business' | 'advanced'
const OPTIONS: { id: Permission; label: string; description: string }[] = [
  { id: 'read', label: '阅读文章', description: '允许查看已订阅内容' },
  { id: 'comment', label: '参与评论', description: '允许在工作区发表评论' },
  { id: 'manage', label: '管理订阅', description: '允许更改订阅来源' },
]

function readInput(input: HTMLInputElement | null | undefined) {
  if (!input) return null
  return {
    name: input.name,
    value: input.value,
    checked: input.checked,
    indeterminate: input.indeterminate,
    disabled: input.disabled,
    tabIndex: input.tabIndex,
  }
}

export default function BaseUiExample({ level }: { level: Level }) {
  const id = useId()
  const [single, setSingle] = useState(false)
  const [enabled, setEnabled] = useState<Permission[]>(['read'])
  const [lockManage, setLockManage] = useState(false)
  const [submit, setSubmit] = useState('尚未提交表单')
  const [submitted, setSubmitted] = useState<string[] | null>(null)
  const [reading, setReading] = useState<string | null>(null)
  const singleInput = useRef<HTMLInputElement | null>(null)
  const parentInput = useRef<HTMLInputElement | null>(null)
  const inputs = useRef<Partial<Record<Permission, HTMLInputElement>>>({})
  const form = useRef<HTMLFormElement | null>(null)
  const manageLocked = level === 'advanced' && lockManage
  const selection = permissionSummary(enabled, manageLocked)

  function markEdited(message = '权限已修改，尚未提交') {
    setSubmit(message)
    setSubmitted(null)
    setReading(null)
  }

  function changePermission(permission: Permission, checked: boolean) {
    setEnabled((previous) => updatePermission(previous, permission, checked, manageLocked))
    markEdited()
  }

  function changeAll(checked: boolean) {
    setEnabled(changeAllPermissions(checked, manageLocked))
    markEdited('批量选择已更新')
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selected = new FormData(event.currentTarget).getAll('permissions').map(String)
    setSubmitted(selected)
    setSubmit(`实际浏览器 FormData: ${selected.length ? selected.join(' / ') : '（无勾选）'}`)
  }

  function inspectInputs() {
    const snapshot =
      level === 'basic'
        ? { single: readInput(singleInput.current) }
        : {
            parent: readInput(parentInput.current),
            permissions: Object.fromEntries(
              OPTIONS.map((option) => [option.id, readInput(inputs.current[option.id])]),
            ),
            formData: form.current
              ? new FormData(form.current).getAll('permissions').map(String)
              : [],
          }
    setReading(JSON.stringify(snapshot, null, 2))
  }

  return (
    <section
      aria-label="Base UI Checkbox 实战"
      className="rl-base-lab"
      data-testid="b10-workshop"
      data-level={level}
    >
      <h2>
        {level === 'basic'
          ? '受控 Checkbox 与 label'
          : level === 'business'
            ? '角色权限批量选择'
            : '混合态、禁用权限与真实 FormData'}
      </h2>
      <p>
        Base UI 管理复选框交互与隐藏原生 input；React 保存编辑状态，局部 CSS
        提供外观。本例不发送授权请求。
      </p>
      {level === 'basic' ? (
        <label className="rl-base-row" htmlFor={`${id}-single-control`}>
          <Checkbox.Root
            checked={single}
            onCheckedChange={(checked) => {
              setSingle(checked)
              setReading(null)
            }}
            inputRef={singleInput}
            id={`${id}-single-control`}
            aria-labelledby={`${id}-single`}
            className="rl-base-checkbox"
          >
            <Checkbox.Indicator className="rl-base-indicator" aria-hidden="true">
              ✓
            </Checkbox.Indicator>
          </Checkbox.Root>
          <span id={`${id}-single`}>接收工程更新摘要</span>
          <strong aria-hidden="true">{single ? '已选择' : '未选择'}</strong>
        </label>
      ) : (
        <form ref={form} onSubmit={submitForm}>
          {level === 'advanced' && (
            <label className="rl-base-row">
              <input
                type="checkbox"
                checked={lockManage}
                onChange={(event) => {
                  const locked = event.target.checked
                  setLockManage(locked)
                  if (locked) setEnabled((previous) => normalizePermissions(previous, true))
                  markEdited()
                }}
              />
              锁定“管理订阅”权限（模拟服务端权限限制）
            </label>
          )}
          <fieldset className="rl-base-fieldset">
            <legend>可授予的订阅权限</legend>
            <label className="rl-base-row rl-base-parent" htmlFor={`${id}-all-control`}>
              <Checkbox.Root
                checked={selection.checked}
                indeterminate={selection.indeterminate}
                onCheckedChange={changeAll}
                inputRef={parentInput}
                id={`${id}-all-control`}
                aria-labelledby={`${id}-all`}
                className="rl-base-checkbox"
                data-testid="b10-parent"
              >
                <Checkbox.Indicator className="rl-base-indicator" aria-hidden="true">
                  {selection.indeterminate ? '−' : '✓'}
                </Checkbox.Indicator>
              </Checkbox.Root>
              <span id={`${id}-all`}>全选 / 取消全选</span>
              <strong aria-hidden="true">
                {selection.selectedCount} / {selection.eligibleCount} 可选
              </strong>
            </label>
            <div className="rl-base-list">
              {OPTIONS.map((option) => (
                <label
                  className="rl-base-row"
                  key={option.id}
                  htmlFor={`${id}-${option.id}-control`}
                >
                  <Checkbox.Root
                    className="rl-base-checkbox"
                    name="permissions"
                    value={option.id}
                    id={`${id}-${option.id}-control`}
                    checked={enabled.includes(option.id)}
                    disabled={manageLocked && option.id === 'manage'}
                    onCheckedChange={(checked) => changePermission(option.id, checked)}
                    inputRef={(input) => {
                      if (input) inputs.current[option.id] = input
                      else delete inputs.current[option.id]
                    }}
                    aria-labelledby={`${id}-${option.id}`}
                    aria-describedby={`${id}-${option.id}-description`}
                    data-testid={`b10-${option.id}`}
                  >
                    <Checkbox.Indicator className="rl-base-indicator" aria-hidden="true">
                      ✓
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span>
                    <strong id={`${id}-${option.id}`}>{option.label}</strong>
                    <small id={`${id}-${option.id}-description`}>{option.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="rl-base-submit">
            提交本地 FormData
          </button>
        </form>
      )}
      <p role="status">
        {level === 'basic' ? (single ? '已勾选，将纳入摘要' : '未勾选，不纳入摘要') : submit}
      </p>
      {submitted && <pre data-testid="b10-form-data">{JSON.stringify(submitted)}</pre>}
      {level === 'advanced' && (
        <p>
          管理权限被锁定时，父项全选也不能越过本地规则；禁用 input 不进入
          FormData。这只是客户端示例，正式权限必须由后端验证。
        </p>
      )}
      <button type="button" className="rl-base-inspect" onClick={inspectInputs}>
        读取实际输入
      </button>
      <p className="rl-base-note">
        读数是点击时通过 SDK inputRef 读取的真实 DOM 属性；混合态独立于
        checked。编辑后清除旧读数，再次读取即可核对。
      </p>
      {reading && <pre data-testid="b10-input-reading">{reading}</pre>}
    </section>
  )
}
