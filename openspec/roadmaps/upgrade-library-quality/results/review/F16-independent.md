# F16 dependency-cruiser 独立复核

结论：**Spec PASS；质量六维分层通过，无新增实质缺陷。** 作者D04明确STABLE后才执行新fixture。只写本报告，未改entry/shared/队列，未扫描产品树或重跑作者六CLI/四policy/共享browser/build/full typecheck。独立产物只在ownedtmp，已清理。

## 六维与分层

| 维度 | 状态 / 证据 |
| --- | --- |
| 技术准确 | PASS实际CLI：18.5.0/MIT，原生ESM JS fixture；新双规则图真实CLI识别2模块/2错误，明确JSON exit0不是架构通过。TS7不兼容失败未隐去。 |
| 清楚解释 | PASS：静态import图不等于递归执行、unused或bundle体积；JSON结构与err退出分开；Node/TS支持与JS替代、公开报告路径信息边界清楚。 |
| 实验有用 | PASS Node：正常三层/domain反向UI/两节点环目标不同，作者原始双报告器分别检验；新独立双规则图不重复原fixture。browser仅展示待主控。 |
| 完整迁入 | PASS：13运行原件（加可选policy.test共14声明源）全部存在；配置、JS依赖边、cli/run/verify/policy齐。真正installed bin定位不依赖深层pnpm exec。Node版本和固定解析已说明。 |
| 官方可靠 | PASS复用固定原文证据：v18.5.0→0c973139131631d0b379f207d83285ddc464a881 README/LICENSE，7600/1086bytes和SHA与本地一致，MIT实装；GitHub deny/frame-ancestors none，blocked正确。 |
| 可复核结果 | PASS本地分层，formal NOT_RUN：六CLI原始命令/报告器/状态复用；本复核只新增1条真实JSON CLI、零新增纯policy套件；raw完整嵌下。browser展示不预支。 |

检索 `node packages/library-lab/scripts/find-library.mjs --id F16 --agent`，repo cwd，exit0；读取最终library/agent/guide/verification、全部运行源与原始records。recreated/目录收录不是SDK PASS。本文预检曾在作者修复中读取旧TS入口，最终判定基于其STABLE后的JS源码。

## 迁入与修复核查

实装manifest绝对路径 `/home/lambert/githubRepos/lambert/ReactLoom/node_modules/.pnpm/dependency-cruiser@18.5.0/node_modules/dependency-cruiser/package.json`：name dependency-cruiser、version18.5.0、licenseMIT、engines `^22||^24||>=26`；bin.depcruise=`bin/dependency-cruiser.mjs`。

初次预检require.resolve('dependency-cruiser/package.json')得到ERR_PACKAGE_PATH_NOT_EXPORTED，直接读实际安装symlink目标成功。这不是CLI失败。最终cli.mjs用import.meta.resolve主入口→../../package.json读取name/version与bin，再process.execPath执行，workspace cwd固定，不依赖深层pnpm命令解析；level和reporter双白名单，无任意shell，60s/8M缓冲。run透传JSON状态，verify才分别检验JSON结构与err状态，子进程无常驻服务清理承诺。

配置两条真实规则：domain→ui正则、to.circular；doNotFollow/exclude node_modules。basic main→domain/ui合法，business domain→UI违规，advanced循环仅导入，不实际调用递归。最终JS文件显式相对引用，作者保留TS7实际零模块/不支持解析日志，改原生ESM是诚实支持边界；不把它推广为TS7类型导入/别名已验。

所有sourceFiles存在：13运行原件=cli/run/verify/result-policy/config共5、basic3、business3、advanced2；可选policy.test使声明总14。每demo所需实际graph和launcher完整，React/env/服务器均不需要。作者ownedtmp migration证据复用，不额外执行全套迁入CLI。

## 作者有效现场证据复用（不重跑）

独立读validation/actual-cli-commands.json每条stdout并解析，结果：

| 场景 | json status / modules / summary.error | err status |
| --- | --- | --- |
| basic | 0 / 3 / 0 | 0 |
| business | 0 / 3 / 1 | 1 |
| advanced | 0 / 2 / 1 | 1 |

signal均null；业务错误名domain-must-not-import-ui、环错误no-circular-dependencies。verify-command最终exit0表示预期合同匹配，不是所有图无违规。初始pnpm解析254和TS7零模块原始红记录保留，修复后不是空图假绿。纯result-policy4项自建解析/退出合同测试，不计SDK；正式三项NOT_RUN仍合理。

## 独立最小新fixture：一条实际CLI

作者STABLE后复制最终config.cjs到 `/tmp/f16-independent-bg0i_9g6`，创建两个新JS模块：

```js
// domain/audit.js
import { chip } from '../ui/chip.js'
export const audit = value => chip(value)
// ui/chip.js
import { audit } from '../domain/audit.js'
export const chip = value => value ? String(value) : audit('fallback')
```

只扫描单个新entry；不执行这些函数、不访问HTTP、不扫描真实项目。实际cwd/argv/exit/stderr及外层断言输出如下：

```json
{
  "cwd": "/tmp/f16-independent-bg0i_9g6",
  "argv": [
    "node",
    "/home/lambert/githubRepos/lambert/ReactLoom/node_modules/.pnpm/dependency-cruiser@18.5.0/node_modules/dependency-cruiser/bin/dependency-cruiser.mjs",
    "--config",
    "config.cjs",
    "--output-type",
    "json",
    "domain/audit.js"
  ],
  "exitCode": 0,
  "stderr": "",
  "assertions": {
    "modules": 2,
    "errorRules": [
      "domain-must-not-import-ui",
      "no-circular-dependencies"
    ],
    "summaryErrors": 2,
    "scope": "actual dependency-cruiser JSON; no source execution, no err rerun"
  }
}
```

断言modules2、summary.error2、规则集合恰为上述两个，实际通过。新JSON进程0仍含2 errors，独立证实文档报告器边界；err模式复用作者现场合同，没有为独立fixture再跑完整双报告器。

可复现的独立脚本（仅ownedtmp写入，成功路径清理；运行成功后删除临时fixture）：

```python
import pathlib,tempfile,shutil,json,subprocess
root=pathlib.Path.cwd();entry=root/'packages/library-lab/entries/F16-dependency-cruiser';tmp=pathlib.Path(tempfile.mkdtemp(prefix='f16-independent-'));(tmp/'domain').mkdir();(tmp/'ui').mkdir();shutil.copy2(entry/'examples/workspace/config.cjs',tmp/'config.cjs');(tmp/'domain/audit.js').write_text("import { chip } from '../ui/chip.js'\nexport const audit = value => chip(value)\n");(tmp/'ui/chip.js').write_text("import { audit } from '../domain/audit.js'\nexport const chip = value => value ? String(value) : audit('fallback')\n")
pkg=(root/'packages/library-lab/node_modules/dependency-cruiser/package.json').resolve();data=json.loads(pkg.read_text());cli=pkg.parent/data['bin']['depcruise'];argv=['node',str(cli),'--config','config.cjs','--output-type','json','domain/audit.js'];r=subprocess.run(argv,cwd=tmp,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);report=json.loads(r.stdout);rules=sorted(set(v['rule']['name'] for v in report['summary']['violations']));assert set(rules)=={'domain-must-not-import-ui','no-circular-dependencies'};assert len(report['modules'])==2;assert report['summary']['error']==2;assert r.returncode==0
record=dict(cwd=str(tmp),argv=argv,exitCode=r.returncode,stderr=r.stderr,stdout=r.stdout,assertions=dict(modules=2,errorRules=rules,summaryErrors=2,scope='actual dependency-cruiser JSON; no source execution, no err rerun'))
pathlib.Path('/tmp/f16-independent-record.json').write_text(json.dumps(record,indent=2));print(json.dumps({k:v for k,v in record.items() if k!='stdout'},indent=2));shutil.rmtree(tmp)

```

此脚本在repo cwd `python3 /tmp/f16-independent.py` exit0。外层stdout如上；目标CLI stdout原字节全文如下（包含本地路径/运行版本，仅作为本地审计证据，外发前需审查）：

```json
{
  "modules": [
    {
      "source": "domain/audit.js",
      "dependencies": [
        {
          "module": "../ui/chip.js",
          "moduleSystem": "es6",
          "dynamic": false,
          "exoticallyRequired": false,
          "dependencyTypes": [
            "local",
            "import"
          ],
          "resolved": "ui/chip.js",
          "coreModule": false,
          "followable": true,
          "couldNotResolve": false,
          "matchesDoNotFollow": false,
          "circular": true,
          "cycle": [
            {
              "name": "ui/chip.js",
              "dependencyTypes": [
                "local",
                "import"
              ]
            },
            {
              "name": "domain/audit.js",
              "dependencyTypes": [
                "local",
                "import"
              ]
            }
          ],
          "valid": false,
          "rules": [
            {
              "severity": "error",
              "name": "domain-must-not-import-ui"
            },
            {
              "severity": "error",
              "name": "no-circular-dependencies"
            }
          ]
        }
      ],
      "dependents": [
        "ui/chip.js"
      ],
      "orphan": false,
      "valid": true
    },
    {
      "source": "ui/chip.js",
      "dependencies": [
        {
          "module": "../domain/audit.js",
          "moduleSystem": "es6",
          "dynamic": false,
          "exoticallyRequired": false,
          "dependencyTypes": [
            "local",
            "import"
          ],
          "resolved": "domain/audit.js",
          "coreModule": false,
          "followable": true,
          "couldNotResolve": false,
          "matchesDoNotFollow": false,
          "circular": true,
          "cycle": [
            {
              "name": "domain/audit.js",
              "dependencyTypes": [
                "local",
                "import"
              ]
            },
            {
              "name": "ui/chip.js",
              "dependencyTypes": [
                "local",
                "import"
              ]
            }
          ],
          "valid": false,
          "rules": [
            {
              "severity": "error",
              "name": "no-circular-dependencies"
            }
          ]
        }
      ],
      "dependents": [
        "domain/audit.js"
      ],
      "orphan": false,
      "valid": true
    }
  ],
  "summary": {
    "violations": [
      {
        "type": "dependency",
        "from": "domain/audit.js",
        "to": "ui/chip.js",
        "unresolvedTo": "../ui/chip.js",
        "dependencyTypes": [
          "local",
          "import"
        ],
        "rule": {
          "severity": "error",
          "name": "domain-must-not-import-ui"
        }
      },
      {
        "type": "cycle",
        "from": "domain/audit.js",
        "to": "ui/chip.js",
        "unresolvedTo": "../ui/chip.js",
        "dependencyTypes": [
          "local",
          "import"
        ],
        "rule": {
          "severity": "error",
          "name": "no-circular-dependencies"
        },
        "cycle": [
          {
            "name": "ui/chip.js",
            "dependencyTypes": [
              "local",
              "import"
            ]
          },
          {
            "name": "domain/audit.js",
            "dependencyTypes": [
              "local",
              "import"
            ]
          }
        ]
      }
    ],
    "error": 2,
    "warn": 0,
    "info": 0,
    "ignore": 0,
    "advisedExitCode": 2,
    "totalCruised": 2,
    "totalDependenciesCruised": 2,
    "optionsUsed": {
      "baseDir": "/tmp/f16-independent-bg0i_9g6",
      "combinedDependencies": false,
      "detectImportsInAmbientModules": false,
      "detectJSDocImports": false,
      "detectProcessBuiltinModuleCalls": false,
      "doNotFollow": {
        "path": "node_modules"
      },
      "exclude": {
        "path": "node_modules"
      },
      "exoticRequireStrings": [],
      "externalModuleResolutionStrategy": "node_modules",
      "metrics": false,
      "moduleSystems": [
        "es6",
        "cjs",
        "tsd",
        "amd"
      ],
      "outputTo": "-",
      "outputType": "json",
      "preserveSymlinks": false,
      "rulesFile": "config.cjs",
      "skipAnalysisNotInRules": false,
      "tsPreCompilationDeps": false,
      "args": "domain/audit.js"
    },
    "ruleSetUsed": {
      "forbidden": [
        {
          "name": "domain-must-not-import-ui",
          "comment": "领域层不应反向引用表示层",
          "severity": "error",
          "from": {
            "path": "(^|/)domain/"
          },
          "to": {
            "path": "(^|/)ui/"
          },
          "scope": "module"
        },
        {
          "name": "no-circular-dependencies",
          "comment": "循环依赖会使模块初始化难以推理",
          "severity": "error",
          "from": {},
          "to": {
            "circular": true
          },
          "scope": "module"
        }
      ]
    },
    "environment": {
      "version": "18.5.0",
      "nodeVersionSupported": "^22||^24||>=26",
      "nodeVersionFound": "v26.13.1",
      "osVersionFound": "x64 linux@7.2.5-3-omarchy",
      "transpilersFound": [
        {
          "name": "javascript",
          "version": "*",
          "available": true,
          "currentVersion": "acorn@8.18.0"
        },
        {
          "name": "babel",
          "version": ">=7.0.0 <8.0.0",
          "available": true,
          "currentVersion": "@babel/core@7.29.7"
        },
        {
          "name": "coffee-script",
          "version": ">=1.0.0 <2.0.0",
          "available": false,
          "currentVersion": "-"
        },
        {
          "name": "coffeescript",
          "version": ">=1.0.0 <3.0.0",
          "available": false,
          "currentVersion": "-"
        },
        {
          "name": "livescript",
          "version": ">=1.0.0 <2.0.0",
          "available": false,
          "currentVersion": "-"
        },
        {
          "name": "svelte",
          "version": ">=3.0.0 <6.0.0",
          "available": false,
          "currentVersion": "-"
        },
        {
          "name": "swc",
          "version": ">=1.0.0 <2.0.0",
          "available": false,
          "currentVersion": "-"
        },
        {
          "name": "typescript",
          "version": ">=2.0.0 <7.0.0",
          "available": false,
          "currentVersion": "-"
        },
        {
          "name": "vue-template-compiler",
          "version": ">=2.0.0 <3.0.0",
          "available": false,
          "currentVersion": "-"
        },
        {
          "name": "@vue/compiler-sfc",
          "version": ">=3.0.0 <4.0.0",
          "available": false,
          "currentVersion": "-"
        }
      ],
      "extensionsFound": [
        {
          "extension": ".js",
          "available": true
        },
        {
          "extension": ".cjs",
          "available": true
        },
        {
          "extension": ".mjs",
          "available": true
        },
        {
          "extension": ".jsx",
          "available": true
        },
        {
          "extension": ".ts",
          "available": false
        },
        {
          "extension": ".tsx",
          "available": false
        },
        {
          "extension": ".d.ts",
          "available": false
        },
        {
          "extension": ".cts",
          "available": false
        },
        {
          "extension": ".d.cts",
          "available": false
        },
        {
          "extension": ".mts",
          "available": false
        },
        {
          "extension": ".d.mts",
          "available": false
        },
        {
          "extension": ".vue",
          "available": false
        },
        {
          "extension": ".svelte",
          "available": false
        },
        {
          "extension": ".ls",
          "available": false
        },
        {
          "extension": ".coffee",
          "available": false
        },
        {
          "extension": ".litcoffee",
          "available": false
        },
        {
          "extension": ".coffee.md",
          "available": false
        },
        {
          "extension": ".csx",
          "available": false
        },
        {
          "extension": ".cjsx",
          "available": false
        }
      ]
    }
  }
}

```

## 官方与剩余边界

固定[sverweij/dependency-cruiser README](https://github.com/sverweij/dependency-cruiser/blob/0c973139131631d0b379f207d83285ddc464a881/README.md)原文SHA256 `84886df812fd8c6d7e1381922b269351c15b9bdb271bed82cb73136bd7099b53`，7600bytes；[MIT LICENSE](https://github.com/sverweij/dependency-cruiser/blob/0c973139131631d0b379f207d83285ddc464a881/LICENSE)SHA256 `046799de79c54f5366624ef97e3d5518afbefcd784a23aa74ef58d8f8bfcb2be`，1086bytes。本复核重新计算本地原件哈希，与固定source-evidence/metadata一致；作者已HTTP200 sameBytes校验，未重复网络下载。完整tree无主README中文候选，保留英文合理。官网为GitHub，保存响应XFO deny和CSP frame-ancestors none，blocked而非看200误判allowed。

无须作者整改。主控继续Lab三配方命令/源码/官方来源展示；无网页SDK、实际架构私有树、TS7/路径别名、动态依赖、生产删除或运行时行为验收。本报告完成停写。
