# E04 CodeMirror6 非作者独立复核

2026-11-18，当前E04-codemirror6工作树。只写本报告，不改条目/共享文件、不跑作者完整套件或共享检查。按LIBRARY_CATALOG入口→metadata→agent→全部sourceFiles→verification→guide检索，另读local-validation、浏览器提案与固定官方材料。适用质量skill沿用本会话已读规范。

结论：Spec与静态质量、独立真实State消费及迁入编译PASS，未发现实质实现缺陷。EditorView/用户输入/存储异常/销毁浏览器验收仍NOT_RUN，正式收据不改。现有proposal需主控补空文本恢复与Storage get/set异常覆盖，不把静态try/catch当已执行。

## 隔离迁入与实际命令

把原件editor-config.mjs/.d.mts、draft-policy.mjs/.d.mts复制至独有/tmp目录，node_modules仅链接现有Lab依赖。没有改原件、安装包或生成共享文件。不同fixture为`export const answer: number = 7;`，consumer只通过实际导出配置与策略创建EditorState。

最终编译cwd `/home/lambert/githubRepos/lambert/ReactLoom`，argv：

```text
pnpm exec tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck /tmp/e04-independent-6tdg287f/consumer.mts
```

exit0、stdout/stderr空。严格检查消费者与迁入声明使用，不检查第三方声明库内部（skipLibCheck），不等于全Lab typecheck或React UI编译。

执行cwd `/tmp/e04-independent-6tdg287f`，argv `node consumer.mts`，exit0，实际输出：

```json
{"trial":"PASS","originalUnchanged":true,"transaction":"7→42","readOnlyFacet":true,"programDispatchAllowed":true,"reconfiguredWritable":true,"emptyDraft":true,"maxUTF16":50000}
```

验证真实State事务保留旧快照，将7替换42；Compartment重配readOnly后facet为true，但程序transaction仍可追加文本；再次重配恢复false。空草稿、恰好50k接受，NUL与50001拒绝。没有DOM、键盘、Storage或EditorView执行，不把本输出当这些能力的证据。临时目录最后仅删除自己创建的目录。

消费者启动初次在临时目录直接pnpm exec失败（无package），加manifest后symlink的pnpm tsc wrapper相对定位错误，随后根cwd的--types node又未解析临时Node类型；均为隔离工具入口问题，未运行条目代码。最终去除不必要Node断言依赖，使用前端consumer本地check，根cwd启动编译通过。不隐去这些启动失败，不将其记作SDK失败。

## 六维复核

|要求|状态与证据层级|
|---|---|
|技术准确|PASS：真实State+源码。不可变transaction、tabSize2、TypeScript语法扩展、basicSetup与Compartment共用实际配置。readOnly限制用户编辑、不禁程序dispatch，非ACL，文档说明准确。|
|解释清楚|PASS：静态。选型→State/View/事务所有权→完整配置/迁入→三目标→输入/恢复/销毁边界；不把语法着色当类型检查。|
|Demo有用|设计/State层PASS，DOM运行NOT_RUN。输入/高亮/undo、会话草稿、同View只读/生命周期为独立目标；浏览器真实操作由主控。|
|源码可迁移|PASS：四个配置/策略原件与类型复制后strict消费者编译、真实SDK执行。完整UI另有example.tsx、theme/updateListener、ReactDOM/effect与精确三依赖；无Provider/env/独立CSS/Worker。|
|官方来源可靠|PASS：原字节与安装字段。codemirror/basic-setup6.0.2固定commit76462c05acb10fe77e0f04edd7fcddfeb9987abd README本地/独立raw SHA均4808b9e09e924d88f61d141714fa99bf40f03195f529b7f0fa66f501fc2e8964。三包实际6.0.2/state6.7.6/lang-javascript6.2.5均MIT；README只代表集成包，独立版本映射明确。保存及本次官网GET无明确frame限制，unknown不冒称allowed。|
|结果可复核|Node局部PASS；DOM/正式收据NOT_RUN。作者真实State3与policy3分列，独立consumer另列，未重复全部套件；白盒生命周期提案有安装源码依据，尚需实际浏览器执行。|

## View生命周期和草稿边界

已核对实际@codemirror/view6.43.15的dist/index.js：EditorView.findFromDOM经.cm-content→Tile.get→tile.root.view取实例；proposal的cmTile.root.view沿相同关联。destroy实际调用plugin/inputState/docView/observer清理、取消测量与计时器，最后置destroyed=true。外部JSHandle持有这个真实View，检查同View身份及最终destroyed，证据强于只看DOM消失；探针属于固定版本内部实现，升级须复核，不能当稳定产品API。

React创建effect仅依赖level，每次有自己的config/Compartment/View；cleanup清本次viewRef再destroy。只读effect重新配置已有View，updateListener为View扩展，无另挂的全局监听。程序重置在只读下仍可更新，现有proposal明确检验这一点。没有Worker、语言服务器、网络或外部资源，不虚构其清理。

草稿是普通字符串，不是JSON。空字符串通过saved!==null路径保留；assertDraftText在初始化、保存、恢复边界检查类型/UTF16码元50000/NUL，恢复校验前不dispatch。sessionStorage读写均try/catch，只动一个本key，不clear全局；业务初始化遇Storage异常回退默认并提示。50k不限制实时键入长度，也不是性能证明。

待主控补验：合法空字符串保存/恢复；临时仅本key的getItem/setItem抛错时可见错误且当前文本保持。现有proposal已有合法恢复/NUL/超限、同View只读、外部destroy，静态实现对这两个余项无明显缺陷。真实中文候选输入、移动键盘/辅助技术仍人工NOT_RUN，不由Node事务或合成键盘推断。

报告完成，停止写入。
