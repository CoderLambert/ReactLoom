import {useState} from 'react';
import {Group, Panel, Separator} from 'react-resizable-panels';

type Level = 'basic' | 'business' | 'advanced';
const border = '1px solid #d7dfd5';

export default function ResizableExample({level}: {level: Level}) {
  const [vertical, setVertical] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [sizes, setSizes] = useState('');
  const orientation = level === 'advanced' && vertical ? 'vertical' : 'horizontal';
  const handleStyle = orientation === 'horizontal'
    ? {width: 12, background: '#d5e5d8', cursor: 'col-resize' as const}
    : {height: 12, background: '#d5e5d8', cursor: 'row-resize' as const};

  return <section aria-label="可调整尺寸的工作面板">
    <h2>{level === 'basic' ? '双栏基础布局' : level === 'business' ? '开发工具三栏工作台' : '方向、约束与键盘调整'}</h2>
    <p>使用真正的 Group / Panel / Separator。拖动绿色分割条，或聚焦分割条后用方向键调整。</p>
    {level === 'advanced' && <div style={{display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12}}>
      <label><input type="checkbox" checked={vertical} onChange={event => setVertical(event.target.checked)}/>纵向排列</label>
      <button type="button" onClick={() => {setGeneration(value => value + 1); setSizes('');}}>复位布局</button>
    </div>}
    <div style={{height: 300, width: '100%', minWidth: 270, border, borderRadius: 10, overflow: 'hidden'}}>
      <Group
        key={`${level}:${orientation}:${generation}`}
        orientation={orientation}
        style={{height: '100%', width: '100%'}}
        onLayoutChanged={layout => setSizes(JSON.stringify(layout))}
      >
        <Panel id="library-explorer" defaultSize={level === 'basic' ? '35%' : '25%'} minSize="16%" maxSize="60%">
          <div style={{padding: 16, height: '100%', background: '#eef3eb', overflow: 'auto'}}>
            <strong>项目资源</strong>
            <p>src / components / routes</p>
            <p>支持最小宽度或高度约束，避免被拖成无法操作的区域。</p>
          </div>
        </Panel>
        <Separator id="library-separator-one" aria-label="调整项目资源和主编辑区域" style={handleStyle}/>
        <Panel id="library-main" defaultSize={level === 'basic' ? '65%' : '45%'} minSize="22%">
          <div style={{padding: 16, height: '100%', overflow: 'auto', background: '#fffef9'}}>
            <strong>{level === 'basic' ? '详情预览' : '代码工作区'}</strong>
            <p>真实的弹性面板内容。调整尺寸不需要给每个子组件写 window resize 监听。</p>
            <pre style={{fontSize: 12, whiteSpace: 'pre-wrap'}}>const example = 'ReactLoom';</pre>
          </div>
        </Panel>
        {level !== 'basic' && <>
          <Separator id="library-separator-two" aria-label="调整编辑区域和检查面板" style={handleStyle}/>
          <Panel id="library-inspector" defaultSize="30%" minSize="15%" maxSize="55%">
            <div style={{padding: 16, height: '100%', overflow: 'auto', background: '#f7f6ed'}}>
              <strong>属性检查器</strong>
              <p>查看所选节点、约束和状态。</p>
            </div>
          </Panel>
        </>}
      </Group>
    </div>
    <p role="status" style={{fontSize: 13, marginTop: 12}}>最近提交的布局（库返回的结构）：{sizes || '尚未调整'}</p>
    {level === 'advanced' && <p>注意 v4 的数字尺寸按像素解释，百分比使用明确的字符串（例如 25%）。</p>}
  </section>;
}
