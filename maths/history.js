/* Melchior's Maths Lab — session history (stored with the rest of the progress in localStorage). */
(function(root){
'use strict';
const SECTIONS={
 u3:{key:'u3',unit:3,title:'Unit 3: Working with powers',short:'Unit 3'},
 u4:{key:'u4',unit:4,title:'Unit 4: 2D shapes and 3D solids',short:'Unit 4'},
 mixed:{key:'mixed',unit:null,title:'Both units (mixed)',short:'Mixed'},
 mock:{key:'mock',unit:null,title:'Mock test (30 marks)',short:'Mock'},
 legacy:{key:'legacy',unit:null,title:'Earlier rounds (before the update)',short:'Earlier'}
};
const MAX_SESSIONS=400;
function blankStore(){return {version:2,stats:{},sessions:[],rounds:[],mocks:[]};}
const num=x=>typeof x==='number'&&isFinite(x);
function cleanSession(s,ids){
 if(!s||typeof s!=='object'||!num(s.start)||!SECTIONS[s.section])return null;
 const wrong=Array.isArray(s.wrong)?s.wrong.filter(w=>w&&typeof w.id==='string'&&(!ids||ids.has(w.id))).map(w=>({id:w.id,given:String(w.given==null?'':w.given).slice(0,80),skipped:!!w.skipped})):[];
 const out={id:String(s.id||('s'+s.start)),start:s.start,end:num(s.end)?s.end:s.start,mode:String(s.mode||'practice'),section:s.section,label:String(s.label||SECTIONS[s.section].title).slice(0,80),
  planned:num(s.planned)?s.planned:0,answered:num(s.answered)?s.answered:0,correct:num(s.correct)?s.correct:0,seconds:num(s.seconds)?s.seconds:null,complete:!!s.complete,wrong};
 if(num(s.marks))out.marks=s.marks;if(num(s.totalMarks))out.totalMarks=s.totalMarks;if(s.timeUp)out.timeUp=true;if(s.legacy)out.legacy=true;
 return out;
}
/* Load whatever is saved (v1 or v2) without losing anything. ids = Set of valid question ids. */
function migrate(raw,ids){
 const b=blankStore();
 if(!raw||typeof raw!=='object')return b;
 if(raw.stats&&typeof raw.stats==='object')for(const k in raw.stats)if(!ids||ids.has(k))b.stats[k]=raw.stats[k];
 if(Array.isArray(raw.rounds))b.rounds=raw.rounds.slice(-60);
 if(Array.isArray(raw.mocks))b.mocks=raw.mocks.slice(-30);
 if(Array.isArray(raw.sessions))b.sessions=raw.sessions.map(s=>cleanSession(s,ids)).filter(Boolean);
 if(!(raw.version>=2)){
  // v1 kept only a short summary of each round: turn those into history entries
  for(const r of b.rounds){
   if(!r||!num(r.at))continue;
   const isMock=r.mode==='mock';
   const m=isMock?b.mocks.find(x=>x&&num(x.at)&&Math.abs(x.at-r.at)<5000):null;
   const s={id:'legacy-'+r.at,start:r.at-(m&&num(m.seconds)?m.seconds*1000:0),end:r.at,mode:r.mode||'practice',section:isMock?'mock':'legacy',label:String(r.label||'Round'),
    planned:r.total||0,answered:r.total||0,correct:r.score||0,seconds:m&&num(m.seconds)?m.seconds:null,complete:true,wrong:[],legacy:true};
   if(m){s.marks=m.marks;s.totalMarks=m.total;}
   b.sessions.push(cleanSession(s,ids));
  }
 }
 b.sessions.sort((x,y)=>x.start-y.start);
 b.sessions=b.sessions.filter(Boolean).slice(-MAX_SESSIONS);
 return b;
}
function newSession({mode,section,label,planned,totalMarks,now=Date.now()}){
 const s={id:'s'+now+'-'+Math.floor(Math.random()*1e6),start:now,end:now,mode,section,label:label||SECTIONS[section].title,planned:planned||0,answered:0,correct:0,seconds:0,complete:false,wrong:[]};
 if(totalMarks)s.totalMarks=totalMarks;
 return s;
}
/* Rebuild the saved entry from the round's results (called after every answer and at the end). */
function syncSession(store,session,results,{now=Date.now(),complete=false,timeUp=false}={}){
 const answered=results.filter(r=>!r.unanswered);
 session.answered=answered.length;
 session.correct=results.filter(r=>r.correct).length;
 session.wrong=results.filter(r=>!r.correct).map(r=>({id:r.q.id,given:String(r.given||'').slice(0,80),skipped:!!r.skipped||!!r.unanswered}));
 if(session.mode==='mock')session.marks=results.reduce((s,r)=>s+(r.correct?(r.q.marks||1):0),0);
 session.end=now;session.seconds=Math.max(0,Math.round((now-session.start)/1000));
 session.complete=!!complete;if(timeUp)session.timeUp=true;
 if(!session.answered&&!complete){store.sessions=store.sessions.filter(s=>s.id!==session.id);return session;}
 const i=store.sessions.findIndex(s=>s.id===session.id);
 const copy=JSON.parse(JSON.stringify(session));
 if(i>=0)store.sessions[i]=copy;else store.sessions.push(copy);
 if(store.sessions.length>MAX_SESSIONS)store.sessions=store.sessions.slice(-MAX_SESSIONS);
 return session;
}
function pct(s){
 if(s.section==='mock'&&num(s.marks)&&s.totalMarks)return Math.round(s.marks/s.totalMarks*100);
 return s.answered?Math.round(s.correct/s.answered*100):0;
}
function scoreText(s){
 if(s.section==='mock'&&num(s.marks)&&s.totalMarks)return `${s.marks}/${s.totalMarks} marks (${pct(s)}%)`;
 return `${s.correct}/${s.answered} (${pct(s)}%)`;
}
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDate(t){const d=new Date(t);return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function formatDuration(sec){if(sec==null)return '—';sec=Math.round(sec);if(sec<60)return sec+' s';const m=Math.floor(sec/60),s=sec%60;return m+' min'+(s?' '+String(s).padStart(2,'0')+' s':'');}
function newestFirst(store){return store.sessions.slice().sort((a,b)=>b.start-a.start);}
/* best / last per section. Best only counts finished sessions or ones with at least 5 answers. */
function sectionSummary(store,key){
 const list=store.sessions.filter(s=>s.section===key&&(s.answered>0||num(s.marks)));
 if(!list.length)return {key,count:0,last:null,best:null};
 const byTime=list.slice().sort((a,b)=>b.start-a.start);
 const fair=list.filter(s=>s.complete||s.answered>=5);
 const best=fair.length?fair.reduce((m,s)=>pct(s)>pct(m)||(pct(s)===pct(m)&&s.start>m.start)?s:m):null;
 return {key,count:list.length,last:byTime[0],best};
}
function statusText(s){if(s.legacy)return 'saved before the update';if(s.complete)return s.timeUp?'finished (time up)':'finished';return s.section==='mock'?'stopped early (not a full mock)':'stopped early';}
/* Plain-text export for a parent. findQ(id) returns the question object. */
function exportText(store,findQ,now=Date.now()){
 const L=[];
 L.push("Melchior's Maths Lab — practice history");
 L.push(`Exported ${formatDate(now)} · Year 8 Maths Cycle Test 2 (Tuesday 24 November 2026)`);
 L.push('');
 L.push('SUMMARY BY SECTION');
 for(const k of ['u3','u4','mixed','mock']){const s=sectionSummary(store,k);
  L.push(`- ${SECTIONS[k].title}: ${s.count} session${s.count===1?'':'s'}`+(s.count?` · last ${scoreText(s.last)} on ${formatDate(s.last.start)}`+(s.best?` · best ${scoreText(s.best)}`:''):''));}
 const leg=sectionSummary(store,'legacy');if(leg.count)L.push(`- ${SECTIONS.legacy.title}: ${leg.count}`);
 L.push('');
 L.push('SESSIONS (newest first)');
 const list=newestFirst(store);
 if(!list.length)L.push('No sessions yet.');
 for(const s of list){
  L.push(`${formatDate(s.start)} · ${s.label} · ${scoreText(s)} · ${s.answered}${s.planned?'/'+s.planned:''} questions answered · ${formatDuration(s.seconds)} · ${statusText(s)}`);
  for(const w of s.wrong){const q=findQ&&findQ(w.id);if(!q)continue;
   L.push(`   ✗ ${q.q.replace(/\^(\d+)/g,'^$1')} — wrote: ${w.skipped||!w.given?'(no answer)':w.given} — answer: ${q.a}${q.units&&q.form==='num'?' '+q.units:''}`);}
 }
 return L.join('\n');
}
const api={SECTIONS,KEY:'melchior-maths-lab-v1',blankStore,migrate,newSession,syncSession,pct,scoreText,formatDate,formatDuration,newestFirst,sectionSummary,statusText,exportText,MAX_SESSIONS};
root.MathsHistory=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
