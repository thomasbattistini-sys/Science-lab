/* Melchior's Maths Lab — UI and round engine. Progress lives only in this browser (localStorage). */
(function(root){
'use strict';
const M=root.MathsMark,data=root.MATHS_DATA,bank=data.questions,topics=data.topics,days=data.days;
const KEY='melchior-maths-lab-v1';
const MOCK_MINUTES=30;
const practiceBank=bank.filter(q=>q.day!==6),mockBank=bank.filter(q=>q.day===6);
function shuffle(a,rng=Math.random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function blankStore(){return {version:1,stats:{},rounds:[],mocks:[]};}
function sanitise(s){const b=blankStore();if(!s||typeof s!=='object')return b;const ids=new Set(bank.map(q=>q.id));if(s.stats&&typeof s.stats==='object')for(const k in s.stats)if(ids.has(k))b.stats[k]=s.stats[k];if(Array.isArray(s.rounds))b.rounds=s.rounds.slice(-60);if(Array.isArray(s.mocks))b.mocks=s.mocks.slice(-30);return b;}
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
root.MathsLab={selectQuestions,blankStore,sanitise};
if(typeof document==='undefined')return;

let storageOK=true,store;
try{store=sanitise(JSON.parse(localStorage.getItem(KEY)));}catch(e){store=blankStore();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(store));storageOK=true;}catch(e){storageOK=false;}updateStorageNote();}
const app=document.getElementById('app');
const esc=M.esc,P=M.pretty;
const pct=(n,d)=>d?Math.round(n/d*100):0;
let screen='home',sel={kind:'day',id:1},count=10,mockFeedback=false;
let round=null; // {mode,label,queue,index,results,feedback,deadline,startedAt}
let timerHandle=null;
function stat(id){return store.stats[id];}
function mastered(list){return list.filter(q=>stat(q.id)&&stat(q.id).lastCorrect===true).length;}
function seen(list){return list.filter(q=>stat(q.id)&&stat(q.id).seen).length;}
function poolFor(s){if(s.kind==='day')return practiceBank.filter(q=>q.day===s.id);if(s.kind==='topic')return practiceBank.filter(q=>q.topic===s.id);return practiceBank;}
function labelFor(s){if(s.kind==='day')return days.find(d=>d.id===s.id).title;if(s.kind==='topic')return topics[s.id];return 'Mixed quick quiz';}
function head(t,sub){return `<div class="section-head"><h1 id="screen-title" tabindex="-1">${t}</h1><p class="lede">${sub}</p></div>`;}
function on(id,ev,fn){const e=document.getElementById(id);if(e)e.addEventListener(ev,fn);}
function updateStorageNote(){const e=document.getElementById('storage-note');if(e)e.textContent=storageOK?'Progress is saved on this iPad/browser only. No account, no tracking, no syncing.':'This browser cannot save progress. You can still practise, but progress may be lost when you close the app.';}
function setNav(){for(const [id,s] of [['nav-home','home'],['nav-mock','mockhome'],['nav-progress','progress']])document.getElementById(id).setAttribute('aria-current',screen===s?'page':'false');}
function render(){
 setNav();
 if(screen!=='quiz'&&timerHandle){clearInterval(timerHandle);timerHandle=null;}
 if(screen==='home')renderHome();else if(screen==='mockhome')renderMockHome();else if(screen==='quiz')renderQuiz();else if(screen==='end')renderEnd();else renderProgress();
 const t=document.getElementById('screen-title');if(t&&screen!=='quiz')t.focus({preventScroll:true});
 if(screen!=='quiz')window.scrollTo(0,0);
}
function masteryLine(list){const m=mastered(list);return `${list.length} questions · ${m} mastered`;}
function renderHome(){
 const dayCards=days.filter(d=>d.id!==6).map(d=>{const list=practiceBank.filter(q=>q.day===d.id);const on=sel.kind==='day'&&sel.id===d.id;return `<button type="button" class="topic${on?' selected':''}" data-day="${d.id}" aria-pressed="${on}"><strong>${esc(d.title)}</strong><span>${esc(d.date)} · ${masteryLine(list)}</span></button>`;}).join('');
 const topicCards=topics.map((t,i)=>{const list=practiceBank.filter(q=>q.topic===i);if(!list.length)return '';const on=sel.kind==='topic'&&sel.id===i;return `<button type="button" class="topic compact${on?' selected':''}" data-topic="${i}" aria-pressed="${on}"><strong>${esc(t)}</strong><span>${masteryLine(list)}</span></button>`;}).join('');
 const pool=poolFor(sel);
 app.innerHTML=head("Melchior's Maths Lab",`Year 8 Maths Cycle Test 2 · ${esc(data.exam)} · ${bank.length} questions on Units 3 and 4.`)+
 `<section class="panel" aria-labelledby="qq"><div class="eyebrow">Quick start</div><h2 id="qq">Mixed quick quiz</h2><p class="small">Questions from every topic. New questions come first, then the ones you got wrong.</p><div class="choices"><button type="button" class="primary" id="quick10">10 questions</button><button type="button" class="primary" id="quick20">20 questions</button></div></section>`+
 `<section class="panel" aria-labelledby="pd"><div class="eyebrow">Practise</div><h2 id="pd">Practise by day</h2><div class="topic-grid">${dayCards}</div><h3>…or by topic</h3><div class="topic-grid">${topicCards}</div>
 <h3>How many questions?</h3><div class="choices">${[10,20,0].map(n=>`<button type="button" class="number${count===n?' selected':''}" data-count="${n}" aria-pressed="${count===n}">${n||'All'}</button>`).join('')}</div>
 <button type="button" class="primary wide" id="start">Start: ${esc(labelFor(sel))} (${count?Math.min(count,pool.length):pool.length} questions)</button></section>`+
 `<section class="panel" aria-labelledby="mk"><div class="eyebrow">Exam practice</div><h2 id="mk">30-minute mock test</h2><p class="small">${mockBank.length} questions, 30 marks, timed like the real test.</p><button type="button" id="go-mock">Go to the mock test</button></section>`+
 `<div class="how"><h3>How it works</h3><ul><li>Type short answers. Use the buttons under the box for powers and brackets, e.g. <b>x²</b> or <b>3(x + 4)</b>.</li><li>Units are optional: 24, 24 cm² and 24 cm2 all count.</li><li>Algebra is checked properly: 6 + 3x is the same as 3x + 6, but “factorise fully” needs the full HCF outside the bracket.</li><li>After each answer you see the method. Missed questions come back later.</li></ul></div>`;
 app.querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>{sel={kind:'day',id:Number(b.dataset.day)};renderKeep();}));
 app.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{sel={kind:'topic',id:Number(b.dataset.topic)};renderKeep();}));
 app.querySelectorAll('[data-count]').forEach(b=>b.addEventListener('click',()=>{count=Number(b.dataset.count);renderKeep();}));
 on('start','click',()=>{const pool=poolFor(sel);startRound('practice',labelFor(sel),selectQuestions(pool,count||pool.length,store.stats));});
 on('quick10','click',()=>startRound('quick','Mixed quick quiz',selectQuestions(practiceBank,10,store.stats)));
 on('quick20','click',()=>startRound('quick','Mixed quick quiz',selectQuestions(practiceBank,20,store.stats)));
 on('go-mock','click',()=>{screen='mockhome';render();});
}
function renderKeep(){const y=window.scrollY;renderHome();window.scrollTo(0,y);}
function renderMockHome(){
 const last=store.mocks.slice(-3).reverse();
 app.innerHTML=head('Mock test',`Year 8 Maths Cycle Test 2 practice paper · ${mockBank.length} questions · 30 marks · ${MOCK_MINUTES} minutes.`)+
 `<section class="panel"><h2>Before you start</h2><ul class="small"><li>Have paper and a pencil ready for working out. No calculator.</li><li>The timer starts when you press Start. When the time is up, the test ends and unanswered questions score 0.</li><li>Each question shows its marks. In the app a question scores all its marks when the final answer is right.</li></ul>
 <label class="check"><input type="checkbox" id="fb" ${mockFeedback?'checked':''}> Show the answer and method after each question (practice style)</label>
 <p class="small">Leave this off for real exam conditions: you will see every answer and method at the end.</p>
 <button type="button" class="primary wide" id="start-mock">Start the 30-minute mock</button></section>`+
 (last.length?`<section class="panel"><h2>Recent mocks</h2>${last.map(m=>`<p>${esc(displayDate(m.at))}: <b>${m.marks}/${m.total}</b> marks · ${fmtTime(m.seconds)}</p>`).join('')}</section>`:'');
 on('fb','change',e=>{mockFeedback=e.target.checked;});
 on('start-mock','click',()=>startRound('mock','Mock test',mockBank.slice(),{feedback:mockFeedback}));
}
function startRound(mode,label,queue,opt={}){
 if(!queue.length)return;
 round={mode,label,queue,index:0,results:[],feedback:null,showFeedback:mode!=='mock'||!!opt.feedback,startedAt:Date.now(),deadline:mode==='mock'?Date.now()+MOCK_MINUTES*60000:null,choiceOrder:null};
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
 // remaining questions score 0
 for(let i=round.results.length;i<round.queue.length;i++){const q=round.queue[i];round.results.push({q,given:'',correct:false,res:{correct:false,message:'Not answered (time up).'},skipped:true});}
 round.timeUp=true;finish();
}
function figHTML(q){return q.fig?`<figure class="diagram"><img src="./fig/${esc(q.fig)}" alt="Diagram for this question (not drawn to scale)"><figcaption>Not drawn to scale</figcaption></figure>`:'';}
const KEYS=['^','²','³','(',')','x','y','a','b'];
function renderQuiz(){
 const r=round,q=r.queue[r.index],n=r.queue.length,fb=r.feedback;
 const score=r.results.filter(x=>x.correct).length;
 const marks=q.marks?` · ${q.marks} mark${q.marks>1?'s':''}`:'';
 let meta=`<div class="round-meta"><span>${esc(r.label)}</span><span>Question ${r.index+1} of ${n}${marks}</span>${r.mode==='mock'?`<span id="timer" class="timer">⏱ ${fmtTime((r.deadline-Date.now())/1000)}</span>`:`<span>Score ${score}/${r.results.length}</span>`}</div><progress max="${n}" value="${r.index+(fb?1:0)}" aria-label="Round progress"></progress>`;
 let body;
 const topicLine=`<div class="eyebrow">${esc(topics[q.topic])}</div>`;
 if(q.form==='mcq'){
  body=`<div class="answer-options">${q.choices.map((c,i)=>{let cls='answer';if(fb){if(c===q.a)cls+=' right-answer';else if(c===fb.given)cls+=' wrong-answer';}return `<button type="button" class="${cls}" data-choice="${esc(c)}" ${fb?'disabled':''}><span class="letter">${'AB'[i]||i+1}</span><span>${P(c)}</span></button>`;}).join('')}</div>`;
 }else{
  const isNum=q.form==='num';
  body=`<form id="answer-form" autocomplete="off"><label for="ans">Your answer${q.units&&isNum?` <span class="small">(units: ${esc(q.units)}, optional)</span>`:''}</label>
  <input id="ans" name="ans" type="text" ${isNum?'inputmode="text"':''} autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="${fb?'next':'done'}" value="${fb?esc(fb.given):''}" ${fb?'readonly':''} placeholder="${isNum?'e.g. 24':q.form==='index'?'e.g. 5^7':'e.g. 3x² + 2x'}">
  <div class="preview" id="preview" aria-live="polite">${fb?'':''}</div>
  ${fb?'':`<div class="keys" role="group" aria-label="Maths keys">${KEYS.map(k=>`<button type="button" class="key" data-key="${esc(k)}" aria-label="Insert ${k==='^'?'power sign':k==='²'?'squared sign':k==='³'?'cubed sign':k}" title="${k==='²'?'adds ²':k==='³'?'adds ³':k==='^'?'power: type x^5':''}">${k==='²'?'x²':k==='³'?'x³':esc(k)}</button>`).join('')}<button type="button" class="key" data-key="⌫" aria-label="Delete">⌫</button></div>`}
  ${fb?'':`<div class="actions"><button type="submit" class="primary" id="check">Check answer</button><button type="button" class="quiet" id="dunno">${r.showFeedback?'Show me the answer':'Skip'}</button></div>`}</form>`;
 }
 let fbHTML='';
 if(fb&&r.showFeedback){
  const res=fb.res;
  fbHTML=`<div class="feedback ${fb.correct?'correct':'incorrect'}" role="status"><h2>${fb.correct?'Correct!':fb.skipped?'Here is the answer':'Not quite'}</h2>
  ${res.message?`<p><b>${esc(res.message)}</b></p>`:''}${res.note?`<p>${esc(res.note)}</p>`:''}
  ${fb.given&&q.form!=='mcq'?`<p class="your-answer">You wrote: ${M.previewText(fb.given)}</p>`:''}
  <p>Answer: <b>${P(q.a)}${q.units&&q.form==='num'?' '+esc(q.units):''}</b></p><p>${P(q.ex)}</p></div>`;
 }
 const nextBtn=fb?`<button type="button" class="primary wide" id="next">${r.index+1<n?'Next question':'See results'}</button>`:'';
 app.innerHTML=meta+`<section class="panel question-panel" data-qid="${q.id}">${topicLine}<h1 id="screen-title" tabindex="-1" class="question">${P(q.q)}</h1>${figHTML(q)}${body}${fbHTML}${nextBtn}</section>`+
 (r.mode!=='mock'||r.index>0?`<div class="round-footer"><span>${r.mode==='mock'?'Answers are saved as you go.':'Checked answers are saved in your progress.'}</span><button type="button" class="quiet" id="quit">${r.mode==='mock'?'Finish test now':'End round'}</button></div>`:`<div class="round-footer"><span>Good luck!</span><button type="button" class="quiet" id="quit">Finish test now</button></div>`);
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
 on('quit','click',()=>{if(r.mode==='mock'){if(confirm('Finish the mock now? Unanswered questions will score 0.'))timeUp();}else{if(r.results.length===0||confirm('End this round now? Your checked answers are already saved.'))finish();}});
 if(!fb)window.scrollTo(0,0);
}
function submit(given,skipped=false){
 const r=round,q=r.queue[r.index];
 if(!skipped&&!String(given).trim()){const p=document.getElementById('preview');if(p)p.textContent='Type an answer first (or use “'+(r.showFeedback?'Show me the answer':'Skip')+'”).';return;}
 const res=skipped?{correct:false}:M.grade(q,given);
 const now=Date.now(),old=store.stats[q.id]||{seen:0,correct:0,incorrect:0};
 store.stats[q.id]={seen:(old.seen||0)+1,correct:(old.correct||0)+(res.correct?1:0),incorrect:(old.incorrect||0)+(res.correct?0:1),lastCorrect:!!res.correct,lastSeen:now};
 save();
 const item={q,given:skipped?'':given,correct:!!res.correct,res,skipped};
 r.results.push(item);
 if(r.showFeedback){r.feedback=item;renderQuiz();const f=document.querySelector('.feedback');if(f)f.scrollIntoView({block:'nearest',behavior:'smooth'});}
 else next(true);
}
function next(){const r=round;r.feedback=null;if(r.index+1<r.queue.length){r.index++;renderQuiz();}else finish();}
function finish(){
 const r=round;if(timerHandle){clearInterval(timerHandle);timerHandle=null;}
 r.seconds=(Date.now()-r.startedAt)/1000;
 const score=r.results.filter(x=>x.correct).length;
 if(r.mode==='mock'){
  const marks=r.results.reduce((s,x)=>s+(x.correct?(x.q.marks||1):0),0),total=r.queue.reduce((s,q)=>s+(q.marks||1),0);
  r.marks=marks;r.total=total;store.mocks.push({at:Date.now(),marks,total,seconds:Math.min(r.seconds,MOCK_MINUTES*60)});
 }
 if(r.results.length)store.rounds.push({at:Date.now(),mode:r.mode,label:r.label,score,total:r.results.length});
 save();screen='end';render();
}
function displayDate(t){try{return new Date(t).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){return new Date(t).toString();}}
function renderEnd(){
 const r=round,score=r.results.filter(x=>x.correct).length,total=r.results.length;
 const byTopic={};for(const x of r.results){const t=x.q.topic;byTopic[t]=byTopic[t]||{c:0,n:0};byTopic[t].n++;if(x.correct)byTopic[t].c++;}
 const missed=r.mode==='mock'&&!r.showFeedback?r.results:r.results.filter(x=>!x.correct);
 const big=r.mode==='mock'?`<div class="big-score">${r.marks}<span>/${r.total} marks</span></div><p class="percent">${pct(r.marks,r.total)}% · ${score} of ${r.queue.length} questions right · time used ${fmtTime(Math.min(r.seconds,MOCK_MINUTES*60))}${r.timeUp?' (time up)':''}</p>`:`<div class="big-score">${score}<span>/${total}</span></div><p class="percent">${pct(score,total)}% correct</p>`;
 const msg=pct(r.mode==='mock'?r.marks:score,r.mode==='mock'?r.total:total);
 app.innerHTML=head(r.mode==='mock'?'Mock test finished':'Round complete',esc(r.label)+' · '+(msg>=85?'Excellent work!':msg>=65?'Good work. Look at the corrections below.':'Keep going: go through the corrections, then try again.'))+
 `<section class="panel">${big}<div class="topic-scores">${Object.entries(byTopic).map(([t,v])=>`<div class="score-label"><span>${esc(topics[t])}</span><span>${v.c}/${v.n}</span></div><progress max="${v.n}" value="${v.c}"></progress>`).join('')}</div>
 <div class="actions"><button type="button" class="primary" id="again">${r.mode==='mock'?'Back to the mock page':'Another round'}</button>${missed.some(x=>!x.correct)&&r.mode!=='mock'?'<button type="button" id="retry">Retry the ones I missed</button>':''}<button type="button" id="home">Home</button></div></section>`+
 (missed.length?`<h2>${r.mode==='mock'&&!r.showFeedback?'All answers and methods':'Corrections'}</h2><div class="corrections">${missed.map(x=>`<article class="correction ${x.correct?'ok':''}"><div class="eyebrow">${esc(topics[x.q.topic])}${x.q.marks?` · ${x.correct?x.q.marks:0}/${x.q.marks} marks`:''}</div><h3>${P(x.q.q)}</h3>${figHTML(x.q)}<p class="your-answer">${x.given?'You wrote: '+M.previewText(x.given):'No answer'}${x.correct?' ✓':' ✗'}</p>${x.res&&x.res.message&&!x.correct?`<p><b>${esc(x.res.message)}</b></p>`:''}<p>Answer: <b>${P(x.q.a)}${x.q.units&&x.q.form==='num'?' '+esc(x.q.units):''}</b></p><p>${P(x.q.ex)}</p></article>`).join('')}</div>`:'<p>No corrections — everything was right!</p>');
 on('again','click',()=>{if(r.mode==='mock'){screen='mockhome';render();}else if(r.mode==='quick')startRound('quick','Mixed quick quiz',selectQuestions(practiceBank,r.queue.length,store.stats));else{const pool=poolFor(sel);startRound('practice',labelFor(sel),selectQuestions(pool,count||pool.length,store.stats));}});
 on('retry','click',()=>startRound(r.mode,r.label+' (retry)',shuffle(r.results.filter(x=>!x.correct).map(x=>x.q))));
 on('home','click',()=>{screen='home';render();});
}
function renderProgress(){
 const all=practiceBank,s=seen(all),m=mastered(all);
 const answered=Object.values(store.stats).reduce((a,x)=>a+(x.correct||0)+(x.incorrect||0),0),right=Object.values(store.stats).reduce((a,x)=>a+(x.correct||0),0);
 const row=(title,list)=>{const mm=mastered(list),ss=seen(list);return `<div class="mastery"><h3>${esc(title)}</h3><progress max="${list.length}" value="${mm}"></progress><p class="small">${mm}/${list.length} mastered · ${ss} tried</p></div>`;};
 app.innerHTML=head('Progress','Mastered = answered correctly the last time it came up.')+
 `<section class="panel"><div class="overview"><div><strong>${m}<span>/${all.length}</span></strong><p>questions mastered</p></div><div><strong>${s}<span>/${all.length}</span></strong><p>questions tried</p></div><div><strong>${pct(right,answered)}<span>%</span></strong><p>of ${answered} answers correct</p></div></div>
 <h2>By day</h2><div class="mastery-grid">${days.filter(d=>d.id!==6).map(d=>row(d.title,all.filter(q=>q.day===d.id))).join('')}</div>
 <h2>By topic</h2><div class="mastery-grid">${topics.map((t,i)=>{const l=all.filter(q=>q.topic===i);return l.length?row(t,l):'';}).join('')}</div></section>`+
 `<section class="panel"><h2>Mock tests</h2>${store.mocks.length?`<div class="table-wrap"><table><thead><tr><th>Date</th><th>Time used</th><th>Marks</th></tr></thead><tbody>${store.mocks.slice().reverse().map(x=>`<tr><td>${esc(displayDate(x.at))}</td><td>${fmtTime(x.seconds)}</td><td>${x.marks}/${x.total}</td></tr>`).join('')}</tbody></table></div>`:'<p class="small">No mock yet.</p>'}</section>`+
 `<section class="panel"><h2>Recent rounds</h2>${store.rounds.length?`<div class="table-wrap"><table><thead><tr><th>Date</th><th>Round</th><th>Score</th></tr></thead><tbody>${store.rounds.slice(-15).reverse().map(x=>`<tr><td>${esc(displayDate(x.at))}</td><td>${esc(x.label)}</td><td>${x.score}/${x.total}</td></tr>`).join('')}</tbody></table></div>`:'<p class="small">No rounds yet.</p>'}
 <div class="actions"><button type="button" class="quiet" id="reset">Reset all maths progress</button></div></section>`;
 on('reset','click',()=>{if(confirm('Delete all Maths Lab progress on this device? (Science Lab progress is not affected.)')){store=blankStore();save();render();}});
}
function navigate(dest){if(screen==='quiz'&&round&&round.results.length<round.queue.length){if(!confirm(round.mode==='mock'?'Leave the mock? It will not be scored.':'Leave this round? Checked answers stay in your progress.'))return;if(timerHandle){clearInterval(timerHandle);timerHandle=null;}}screen=dest;render();}
on('nav-home','click',()=>navigate('home'));on('nav-mock','click',()=>navigate('mockhome'));on('nav-progress','click',()=>navigate('progress'));
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
