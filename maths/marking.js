/* Melchior's Maths Lab — answer marking engine (works in the browser and in Node). */
(function(root){
'use strict';
const SUP={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-'};
function clean(s){
 s=String(s==null?'':s).normalize('NFKC');
 // NFKC turns ² into 2, so map superscripts first from the raw string
 return s;
}
function prep(raw){
 let s=String(raw==null?'':raw);
 s=s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g,m=>'^'+(m.length>1||m==='⁻'?'(':'')+[...m].map(c=>SUP[c]).join('')+(m.length>1||m==='⁻'?')':''));
 s=s.replace(/[×·∙⋅✕]/g,'*').replace(/÷/g,'/').replace(/[−–—]/g,'-').replace(/½/g,'(1/2)');
 s=s.replace(/\*\*/g,'^');
 return s.toLowerCase().trim();
}
/* ---------- numbers ---------- */
const UNIT_RE=/^(mm|cm|m|km)(\^?[23])?$|^(cm\^?3|ml|millilit(re|er)s?|l|lit(re|er)s?)$|^(°|degrees?|deg)$|^(£|pounds?|p|pence)$|^[a-z]+$/;
function unitKey(u){
 u=u.replace(/\s+/g,'').replace(/\^/g,'');
 if(/^(°|degrees?|deg)$/.test(u))return '°';
 if(/^lit(re|er)s?$|^l$/.test(u))return 'litres';
 if(/^(mm|cm|m|km)[23]?$/.test(u))return u;
 return null;
}
function expectedUnitKey(u){if(!u)return null;return unitKey(u.replace('²','2').replace('³','3'));}
function parseNumber(str){
 // returns {value, unit} or null
 let s=String(str).trim().toLowerCase();
 s=s.replace(/[−–—]/g,'-').replace(/²/g,'2').replace(/³/g,'3');
 s=s.replace(/^[a-z]\s*=\s*/,'');             // x = 5
 s=s.replace(/^£\s*/,'');
 s=s.replace(/\s*(=|is)\s*$/,'');
 const m=s.match(/^([-+]?(?:\d[\d\s,]*(?:\.\d+)?|\.\d+)(?:\s*½)?(?:\s*\d+\s*\/\s*\d+)?)\s*(.*)$/);
 if(!m)return null;
 let num=m[1].trim(),rest=m[2].trim();
 if(rest.startsWith('/')){ // simple fraction like 25/3
  const f=s.match(/^([-+]?\d+)\s*\/\s*(\d+)\s*(.*)$/);
  if(!f||Number(f[2])===0)return null;num=null;var val=Number(f[1])/Number(f[2]);rest=f[3].trim();
 }
 if(num!==null){
  let half=0;if(num.includes('½')){half=0.5;num=num.replace('½','').trim();}
  let frac=0;const fm=num.match(/^(.*\d)\s+(\d+)\s*\/\s*(\d+)$/);if(fm){num=fm[1];frac=Number(fm[2])/Number(fm[3]);}
  let n=num.replace(/\s+/g,' ');
  // thousands separators: groups of exactly 3 digits
  if(/^[-+]?\d{1,3}([ ,]\d{3})+(\.\d+)?$/.test(n))n=n.replace(/[ ,]/g,'');
  else if(/^[-+]?\d+,\d+$/.test(n))n=n.replace(',','.'); // decimal comma
  if(!/^[-+]?(\d+(\.\d+)?|\.\d+)$/.test(n))return null;
  val=Number(n);const sign=val<0||n.startsWith('-')?-1:1;val=val+sign*(half+frac);
 }
 rest=rest.replace(/^(of|in)\s+/,'').trim();
 if(rest&&!/^[a-z°£\s^0-9]+$/.test(rest))return null;
 if(rest&&/\d/.test(rest.replace(/^(mm|cm|m|km)\s*\^?\s*[23]/,'')))return null;
 return {value:val,unit:rest||null};
}
function nearlyEqual(a,b){return Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));}
/* ---------- algebra parser ---------- */
function tokenize(s){
 const toks=[];let i=0;
 while(i<s.length){
  const c=s[i];
  if(/\s/.test(c)){i++;continue;}
  if(/[0-9.]/.test(c)){let j=i;while(j<s.length&&/[0-9.]/.test(s[j]))j++;const t=s.slice(i,j);if((t.match(/\./g)||[]).length>1||t==='.')throw new Error('bad number');toks.push({t:'num',v:Number(t)});i=j;continue;}
  if(/[a-z]/.test(c)){toks.push({t:'var',v:c});i++;continue;}
  if('+-*/^()'.includes(c)){toks.push({t:c});i++;continue;}
  if(c==='['||c==='{'){toks.push({t:'('});i++;continue;}
  if(c===']'||c==='}'){toks.push({t:')'});i++;continue;}
  throw new Error('bad char '+c);
 }
 return toks;
}
function parseExpr(raw){
 const s=prep(raw);if(!s)throw new Error('empty');
 const toks=tokenize(s);let p=0;const flags={caretless:false};
 const peek=()=>toks[p],next=()=>toks[p++];
 function sum(){
  const terms=[];let sign=1;
  if(peek()&&(peek().t==='+'||peek().t==='-')){sign=next().t==='-'?-1:1;}
  terms.push({sign,node:product()});
  while(peek()&&(peek().t==='+'||peek().t==='-')){const sg=next().t==='-'?-1:1;terms.push({sign:sg,node:product()});}
  return terms.length===1&&terms[0].sign===1?terms[0].node:{t:'add',terms};
 }
 function product(){
  const factors=[{node:unary(),div:false}];
  for(;;){
   const k=peek();if(!k)break;
   if(k.t==='*'||k.t==='/'){next();factors.push({node:unary(),div:k.t==='/'});continue;}
   if(k.t==='num'||k.t==='var'||k.t==='('){
    const prev=factors[factors.length-1].node;
    if(k.t==='num'&&prev.t==='var'&&!prev.paren){ // x2 → x^2
     next();flags.caretless=true;factors[factors.length-1].node={t:'pow',b:prev,e:{t:'num',v:k.v}};continue;}
    if(k.t==='num'&&prev.t==='pow'&&!prev.paren&&!prev.e.paren){throw new Error('ambiguous');}
    factors.push({node:power(),div:false,implicit:true});continue;
   }
   break;
  }
  return factors.length===1?factors[0].node:{t:'mul',factors};
 }
 function unary(){const k=peek();if(k&&k.t==='-'){next();return {t:'neg',x:unary()};}if(k&&k.t==='+'){next();return unary();}return power();}
 function power(){
  const b=atom();
  if(peek()&&peek().t==='^'){next();let e;
   if(peek()&&peek().t==='-'){next();e={t:'neg',x:atom()};}else e=atom();
   if(peek()&&peek().t==='^')throw new Error('stacked powers');
   return {t:'pow',b,e};}
  return b;
 }
 function atom(){
  const k=next();if(!k)throw new Error('unexpected end');
  if(k.t==='num')return {t:'num',v:k.v};
  if(k.t==='var')return {t:'var',v:k.v};
  if(k.t==='('){const e=sum();const c=next();if(!c||c.t!==')')throw new Error('missing )');return Object.assign({},e,{paren:true});}
  throw new Error('unexpected '+k.t);
 }
 const tree=sum();if(p!==toks.length)throw new Error('trailing');
 return {tree,flags};
}
function evalNode(n,env){
 switch(n.t){
  case 'num':return n.v;
  case 'var':return n.v in env?env[n.v]:NaN;
  case 'neg':return -evalNode(n.x,env);
  case 'add':return n.terms.reduce((s,t)=>s+t.sign*evalNode(t.node,env),0);
  case 'mul':return n.factors.reduce((s,f)=>f.div?s/evalNode(f.node,env):s*evalNode(f.node,env),1);
  case 'pow':return Math.pow(evalNode(n.b,env),evalNode(n.e,env));
 }
 return NaN;
}
function varsOf(n,set=new Set()){
 if(n.t==='var')set.add(n.v);else if(n.t==='neg')varsOf(n.x,set);else if(n.t==='add')n.terms.forEach(t=>varsOf(t.node,set));else if(n.t==='mul')n.factors.forEach(f=>varsOf(f.node,set));else if(n.t==='pow'){varsOf(n.b,set);varsOf(n.e,set);}
 return set;
}
let seed=12345;function rnd(){seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;}
function equivalent(a,b){
 const vs=new Set([...varsOf(a),...varsOf(b)]);
 seed=987654;
 for(let trial=0;trial<10;trial++){
  const env={};for(const v of vs){let x;do{x=(rnd()*4.6-2.3);}while(Math.abs(x)<0.35||Math.abs(Math.abs(x)-1)<0.08);env[v]=x;}
  const x=evalNode(a,env),y=evalNode(b,env);
  if(!isFinite(x)||!isFinite(y))return false;
  if(Math.abs(x-y)>1e-7*Math.max(1,Math.abs(x),Math.abs(y)))return false;
 }
 return true;
}
/* polynomial with monomial keys: {"x:2,y:1": coeff} */
function monoKey(m){return Object.keys(m).filter(k=>m[k]!==0).sort().map(k=>k+':'+m[k]).join(',');}
function keyMono(k){const m={};if(!k)return m;k.split(',').forEach(p=>{const [v,e]=p.split(':');m[v]=Number(e);});return m;}
function polyAdd(a,b,s=1){const r=Object.assign({},a);for(const k in b){r[k]=(r[k]||0)+s*b[k];if(Math.abs(r[k])<1e-12)delete r[k];}return r;}
function polyMul(a,b){const r={};for(const ka in a)for(const kb in b){const m=keyMono(ka),mb=keyMono(kb);for(const v in mb)m[v]=(m[v]||0)+mb[v];const k=monoKey(m);r[k]=(r[k]||0)+a[ka]*b[kb];if(Math.abs(r[k])<1e-12)delete r[k];}return r;}
function toPoly(n){
 switch(n.t){
  case 'num':return n.v===0?{}:{'':n.v};
  case 'var':return {[n.v+':1']:1};
  case 'neg':{const p=toPoly(n.x);if(!p)return null;const r={};for(const k in p)r[k]=-p[k];return r;}
  case 'add':{let r={};for(const t of n.terms){const p=toPoly(t.node);if(!p)return null;r=polyAdd(r,p,t.sign);}return r;}
  case 'mul':{let r={'':1};for(const f of n.factors){const p=toPoly(f.node);if(!p)return null;
    if(f.div){const ks=Object.keys(p);if(ks.length!==1)return null;const m=keyMono(ks[0]);const inv={};for(const v in m)inv[v]=-m[v];r=polyMul(r,{[monoKey(inv)]:1/p[ks[0]]});}
    else r=polyMul(r,p);}return r;}
  case 'pow':{const e=evalNode(n.e,{});if(!Number.isInteger(e))return null;const b=toPoly(n.b);if(!b)return null;
    if(e<0){const ks=Object.keys(b);if(ks.length!==1)return null;const m=keyMono(ks[0]);const r={};for(const v in m)m[v]*=e;return {[monoKey(m)]:Math.pow(b[ks[0]],e)};}
    let r={'':1};for(let i=0;i<e;i++)r=polyMul(r,b);return r;}
 }
 return null;
}
/* Is this node a single simplified term: [number] var[^int] var[^int] ... with each var once */
function simpleTerm(n){
 if(n.paren)return false;
 let factors;
 if(n.t==='mul'){if(n.factors.some(f=>f.div))return false;factors=n.factors.map(f=>f.node);}
 else factors=[n];
 const seen=new Set();let i=0;
 for(const f of factors){
  if(f.paren)return false;
  if(f.t==='num'){if(i!==0)return false;}
  else if(f.t==='var'){if(seen.has(f.v))return false;seen.add(f.v);}
  else if(f.t==='pow'){if(f.b.t!=='var'||f.b.paren)return false;if(f.e.t!=='num'||!Number.isInteger(f.e.v)||f.e.v<2)return false;if(seen.has(f.b.v))return false;seen.add(f.b.v);}
  else return false;
  i++;
 }
 return true;
}
function termsOf(n){
 if(n.t==='add'&&!n.paren)return n.terms.map(t=>t.node);
 return [n];
}
function stripNeg(n){while(n.t==='neg')n=n.x;return n;}
function isSimplified(tree){
 // a sum of simplified terms (leading unary minus allowed), no like terms, no zero terms
 const terms=termsOf(tree).map(stripNeg);
 if(!terms.every(simpleTerm))return false;
 const p=toPoly(tree);if(!p)return false;
 const keys=terms.map(t=>monoKey(keyMono(Object.keys(toPoly(t))[0]||'')));
 if(new Set(keys).size!==keys.length)return false;
 if(terms.some(t=>{const tp=toPoly(t);return !tp||Object.keys(tp).length!==1;}))return false;
 if(Object.keys(p).length!==terms.length)return false;
 if(terms.some(t=>t.t==='num'&&terms.length>0&&t.v===0&&terms.length>1))return false;
 return true;
}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a;}
function content(poly){
 // common numeric factor (integers only) and common variable powers
 const ks=Object.keys(poly);if(!ks.length)return {num:1,vars:{}};
 const coeffs=ks.map(k=>poly[k]);
 let g=coeffs.every(c=>Number.isInteger(c))?coeffs.reduce((a,c)=>gcd(a,c),0):1;
 const vars={};const monos=ks.map(keyMono);
 for(const v in monos[0]){const mn=Math.min(...monos.map(m=>m[v]||0));if(mn>0)vars[v]=mn;}
 return {num:g||1,vars};
}
function factorStructure(tree){
 // returns {ok, reason, common}
 let n=tree;
 if(n.t==='add'&&n.terms.length===1&&!n.paren)n=n.terms[0].node;
 if(n.t==='neg')n=n.x;
 const factors=n.t==='mul'&&!n.paren?n.factors:[{node:n}];
 if(factors.some(f=>f.div))return {ok:false,reason:'notFactorised'};
 const brackets=factors.filter(f=>f.node.t==='add'&&f.node.paren);
 if(!brackets.length)return {ok:false,reason:'notFactorised'};
 if(factors.some(f=>f.node.t==='add'&&!f.node.paren))return {ok:false,reason:'notFactorised'};
 const outer=factors.filter(f=>!(f.node.t==='add'&&f.node.paren));
 if(outer.length){const o=outer.length===1?outer[0].node:{t:'mul',factors:outer.map(f=>({node:Object.assign({},f.node,{paren:false})}))};if(!simpleTerm(Object.assign({},o,{paren:false}))&&!(o.t==='pow'&&o.b.t==='var'))return {ok:false,reason:'messy'};}
 for(const b of brackets){
  const inner=Object.assign({},b.node,{paren:false});
  if(!isSimplified(inner))return {ok:false,reason:'messyInner'};
  const c=content(toPoly(inner));
  if(c.num>1||Object.keys(c.vars).length){return {ok:false,reason:'partial',common:c};}
 }
 return {ok:true};
}
function isIndexForm(tree){
 // number ^ integer, e.g. 5^7 (allow unary minus exponent)
 if(tree.t!=='pow'||tree.paren)return false;
 if(tree.b.t!=='num'||tree.b.paren)return false;
 const e=tree.e.t==='neg'?tree.e.x:tree.e;
 return e.t==='num'&&Number.isInteger(e.v);
}
function commonText(c){let s=c.num>1?String(c.num):'';for(const v of Object.keys(c.vars).sort())s+=v+(c.vars[v]>1?'^'+c.vars[v]:'');return s;}
/* ---------- main grading ---------- */
function grade(q,input){
 const raw=String(input==null?'':input).trim();
 if(!raw)return {correct:false,empty:true,message:'No answer given.'};
 if(q.form==='mcq'){const ok=raw.toLowerCase()===String(q.a).toLowerCase()||(q.alt||[]).some(a=>a.toLowerCase()===raw.toLowerCase());return {correct:ok};}
 if(q.form==='num'){
  const exp=Number(q.a);
  const got=parseNumber(raw);
  if(!got){
   // maybe they typed an expression that evaluates (e.g. 2^5): do not credit, but explain
   try{const {tree}=parseExpr(raw);if(varsOf(tree).size===0&&nearlyEqual(evalNode(tree,{}),exp))return {correct:false,message:'That works out to the right value, but give your final answer as a single number.'};}catch(e){}
   return {correct:false,message:'Give your answer as a number.'};
  }
  if(!nearlyEqual(got.value,exp))return {correct:false};
  const want=expectedUnitKey(q.units),have=got.unit?unitKey(got.unit):null;
  if(got.unit&&want&&have&&have!==want)return {correct:true,note:`Careful with the units: this answer is in ${q.units}, not ${got.unit.replace(/\^?2$/,'²').replace(/\^?3$/,'³')}.`};
  if(!got.unit&&q.units&&q.units!=='£')return {correct:true,note:`In the test, remember the units: ${q.units}.`};
  return {correct:true};
 }
 // algebraic forms
 let student,expected;
 try{student=parseExpr(raw);}catch(e){return {correct:false,message:'I could not read that expression. Check the brackets and signs (use ^ for powers, e.g. x^2).'};}
 expected=parseExpr(q.a).tree;
 const tree=student.tree;
 const note=student.flags.caretless?'Write powers with ^ or a small number, e.g. x² (not x2).':null;
 if(q.form==='index'){
  const expIsIndex=isIndexForm(expected);
  if(varsOf(tree).size||!nearlyEqual(evalNode(tree,{}),evalNode(expected,{})))return {correct:false};
  if(expIsIndex&&!isIndexForm(tree))return {correct:false,message:'That is the right value, but the question wants index form, e.g. '+q.a+'.'};
  if(!expIsIndex&&!(isIndexForm(tree)||tree.t==='num'))return {correct:false,message:'Right value, but simplify it to a single number.'};
  return {correct:true};
 }
 if(!equivalent(tree,expected))return {correct:false,note:null};
 if(q.form==='factor'){
  const s=factorStructure(tree);
  if(s.ok)return {correct:true,note};
  if(s.reason==='partial')return {correct:false,message:`Equivalent, but not fully factorised: the bracket still has a common factor of ${commonText(s.common)}. Take out the highest common factor.`};
  if(s.reason==='notFactorised')return {correct:false,message:'That is equal to the expression, but it is not factorised. Take out the highest common factor and write it with a bracket.'};
  return {correct:false,message:'Equivalent, but tidy it up: one simplified term outside the bracket and simplified terms inside.'};
 }
 // expr
 if(isSimplified(tree))return {correct:true,note};
 const hasBr=JSON.stringify(tree).includes('"paren":true');
 return {correct:false,message:hasBr?'That is equivalent, but not finished: expand the brackets and simplify fully.':'That is equivalent, but not fully simplified yet: collect like terms and multiply out numbers and powers.'};
}
/* ---------- display helpers ---------- */
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function pretty(s){
 // escape then turn a^b into superscripts; '*' between algebra into ×
 let h=esc(s);
 h=h.replace(/\^\(([^()]{1,12})\)/g,'<sup>$1</sup>').replace(/\^(-?\d+|[a-z])/g,'<sup>$1</sup>');
 return h;
}
function previewText(s){return pretty(String(s).replace(/\*/g,'×'));}
const api={prep,parseNumber,parseExpr,evalNode,equivalent,toPoly,isSimplified,factorStructure,isIndexForm,grade,pretty,previewText,esc};
root.MathsMark=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
