# F12 Vitest 非作者独立复核

结论：Spec与质量在本地Node范围PASS，无实质阻断发现。只写本报告；未改entry/shared，不重跑作者19项、不跑共享检查/browser。正式verification无receipt仍NOT_RUN准确。

| 六项 | 状态 / 独立证据 |
| --- | --- |
| 技术准确 | PASS真实runner+静态：Vitest5.0.5运行新2项，响应是进程内fixture，fake timers是虚拟时钟，非HTTP/浏览器。 |
| 解释清楚 | PASS：domain与Vitest分离，规范化非SSRF，after3不是Retry-After，取消/忽略迟到非强制终止。 |
| 实验有效 | PASS Node：URL、响应矩阵、取消竞态三个独立任务；新消费者进一步检查201正常结果、422解析中abort、旧finally与新controller、恢复后timerCount0。 |
| 源码完整 | PASS strict：复制原五文件（配置+domain+三测试）及新测试严格编译exit0；专用配置root明确，不继承宿主Vite。 |
| 官方可靠 | PASS：固定7a825db43e2beca0b219d2eadaec334cb81af0c7 README SHA e8ebb122af88ef7d54982ada599ffbc3321db6d57f3902b800031d7745b7bdde及LICENSE原字节重新GET比对一致；MIT/5.0.5实际字段匹配；保存homepage HTTP200/XFO DENY支持blocked。 |
| 结果可复核 | PASS本地：下面真实argv/cwd/exit/output及完整新消费者可重现；browser只检查静态CLI展示，由主控，不称Node证明UI。 |

核心审计：verifyCode在调用前/响应后/JSON后requireActive，503不消费JSON；createLatestRequest run先abort旧controller再增generation，finally检查current身份，cancel可重复，过期成功/错误返回null；当前错误抛出。调用方对卸载需自己cancel；忽略abort的底层工作不会物理停止。fake timer fixture的成功/abort分支均清listener，abort清timer，afterEach恢复真时钟。合法null与过期null混淆已在限制说明，不隐瞒。

当前catalog/agent/guide/实际五文件/verification/local-validation均读取；独占Vitest配置include仅三作者文件。新consumer使用自己临时配置，仅收集independent.test.ts，不重复原19项。网页短命令缺--config的共享接线已由作者向主控报告，guide/agent给出真正带--config命令；本报告未替共享短命令背书。

## 真实独立执行

cwd `/home/lambert/githubRepos/lambert/ReactLoom`。

`pnpm --filter @reactloom/library-lab exec tsc -p /tmp/f12-independent-xh1t02az/tsconfig.json` exit0，输出空。

`pnpm --filter @reactloom/library-lab exec vitest run --root /tmp/f12-independent-xh1t02az --config /tmp/f12-independent-xh1t02az/independent.config.ts --reporter=verbose` exit0：

```text
RUN v5.0.5 /tmp/f12-independent-xh1t02az
✓ independent.test.ts > new URL and response fixture with real Vitest runner 17ms
✓ independent.test.ts > old completion cannot erase new controller, and timer is cleaned by consumer 2ms
Test Files 1 passed (1)
Tests 2 passed (2)
Start at 02:56:24
Duration 107ms (tests 46%, transform 35%, import 14%, worker 5%)
```

两个断言组是真实Vitest runner能力使用，其业务是自建policy/Response doubles，不另重复计policy套件。最初临时目录直接pnpm exec两次exit1：先No package found，再因pnpm .bin相对symlink解析到/node_modules失败；这些是独立试验布局问题。改从真实Lab cwd调用已安装CLI，显式--root/绝对--config后成功；没有改依赖或假装前两次通过。

官方Python urllib固定raw GET与本地readme/LICENSE比较exit0：`Fixed README SHA e8ebb122af88ef7d54982ada599ffbc3321db6d57f3902b800031d7745b7bdde and LICENSE original bytes MATCH`。保存头X-Frame-Options DENY实际核对；未重跑浏览器iframe。临时目录仅本次创建并清理。

## 完整新消费者重现

把下列Python存到临时文件，在repo root执行；其复制原件、类型检查并运行两个新fixture，不收集作者套件。

```python
import pathlib,tempfile,shutil,json,subprocess
root=pathlib.Path.cwd();src=root/'packages/library-lab/entries/F12-vitest';tmp=pathlib.Path(tempfile.mkdtemp(prefix='f12-independent-',dir='/tmp'));(tmp/'node_modules').symlink_to(root/'packages/library-lab/node_modules');(tmp/'examples').mkdir();(tmp/'package.json').write_text('{"name":"f12-independent","private":true,"type":"module"}')
for n in ['domain.ts','basic.test.ts','business.test.ts','advanced.test.ts']:shutil.copy(src/'examples'/n,tmp/'examples'/n)
shutil.copy(src/'vitest.config.ts',tmp/'vitest.config.ts')
(tmp/'independent.config.ts').write_text("import {defineConfig} from 'vitest/config';export default defineConfig({test:{environment:'node',include:['independent.test.ts']}})")
(tmp/'independent.test.ts').write_text('''import {it,expect,vi,afterEach} from 'vitest';
import {normalizeFeedURL,verifyCode,createLatestRequest} from './examples/domain';
afterEach(()=>vi.useRealTimers());
it('new URL and response fixture with real Vitest runner',async()=>{
 expect(normalizeFeedURL('https://ORION.example:443/a?q=42#x')).toBe('https://orion.example/a?q=42');
 const controller=new AbortController();
 expect(await verifyCode(async signal=>{expect(signal).toBe(controller.signal);return new Response(JSON.stringify({message:'Orion 42'}),{status:201})},controller.signal)).toEqual({kind:'ok',message:'Orion 42'});
 const reading=new AbortController();
 const response=new Response('{}',{status:422});vi.spyOn(response,'json').mockImplementation(async()=>{reading.abort();return {code:'ORION'}});
 await expect(verifyCode(async()=>response,reading.signal)).rejects.toMatchObject({name:'AbortError'});
});
it('old completion cannot erase new controller, and timer is cleaned by consumer',async()=>{
 vi.useFakeTimers();const signals:AbortSignal[]=[];let count=0;let finishOld!:(value:string)=>void;
 const manager=createLatestRequest<string>(signal=>{signals.push(signal);if(++count===1)return new Promise(resolve=>{finishOld=resolve});return new Promise(resolve=>{const timer=setTimeout(()=>{signal.removeEventListener('abort',stop);resolve('new')},33);const stop=()=>{clearTimeout(timer);signal.removeEventListener('abort',stop);resolve('stopped')};signal.addEventListener('abort',stop,{once:true})})});
 const old=manager.run(),latest=manager.run();finishOld('old');expect(await old).toBeNull();manager.cancel();expect(signals[1].aborted).toBe(true);expect(await latest).toBeNull();expect(vi.getTimerCount()).toBe(0);
 const recovered=manager.run();await vi.advanceTimersByTimeAsync(33);expect(await recovered).toBe('new');expect(vi.getTimerCount()).toBe(0);
});
''')
(tmp/'tsconfig.json').write_text(json.dumps({'compilerOptions':{'strict':True,'noEmit':True,'jsx':'react-jsx','target':'ES2022','module':'ESNext','moduleResolution':'Bundler','types':['node'],'skipLibCheck':True},'include':['*.ts','examples/*.ts']}))
for cmd,cwd in [(f'pnpm --filter @reactloom/library-lab exec tsc -p {tmp}/tsconfig.json',root),(f'pnpm --filter @reactloom/library-lab exec vitest run --root {tmp} --config {tmp}/independent.config.ts --reporter=verbose',root)]:
 r=subprocess.run(cmd,cwd=cwd,shell=True,text=True,capture_output=True);print(json.dumps({'cwd':str(cwd),'argv':cmd,'exit':r.returncode,'output':r.stdout+r.stderr},ensure_ascii=False))
shutil.rmtree(tmp)

```
