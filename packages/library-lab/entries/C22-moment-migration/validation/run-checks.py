import datetime, json, pathlib, shlex, subprocess

entry=pathlib.Path(__file__).resolve().parents[1]
root=entry.parents[3]
lab=root/'packages/library-lab'
ledger_path=entry/'validation/commands.json'
ledger=json.loads(ledger_path.read_text()) if ledger_path.exists() else []
checks=[
 ('sdk',['pnpm','test:sdk','--entry=C22'],lab),
 ('typecheck',['pnpm','exec','tsc','--ignoreConfig','--noEmit','--jsx','react-jsx','--target','es2022','--module','esnext','--moduleResolution','bundler','--strict','--skipLibCheck','--allowSyntheticDefaultImports','--esModuleInterop','--types','react,node','entries/C22-moment-migration/examples/example.tsx','entries/C22-moment-migration/examples/demo.tsx'],lab),
]
for name,argv,cwd in checks:
 start=datetime.datetime.now(datetime.timezone.utc).isoformat()
 result=subprocess.run(argv,cwd=cwd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 end=datetime.datetime.now(datetime.timezone.utc).isoformat()
 text=f'cwd={cwd}\ncommand={shlex.join(argv)}\nstartedAt={start}\nfinishedAt={end}\nexitCode={result.returncode}\n\n'+result.stdout
 log=entry/f'validation/{name}.txt';log.write_text(text)
 ledger.append({'name':name,'cwd':str(cwd),'argv':argv,'startedAt':start,'finishedAt':end,'exitCode':result.returncode,'log':str(log.relative_to(entry))})
 ledger_path.write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
 print(name,'exit',result.returncode)
