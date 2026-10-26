import {useState} from 'react';
import clsx from 'clsx';
import {twJoin, twMerge} from 'tailwind-merge';

type Props = {level: 'basic' | 'business' | 'advanced'};

// 模块级复用；twMerge 只根据 Tailwind 规则合并，不参与 CSS 编译。
export function cn(...values: Parameters<typeof clsx>): string {
  return twMerge(clsx(...values));
}

const cases = [
  {name: '同组冲突',input: ['px-2', 'px-6'],meaning: '较晚 px-6 覆盖 px-2'},
  {name: '非对称覆盖 A',input: ['pr-4', 'px-3'],meaning: '后续 px-3 覆盖右侧'},
  {name: '非对称覆盖 B',input: ['px-3', 'pr-4'],meaning: '保留 px-3 的左侧与 pr-4 的右侧'},
  {name: '响应式变体',input: ['md:p-2', 'md:p-6', 'p-4'],meaning: '仅合并同 modifier 的冲突'},
  {name: '悬停变体',input: ['hover:bg-red-500', 'hover:bg-green-500'],meaning: '保留后面的 hover 背景'},
];

export default function TailwindMergeExample({level}: Props) {
  const [base, setBase] = useState('px-3 pr-4');
  const [override, setOverride] = useState('pr-8');
  const [selected, setSelected] = useState(false);
  const [size, setSize] = useState<'compact' | 'comfortable'>('compact');

  const composed = clsx(
    'rounded-lg border px-3 py-2 bg-slate-100',
    selected && 'bg-green-100',
    size === 'comfortable' && 'px-7 py-5',
  );
  const finalClass = twMerge(composed, override);
  const customMerged = twMerge(base, override);

  return <section aria-label="tailwind-merge 实际运行示例">
    <h2>{level === 'basic' ? '类名冲突消解'
      : level === 'business' ? '可覆盖的组件 className' : '非对称冲突与变体'}</h2>
    <div className="demo-controls">
      <label>默认类名 <input aria-label="默认类名" value={base}
        onChange={event => setBase(event.target.value)} style={{minWidth:230}} /></label>
      <label>覆盖类名 <input aria-label="覆盖类名" value={override}
        onChange={event => setOverride(event.target.value)} style={{minWidth:190}} /></label>
    </div>
    <p>只是拼接：<output data-testid="tw-joined">{twJoin(base, override)}</output></p>
    <p>真实 twMerge：<output data-testid="tw-merged" className="demo-output">{customMerged}</output></p>

    {level !== 'basic' && <>
      <div className="demo-controls">
        <label><input type="checkbox" checked={selected}
          onChange={event => setSelected(event.target.checked)}/>已选中</label>
        <label>卡片尺寸 <select value={size} onChange={event =>
          setSize(event.target.value as typeof size)}>
          <option value="compact">紧凑</option>
          <option value="comfortable">舒适</option>
        </select></label>
      </div>
      <article className={finalClass}>
        <h3>前端工程实践精选</h3>
        <p>卡片最终使用真实合并器输出的 className，覆盖类仅影响允许扩展的样式接口。</p>
        <button type="button" aria-pressed={selected} onClick={() => setSelected(v => !v)}>
          {selected ? '取消选择' : '选择文章'}
        </button>
      </article>
      <p>业务组件：<output data-testid="tw-business">{finalClass}</output></p>
      <p>cn(cls​x(...)) 示例：<code>{cn('p-2', {'p-4': selected, 'p-3': !selected})}</code></p>
    </>}
    {level === 'advanced' && <section>
      <h3>关键边界（真实 twMerge 执行）</h3>
      <ul>{cases.map(item => <li key={item.name}>
        <strong>{item.name}</strong>：<code>{item.input.join(' + ')}</code> →{' '}
        <output>{twMerge(...item.input)}</output><br/><small>{item.meaning}</small>
      </li>)}</ul>
      <p>注意：twMerge 不保证识别项目自定义 Tailwind token；也不是 CSS 编译器或安全净化器。</p>
    </section>}
  </section>;
}
