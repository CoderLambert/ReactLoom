import {useEffect, useRef, useState} from 'react';
import {useFieldArray, useForm} from 'react-hook-form';

export type Source = {name: string; url: string};
export type SubscriptionDraft = {group: string; sources: Source[]};
type Props = {level: 'basic' | 'business' | 'advanced'};

const defaultDraft: SubscriptionDraft = {
  group: '技术',
  sources: [{name: '前端工程', url: 'https://example.com/rss.xml'}],
};

function validateHttps(value: string): true | string {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? true : '只允许 HTTPS 源地址';
  } catch {
    return '请输入有效的完整 URL';
  }
}

function delayWithSignal(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('已取消', 'AbortError'));
      return;
    }
    const done = () => {
      signal.removeEventListener('abort', abort);
      resolve();
    };
    const timer = window.setTimeout(done, ms);
    const abort = () => {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      reject(new DOMException('已取消', 'AbortError'));
    };
    signal.addEventListener('abort', abort, {once: true});
  });
}

export default function SubscriptionForm({level}: Props) {
  const {control, register, handleSubmit, setError, clearErrors, reset,
    formState: {errors, isSubmitting, isDirty}} = useForm<SubscriptionDraft>({
      defaultValues: defaultDraft,
      mode: 'onBlur',
    });
  const {fields, append, remove} = useFieldArray({control, name: 'sources'});
  const [saved, setSaved] = useState<SubscriptionDraft | null>(null);
  const [feedback, setFeedback] = useState('尚未提交');
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);

  useEffect(() => () => {
    generation.current++;
    controller.current?.abort();
  }, []);

  const stop = () => {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    setFeedback('本地模拟请求已取消');
  };

  async function submit(value: SubscriptionDraft) {
    const token = ++generation.current;
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    clearErrors('root.server');
    setFeedback('正在验证订阅草稿…');
    try {
      // 本地业务 fixture：模拟耗时与 409 映射，不访问外部 HTTP。
      if (level === 'advanced') await delayWithSignal(450, active.signal);
      if (active.signal.aborted || token !== generation.current) return;
      const urls = value.sources.map(source => source.url.trim().toLowerCase());
      if (new Set(urls).size !== urls.length) {
        setError('root.server', {type: 'duplicate', message: '同一分组不能重复订阅相同 URL'});
        setFeedback('客户端检测到重复 URL');
        return;
      }
      if (level === 'advanced') {
        const conflict = value.sources.findIndex(source => source.url.includes('/duplicate'));
        if (conflict >= 0) {
          setError(`sources.${conflict}.url` as const,
            {type: 'server', message: '模拟服务端 409：该源已存在'},
            {shouldFocus: true});
          setError('root.server', {type: 'server', message: '模拟服务端拒绝了重复订阅'});
          setFeedback('服务端 409 演示：字段错误已正确回填');
          return;
        }
      }
      setSaved(value);
      setFeedback('校验通过，已生成本地预览；没有真正写入服务端');
    } catch (error) {
      if (token === generation.current && !active.signal.aborted) {
        setError('root.server', {type: 'unknown', message: String(error)});
        setFeedback('本地模拟提交失败');
      }
    } finally {
      if (token === generation.current) controller.current = null;
    }
  }

  const advanced = level === 'advanced';
  return <section aria-label="React Hook Form 实际 SDK 示例">
    <h2>{level === 'basic' ? 'RSS 订阅表单' : advanced ? '字段级错误、取消与竞态' : '动态 RSS 来源列表'}</h2>
    <p>RHF 管理真实输入与字段数组；提交端是明确标注的本地业务 fixture，不需要 API 密钥。</p>
    <form onSubmit={handleSubmit(submit)} onKeyDown={event => {
      // 中文 IME 候选确认键不应意外提交表单。
      if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault();
    }}>
      <div className="demo-controls">
        <label>分组名称 <input aria-label="分组名称" aria-invalid={!!errors.group}
          aria-describedby={errors.group ? 'rhf-group-error' : undefined}
          {...register('group', {required: '请输入分组名', minLength: {value: 2, message: '最少两个字符'}})} />
        </label>
        {errors.group && <small id="rhf-group-error" role="alert">{errors.group.message}</small>}
      </div>
      {fields.map((field, index) => <fieldset key={field.id} style={{border:'1px solid #c7d7c9', margin:'12px 0', padding:14}}>
        <legend>来源 {index + 1}</legend>
        <div className="demo-controls">
          <label>标题 <input aria-label={`来源 ${index + 1} 标题`}
            aria-invalid={!!errors.sources?.[index]?.name}
            {...register(`sources.${index}.name` as const,
              {required: '请输入标题', minLength: {value: 2, message: '至少两个字符'}})} />
          </label>
          <label>RSS URL <input aria-label={`来源 ${index + 1} URL`} type="url"
            aria-invalid={!!errors.sources?.[index]?.url}
            {...register(`sources.${index}.url` as const,
              {required: '请输入 URL', validate: validateHttps})} />
          </label>
          {level !== 'basic' && <button type="button" disabled={fields.length <= 1}
            onClick={() => remove(index)}>移除该源</button>}
        </div>
        {errors.sources?.[index]?.name && <p role="alert">{errors.sources[index]?.name?.message}</p>}
        {errors.sources?.[index]?.url && <p role="alert">{errors.sources[index]?.url?.message}</p>}
      </fieldset>)}
      {level !== 'basic' && <button type="button" onClick={() =>
        append({name: '新来源', url: 'https://example.com/feed'})}>新增 RSS 来源</button>}
      <div className="demo-controls">
        <button type="submit" disabled={isSubmitting}>验证并预览</button>
        {advanced && <button type="button" onClick={stop}>取消本地提交</button>}
        <button type="button" onClick={() => {
          stop(); reset(); setSaved(null); setFeedback('已恢复初始草稿');
        }}>重置表单</button>
      </div>
    </form>
    <p role="status">{feedback} · {isDirty ? '存在未保存修改' : '输入处于默认状态'}</p>
    {errors.root?.server && <p role="alert">{errors.root.server.message}</p>}
    {advanced && <p>将任意 URL 改为 <code>https://example.com/duplicate</code>，可模拟服务端 409；取消后不应回写旧结果。</p>}
    {saved && <><h3>通过校验的本地数据</h3><output className="demo-output">{JSON.stringify(saved, null, 2)}</output></>}
  </section>;
}
