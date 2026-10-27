// Parse genuine report bytes after Vite exits. Does not mock rollup-plugin-visualizer.
export function checkVisualizerReport(level,text,assetFiles=[]) {
  if(!['basic','business','advanced'].includes(level))throw Error('Unknown report mode');
  if(typeof text!=='string'||Buffer.byteLength(text)<100)throw Error('Report missing or too short');
  if(level==='basic') {
    if(!/<html[\s>]/i.test(text)||!/<\/html>/i.test(text))throw Error('Expected HTML report');
  }else if(level==='business'){
    if(!/^#\s/m.test(text)||!/\|.+\|/m.test(text))throw Error('Expected Markdown table report');
  }else{
    let raw;
    try{raw=JSON.parse(text)}catch{throw Error('Malformed raw-data JSON')}
    if(!raw||typeof raw!=='object'||!['string','number'].includes(typeof raw.version))
      throw Error('Expected versioned raw-data report');
    const js=assetFiles.filter(name=>/^[^/\\]+\.js$/i.test(name));
    if(js.length<2)throw Error('Actual Vite build must split the dynamic import chunk');
  }
  return true;
}
