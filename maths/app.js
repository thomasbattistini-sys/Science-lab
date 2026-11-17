/* Melchior's Maths Lab — UI and round engine. Progress and history live only in this browser (localStorage). */
(function(root){
'use strict';
const M=root.MathsMark,X=root.MathsExplain,H=root.MathsHistory,data=root.MATHS_DATA,bank=data.questions;
const KEY=H.KEY; // 'melchior-maths-lab-v1' (same key as before: old progress is kept and upgraded)
const MOCK_MINUTES=30;
const practiceBank=bank.filter(q=>q.day!==6),mockBank=bank.filter(q=>q.day===6);
const SECTION_KEYS=['u3','u4','mixed'];
function shuffle(a,rng=Math.random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const ids=new Set(bank.map(q=>q.id));
function blankStore(){return H.blankStore();}
function sanitise(s){return H.migrate(s,ids);}
/* unseen first, then last-time-wrong, then oldest; balanced across topics; more past errors = more weight */
function selectQuestions(pool,count,stats,rng=Math.random){
 const limit=Math.min(count,pool.length),chosen=[],topicCounts={};
 const tier=q=>{const s=stats[q.id];return !s||!s.seen?0:s.lastCorrect===false?1:2;};
 for(let level=0;level<3&&chosen.length<limit;level++){
  let cand=shuffle(pool.filter(q=>tier(q)===level),rng);
  const pr=new Map(cand.map(q=>{const s=stats[q.id]||{};const w=(1+(s.incorrect||0))/(1+(s.correct||0));return [q.id,-Math.log(Math.max(Number.EPSILON,rng()))/w];}));
  while(cand.length&&chosen.length<limit){
   const ts=[...new Set(cand.map(q=>q.topic))];const min=Math.min(...ts.map(t=>topicCounts[t]||0));
   const el=ts.filter(t=>(topicCounts[t]||0)===min);const t=el[Math.floor(rng()*el.length)];
   const c=cand.filter(q=>q.topic===t).sort((a,b)=>level===2?((stats[a.id].lastSeen||0)-(stats[b.id].lastSeen||0))||pr.get(a.id)-pr.get(b.id):pr.get(a.id)-pr.get(b.id));
   chosen.push(c[0]);topicCounts[t]=(topicCounts[t]||0)+1;cand=cand.filter(q=>q.id!==c[0].id);
  }
 }
 // keep a gentle order: by day then shuffled inside? -> fully shuffled like the science app
 return shuffle(chosen,rng);
}
function poolForSection(key){const u=H.SECTIONS[key]&&H.SECTIONS[key].unit;return u?practiceBank.filter(q=>q.unit===u):practiceBank;}
root.MathsLab={selectQuestions,blankStore,sanitise,poolForSection};
if(typeof document==='undefined')return;

let storageOK=true,store;
try{store=sanitise(JSON.parse(localStorage.getItem(KEY)));}catch(e){store=blankStore();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(store));storageOK=true;}catch(e){storageOK=false;}updateStorageNote();}
const app=document.getElementById('app');
const esc=M.esc,P=M.pretty;
const pct=(n,d)=>d?Math.round(n/d*100):0;
const findQ=id=>bank.find(q=>q.id===id);
let screen='home',section='u3',count=10,mockFeedback=false;
let round=null; // {mode,section,label,queue,index,results,feedback,deadline,startedAt,session}
let timerHandle=null;
function stat(id){return store.stats[id];}
function mastered(list){return list.filter(q=>stat(q.id)&&stat(q.id).lastCorrect===true).length;}
function seen(list){return list.filter(q=>stat(q.id)&&stat(q.id).seen).length;}
function head(t,sub){return `<div class="section-head"><h1 id="screen-title" tabindex="-1">${t}</h1><p class="lede">${sub}</p></div>`;}
function on(id,ev,fn){const e=document.getElementById(id);if(e)e.addEventListener(ev,fn);}
function updateStorageNote(){const e=document.getElementById('storage-note');if(e)e.textContent=storageOK?'Progress and history are saved on this iPad/browser only. No account, no tracking, no syncing.':'This browser cannot save progress. You can still practise, but your history may be lost when you close the app.';}
function setNav(){for(const [id,s] of [['nav-home','home'],['nav-mock','mockhome'],['nav-history','history']])document.getElementById(id).setAttribute('aria-current',screen===s?'page':'false');}
function render(){
 setNav();
 if(screen!=='quiz'&&timerHandle){clearInterval(timerHandle);timerHandle=null;}
 if(screen==='home')renderHome();else if(screen==='mockhome')renderMockHome();else if(screen==='quiz')renderQuiz();else if(screen==='end')renderEnd();else renderHistory();
 const t=document.getElementById('screen-title');if(t&&screen!=='quiz')t.focus({preventScroll:true});
 if(screen!=='quiz')window.scrollTo(0,0);
}
function daysToGo(){const d=new Date(2026,10,24),n=new Date();n.setHours(0,0,0,0);const k=Math.round((d-n)/86400000);return k>1?`${k} days to go`:k===1?'Tomorrow!':k===0?'Today — good luck!':'';}
function lastLine(key){const s=H.sectionSummary(store,key);return s.last?`Last: ${H.scoreText(s.last)} · ${H.formatDate(s.last.start)}`:'Not tried yet';}
function renderHome(){
 const cards=SECTION_KEYS.map(k=>{const sec=H.SECTIONS[k],list=poolForSection(k),sel=section===k;
  return `<button type="button" class="topic section-card${sel?' selected':''}" data-section="${k}" aria-pressed="${sel}"><strong>${esc(sec.title)}</strong><span>${list.length} questions · ${mastered(list)} mastered</span><span class="last">${esc(lastLine(k))}</span></button>`;}).join('');
 const pool=poolForSection(section),n=count?Math.min(count,pool.length):pool.length;
 const recent=H.newestFirst(store)[0];
 const dg=daysToGo();
 app.innerHTML=head("Melchior's Maths Lab",`Year 8 Maths Cycle Test 2 · ${esc(data.exam)}${dg?' · '+dg:''}`)+
 `<section class="panel" aria-labelledby="pd"><div class="eyebrow">Practise</div><h2 id="pd">1. Choose a section</h2><div class="section-grid">${cards}</div>
 <h3>2. How many questions?</h3><div class="choices">${[10,20,0].map(c=>`<button type="button" class="number${count===c?' selected':''}" data-count="${c}" aria-pressed="${count===c}">${c||'All'}</button>`).join('')}</div>
 <button type="button" class="primary wide" id="start">Start: ${esc(H.SECTIONS[section].title)} (${n} questions)</button></section>`+
 `<section class="panel" aria-labelledby="mk"><div class="eyebrow">Exam practice</div><h2 id="mk">30-minute mock test</h2><p class="small">${mockBank.length} questions, 30 marks, timed like the real test.</p><button type="button" id="go-mock">Go to the mock test</button></section>`+
 `<section class="panel" aria-labelledby="hs"><div class="eyebrow">My history</div><h2 id="hs">${recent?'Last session':'No sessions yet'}</h2>${recent?`<p>${esc(H.formatDate(recent.start))} · ${esc(recent.label)} · <b>${esc(H.scoreText(recent))}</b>${recent.complete?'':' · stopped early'}</p>`:'<p class="small">Every session you do is saved with its date and score.</p>'}<button type="button" id="go-history">See my history</button></section>`+
 `<div class="how"><h3>How it works</h3><ul><li>Type short answers. Use the buttons under the box for powers and brackets, e.g. <b>x²</b> or <b>3(x + 4)</b>.</li><li>Units are optional: 24, 24 cm² and 24 cm2 all count.</li><li>Algebra is checked properly: 6 + 3x is the same as 3x + 6, but “factorise fully” needs the full HCF outside the bracket.</li><li>If an answer is wrong you see why, the method step by step, and another example to practise the same skill.</li><li>Every session is saved in <b>My history</b> with the date, score and the questions you missed.</li></ul></div>`;
 app.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>{section=b.dataset.section;renderKeep();}));
 app.querySelectorAll('[data-count]').forEach(b=>b.addEventListener('click',()=>{count=Number(b.dataset.count);renderKeep();}));
 on('start','click',()=>{const p=poolForSection(section);startRound('practice',section,H.SECTIONS[section].title,selectQuestions(p,count||p.length,store.stats));});
 on('go-mock','click',()=>{screen='mockhome';render();});
 on('go-history','click',()=>{screen='history';render();});
}
function renderKeep(){const y=window.scrollY;renderHome();window.scrollTo(0,y);}
function renderMockHome(){
 const last=H.newestFirst(store).filter(s=>s.section==='mock').slice(0,3);
 app.innerHTML=head('Mock test',`Year 8 Maths Cycle Test 2 practice paper · ${mockBank.length} questions · 30 marks · ${MOCK_MINUTES} minutes.`)+
 `<section class="panel"><h2>Before you start</h2><ul class="small"><li>Have paper, a pencil and your calculator ready (calculator allowed, as in the real test).</li><li>The timer starts when you press Start. When the time is up, the test ends and unanswered questions score 0.</li><li>Each question shows its marks. In the app a question scores all its marks when the final answer is right.</li></ul>
 <label class="check"><input type="checkbox" id="fb" ${mockFeedback?'checked':''}> Show the answer and explanation after each question (practice style)</label>
 <p class="small">Leave this off for real exam conditions: you will see every answer, explanation and extra example at the end.</p>
 <button type="button" class="primary wide" id="start-mock">Start the 30-minute mock</button></section>`+
 (last.length?`<section class="panel"><h2>Recent mocks</h2>${last.map(m=>`<p>${esc(H.formatDate(m.start))}: <b>${esc(H.scoreText(m))}</b> · ${esc(H.formatDuration(m.seconds))}${m.complete?'':' · stopped early'}</p>`).join('')}</section>`:'');
 on('fb','change',e=>{mockFeedback=e.target.checked;});
 on('start-mock','click',()=>startRound('mock','mock','Mock test',mockBank.slice(),{feedback:mockFeedback}));
}
function startRound(mode,sec,label,queue,opt={}){
 if(!queue.length)return;
 const now=Date.now();
 round={mode,section:sec,label,queue,index:0,results:[],feedback:null,showFeedback:mode!=='mock'||!!opt.feedback,startedAt:now,deadline:mode==='mock'?now+MOCK_MINUTES*60000:null};
 round.session=H.newSession({mode,section:sec,label,planned:queue.length,totalMarks:mode==='mock'?queue.reduce((s,q)=>s+(q.marks||1),0):0,now});
 screen='quiz';render();
}
function fmtTime(sec){sec=Math.max(0,Math.round(sec));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');}
function tickTimer(){
 const e=document.getElementById('timer');if(!round||!round.deadline)return;
 const left=(round.deadline-Date.now())/1000;
 if(e){e.textContent='⏱ '+fmtTime(left);e.classList.toggle('low',left<300);}
 if(left<=0){clearInterval(timerHandle);timerHandle=null;timeUp();}
}
function timeUp(){
 for(let i=round.results.length;i<round.queue.length;i++){const q=round.queue[i];round.results.push({q,given:'',correct:false,res:{correct:false,message:'Not answered (time up).'},skipped:true,unanswered:true});}
 round.timeUp=true;finish();
}
function figHTML(q){return q.fig?`<figure class="diagram"><img src="./fig/${esc(q.fig)}" alt="Diagram for this question (not drawn to scale)"><figcaption>Not drawn to scale</figcaption></figure>`:'';}
const KEYS=['^','²','³','(',')','x','y','a','b'];
const ans=q=>P(q.a)+(q.units&&q.form==='num'?' '+esc(q.units):'');
const mathHTML=s=>P(String(s).replace(/\*/g,'×'));
function stepHTML(st){return `<li>${st.t?esc(st.t):''}${st.t&&st.m?': ':''}${st.m?`<span class="m">${mathHTML(st.m)}</span>`:''}</li>`;}
/* (a) why it is wrong, (b) method for this question, (c) another worked example */
function explainHTML(q,given,res,skipped){
 const d=X.diagnose(q,skipped?'':given,res);
 const ex=X.exampleFor(q);
 const steps=X.methodSteps(q);
 let why;
 if(skipped||d.blank)why=`<p>No answer was given, so here is how to do it.</p>`;
 else if(d.why.length)why=`<ul>${d.why.map(w=>`<li>${P(w.text)}</li>`).join('')}</ul>`+(d.specific?'':`<p class="small">Common slips with this skill: ${d.mistakes.map(esc).join(' ')}</p>`);
 else why=`<p>I can't pin down one exact slip, so compare your working with the method below. Common slips with this skill:</p><ul>${d.mistakes.map(m=>`<li>${esc(m)}</li>`).join('')}</ul>`;
 const exAns=P(ex.a)+(ex.full?' — '+P(ex.full):'')+(ex.units?' '+esc(ex.units):'');
 return `<div class="explain">
 <section class="why"><h3><span class="tag">1</span> Why it's not right</h3>${why}<p class="rule"><b>Key rule (${esc(d.title)}):</b> ${esc(d.rule)}</p></section>
 <section class="method"><h3><span class="tag">2</span> Method for this question</h3><ol>${steps.map(s=>`<li>${mathHTML(s)}</li>`).join('')}</ol></section>
 <section class="example"><h3><span class="tag">3</span> Another example: ${esc(ex.title)}</h3><p class="exq">${mathHTML(ex.q)}</p><ol>${ex.steps.map(stepHTML).join('')}</ol><p>Answer: <b>${exAns}</b></p></section>
 </div>`;
}
function renderQuiz(){
 const r=round,q=r.queue[r.index],n=r.queue.length,fb=r.feedback;
 const score=r.results.filter(x=>x.correct).length;
 const marks=q.marks?` · ${q.marks} mark${q.marks>1?'s':''}`:'';
 let meta=`<div class="round-meta"><span>${esc(r.label)}</span><span>Question ${r.index+1} of ${n}${marks}</span>${r.mode==='mock'?`<span id="timer" class="timer">⏱ ${fmtTime((r.deadline-Date.now())/1000)}</span>`:`<span>Score ${score}/${r.results.length}</span>`}</div><progress max="${n}" value="${r.index+(fb?1:0)}" aria-label="Round progress"></progress>`;
 let body;
 const unitLine=`<div class="eyebrow">${esc(q.unit===3?H.SECTIONS.u3.title:H.SECTIONS.u4.title)}</div>`;
 if(q.form==='mcq'){
  body=`<div class="answer-options">${q.choices.map((c,i)=>{let cls='answer';if(fb){if(c===q.a)cls+=' right-answer';else if(c===fb.given)cls+=' wrong-answer';}return `<button type="button" class="${cls}" data-choice="${esc(c)}" ${fb?'disabled':''}><span class="letter">${'AB'[i]||i+1}</span><span>${P(c)}</span></button>`;}).join('')}</div>`;
 }else{
  const isNum=q.form==='num';
  body=`<form id="answer-form" autocomplete="off"><label for="ans">Your answer${q.units&&isNum?` <span class="small">(units: ${esc(q.units)}, optional)</span>`:''}</label>
  <input id="ans" name="ans" type="text" ${isNum?'inputmode="text"':''} autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="${fb?'next':'done'}" value="${fb?esc(fb.given):''}" ${fb?'readonly':''} placeholder="${isNum?'e.g. 24':q.form==='index'?'e.g. 5^7':'e.g. 3x² + 2x'}">
  <div class="preview" id="preview" aria-live="polite"></div>
  ${fb?'':`<div class="keys" role="group" aria-label="Maths keys">${KEYS.map(k=>`<button type="button" class="key" data-key="${esc(k)}" aria-label="Insert ${k==='^'?'power sign':k==='²'?'squared sign':k==='³'?'cubed sign':k}" title="${k==='²'?'adds ²':k==='³'?'adds ³':k==='^'?'power: type x^5':''}">${k==='²'?'x²':k==='³'?'x³':esc(k)}</button>`).join('')}<button type="button" class="key" data-key="⌫" aria-label="Delete">⌫</button></div>`}
  ${fb?'':`<div class="actions"><button type="submit" class="primary" id="check">Check answer</button><button type="button" class="quiet" id="dunno">${r.showFeedback?'Show me the answer':'Skip'}</button></div>`}</form>`;
 }
 let fbHTML='';
 if(fb&&r.showFeedback){
  const res=fb.res;
  if(fb.correct){
   fbHTML=`<div class="feedback correct" role="status"><h2>Correct!</h2>${res.message?`<p><b>${esc(res.message)}</b></p>`:''}${res.note?`<p>${esc(res.note)}</p>`:''}
   ${fb.given&&q.form!=='mcq'?`<p class="your-answer">You wrote: ${M.previewText(fb.given)}</p>`:''}<p>Answer: <b>${ans(q)}</b></p><p>${mathHTML(X.methodText(q))}</p></div>`;
  }else{
   fbHTML=`<div class="feedback incorrect" role="status"><h2>${fb.skipped?'Here is the answer':'Not quite'}</h2>
   ${fb.given&&q.form!=='mcq'?`<p class="your-answer">You wrote: ${M.previewText(fb.given)}</p>`:''}${q.form==='mcq'&&fb.given?`<p class="your-answer">You chose: ${P(fb.given)}</p>`:''}
   <p>Correct answer: <b>${ans(q)}</b></p>${explainHTML(q,fb.given,res,fb.skipped)}</div>`;
  }
 }
 const nextBtn=fb?`<button type="button" class="primary wide" id="next">${r.index+1<n?'Next question':'See results'}</button>`:'';
 app.innerHTML=meta+`<section class="panel question-panel" data-qid="${q.id}">${unitLine}<h1 id="screen-title" tabindex="-1" class="question">${P(q.q)}</h1>${figHTML(q)}${body}${fbHTML}${nextBtn}</section>`+
 (r.mode!=='mock'||r.index>0?`<div class="round-footer"><span>${r.mode==='mock'?'Answers are saved as you go.':'Every answer is saved in My history.'}</span><button type="button" class="quiet" id="quit">${r.mode==='mock'?'Finish test now':'End round'}</button></div>`:`<div class="round-footer"><span>Good luck!</span><button type="button" class="quiet" id="quit">Finish test now</button></div>`);
 if(r.mode==='mock'){if(!timerHandle)timerHandle=setInterval(tickTimer,1000);tickTimer();}
 const input=document.getElementById('ans');
 if(input&&!fb){
  const prev=document.getElementById('preview');
  const upd=()=>{prev.innerHTML=input.value.trim()?'Reads as: '+M.previewText(input.value):'';};
  input.addEventListener('input',upd);
  app.querySelectorAll('[data-key]').forEach(b=>{
   b.addEventListener('pointerdown',e=>e.preventDefault()); // keep the iPad keyboard open
   b.addEventListener('mousedown',e=>e.preventDefault());
   b.addEventListener('click',()=>{const k=b.dataset.key;const s=input.selectionStart??input.value.length,e=input.selectionEnd??input.value.length;
    if(k==='⌫'){if(s!==e)input.setRangeText('',s,e,'end');else if(s>0)input.setRangeText('',s-1,s,'end');}
    else input.setRangeText(k,s,e,'end');
    input.focus();upd();});
  });
  on('answer-form','submit',e=>{e.preventDefault();submit(input.value);});
  on('dunno','click',()=>submit('',true));
  if(window.matchMedia('(pointer:fine)').matches)input.focus({preventScroll:true});
 }
 if(q.form==='mcq'&&!fb)app.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>submit(b.dataset.choice)));
 if(fb){const nb=document.getElementById('next');nb.addEventListener('click',next);nb.focus({preventScroll:true});}
 on('quit','click',()=>{if(r.mode==='mock'){if(confirm('Finish the mock now? Unanswered questions will score 0.'))timeUp();}else{if(r.results.length===0||confirm('End this round now? Your answers so far are saved in My history.'))finish();}});
 if(!fb)window.scrollTo(0,0);
}
function submit(given,skipped=false){
 const r=round,q=r.queue[r.index];
 if(!skipped&&!String(given).trim()){const p=document.getElementById('preview');if(p)p.textContent='Type an answer first (or use “'+(r.showFeedback?'Show me the answer':'Skip')+'”).';return;}
 const res=skipped?{correct:false}:M.grade(q,given);
 const now=Date.now(),old=store.stats[q.id]||{seen:0,correct:0,incorrect:0};
 store.stats[q.id]={seen:(old.seen||0)+1,correct:(old.correct||0)+(res.correct?1:0),incorrect:(old.incorrect||0)+(res.correct?0:1),lastCorrect:!!res.correct,lastSeen:now};
 const item={q,given:skipped?'':given,correct:!!res.correct,res,skipped};
 r.results.push(item);
 H.syncSession(store,r.session,r.results,{now}); // saved straight away, so a session left half-way is kept
 save();
 if(r.showFeedback){r.feedback=item;renderQuiz();const f=document.querySelector('.feedback');if(f)f.scrollIntoView({block:'nearest',behavior:'smooth'});}
 else next(true);
}
function next(){const r=round;r.feedback=null;if(r.index+1<r.queue.length){r.index++;renderQuiz();}else finish();}
function finish(){
 const r=round;if(timerHandle){clearInterval(timerHandle);timerHandle=null;}
 const now=Date.now();
 r.seconds=(now-r.startedAt)/1000;
 if(r.mode==='mock'){r.marks=r.results.reduce((s,x)=>s+(x.correct?(x.q.marks||1):0),0);r.total=r.queue.reduce((s,q)=>s+(q.marks||1),0);}
 const complete=r.mode==='mock'||r.results.length>=r.queue.length;
 if(r.results.length)H.syncSession(store,r.session,r.results,{now:r.mode==='mock'?Math.min(now,r.startedAt+MOCK_MINUTES*60000):now,complete,timeUp:!!r.timeUp});
 save();screen='end';render();
}
function renderEnd(){
 const r=round,score=r.results.filter(x=>x.correct).length,total=r.results.length;
 const byUnit={};for(const x of r.results){const t=x.q.unit;byUnit[t]=byUnit[t]||{c:0,n:0};byUnit[t].n++;if(x.correct)byUnit[t].c++;}
 const missed=r.mode==='mock'&&!r.showFeedback?r.results:r.results.filter(x=>!x.correct);
 const big=r.mode==='mock'?`<div class="big-score">${r.marks}<span>/${r.total} marks</span></div><p class="percent">${pct(r.marks,r.total)}% · ${score} of ${r.queue.length} questions right · time used ${fmtTime(Math.min(r.seconds,MOCK_MINUTES*60))}${r.timeUp?' (time up)':''}</p>`:`<div class="big-score">${score}<span>/${total}</span></div><p class="percent">${pct(score,total)}% correct${total<r.queue.length?` · ${total} of ${r.queue.length} questions answered`:''}</p>`;
 const msg=pct(r.mode==='mock'?r.marks:score,r.mode==='mock'?r.total:total);
 app.innerHTML=head(r.mode==='mock'?'Mock test finished':'Round complete',esc(r.label)+' · '+(msg>=85?'Excellent work!':msg>=65?'Good work. Look at the corrections below.':'Keep going: go through the corrections, then try again.'))+
 `<section class="panel">${big}<div class="topic-scores">${Object.entries(byUnit).map(([u,v])=>`<div class="score-label"><span>${esc(u==='3'?H.SECTIONS.u3.title:H.SECTIONS.u4.title)}</span><span>${v.c}/${v.n}</span></div><progress max="${v.n}" value="${v.c}"></progress>`).join('')}</div>
 <p class="small saved-note">✓ Saved in My history · ${esc(H.formatDate(r.session.start))}</p>
 <div class="actions"><button type="button" class="primary" id="again">${r.mode==='mock'?'Back to the mock page':'Another round'}</button>${missed.some(x=>!x.correct)&&r.mode!=='mock'?'<button type="button" id="retry">Retry the ones I missed</button>':''}<button type="button" id="hist">My history</button><button type="button" id="home">Home</button></div></section>`+
 (missed.length?`<h2>${r.mode==='mock'&&!r.showFeedback?'All answers and methods':'Corrections'}</h2><div class="corrections">${missed.map(x=>`<article class="correction ${x.correct?'ok':''}"><div class="eyebrow">${esc(X.diagnose(x.q,'',null).title)}${x.q.marks?` · ${x.correct?x.q.marks:0}/${x.q.marks} marks`:''}</div><h3>${P(x.q.q)}</h3>${figHTML(x.q)}<p class="your-answer">${x.given?'You wrote: '+M.previewText(x.given):'No answer'}${x.correct?' ✓':' ✗'}</p>${x.correct?`<p>Answer: <b>${ans(x.q)}</b></p><p>${mathHTML(X.methodText(x.q))}</p>`:`<p>Correct answer: <b>${ans(x.q)}</b></p>${explainHTML(x.q,x.given,x.res,x.skipped)}`}</article>`).join('')}</div>`:'<p>No corrections — everything was right!</p>');
 on('again','click',()=>{if(r.mode==='mock'){screen='mockhome';render();}else{const p=poolForSection(r.section);startRound('practice',r.section,H.SECTIONS[r.section].title,selectQuestions(p,count||p.length,store.stats));}});
 on('retry','click',()=>startRound('retry',r.section,H.SECTIONS[r.section].short+' · retry of missed questions',shuffle(r.results.filter(x=>!x.correct).map(x=>x.q))));
 on('hist','click',()=>{screen='history';render();});
 on('home','click',()=>{screen='home';render();});
}
function sessionHTML(s){
 const wrong=s.wrong.map(w=>({w,q:findQ(w.id)})).filter(x=>x.q);
 const cls=H.pct(s)>=85?'good':H.pct(s)>=65?'ok':'low';
 return `<li class="session"><div class="session-top"><span class="when">${esc(H.formatDate(s.start))}</span><span class="score ${cls}">${esc(H.scoreText(s))}</span></div>
 <div class="session-meta">${esc(s.label)} · ${s.answered}${s.planned?' of '+s.planned:''} answered · ${esc(H.formatDuration(s.seconds))}${s.complete?'':' · <span class="badge">'+esc(H.statusText(s))+'</span>'}${s.legacy?' · <span class="badge">'+esc(H.statusText(s))+'</span>':''}</div>
 ${wrong.length?`<details><summary>${wrong.length} question${wrong.length>1?'s':''} to review</summary><ul class="wrong-list">${wrong.map(({w,q})=>`<li><span class="wq">${P(q.q)}</span><span class="small">${w.skipped||!w.given?'No answer':'You wrote: '+M.previewText(w.given)} · Answer: <b>${ans(q)}</b></span></li>`).join('')}</ul></details>`:(s.legacy?'':'<p class="small allright">No mistakes ✓</p>')}</li>`;
}
function renderHistory(){
 const list=H.newestFirst(store);
 const card=k=>{const s=H.sectionSummary(store,k),sec=H.SECTIONS[k];const pool=k==='mock'?mockBank:poolForSection(k);
  return `<div class="mastery"><h3>${esc(sec.title)}</h3>${s.count?`<p class="small"><b>Last:</b> ${esc(H.scoreText(s.last))} · ${esc(H.formatDate(s.last.start))}<br><b>Best:</b> ${s.best?esc(H.scoreText(s.best))+' · '+esc(H.formatDate(s.best.start)):'—'}<br>${s.count} session${s.count>1?'s':''}</p>`:'<p class="small">No sessions yet.</p>'}
  ${k==='mock'?'':`<progress max="${pool.length}" value="${mastered(pool)}" aria-label="Questions mastered"></progress><p class="small">${mastered(pool)}/${pool.length} questions mastered · ${seen(pool)} tried</p>`}</div>`;};
 const answered=list.reduce((a,s)=>a+s.answered,0),right=list.reduce((a,s)=>a+s.correct,0);
 app.innerHTML=head('My history','Every session on this iPad, newest first: date, section, score, time taken and the questions to review.')+
 `<section class="panel"><div class="overview"><div><strong>${list.length}</strong><p>sessions</p></div><div><strong>${answered}</strong><p>questions answered</p></div><div><strong>${pct(right,answered)}<span>%</span></strong><p>answers correct</p></div></div>
 <h2>Progress by section</h2><div class="mastery-grid">${['u3','u4','mixed','mock'].map(card).join('')}</div></section>`+
 `<section class="panel"><h2>Sessions</h2>${list.length?`<ol class="sessions">${list.map(sessionHTML).join('')}</ol>`:'<p class="small">No sessions yet. Choose a section on the Practise page to start.</p>'}</section>`+
 `<section class="panel"><h2>For a parent</h2><p class="small">Copy the whole history as text (dates, scores and every mistake) to paste into a message or email.</p>
 <div class="actions"><button type="button" class="primary" id="copy">Copy history as text</button>${navigator.share?'<button type="button" id="share">Share…</button>':''}</div><p class="small" id="copy-status" aria-live="polite"></p>
 <details><summary>Show the text</summary><textarea id="export" readonly rows="10">${esc(H.exportText(store,findQ))}</textarea></details>
 <div class="actions"><button type="button" class="quiet" id="reset">Reset all maths progress and history</button></div></section>`;
 const text=()=>H.exportText(store,findQ);
 on('copy','click',async()=>{const st=document.getElementById('copy-status');const t=text();
  try{await navigator.clipboard.writeText(t);st.textContent='Copied ✓ — paste it into a message or email.';}
  catch(e){const ta=document.getElementById('export');ta.closest('details').open=true;ta.value=t;ta.focus();ta.select();try{document.execCommand('copy');st.textContent='Copied ✓';}catch(e2){st.textContent='Select the text below and copy it.';}}});
 on('share','click',()=>{navigator.share({title:"Melchior's Maths Lab history",text:text()}).catch(()=>{});});
 on('reset','click',()=>{if(confirm('Delete all Maths Lab progress AND history on this device? (Science Lab progress is not affected.)')){store=blankStore();save();render();}});
}
function navigate(dest){if(screen==='quiz'&&round&&round.results.length<round.queue.length){if(!confirm(round.mode==='mock'?'Leave the mock? It will be saved in My history as stopped early.':'Leave this round? Your answers so far are saved in My history.'))return;if(timerHandle){clearInterval(timerHandle);timerHandle=null;}}screen=dest;render();}
on('nav-home','click',()=>navigate('home'));on('nav-mock','click',()=>navigate('mockhome'));on('nav-history','click',()=>navigate('history'));
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&screen==='quiz'&&round&&round.feedback&&document.activeElement&&document.activeElement.id!=='next'){e.preventDefault();next();}});
function offlineStatus(){const e=document.getElementById('offline-status');if(e)e.textContent=navigator.onLine?'Works without an account':'Offline · ready to practise';}
window.addEventListener('online',offlineStatus);window.addEventListener('offline',offlineStatus);offlineStatus();
/* If the Science Lab service worker (scope /Science-lab/) handled this page before ours was installed,
   it may have stored this page as its own offline copy. Put the real Science Lab page back. */
async function repairScienceCache(){try{if(!('caches' in window))return;const url=new URL('../index.html',location.href).href;for(const k of await caches.keys()){if(!k.startsWith('science-lab-'))continue;const c=await caches.open(k);const hit=await c.match(url);if(hit&&(await hit.clone().text()).includes("Melchior's Maths Lab")){const r=await fetch(url+'?repair='+Date.now(),{cache:'no-store'});if(r.ok&&!(await r.clone().text()).includes("Melchior's Maths Lab"))await c.put(url,r);}}}catch(e){}}
if('serviceWorker' in navigator&&location.protocol!=='file:'){
 window.addEventListener('load',()=>{repairScienceCache();navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(async reg=>{await navigator.serviceWorker.ready;const act=reg.active||reg.waiting||reg.installing;if(act){const ch=new MessageChannel();ch.port1.onmessage=e=>{if(e.data==='offline-ready')document.getElementById('offline-status').textContent=navigator.onLine?'Ready for offline use':'Offline · ready to practise';};act.postMessage('status',[ch.port2]);}reg.addEventListener('updatefound',()=>{const w=reg.installing;if(w)w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)document.getElementById('offline-status').textContent='Update ready — close and reopen the app';});});}).catch(()=>{document.getElementById('offline-status').textContent='Online use ready · offline caching unavailable';});});
}else if(location.protocol==='file:'){document.getElementById('offline-status').textContent='Local preview · use HTTPS hosting for offline installation';}
save();render();
})(typeof globalThis!=='undefined'?globalThis:window);
