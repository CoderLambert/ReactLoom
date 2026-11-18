# E02 BlockNote 迁入指南

适用于现成块UI、菜单与JSON文档；完全自绘评估Tiptap。核心/React/Mantine0.56.0为MPL-2.0，实装package与固定LICENSE.txt双核。未引入XL/上传/协作。

已有React/TSX DOM宿主执行`pnpm add @blocknote/core@0.56.0 @blocknote/react@0.56.0 @blocknote/mantine@0.56.0 @mantine/core@9.7.3 @mantine/hooks@9.7.3`。复制example.tsx和snapshot-policy.mjs/.d.mts；demo.tsx仅转发。保留Mantine style.css和core/fonts/inter.css；已有MantineContext时复用，否则View自包Provider。无env/后端。Mantine9.7.3要求React/ReactDOM^19.2.0；blocknote/mantine peer支持^8.3.11||^9.0.2。utils6.0.22是Lab另一个实际pin，UI未直接导入，不凭版本号判定不兼容。

editor.document是事实源，initialContent只创建时读。保存和恢复均先parseBlockSnapshot，未知/非法/超限内容在replaceBlocks前拒绝；读写Storage均try/catch，仅处理reactloom.lab.E02.blocknote.blocks.v1。默认菜单比恢复白名单宽；媒体、表格、代码等不能通过当前保存合同。恢复时递归删除id，让SDK重新生成。不要声称replaceBlocks异常必定回滚。

有限恢复五类paragraph/heading/bulletListItem/numberedListItem/checkListItem，已知props及文本/HTTPS链接，60000UTF16单元、100总块、深度8。不是完整BlockNote schema或HTML净化。生产外来JSON需版本化契约。输入法组合期间不保存/恢复/插入，平时不在onChange中整篇replace。

onChange返回unsubscribe，effect cleanup执行；useCreateBlockNote只是useMemo创建，View卸载调用editor.unmount。不要从DOM消失编造destroy证据。key=level使每场景新建，产品按documentId。无全局缓存清理/上传/网络；不修改其他Storage键。

应用策略与 DOM SDK 分项，实际 Chromium 记录见 local-validation.md。测试应验证编辑菜单、onChange、insertBlocks、合法恢复新id、损坏/超限/非法不改内容、Storage异常以及重挂载，不将组件消失等同destroy。

固定官方来源TypeCellOS/BlockNote@8e0485caef54abe9cad6b84fa66505e0398acb79的原README/LICENSE；无官方中文原文则language=en。主页unknown，HTTP200不是嵌入PASS。正式sdk/build/browser无匹配receipt保持NOT_RUN。
