import {useMemo, useState, type FormEvent} from 'react';
import {Checkbox} from '@base-ui/react/checkbox';
import './checkbox.css';

type Level = 'basic' | 'business' | 'advanced';
type Permission = 'read' | 'comment' | 'manage';
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
  const partial = enabled.length > 0 && enabled.length < OPTIONS.length;
  const all = enabled.length === OPTIONS.length;
  const total = useMemo(() => enabled.length, [enabled]);

  function changePermission(id: Permission, checked: boolean) {
    setEnabled(previous => checked ? [...previous.filter(x => x !== id), id] : previous.filter(x => x !== id));
    setSubmit('权限已修改，尚未提交');
  }
  function changeAll(checked: boolean) {
    setEnabled(checked ? OPTIONS.filter(p => !(lockManage && p.id === 'manage')).map(p => p.id) : []);
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
          if (e.target.checked) setEnabled(old => old.filter(value => value !== 'manage'));
        }}/>
        锁定“管理订阅”权限（模拟服务端权限限制）
      </label>}
      <label className="rl-base-row rl-base-parent">
        <Checkbox.Root checked={all} indeterminate={partial} className="rl-base-checkbox"
          onCheckedChange={changeAll}>
          <Checkbox.Indicator className="rl-base-indicator">
            {partial ? '−' : '✓'}
          </Checkbox.Indicator>
        </Checkbox.Root>
        <span>全选 / 取消全选</span>
        <strong>{total} / {OPTIONS.length}</strong>
      </label>
      <div className="rl-base-list">{OPTIONS.map(option =>
        <label className="rl-base-row" key={option.id}>
          <Checkbox.Root className="rl-base-checkbox" name="permissions" value={option.id}
            checked={enabled.includes(option.id)}
            disabled={lockManage && option.id === 'manage'}
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
