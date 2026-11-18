import{s as e}from"./rolldown-runtime-BcKkbAw3.js";import{n as t,t as n}from"./jsx-runtime-AVt7Hd0a.js";import{n as r}from"./lib-DRRTRmhG.js";import{t as i}from"./lib-Bo_FLk3b.js";import{t as a}from"./lib-BwjyqhQH.js";var o=e(t(),1),s=e=>Array.from(e).some(e=>{let t=e.codePointAt(0);return t<=32||t===127||t===92});function c(e){if(typeof e!=`string`||s(e))return``;if(e.startsWith(`#`))return/^#[a-z0-9_.:-]+$/iu.test(e)?e:``;try{let t=new URL(e);return t.protocol!==`https:`||!t.hostname||t.username||t.password?``:t.href}catch{return``}}var l={a:({href:e,children:t})=>{let n=c(e);return n?(0,o.createElement)(`a`,{href:n,target:n.startsWith(`#`)?void 0:`_blank`,rel:n.startsWith(`#`)?void 0:`noopener noreferrer`},t):(0,o.createElement)(`span`,{title:`已移除不安全链接`},t)},img:({alt:e})=>(0,o.createElement)(`span`,null,`[图片外链被禁用：${e??`无描述`}]`)},u=n(),d={basic:`# ReactLoom Markdown

**加粗**、行内 \`code\`，以及 [官方文档](https://github.com/remarkjs/react-markdown)。`,business:`# 接口验收报告

| 场景 | 状态 |
| --- | --- |
| 请求成功 | PASS |
| 超时取消 | NOT_RUN |

- [x] 模型校验
- [ ] 浏览器复查
`,advanced:`# 不可信内容

[伪造链接](javascript:alert(1))

<img src=x onerror=alert(1)>

<script>alert(1)<\/script>

![远程图片](https://example.invalid/e06-tracker.png)`};function f({level:e}){let[t,n]=(0,o.useState)(d[e]);return(0,o.useEffect)(()=>{n(d[e])},[e]),(0,u.jsxs)(`section`,{"aria-label":`react-markdown 真实渲染实验`,children:[(0,u.jsx)(`h2`,{children:`可编辑 Markdown`}),(0,u.jsx)(`p`,{children:`从左侧原文实时渲染；原文不会被当作可执行 JSX 或脚本。`}),(0,u.jsx)(`label`,{htmlFor:`md-source`,children:`Markdown 输入`}),(0,u.jsx)(`textarea`,{id:`md-source`,"aria-label":`Markdown 输入`,rows:10,style:{width:`100%`,padding:12,display:`block`,marginBottom:16},value:t,maxLength:12e3,onChange:e=>n(e.target.value)}),(0,u.jsx)(`button`,{type:`button`,onClick:()=>n(d[e]),children:`重置样例`}),(0,u.jsx)(`section`,{"data-testid":`markdown-preview`,"aria-label":`安全渲染预览`,style:{border:`1px solid #cad7c9`,padding:18,marginTop:16,borderRadius:8},children:(0,u.jsx)(a,{remarkPlugins:[r],rehypePlugins:[i],skipHtml:!0,urlTransform:c,components:l,children:t})}),e===`advanced`&&(0,u.jsx)(`p`,{role:`status`,children:`尝试插入 script、事件属性、javascript: URL 或远程跟踪图，确认没有任何代码执行。`})]})}export{f as default};