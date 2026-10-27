import {useState, type FormEvent} from 'react';
import {changeAllPermissions, changePermission as updatePermission, normalizePermissions, permissionSummary, type Permission} from './permission-policy';
import {Checkbox} from '@base-ui/react/checkbox';
import './checkbox.css';

type Level = 'basic' | 'business' | 'advanced';
const OPTIONS: {id: Permission; label: string; description: string}[] = [
  {id: 'read', label: '阅读文章', description: '允许查看已订阅内容'},
  {id: 'comment', label: '参与评论', description: '允许在工作区发表评论'},
  {id: 'manage', label: '管理订阅', description: '允许更改订阅来源'},
];
export default function BaseUiExample({level}: {level: Level}) {
  const [single, setSingle] = useState(false);
  const [enabled, setEnabled] = useState<Permission[]>(['read']);
  const [lockManage, setLockManage] = useState(false);
  const [submit, setSubmit] = useState('尚未提交表单');
  const manageLocked = level === 'advanced' && lockManage;
  const selection = permissionSummary(enabled, manageLocked);
  function changePermission(id: Permission, checked: boolean) {
    setEnabled(previous => updatePermission(previous, id, checked, manageLocked));
    setSubmit('权限已修改，尚未提交');
  }
  function changeAll(checked: boolean) {
    setEnabled(changeAllPermissions(checked, manageLocked));
    setSubmit('批量选择已更新');
  }
  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selected = new FormData(event.currentTarget).getAll('permissions').map(String);
    setSubmit('实际浏览器 FormData: ' + (selected.length ? selected.join(' / ') : '（无勾选）'));
  }
  return <section aria-label="Base UI Checkbox 实战" className="rl-base-lab">
    <h2>{level === 'basic' ? '受控 Checkbox 与 label' :
      level === 'business' ? '角色权限批量选择' : '混合态、禁用权限与真实 FormData'}</h2>
    <p>使用真实 Base UI Checkbox.Root/Indicator；组件管理复选框语义和隐藏表单input，样式由项目自行维护。</p>
    {level === 'basic' ? <label className="rl-base-row">
      <Checkbox.Root checked={single} onCheckedChange={setSingle} className="rl-base-checkbox">
        <Checkbox.Indicator className="rl-base-indicator">✓</Checkbox.Indicator>
      </Checkbox.Root>
      <span>接收工程更新摘要</span>
      <strong>{single ? '已选择' : '未选择'}</strong>
    </label> : <form onSubmit={submitForm}>
      {level === 'advanced' && <label className="rl-base-row">
        <input type="checkbox" checked={lockManage} onChange={e => {
          setLockManage(e.target.checked);
          if (e.target.checked) setEnabled(old => normalizePermissions(old, true));
        }}/>
        锁定“管理订阅”权限（模拟服务端权限限制）
      </label>}
      <label className="rl-base-row rl-base-parent">
        <Checkbox.Root checked={selection.checked} indeterminate={selection.indeterminate} className="rl-base-checkbox"
          onCheckedChange={changeAll}>
          <Checkbox.Indicator className="rl-base-indicator">
            {selection.indeterminate ? '−' : '✓'}
          </Checkbox.Indicator>
        </Checkbox.Root>
        <span>全选 / 取消全选</span>
        <strong>{selection.selectedCount} / {selection.eligibleCount} 可选</strong>
      </label>
      <div className="rl-base-list">{OPTIONS.map(option =>
        <label className="rl-base-row" key={option.id}>
          <Checkbox.Root className="rl-base-checkbox" name="permissions" value={option.id}
            checked={enabled.includes(option.id)}
            disabled={manageLocked && option.id === 'manage'}
            onCheckedChange={checked => changePermission(option.id, checked)}>
            <Checkbox.Indicator className="rl-base-indicator">✓</Checkbox.Indicator>
          </Checkbox.Root>
          <span><strong>{option.label}</strong><small>{option.description}</small></span>
        </label>
      )}</div>
      <button type="submit" className="rl-base-submit">提交本地 FormData</button>
    </form>}
    <p role="status">{level === 'basic' ? (single ? '已勾选，将纳入摘要' : '未勾选，不纳入摘要') : submit}</p>
    {level === 'advanced' && <p>父项使用真正的 indeterminate；管理权限被锁定时，父项勾选也不能越过业务授权。正式权限必须由后端验证。</p>}
  </section>;
}
