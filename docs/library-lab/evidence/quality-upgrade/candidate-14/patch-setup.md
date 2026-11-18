# RGL 2.3.0局部patch接线

原pnpm patch-commit在仓库cwd执行并自动解析整个workspace，下载阶段由root SIGINT停止，exit130。原lock SHA1d255c48…在中断后保持candidate14基线，node_modules没有完成改动。后续offline lock-only失败因无关Next metadata缺失；Python初次最小移锁工具失败因无PyYAML，未写锁，原始退出与诊断见执行记录。

隔离项目 .local-evidence/rgl-patch-isolated由pnpm10.33.3完成14包lock-only，得到官方patch hash65db3074ef40503b9bfda2b68c12c7d39c1aa7e93efc1fade47fcd6298552940。Node yaml解析确认隔离RGL依赖snapshot和原workspace完全相同，将patch mapping、Lab importer version及对应snapshot key移入原锁；其余所有解析值逐值相等断言通过。差异JSON见patch-lock-minimal-delta.json。

root pnpm install --frozen-lockfile --lockfile-only --offline --ignore-scripts exit0（353ms），随后filtered Lab pnpm install --frozen-lockfile --offline --ignore-scripts exit0（849ms），实际仅+1/-1，复用1、下载0。完整命令/cwd/输出/exit分别在patch-root-frozen-lock-fixed.txt、patch-root-install.txt。未执行hooks/生命周期脚本、未升级任何依赖，不停止现有预览。

仅RGL包替换为带精确hash的补丁实例，原上游版本仍2.3.0；ESM/CJS均清自有edge-scroll RAF。正式sdk/build/browser仍NOT_RUN。需要新candidate15真实active-unmount与原正常交互回归。
