/* Melchior's Maths Lab — explanations after a wrong answer:
   (a) why it is wrong (diagnosis of the likely slip), (b) the method for this question, (c) another worked example. */
(function(root){
'use strict';
const M=root.MathsMark,{SKILLS,METHODS}=root.MathsSkills;
const near=(a,b)=>Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));
const fmtN=x=>String(Number((+x).toPrecision(10)));
/* ---------- which skill does a question practise? ---------- */
function skillOf(q){
 const t=q.topic,s=q.q,f=q.form;
 const has=re=>re.test(s);
 const indexAlg=()=>has(/\)\^/)?'algPow':has(/÷/)?'algDiv':'algMul';
 switch(t){
  case 0:
   if(has(/×/))return 'multTerms';
   if(has(/÷/))return 'divTerms';
   if(has(/rectangle|triangle|costs|perimeter|area/i))return 'exprWord';
   if(has(/\(/))return has(/-\d*[a-z]?\(/)?'expandNeg':'expand';
   return 'collect';
  case 1: return has(/and simplify/)?'expandTwo':has(/Expand\s+-/)?'expandNeg':'expand';
  case 2: return 'substitute';
  case 3: case 4:
   if(f==='mcq')return 'fullyCheck';
   return /^[^(]*[a-z]/.test(q.a)?(/\^/.test(q.a.split('(')[0])?'factorPow':'factorAlg'):'factorNum';
  case 5: return f==='factor'?'factorNum':'solve';
  case 6: return 'formula';
  case 7:
   if(f==='num')return has(/Find [nk]/)?'idxFindN':'idxValue';
   if((has(/\)\^/)&&has(/[×÷]/))||(has(/×/)&&has(/÷/)))return 'idxMixed';
   return has(/\)\^/)?'idxPow':has(/÷/)?'idxDiv':'idxMul';
  case 8: return indexAlg();
  case 9: return f==='factor'?'factorPow':has(/\)\^/)?'algPow':'expandPow';
  case 10: return has(/\bangles?\b/i)?'angleEq':'shapeEq';
  case 11: if(f==='num')return has(/Find [nk]/)?'idxFindN':'idxValue'; return indexAlg();
  case 12:
   if(has(/trapezium/))return 'areaTrap';
   if(has(/Find (its|the)( perpendicular)? (height|base)/))return 'areaReverse';
   return has(/triangle/)?'areaTri':'areaPara';
  case 13:
   if(has(/triangle|parallelogram has/))return 'areaReverse';
   if(has(/Find (x|its height|the other)/))return 'trapReverse';
   return 'areaTrap';
  case 14:
   if(has(/cost|bag/i))return 'areaProblem';
   if(has(/same area/))return 'areaReverse';
   if(has(/trapezium/))return 'areaTrap';
   return 'areaCompound';
  case 15:
   if(has(/surface area/)&&!has(/VOLUME/))return has(/cuboid/)?'saCuboid':'saCube';
   if(has(/Find (its|the) height|length of one edge/))return 'volReverse';
   if(has(/cube/)&&!has(/cuboid/))return 'volCube';
   return 'volCuboid';
  case 16: return has(/cube\b/)&&!has(/cuboid/)?'saCube':'saCuboid';
  case 17: return has(/volume/i)?'volCompound':'saCompound';
  case 18: return has(/^Convert/)?'convert':'capacity';
  case 19: return has(/paint|tin/i)?'saProblem':has(/cubes fit|cartons/)?'packing':'capacity';
 }
 return 'collect';
}
/* ---------- the method for this question, as steps ---------- */
function methodText(q){return METHODS[q.id]||q.ex||'';}
function methodSteps(q){
 const txt=methodText(q);
 // split into sentences / clauses without breaking decimals like 2.5; the final "Answer: ..." is shown separately
 const st=txt.split(/(?<=[.;])\s+(?=[A-Z(½0-9-])|;\s+/).map(x=>x.trim().replace(/;$/,'')).filter(Boolean);
 const keep=st.filter(x=>!/^Answer:/.test(x));
 return keep.length?keep:st;
}
/* ---------- another worked example of the same skill ---------- */
const norm=s=>String(s).toLowerCase().replace(/^\s*\d+\.\s*/,'').replace(/\([a-c]\)\s*/g,'').replace(/[^a-z0-9^+\-×÷()=]/g,'');
function hash(s){let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h;}
function prefTag(q,sk){
 const s=q.q;
 if(sk==='convert'){const from=/m³ to/.test(s)&&!/cm³ to/.test(s);if(from&&/to cm³/.test(s))return 'm3-cm3';if(from)return 'm3-l';if(/litres to ml|litres to cm³/.test(s))return 'l-ml';return 'cm3-l';}
 return null;
}
/* features used to pick the example that looks most like the question */
const FEATURES={negInBracket:/\([^)]*-/,negOutside:/(^|[\s(])-\d*[a-z]*\(/,power:/\^/,divide:/÷/,times:/×/,bracket:/\(/,twoBrackets:/\(.*\(/,decimal:/\d\.\d/,letters2:/[a-z][a-z]/,slanted:/slant|sloping/,cube:/\bcube\b/,findX:/Find [a-z]\b/,point:/around a point/,straight:/straight line/,triangle:/triangle/,rectangle:/rectangle/,equilateral:/equilateral/};
function features(s){s=String(s).replace(/^.*?(Simplify|Expand and simplify|Expand|Factorise fully|Factorise|Solve)\s+/,'');const f=new Set();for(const k in FEATURES)if(FEATURES[k].test(s))f.add(k);return f;}
function exampleFor(q){
 const sk=skillOf(q),skill=SKILLS[sk];
 const list=skill.ex.filter(e=>norm(e.q)!==norm(q.q));
 const tag=prefTag(q,sk);
 const tagged=tag?list.filter(e=>e.tag===tag):[];
 let pool=tagged.length?tagged:list;
 const fq=features(q.q+(/slant|sloping/.test(methodText(q))?' sloping':'')),score=e=>{const fe=features(e.q);let n=0;for(const k of fq)if(fe.has(k))n+=2;for(const k of fe)if(!fq.has(k))n-=1;return n;};
 const best=Math.max(...pool.map(score));pool=pool.filter(e=>score(e)===best);
 return Object.assign({skill:sk,title:skill.title},pool[hash(q.id)%pool.length]);
}
/* ---------- tiny polynomial engine (with deliberate "mistake" modes) ---------- */
function mono(c,e){return {c,e:e||{}};}
function monoKey(e){return Object.keys(e).filter(k=>e[k]!==0).sort().map(k=>k+(e[k]!==1?'^'+e[k]:'')).join('');}
function pAdd(p,m,s=1){const k=monoKey(m.e);if(!p[k])p[k]={c:0,e:Object.assign({},m.e)};p[k].c+=s*m.c;if(Math.abs(p[k].c)<1e-12)delete p[k];return p;}
function pFrom(list){const p={};list.forEach(m=>pAdd(p,m));return p;}
function terms(p){return Object.values(p);}
function mulMono(a,b,o){
 const e=Object.assign({},a.e);let shared=false;
 for(const v in b.e){if(v in e){shared=true;e[v]=o.expMul?e[v]*b.e[v]:o.expKeep?Math.max(e[v],b.e[v]):e[v]+b.e[v];}else e[v]=b.e[v];}
 const lettersBoth=Object.keys(a.e).length&&Object.keys(b.e).length;
 const c=o.coefAdd&&lettersBoth?a.c+b.c:a.c*b.c;
 return mono(c,e);
}
function divMono(a,b,o){const e=Object.assign({},a.e);for(const v in b.e){e[v]=(e[v]||0);e[v]=o.expDiv&&e[v]&&b.e[v]?e[v]/b.e[v]:o.divAdd?e[v]+b.e[v]:e[v]-b.e[v];if(e[v]===0)delete e[v];}return mono(o.coefSub?a.c-b.c:a.c/b.c,e);}
function powMono(m,n,o){const e={};for(const v in m.e)e[v]=o.powAdd?m.e[v]+n:m.e[v]*n;return mono(o.coefNoPow?m.c:o.coefTimes&&m.c!==1?m.c*n:Math.pow(m.c,n),e);}
function pMul(p,q,o){const r={};for(const a of terms(p))for(const b of terms(q))pAdd(r,mulMono(a,b,o));return r;}
function single(p){const t=terms(p);return t.length===1?t[0]:t.length===0?mono(0):null;}
/* evaluate a parsed tree to a polynomial; o = mistake modes; sgn = sign coming from a "- ..." in a sum */
function evalP(n,o={},sgn=1){
 switch(n.t){
  case 'num':return pFrom([mono(sgn*n.v)]);
  case 'var':return pFrom([mono(sgn,{[n.v]:1})]);
  case 'neg':return evalP(n.x,o,-sgn);
  case 'add':{const r={};for(const t of n.terms){const p=evalP(t.node,o,sgn*t.sign);if(!p)return null;terms(p).forEach(m=>pAdd(r,m));}return r;}
  case 'mul':{
   const brackets=n.factors.filter(f=>!f.div&&f.node.t==='add'&&f.node.paren&&f.node.terms.length>1);
   // group implicit products into terms (5x × 2x = [5x] × [2x]); slips apply only between terms
   const groups=[];
   for(const f of n.factors){
    if(brackets.includes(f))continue;
    if(!groups.length||!f.implicit)groups.push({div:!!f.div,fs:[f]});else groups[groups.length-1].fs.push(f);
   }
   let outer=pFrom([mono(sgn)]);
   for(const g of groups){
    let gp=pFrom([mono(1)]);
    for(const f of g.fs){const p=evalP(f.node,o);if(!p)return null;gp=pMul(gp,p,{});}
    if(g.div){const d=single(gp),c=single(outer);if(!d||!c||!d.c)return null;outer=pFrom([divMono(c,d,o)]);}
    else outer=pMul(outer,gp,Object.keys(outer).length===1&&outer['']&&near(Math.abs(outer[''].c),1)?{}:o);
   }
   if(!brackets.length)return outer;
   if(brackets.length===1&&single(outer)&&(o.firstOnly||o.signSlip)){
    const om=single(outer),r={};
    brackets[0].node.terms.forEach((t,i)=>{const ip=evalP(t.node,o,t.sign);if(!ip)return;
     for(const im of terms(ip)){
      if(i===0)pAdd(r,mulMono(om,im,o));
      else if(o.firstOnly)pAdd(r,mono(im.c*Math.sign(om.c)*(sgn<0?-1:1)*(sgn<0?1:1),im.e)&&im);
      else pAdd(r,mulMono(mono(Math.abs(om.c),om.e),im,o));
     }});
    return r;
   }
   let r=outer;for(const b of brackets){const p=evalP(b.node,o);if(!p)return null;r=pMul(r,p,o);}return r;
  }
  case 'pow':{
   const e=M.evalNode(n.e,{});if(!Number.isInteger(e)||e<0)return null;
   const b=evalP(n.b,o);if(!b)return null;const m=single(b);
   if(m){const r=powMono(m,e,n.b.paren?o:{});r.c*=sgn;return pFrom([r]);}
   let r=pFrom([mono(sgn)]);for(let i=0;i<e;i++)r=pMul(r,b,{});return r;
  }
 }
 return null;
}
function polyEq(a,b){if(!a||!b)return false;const ka=Object.keys(a),kb=Object.keys(b);if(ka.length!==kb.length)return false;return ka.every(k=>b[k]&&near(a[k].c,b[k].c));}
function termStr(m,first){
 const k=monoKey(m.e),c=m.c,abs=Math.abs(c);
 let body=k?(near(abs,1)?'':fmtN(abs))+k:fmtN(abs);
 return first?(c<0?'-':'')+body:(c<0?' - ':' + ')+body;
}
function sortTerms(list){const deg=m=>Object.values(m.e).reduce((a,b)=>a+b,0);return list.slice().sort((a,b)=>deg(b)-deg(a)||monoKey(a.e).localeCompare(monoKey(b.e)));}
function polyStr(p){const t=sortTerms(terms(p));if(!t.length)return '0';return t.map((m,i)=>termStr(m,i===0)).join('');}
const one=m=>termStr(m,true);
const brk=m=>m.c<0?'('+one(m)+')':one(m);
const sgn1=m=>(m.c>0?'+':'')+one(m);
/* wrap the term after ÷ so that 20x^8 ÷ 5x^3 means 20x^8 ÷ (5x^3), as in the question */
function wrapDiv(s){return String(s).replace(/÷\s*([0-9.]*(?:[a-z](?:\^\d+)?)*)/g,(m,t)=>t?'÷ ('+t+')':m);}
function parse(s){try{return M.parseExpr(wrapDiv(s)).tree;}catch(e){return null;}}
function questionExpr(q){
 let s=q.q.replace(/^\s*\d+\.\s*/,'').replace(/^\([a-c]\)\s*/,'');
 let m=s.match(/(?:writes|says)\s+(.+?)\s*=\s*(.+?)\.\s/);if(m)return {src:m[1],claim:m[2]};
 m=s.match(/factorises\s+(.+?)\s+as\s+(.+?)\.\s/);if(m)return {src:m[1],claim:m[2]};
 m=s.match(/(?:Expand and simplify|Simplify|Expand|Factorise fully|Factorise)\s+(?:\([a-c]\)\s*)?(.+?)\.?\s*$/);
 if(m&&!/[=]|[a-z]{2,}/.test(m[1].replace(/\^/g,'')))return {src:m[1]};
 return null;
}
/* ---------- diagnosis ---------- */
const ALG_SLIPS=[
 {o:{firstOnly:1},k:'firstOnly',msg:'It looks like you multiplied only the FIRST term inside the bracket. The term outside multiplies EVERY term inside.'},
 {o:{signSlip:1},k:'signSlip',msg:'Sign error when expanding: a negative (or a minus sign) in front of the bracket changes the sign of EVERY term inside. Remember negative × negative = positive.'},
 {o:{expMul:1},k:'expMul',msg:'When you multiply powers of the same letter, ADD the powers (x³ × x⁴ = x⁷). It looks like you multiplied them.'},
 {o:{expKeep:1},k:'expKeep',msg:'When the same letter is multiplied, its power goes up: a × a = a², x² × x³ = x⁵.'},
 {o:{coefAdd:1},k:'coefAdd',msg:'Multiply the numbers in front, don\'t add them (3a × 4a: 3 × 4 = 12).'},
 {o:{coefAdd:1,expKeep:1},k:'addInsteadOfMultiply',msg:'You added the terms instead of multiplying them. Multiply the numbers, and the same letter gets a power: 5x × 2x = 10x².'},
 {o:{expDiv:1},k:'expDiv',msg:'When you divide powers of the same letter, SUBTRACT the powers (x⁸ ÷ x² = x⁶). It looks like you divided them.'},
 {o:{divAdd:1},k:'divAdd',msg:'When you divide powers of the same letter, SUBTRACT the powers (x⁸ ÷ x³ = x⁵). It looks like you added them.'},
 {o:{coefSub:1},k:'coefSub',msg:'Divide the numbers, don\'t subtract them (20 ÷ 5 = 4).'},
 {o:{powAdd:1},k:'powAdd',msg:'For a power of a power, MULTIPLY the powers: (x³)² = x⁶. It looks like you added them.'},
 {o:{coefNoPow:1},k:'coefNoPow',msg:'The number inside the bracket must be raised to the power too: (2a³)² = 4a⁶, not 2a⁶.'},
 {o:{coefTimes:1},k:'coefTimes',msg:'Raise the number to the power, don\'t multiply by the power: (3x)² = 3² × x² = 9x², not 6x².'},
 {o:{powAdd:1,coefNoPow:1},k:'powAdd',msg:'For a power of a bracket, raise the number to the power AND multiply the powers of the letters: (2x³)⁴ = 16x¹².'}
];
function diagAlgebra(q,given,out){
 const st=parse(given);if(!st)return;
 const S=evalP(st);if(!S)return;
 const qe=questionExpr(q);
 const E=evalP(parse(q.a));if(!E)return;
 if(qe&&qe.claim){const C=evalP(parse(qe.claim)||{t:'num',v:NaN});if(C&&polyEq(S,C)){out.push(['repeatClaim','That is the same as the wrong answer in the question. Find the mistake in it first, then correct it.']);}}
 if(q.form==='factor'){diagFactor(q,st,S,E,out);return;}
 const src=qe&&parse(qe.src);
 if(src){
  for(const sl of ALG_SLIPS){const V=evalP(src,sl.o);if(V&&!polyEq(V,E)&&polyEq(S,V)){
   const diff=Object.keys(E).filter(k=>!S[k]||!near(S[k].c,E[k].c)).slice(0,2).map(k=>S[k]?`you wrote ${sgn1(S[k])}, it should be ${sgn1(E[k])}`:`the ${one(E[k])} term is missing`);
   out.push([sl.k,sl.msg+(diff.length?' Here: '+diff.join('; ')+'.':'')]);return;}}
 }
 comparePolys(S,E,out);
}
function comparePolys(S,E,out){
 const ks=Object.keys(S),ke=Object.keys(E);
 // same terms with some signs flipped
 if(ks.length===ke.length&&ks.every(k=>E[k]&&near(Math.abs(E[k].c),Math.abs(S[k].c)))){
  const bad=ks.filter(k=>!near(E[k].c,S[k].c));
  if(bad.length){out.push(['sign','Sign slip: '+bad.map(k=>`you wrote ${sgn1(S[k])} but it should be ${sgn1(E[k])}`).join('; ')+'. Check the sign in front of each term (negative × negative = positive).']);return;}
 }
 // unlike terms combined (e.g. 3x + 12 written as 15x)
 for(const k of ks){if(E[k]&&near(E[k].c,S[k].c))continue;
  const others=ke.filter(j=>!S[j]||j===k);
  if(!E[k]&&Object.keys(S[k].e).length>=2&&Object.keys(S[k].e).every(v=>ke.some(j=>E[j].e[v]&&Object.keys(E[j].e).length===1))){out.push(['unlike',`You combined unlike terms into ${one(S[k])}. Terms with different letters cannot be added together: they stay separate.`]);return;}
  for(let i=0;i<others.length;i++)for(let j=i+1;j<others.length;j++){const a=E[others[i]],b=E[others[j]];if(near(a.c+b.c,S[k].c)&&!polyEq(pFrom([a]),pFrom([b]))){out.push(['unlike',`You combined unlike terms: ${one(a)} and ${one(b)} cannot be added together because their letters or powers are different.`]);return;}}
 }
 const msgs=[];
 for(const k of ke){if(!S[k])msgs.push(`you are missing the ${one(E[k])} term`);else if(!near(S[k].c,E[k].c))msgs.push(`you have ${one(S[k])} but it should be ${one(E[k])}`);}
 for(const k of ks)if(!E[k])msgs.push(`${one(S[k])} should not be there`);
 if(msgs.length&&msgs.length<=3)out.push(['terms','Compare term by term: '+msgs.join('; ')+'.']);
}
function diagFactor(q,st,S,E,out){
 // structure of the student's answer: outer × (bracket)
 let n=st;if(n.t==='add'&&n.terms.length===1)n=n.terms[0].node;
 const fs=n.t==='mul'?n.factors:[{node:n}];
 const br=fs.filter(f=>f.node.t==='add'&&f.node.paren),rest=fs.filter(f=>!(f.node.t==='add'&&f.node.paren));
 if(br.length===1){
  const O=rest.length?single(evalP({t:'mul',factors:rest.map(f=>({node:Object.assign({},f.node,{paren:false})}))})):mono(1);
  if(O){
   const ib=br[0].node.terms.map(t=>single(evalP(t.node,{},t.sign))).filter(Boolean);
   const eTerms=terms(E);
   const notFactor=eTerms.some(t=>{if(!Number.isInteger(t.c/O.c))return true;for(const v in O.e)if((t.e[v]||0)<O.e[v])return true;return false;});
   if(notFactor){out.push(['notCommon',`${one(O)} is not a factor of every term in ${polyStr(E)}, so it cannot go outside the bracket. Find the HCF of all the terms.`]);}
   for(const t of ib){
    const prod=mulMono(O,t,{});const k=monoKey(prod.e);
    if(E[k]&&near(E[k].c,prod.c))continue;
    if(E[k]&&near(E[k].c,-prod.c)){out.push(['sign',`Sign slip inside the bracket: ${one(O)} × ${brk(t)} = ${one(prod)}, but the original term is ${one(E[k])}. A negative term stays negative after dividing by the HCF.`]);continue;}
    const tk=monoKey(t.e);
    if(!notFactor&&E[tk]&&near(E[tk].c,t.c)&&!(near(O.c,1)&&!Object.keys(O.e).length)){out.push(['notDivided',`You did not divide ${one(t)} by ${one(O)}: every term inside the bracket must be divided by the HCF.`]);continue;}
    if(!notFactor)out.push(['divide',`Check ${one(t)}: ${one(O)} × ${brk(t)} = ${one(prod)}, which is not one of the original terms. Divide each original term by ${one(O)} carefully.`]);
   }
  }
 }
 out.push(['expandCheck',`Check by expanding your answer: it gives ${polyStr(S)}, but the question is ${polyStr(E)}.`]);
}
/* index form with numbers (5^3 × 5^4) */
function expo(n,o){
 // returns {b: base string, e: exponent} for products/quotients/powers of a single base
 switch(n.t){
  case 'num':return {b:String(n.v),e:1,bare:true};
  case 'var':return {b:n.v,e:1,bare:true};
  case 'pow':{const b=n.b.t==='num'||n.b.t==='var'?{b:String(n.b.t==='num'?n.b.v:n.b.v),e:1}:expo(n.b,o);if(!b)return null;const k=M.evalNode(n.e,{});if(!Number.isFinite(k))return null;
   if(n.b.t==='num'||n.b.t==='var')return {b:b.b,e:k};return {b:b.b,e:o.powAdd?b.e+k:b.e*k};}
  case 'mul':{let r=null;for(const f of n.factors){const x=expo(f.node,o);if(!x)return null;const xe=x.bare&&o.bareZero?0:x.e;
   if(!r){r={b:x.b,e:xe};continue;}if(r.b!==x.b)return null;
   r.e=f.div?(o.expDiv?r.e/xe:o.divAdd?r.e+xe:r.e-xe):(o.expMul?r.e*xe:r.e+xe);}return r;}
  case 'add':return n.terms.length===1&&n.terms[0].sign===1?expo(n.terms[0].node,o):null;
 }
 return null;
}
function diagIndex(q,given,out){
 const qe=questionExpr(q);if(!qe)return;
 const src=parse(qe.src),st=parse(given);if(!src||!st)return;
 const right=expo(src,{});if(!right)return;
 let g=null;
 if(st.t==='pow'&&st.b.t==='num'&&st.e.t==='num')g={b:String(st.b.v),e:st.e.v};
 else if(st.t==='num'){out.push(['value',`The answer should stay in index form: ${right.b}^${right.e}.`]);return;}
 if(!g)return;
 if(g.b!==right.b){
  const bb=Number(g.b),rb=Number(right.b);
  if(rb>1&&Math.round(Math.log(bb)/Math.log(rb))>1&&near(Math.pow(rb,Math.round(Math.log(bb)/Math.log(rb))),bb))out.push(['baseMul',`Keep the base the same. With the laws of indices the base (${right.b}) is never multiplied — only the powers change.`]);
  else out.push(['base',`The base should stay ${right.b}.`]);
  return;
 }
 const slips=[[{expMul:1},'expMul','When multiplying powers of the same base, ADD the powers. It looks like you multiplied them.'],[{expDiv:1},'expDiv','When dividing powers of the same base, SUBTRACT the powers. It looks like you divided them.'],[{divAdd:1},'divAdd','When dividing powers of the same base, SUBTRACT the powers. It looks like you added them.'],[{powAdd:1},'powAdd','For a power of a power, MULTIPLY the powers. It looks like you added them.'],[{bareZero:1},'bare','A number on its own is that number to the power 1 (10 = 10¹), so it adds 1 to the power.']];
 for(const [o,k,msg] of slips){const v=expo(src,o);if(v&&!near(v.e,right.e)&&near(v.e,g.e)){out.push([k,msg]);return;}}
 out.push(['power',`The base is right, but the power should be ${right.e}, not ${g.e}.`]);
}
/* numbers */
function numsIn(s){return (String(s).replace(/(\d) (\d{3})\b/g,'$1$2').replace(/[²³]/g,'').match(/\d+(?:\.\d+)?/g)||[]).map(Number);}
function dimsCuboid(txt){let m=txt.match(/([\d.]+)\s*(?:cm|m)?\s*(?:by|×)\s*([\d.]+)\s*(?:cm|m)?\s*(?:by|×)\s*([\d.]+)/);if(m)return [+m[1],+m[2],+m[3]];
 const pr=[...txt.matchAll(/([\d.]+)\s*×\s*([\d.]+)\s*=/g)].map(x=>[+x[1],+x[2]]);
 if(pr.length>=3){const [a,b]=pr[0],[a2,c]=pr[1];if(a===a2&&((pr[2][0]===b&&pr[2][1]===c)||(pr[2][0]===c&&pr[2][1]===b)))return [a,b,c];}
 return null;}
function cubeEdge(txt){let m=txt.match(/edge (?:of )?([\d.]+)/)||txt.match(/([\d.]+)\^3/)||txt.match(/6 × ([\d.]+)\^2/);return m?+m[1]:null;}
function linearSolve(L,R,v){ // L,R polynomials in one variable v (degree <= 1)
 const get=(p,k)=>p[k]?p[k].c:0;
 if(Object.keys(L).concat(Object.keys(R)).some(k=>k!==''&&k!==v))return null;
 return {pL:get(L,v),pR:get(R,v),rL:get(L,''),rR:get(R,'')};
}
function subst(str,env){return str.replace(/[a-z]/g,c=>c in env?(+env[c]<0?'('+env[c]+')':env[c]):c);}
const tidy=s=>s.replace(/\s*×\s*/g,' × ').replace(/\s+/g,' ').trim();
function findEquation(q){
 const s=q.q;
 let m=s.match(/Solve\s+(.+?)\s*=\s*(.+?)\s*$/);
 if(m)return {L:m[1],R:m[2],show:true};
 m=s.match(/^(?:\d+\.\s*)?([A-Za-z])\s*=\s*(.+?)\.\s*Find (?:the positive value of )?([a-z])\s+when\s+(.+?)\.?\s*$/);
 if(m){const env={};for(const x of m[4].matchAll(/([A-Za-z])\s*=\s*(-?[\d.]+)/g))env[x[1]]=x[2];
  if(m[1] in env){const lhs=env[m[1]];delete env[m[1]];const rhs=tidy(subst(m[2].replace(/½/g,'½×').replace(/([a-z0-9)])(?=[a-z(])/g,'$1×').replace(/([a-z])(?=\d)/g,'$1×'),env));return {L:lhs,R:rhs,v:m[3],show:true};}}
 // first equation in the method text
 for(let clause of methodText(q).split(/,\s|;\s|\.\s/)){
  clause=clause.replace(/^.*?:\s*/,'').replace(/\s*(cm|m|kg|miles|hours)\.?$/,'');
  const parts=clause.split('=');if(parts.length<2)continue;
  const L=parse(parts[0]),R=parse(parts[1]);if(!L||!R)continue;
  const vs=new Set([...JSON.stringify([L,R]).matchAll(/"var","v":"([a-z])"/g)].map(x=>x[1]));
  if(vs.size===1)return {L:parts[0],R:parts[1]};
 }
 return null;
}
function diagEquation(q,v,A,out){
 const eq=findEquation(q);if(!eq)return false;
 const Lt=parse(eq.L),Rt=parse(eq.R);if(!Lt||!Rt)return false;
 const vs=[...new Set([...JSON.stringify([Lt,Rt]).matchAll(/"var","v":"([a-z])"/g)].map(x=>x[1]))];
 if(vs.length!==1)return false;const x=eq.v||vs[0];
 const L=evalP(Lt),R=evalP(Rt);if(!L||!R)return false;
 const lin=linearSolve(L,R,x);if(!lin)return false;
 const {pL,pR,rL,rR}=lin;if(!(pL-pR))return false;
 if(!near((rR-rL)/(pL-pR),A))return false; // our reading of the equation must give the right answer
 let p=pL-pR,c=rR-rL;if(p<0){p=-p;c=-c;}
 const cands=[];
 if(/\(/.test(eq.L+eq.R)){const L2=evalP(Lt,{firstOnly:1}),R2=evalP(Rt,{firstOnly:1});const l2=L2&&R2&&linearSolve(L2,R2,x);if(l2&&l2.pL-l2.pR)cands.push([(l2.rR-l2.rL)/(l2.pL-l2.pR),'firstOnly','When you expanded the bracket you multiplied only the first term. The number outside multiplies every term inside.']);}
 if(pL&&pR){
  if(rL||rR)cands.push([(rR+rL)/(pL-pR),'inverse','When you move a number to the other side, do the inverse operation (+ becomes -, - becomes +).']);
  cands.push([(rR-rL)/(pL+pR),'inverseX',`When you move the ${x} terms to one side you must subtract (not add) — check the sign of the ${x} terms.`]);
 }else{
  const pv=pL||pR,kv=pL?rL:rR,ko=pL?rR:rL;
  if(kv)cands.push([(ko+kv)/pv,'inverse',`You moved the ${fmtN(Math.abs(kv))} to the other side without changing the operation. To undo ${kv>0?'+ '+fmtN(kv):'- '+fmtN(-kv)}, ${kv>0?'subtract':'add'} ${fmtN(Math.abs(kv))} on both sides.`]);
 }
 if(!near(p,1))cands.push([c,'noDivide',`You found ${fmtN(p)}${x} = ${fmtN(c)} but did not finish: divide both sides by ${fmtN(p)}.`]);
 if(!near(p,1)&&c)cands.push([c*p,'multiply',`At the last step you multiplied by ${fmtN(p)}; you need to DIVIDE by ${fmtN(p)}.`]);
 if(c)cands.push([p/c,'flip',`You divided the wrong way round: ${fmtN(p)}${x} = ${fmtN(c)} means ${x} = ${fmtN(c)} ÷ ${fmtN(p)}.`]);
 const mt=methodText(q);
 for(const [T,U] of [[180,360],[360,180]]){if(new RegExp('= '+T+'\\b').test(mt)){const r2=rR===T?U:rR,r2L=rL===-T?-U:rL;if(r2!==rR||r2L!==rL)cands.push([(r2-r2L)/p,'angleTotal',`You used ${U}° but the angles here add up to ${T}°.`]);}}
 const hit=cands.find(c=>near(c[0],v)&&!near(c[0],A));
 if(hit)out.push([hit[1],hit[2]]);
 const lv=M.evalNode(Lt,{[x]:v}),rv=M.evalNode(Rt,{[x]:v});
 if(Number.isFinite(lv)&&Number.isFinite(rv)){const Ls=eq.L.trim(),Rs=eq.R.trim(),num=t=>/^-?[\d.]+$/.test(t);
  let msg;
  if(num(Rs))msg=`Check by substituting ${x} = ${fmtN(v)}: ${Ls} = ${fmtN(lv)}, not ${Rs}.`;
  else if(num(Ls))msg=`Check by substituting ${x} = ${fmtN(v)}: ${Rs} = ${fmtN(rv)}, not ${Ls}.`;
  else msg=`Check by substituting ${x} = ${fmtN(v)}: ${Ls} = ${fmtN(lv)} but ${Rs} = ${fmtN(rv)}. Both sides should be equal.`;
  out.push(['subBack',msg]);}
 return true;
}
function diagSubstitute(q,v,A,out){
 const m=q.q.match(/value of\s+(.+?)\s+when\s+(.+?)\.?\s*$/);if(!m)return;
 const tree=parse(m[1]);if(!tree)return;const env={};for(const x of m[2].matchAll(/([a-z])\s*=\s*(-?[\d.]+)/g))env[x[1]]=+x[2];
 const ev=(n,o)=>{switch(n.t){case 'num':return n.v;case 'var':return o.abs?Math.abs(env[n.v]):env[n.v];case 'neg':return -ev(n.x,o);
  case 'add':return n.terms.reduce((s,t)=>s+t.sign*ev(t.node,o),0);case 'mul':return n.factors.reduce((s,f)=>f.div?s/ev(f.node,o):s*ev(f.node,o),1);
  case 'pow':{const b=ev(n.b,o),e=ev(n.e,o);if(o.dbl&&n.b.t==='var')return e*b;if(o.negPow&&b<0)return -Math.pow(-b,e);return Math.pow(b,e);}}return NaN;};
 const slips=[[{negPow:1},'negSquare','Use brackets for negative numbers: (-2)² = (-2) × (-2) = +4, not -4.'],[{dbl:1},'powerAsTimes','A power is repeated multiplication: a² means a × a, not 2 × a.'],[{abs:1},'negIgnored','You lost a minus sign: put negative numbers in brackets, e.g. 4 × (-1) = -4 and 5 - 4 × (-1) = 5 + 4.']];
 for(const [o,k,msg] of slips){const r=ev(tree,o);if(Number.isFinite(r)&&!near(r,A)&&near(r,v)){out.push([k,msg]);return;}}
}
function diagGeometry(q,sk,v,A,out){
 const txt=q.q+' '+methodText(q);
 const say=(k,msg)=>{out.push([k,msg]);return true;};
 if(sk==='areaTri'||sk==='areaTrap'||(sk==='areaCompound'&&/½/.test(txt))){if(near(v,2*A))return say('forgotHalf',sk==='areaTrap'?'You forgot the ½: area of a trapezium = ½ × (a + b) × h.':'You forgot the ½: a triangle is half of a rectangle, so area = ½ × base × height.');}
 if(sk==='areaPara'&&near(v,A/2))return say('extraHalf','No ½ for a parallelogram: area = base × perpendicular height. The ½ is only for triangles (and trapezia).');
 if(sk==='areaTrap'){const m=txt.match(/½\s*×?\s*\(\s*([\d.]+)\s*\+\s*([\d.]+)\s*\)\s*×\s*([\d.]+)/)||txt.match(/parallel sides ([\d.]+) \w+ and ([\d.]+) \w+ and (?:width \()?height\)? ([\d.]+)/);
  if(m){const a=+m[1],b=+m[2],h=+m[3];
   if(near(v,a+b*h/2)||near(v,a+b*h))return say('order','Add the parallel sides FIRST (they are in a bracket): ½ × (a + b) × h, not a + b × h.');
   if(near(v,a*b*h/2)||near(v,a*b*h)||near(v,a*b/2*h))return say('multSides','Add the two parallel sides, don\'t multiply them: ½ × (a + b) × h.');
   if(near(v,(a+b)/2))return say('noHeight','You forgot to multiply by the height: ½ × (a + b) × h.');}}
 if(['areaPara','areaTri','areaCompound'].includes(sk)){
  const ns=[...new Set(numsIn(q.q+' '+methodText(q)).filter(x=>!near(x,A)&&x>0))];
  for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){const a=ns[i],b=ns[j];
   if(near(v,2*(a+b))||near(v,a+b))return say('perimeter',`It looks like you added the lengths (${fmtN(a)} and ${fmtN(b)}). Adding lengths gives a perimeter; area multiplies base × perpendicular height.`);
   if(sk!=='areaCompound'&&(near(v,a*b)||near(v,a*b/2)))return say('wrongHeight',`It looks like you used ${fmtN(a)} × ${fmtN(b)}. Use the base and the PERPENDICULAR height (at right angles to the base), not a slanted side.`);}
 }
 if(sk==='volCuboid'||sk==='saCuboid'||sk==='capacity'){
  const d=dimsCuboid(txt);if(d){const [a,b,c]=d,V=a*b*c,SA=2*(a*b+a*c+b*c);
   if(sk==='volCuboid'&&near(v,SA))return say('saNotVol','That is the surface area. Volume = length × width × height.');
   if(sk==='saCuboid'&&near(v,V))return say('volNotSa','That is the volume (length × width × height). Surface area = the total area of the 6 faces.');
   if(sk==='saCuboid'&&near(v,SA/2))return say('halfSa','You counted only 3 faces. Each face has a matching opposite face, so double it: SA = 2(lw + lh + wh).');
   if(near(v,a+b+c))return say('added','You added the lengths. Volume multiplies them: length × width × height.');
   if(sk==='volCuboid'&&[a*b,a*c,b*c].some(x=>near(v,x)))return say('twoDims','You multiplied only two lengths (that is the area of one face). Multiply all three.');
   if(sk==='capacity'&&near(v,A*1000))return say('noConvert','That is the volume in cm³. Divide by 1000 to get litres (1 litre = 1000 cm³).');
   if(sk==='capacity'&&near(v,A/1000))return say('noConvert','That is the volume in m³. Multiply by 1000 to get litres (1 m³ = 1000 litres).');}}
 if(sk==='volCube'||sk==='saCube'){const e=cubeEdge(txt);if(e){
   if(sk==='volCube'&&near(v,e*e))return say('squared',`You squared the edge. A cube's volume is edge³ = ${fmtN(e)} × ${fmtN(e)} × ${fmtN(e)}.`);
   if(sk==='volCube'&&near(v,3*e))return say('times3',`${fmtN(e)}³ means ${fmtN(e)} × ${fmtN(e)} × ${fmtN(e)}, not 3 × ${fmtN(e)}.`);
   if(sk==='volCube'&&near(v,6*e*e))return say('saNotVol','That is the surface area. Volume = edge³.');
   if(sk==='saCube'&&near(v,e*e*e))return say('volNotSa','That is the volume (edge³). Surface area = 6 × edge².');
   if(sk==='saCube'&&(near(v,e*e)||near(v,4*e*e)))return say('faces',`A cube has 6 faces, each ${fmtN(e)} × ${fmtN(e)}. Count all six.`);
   if(sk==='saCube'&&near(v,6*e))return say('times6',`Each face is a square: its area is ${fmtN(e)} × ${fmtN(e)}, then multiply by 6.`);}}
 if(sk==='saCube'){const m=q.q.match(/surface area ([\d.]+)/);if(m&&near(v,+m[1]/6))return say('oneFace',`${fmtN(v)} cm² is the area of ONE face. The edge is the number that squares to it (${fmtN(A)} × ${fmtN(A)} = ${fmtN(A*A)}).`);}
 if(sk==='saCube'){const m=q.q.match(/surface area ([\d.]+)/);if(m&&near(v,+m[1]/6))return say('oneFace',`${fmtN(v)} cm² is the area of ONE face. The edge is the number that squares to it (${fmtN(A)} × ${fmtN(A)} = ${fmtN(A*A)}).`);}
 if(sk==='convert'){const m=q.q.match(/Convert ([\d.\s]+?) (cm³|ml|litres?|m³) to (litres|ml|cm³|m³)/);if(m){const N=+m[1].replace(/\s/g,''),f=A/N;
   if(near(v,N))return say('noConvert','You need to convert: the number changes when the unit changes (unless it is ml ↔ cm³, which are equal).');
   if(near(v,N/f)&&!near(f,1))return say('direction',f>1?'Big unit → small unit: MULTIPLY. You divided.':'Small unit → big unit: DIVIDE. You multiplied.');
   if(near(f,1e6)&&near(v,N*1000))return say('m3cm3','1 m³ = 100 × 100 × 100 = 1 000 000 cm³, not 1000 cm³.');
   if(near(v,f>1?N*100:N/100)||near(v,f>1?N*10:N/10))return say('factor100','For volume and capacity the factor is 1000 (1 litre = 1000 ml = 1000 cm³), not 10 or 100.');
   if(near(f,1)&&(near(v,N*1000)||near(v,N/1000)))return say('mlcm3','1 ml = 1 cm³, so the number stays the same.');}}
 return false;
}
function diagNumber(q,given,out){
 const g=M.parseNumber(given);if(!g)return;
 const v=g.value,A=Number(q.a),sk=skillOf(q);
 if(near(v,A))return;
 if(sk==='substitute')diagSubstitute(q,v,A,out);
 if(!out.length)diagGeometry(q,sk,v,A,out);
 if(!out.length||out.every(x=>x[0]==='subBack'))diagEquation(q,v,A,out);
 if(!out.length||out.every(x=>x[0]==='subBack')){
  if(near(v,-A))out.unshift(['sign',`Your answer has the wrong sign: it should be ${fmtN(A)}, not ${fmtN(v)}. Check the signs, especially with negative numbers.`]);
  else{for(const k of [10,100,1000,1e6]){if(near(v,A*k)||near(v,A/k)){out.unshift(['placeValue',`Your digits look right, but your answer is ${fmtN(k)} times too ${near(v,A*k)?'big':'small'}. Check the conversion of units or the decimal point.`]);break;}}}
 }
}
function diagMcq(q,given,out){
 const m=q.q.match(/Is\s+(.+?)\s+fully factorised/);if(!m)return;
 const t=parse(m[1]);if(!t)return;
 const s=M.factorStructure(t);
 if(String(q.a).toLowerCase()==='no'&&s.reason==='partial'){
  const c=s.common;let txt=(c.num>1?c.num:'')+Object.keys(c.vars).sort().map(v=>v+(c.vars[v]>1?'^'+c.vars[v]:'')).join('');
  out.push(['notFully',`Look inside the bracket: the terms still have a common factor of ${txt}. So it is NOT fully factorised — more can be taken out.`]);
 }else if(String(q.a).toLowerCase()==='yes')out.push(['isFully','Look inside the bracket: the terms have no common factor except 1, so nothing more can be taken out. It IS fully factorised.']);
}
/* main entry: returns {skill, title, rule, mistakes, why:[{kind,text}], specific} */
function diagnose(q,given,res){
 const sk=skillOf(q),skill=SKILLS[sk],out=[];
 const blank=!String(given==null?'':given).trim();
 if(!blank){
  if(res&&res.message&&!/^(No answer|Give your answer as a number|I could not read)/.test(res.message))out.push(['marking',res.message]);
  const equivalentMsg=out.length&&/[Ee]quivalent|right value|works out to the right value|not factorised|not finished|index form/.test(out[0][1]);
  if(!equivalentMsg){
   try{
    if(q.form==='num')diagNumber(q,given,out);
    else if(q.form==='mcq')diagMcq(q,given,out);
    else if(q.form==='index')diagIndex(q,given,out);
    else diagAlgebra(q,given,out);
   }catch(e){if(api.strict)throw e;/* never block the feedback */}
  }
 }
 const why=[];const seen=new Set();
 for(const [kind,text] of out){if(seen.has(text))continue;seen.add(text);why.push({kind,text});}
 return {skill:sk,title:skill.title,rule:skill.rule,mistakes:skill.mistakes,why,specific:why.some(w=>w.kind!=='subBack'&&w.kind!=='expandCheck'),blank};
}
const api={skillOf,methodSteps,methodText,exampleFor,diagnose,evalP,polyStr,polyEq,parse,questionExpr};
root.MathsExplain=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
