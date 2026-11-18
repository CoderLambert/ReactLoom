# E01 Tiptap 工程复用

适用：自定义富文本工具栏/结构化JSON；不是现成块UI、HTML净化器、上传或协作服务。固定react/pm/starter-kit3.32.0，实际package与上游MIT；不继承云平台许可。

已有React/TS安装三包同版本。复制example.tsx、editor-config.ts、snapshot-policy.mjs/.d.mts、snapshot-storage.mjs/.d.mts；demo.tsx可省。TS bundler解析、浏览器DOM，SSR使用客户端边界。无需Provider/env/额外CSS插件/服务。

配置不可删：createExtensions中的标题2/3级和HTTPS Link限制，START结构化文档，immediatelyRender:false。StarterKit已有UndoRedo/Link/Underline，不重复扩展。正文在Editor，不逐键getJSON→setContent。

恢复必须policy→真实editor.schema.nodeFromJSON(...).check()→setContent(errorOnInvalidContent:true)，全部验证前不改变文档。大小20,000码元/节点500/深度12为演示边界；新增schema同步策略。禁止HTML注入、未校验远端JSON、失败时清空正文。Storage异常可见，只读写reactloom.lab.E01.tiptap.draft.v1，不clear全局，不将fake策略异常当浏览器配额实测。

useEditor owns destroy；update on/off函数身份相同，key=level换实例。浏览器需实际editor.isDestroyed、自己的off调用与事件清空，DOM消失不够。真实IME/移动键盘人工验收；没有协作、自动保存、图片、后端版本或持久化迁移。

测试：真实SDK套件只验证相同配置Schema roundtrip及非法结构拒绝，policy套件单列。Browser提案检查格式/undo/草稿/JSON前后内容不变/Hook清理。无正式收据verification均NOT_RUN。
