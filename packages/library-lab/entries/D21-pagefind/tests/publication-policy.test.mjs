import test from 'node:test';
import assert from 'node:assert/strict';
import {assertPublicDocument, escapeHtmlText} from '../examples/publication-policy.mjs';
const publicDoc={url:'/articles/rss/',visibility:'public',title:'RSS',content:'Only public docs'};
test('public allowlist explicitly accepts reviewed fixture',()=>{
 assert.equal(assertPublicDocument(publicDoc),publicDoc);
});
test('fail closed for unpublished documents and unsafe paths',()=>{
 for(const payload of [
  {...publicDoc,visibility:'private'}, {...publicDoc,visibility:undefined},
  {...publicDoc,url:'https://other.test/articles/rss/'},
  {...publicDoc,url:'/articles/../private/secret'},
  {...publicDoc,url:'//external.test/articles/rss/'},
  {...publicDoc,url:'/articles/rss/?token=sensitive'},
 ]) assert.throws(()=>assertPublicDocument(payload),/Pagefind/);
});
test('HTML escaping prevents fixture text from becoming executable markup',()=>{
 assert.equal(escapeHtmlText('<img src=x onerror="alert(1)">&\''), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;');
});
