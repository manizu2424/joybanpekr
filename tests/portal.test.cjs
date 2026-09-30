const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Node {
    constructor(tag) { this.tagName=tag.toUpperCase(); this.children=[]; this.attributes={}; this._text=''; }
    set textContent(text) { this._text=String(text); this.children=[]; }
    get textContent() { return this._text + this.children.map(child=>child.textContent).join(''); }
    append(...children) { this.children.push(...children); }
    setAttribute(key,value) { this.attributes[key]=value; }
    addEventListener() {}
}
function context() {
    const ctx=vm.createContext({URL,URLSearchParams,setTimeout,clearTimeout,document:{createElement:tag=>new Node(tag),addEventListener(){}},window:{addEventListener(){}}});
    vm.runInContext(fs.readFileSync('js/portal.js','utf8'),ctx);
    return ctx;
}
function flatten(node) { return [node,...node.children.flatMap(flatten)]; }
test('HTTP(S) 링크만 허용하고 인증 정보·스크립트 URL 거부',()=>{
    const ctx=context();
    for (const value of ['javascript:alert(1)','data:text/html,test','file:///tmp/a','https://user:pass@example.com/','/local','broken']) assert.equal(ctx.safeLinkURL(value),null);
    assert.equal(ctx.safeLinkURL('https://example.com/path?q=1').hostname,'example.com');
});
test('자료 제목·메모·태그를 HTML로 해석하지 않음',()=>{
    const ctx=context(); const payload='<img src=x onerror=alert(1)>';
    const card=ctx.renderLink({id:1,title:payload,url:'javascript:alert(1)',description:payload,tags:[payload],category:'ai',kind:'article',visibility:'private',is_read:false,is_favorite:false});
    const nodes=flatten(card);
    assert.ok(card.textContent.includes(payload));
    assert.ok(nodes.every(node=>!['IMG','SCRIPT','A'].includes(node.tagName)));
    assert.ok(!card.textContent.includes('나만 보기'));
    assert.ok(!card.textContent.includes('안 읽음'));
});
test('외부 링크의 안전 설정과 중복 태그 정규화',()=>{
    const ctx=context();
    const card=ctx.renderLink({id:1,title:'Python',url:'https://example.com',tags:[],category:'python',kind:'site'});
    const link=flatten(card).find(node=>node.tagName==='A');
    assert.equal(link.rel,'noopener noreferrer'); assert.equal(link.target,'_blank');
    assert.deepEqual(Array.from(ctx.splitTags('API, Python, API, ,')),['API','Python']);
});
test('게시판 URL의 알 수 없는 카테고리는 허용된 기본값으로 대체된다',async()=>{
    const list={innerHTML:''};
    const ctx=vm.createContext({console:{log(){},error(){}},URL,URLSearchParams,window:{location:{pathname:'/board.html'}},
        document:{readyState:'loading',addEventListener(){},body:{dataset:{}},querySelector:s=>s==='.post-list'?list:null,querySelectorAll:()=>[]},
        fetch:async()=>({ok:true,json:async()=>({status:'success',data:[],total_count:0})})});
    vm.runInContext(fs.readFileSync('js/app.js','utf8'),ctx);
    await ctx.loadBoardPosts('<img src=x onerror=alert(1)>');
    assert.ok(!list.innerHTML.includes('<img')); assert.ok(list.innerHTML.includes('AI 이야기'));
    ctx.fetch=async()=>({ok:false,json:async()=>({status:'error'})});
    await ctx.loadBoardPosts('works'); assert.ok(list.innerHTML.includes('불러오지 못했습니다'));
});
