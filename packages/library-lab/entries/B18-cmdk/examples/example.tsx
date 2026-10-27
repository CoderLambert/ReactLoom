import {useEffect, useRef, useState} from 'react';
import {Command} from 'cmdk';
import {shouldSuppressCommandEnter, shouldTogglePalette} from './keyboard-policy';

type Level = 'basic' | 'business' | 'advanced';
type Action = {id: string; label: string; description: string; keywords: string[]; group: '阅读' | '管理'; enabled: boolean};
const actions: Action[] = [
  {id: 'save', label: '稍后阅读', description: '保存当前文章到阅读队列',
    keywords: ['收藏', 'bookmark', 'reading'], group: '阅读', enabled: true},
  {id: 'read', label: '标记已读', description: '将文章移出未读列表',
    keywords: ['完成', 'done', 'read'], group: '阅读', enabled: true},
  {id: 'copy', label: '复制引用', description: '生成本地演示引用，不写入系统剪贴板',
    keywords: ['引用', 'citation'], group: '阅读', enabled: true},
  {id: 'refresh', label: '刷新订阅', description: '展示本地状态，不向远端发请求',
    keywords: ['更新', 'refresh', 'rss'], group: '管理', enabled: true},
  {id: 'delete', label: '删除所有订阅', description: '危险动作在演示环境中禁用',
    keywords: ['remove', '危险'], group: '管理', enabled: false},
];

export default function CmdkExample({level}: {level: Level}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [lastAction, setLastAction] = useState('尚未执行命令');
  const composing = useRef(false);
  const pendingImeEnter = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const advanced = level === 'advanced';

  useEffect(() => {
    if (!advanced) return;
    const handleKey = (event: KeyboardEvent) => {
      const element = event.target;
      const editable = element instanceof HTMLElement && (element.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName));
      if (!shouldTogglePalette(event,editable,open)) return;
      event.preventDefault();
      setOpen(value => !value);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [advanced,open]);

  function select(action: Action) {
    if (composing.current || !action.enabled) return;
    setLastAction(action.label + '：演示动作已完成（没有真实写入）');
    setQuery('');
    if (advanced) {
      setOpen(false);
      queueMicrotask(() => trigger.current?.focus());
    }
  }

  const commandContent = <>
    <Command.Input
      aria-label="输入命令关键词"
      value={query}
      onValueChange={setQuery}
      onCompositionStart={() => {composing.current = true; pendingImeEnter.current = true;}}
      onCompositionEnd={() => {composing.current = false; pendingImeEnter.current = true;}}
      onKeyDownCapture={event => {
        if (event.key !== 'Enter' && !composing.current) pendingImeEnter.current = false;
        if (shouldSuppressCommandEnter(event.nativeEvent,composing.current,pendingImeEnter.current)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onKeyUpCapture={event => {
        if (event.key === 'Enter') pendingImeEnter.current = false;
      }}
      onBlur={() => {composing.current = false; pendingImeEnter.current = false;}}
      placeholder="搜索命令、中文拼写或快捷词"
    />
    <Command.List>
      <Command.Empty>没有匹配命令，试试“阅读”或“刷新”。</Command.Empty>
      {(['阅读', '管理'] as const).map(group => <Command.Group key={group} heading={group}>
        {actions.filter(action => action.group === group && (level !== 'basic' || action.group === '阅读')).map(action =>
          <Command.Item key={action.id} value={action.label} keywords={action.keywords}
            disabled={!action.enabled} onSelect={() => select(action)}>
            <span>{action.label}</span>
            <small>{action.description}</small>
          </Command.Item>
        )}
      </Command.Group>)}
    </Command.List>
    <p className="lab-ab-cmdk-hint">上下方向键切换 · Enter 确认 · 输入法候选期间不提交</p>
  </>;

  return <section aria-label="cmdk 真实命令面板">
    <style>{'.lab-ab-cmdk [cmdk-input]{width:100%;padding:12px 14px;outline:2px solid transparent;border:1px solid #a9bda9;background:white;border-radius:8px}.lab-ab-cmdk [cmdk-input]:focus-visible{outline:2px solid #376c52}.lab-ab-cmdk [cmdk-list]{max-height:260px;overflow-y:auto;padding:10px 3px}.lab-ab-cmdk [cmdk-group-heading]{font-size:11px;color:#617767;margin:12px 8px 5px}.lab-ab-cmdk [cmdk-item]{display:flex;justify-content:space-between;gap:12px;padding:11px;margin:3px 0;border-radius:7px;cursor:pointer}.lab-ab-cmdk [cmdk-item][data-selected=true]{background:#dcebdd}.lab-ab-cmdk [cmdk-item][data-disabled=true]{opacity:.4;cursor:not-allowed}.lab-ab-cmdk [cmdk-item] small{font-size:11px;color:#5a6d62}.lab-ab-cmdk [cmdk-empty]{padding:20px}.lab-ab-cmdk-hint{font-size:11px;color:#617767;margin:8px}.lab-ab-cmdk[cmdk-dialog]{background:#fff;position:fixed;z-index:9999;top:20%;left:50%;transform:translateX(-50%);width:min(580px,90vw);box-shadow:0 15px 55px #192b2077;border-radius:14px;padding:20px}.lab-ab-cmdk [cmdk-separator]{height:1px;background:#ddd}'}</style>
    <h2>{level === 'basic' ? '可键盘选择的命令' : level === 'business' ? '新闻工作台命令' : '带快捷键的命令对话框'}</h2>
    <p>全部由 cmdk 真正执行筛选、分组和选择；业务动作只更新演示状态，不写用户数据。</p>
    {advanced ? <>
      <button type="button" ref={trigger} onClick={() => setOpen(true)}
        aria-haspopup="dialog" aria-expanded={open}>打开命令面板（Ctrl/Cmd+K）</button>
      <Command.Dialog className="lab-ab-cmdk" open={open} onOpenChange={setOpen}
        label="本示例的命令面板">{commandContent}</Command.Dialog>
    </> : <Command className="lab-ab-cmdk" label="当前示例的命令列表"
      style={{border: '1px solid #d3e2d2', borderRadius: 12, padding: 17, maxWidth: 630}}>
      {commandContent}
    </Command>}
    <p role="status" aria-live="polite" style={{marginTop: 15}}>当前动作：{lastAction}</p>
    <p style={{fontSize: 12}}>危险命令被禁用；面板关闭时 Ctrl/Cmd+K 不抢占其他输入框，面板打开后同键可关闭；输入法确认后的 Enter keyup 才解除误提交保护，卸载移除监听。</p>
  </section>;
}
