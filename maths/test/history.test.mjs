// Run: node test/history.test.mjs — session history: saving, partial sessions, migration from v1, summaries, export.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
const H = require('../history.js');
const src = fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8');
const data = JSON.parse(src.replace(/^window\.MATHS_DATA=/, '').replace(/;\s*$/, ''));
globalThis.MATHS_DATA = data;
require('../marking.js'); require('../skills.js'); require('../explain.js');
const Lab = require('../app.js') || globalThis.MathsLab;
const qs = data.questions, ids = new Set(qs.map(q => q.id)), byId = id => qs.find(q => q.id === id);
let pass = 0, fail = 0; const failures = [];
function expect(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }
const T = (d, h, m) => new Date(2026, 10, d, h, m).getTime(); // local time, November 2026

// formatting
expect(H.formatDate(T(17, 21, 30)) === 'Tue 17 Nov, 21:30', 'date format: ' + H.formatDate(T(17, 21, 30)));
expect(H.formatDate(T(22, 9, 5)) === 'Sun 22 Nov, 09:05', 'date format with leading zeros: ' + H.formatDate(T(22, 9, 5)));
expect(H.formatDuration(372) === '6 min 12 s' && H.formatDuration(45) === '45 s' && H.formatDuration(120) === '2 min', 'duration format');
expect(H.KEY === 'melchior-maths-lab-v1', 'storage key unchanged');

// a practice session saved answer by answer
let store = H.blankStore();
const qA = byId('m018'), qB = byId('m105'), qC = byId('m143');
let s = H.newSession({ mode: 'practice', section: 'u3', label: H.SECTIONS.u3.title, planned: 3, now: T(17, 21, 30) });
const results = [];
H.syncSession(store, s, results, { now: T(17, 21, 30) });
expect(store.sessions.length === 0, 'no entry before the first answer');
results.push({ q: qA, given: '3x + 12', correct: true });
H.syncSession(store, s, results, { now: T(17, 21, 31) });
expect(store.sessions.length === 1 && store.sessions[0].complete === false && store.sessions[0].answered === 1, 'partial session saved after first answer');
results.push({ q: qB, given: 'x^15', correct: false });
H.syncSession(store, s, results, { now: T(17, 21, 33) });
expect(store.sessions.length === 1, 'same session updated, not duplicated');
expect(store.sessions[0].wrong.length === 1 && store.sessions[0].wrong[0].id === 'm105' && store.sessions[0].wrong[0].given === 'x^15', 'wrong answer stored with what he wrote');
results.push({ q: byId('m106'), given: '', correct: false, skipped: true });
H.syncSession(store, s, results, { now: T(17, 21, 36), complete: true });
let e = store.sessions[0];
expect(e.complete && e.answered === 3 && e.correct === 1 && e.seconds === 360 && e.wrong.length === 2 && e.wrong[1].skipped, 'finished session: counts, duration, skipped flag');
expect(H.pct(e) === 33 && H.scoreText(e) === '1/3 (33%)', 'score text ' + H.scoreText(e));
// localStorage round trip keeps everything
const reloaded = H.migrate(JSON.parse(JSON.stringify(store)), ids);
expect(JSON.stringify(reloaded.sessions) === JSON.stringify(store.sessions), 'survives a save/load round trip');

// a session left half-way (quit) stays as "stopped early"
let s2 = H.newSession({ mode: 'practice', section: 'u4', label: H.SECTIONS.u4.title, planned: 10, now: T(18, 18, 0) });
H.syncSession(store, s2, [{ q: qC, given: '20', correct: false }, { q: byId('m150'), given: '12', correct: true }], { now: T(18, 18, 4) });
const p = store.sessions.find(x => x.id === s2.id);
expect(p && !p.complete && p.answered === 2 && p.planned === 10 && H.statusText(p) === 'stopped early', 'partial session kept as stopped early');

// mock with marks
let s3 = H.newSession({ mode: 'mock', section: 'mock', label: 'Mock test', planned: 18, totalMarks: 30, now: T(19, 17, 0) });
const mock = qs.filter(q => q.day === 6);
const mres = mock.map((q, i) => ({ q, given: i < 10 ? q.a : 'zz', correct: i < 10, unanswered: i >= 15, skipped: i >= 15 }));
H.syncSession(store, s3, mres, { now: T(19, 17, 25), complete: true });
const m = store.sessions.find(x => x.id === s3.id);
const expMarks = mock.slice(0, 10).reduce((a, q) => a + q.marks, 0);
expect(m.marks === expMarks && m.totalMarks === 30 && m.answered === 15 && H.scoreText(m) === `${expMarks}/30 marks (${Math.round(expMarks / 30 * 100)}%)`, 'mock marks: ' + H.scoreText(m));

// newest first + summaries
const order = H.newestFirst(store).map(x => x.section);
expect(order.join(',') === 'mock,u4,u3', 'newest first: ' + order);
let s4 = H.newSession({ mode: 'practice', section: 'u3', planned: 10, now: T(20, 19, 0) });
H.syncSession(store, s4, qs.filter(q => q.unit === 3).slice(0, 10).map((q, i) => ({ q, given: q.a, correct: i < 8 })), { now: T(20, 19, 9), complete: true });
let s5 = H.newSession({ mode: 'practice', section: 'u3', planned: 10, now: T(21, 19, 0) });
H.syncSession(store, s5, [{ q: qA, given: '3x+12', correct: true }], { now: T(21, 19, 1) }); // 1/1 partial: must not count as best
const u3 = H.sectionSummary(store, 'u3');
expect(u3.count === 3 && u3.last.id === s5.id && u3.best.id === s4.id && H.pct(u3.best) === 80, 'u3 summary best/last');
expect(H.sectionSummary(store, 'mixed').count === 0, 'empty section summary');

// export text for a parent
const txt = H.exportText(store, byId, T(21, 20, 0));
expect(txt.includes('Exported Sat 21 Nov, 20:00'), 'export header date');
expect(txt.includes('Tue 17 Nov, 21:30 · Unit 3: Working with powers · 1/3 (33%)'), 'export session line');
expect(txt.includes('Simplify x^3 × x^5') && txt.includes('wrote: x^15') && txt.includes('answer: x^8'), 'export lists mistakes');
expect(txt.includes('Unit 4: 2D shapes and 3D solids: 1 session') && txt.includes('stopped early'), 'export summary and partial flag');
expect(txt.indexOf('Sat 21 Nov, 19:00') < txt.indexOf('Tue 17 Nov, 21:30'), 'export newest first');

// migration from the v1 store (before this update): nothing is lost
const v1 = { version: 1, stats: { m001: { seen: 2, correct: 1, incorrect: 1, lastCorrect: true, lastSeen: T(17, 20, 0) }, bogus: { seen: 1 } },
  rounds: [{ at: T(17, 20, 10), mode: 'practice', label: 'Day 1 · Algebra basics', score: 7, total: 10 }, { at: T(17, 20, 50), mode: 'mock', label: 'Mock test', score: 12, total: 18 }],
  mocks: [{ at: T(17, 20, 50), marks: 21, total: 30, seconds: 1500 }] };
const mig = H.migrate(v1, ids);
expect(mig.version === 2 && mig.stats.m001 && !mig.stats.bogus, 'v1 stats kept (unknown ids dropped)');
expect(mig.sessions.length === 2 && mig.sessions[0].section === 'legacy' && mig.sessions[0].correct === 7 && mig.sessions[0].legacy, 'v1 rounds become history entries');
expect(mig.sessions[1].section === 'mock' && mig.sessions[1].marks === 21 && mig.sessions[1].totalMarks === 30 && mig.sessions[1].seconds === 1500, 'v1 mock keeps marks and time');
const mig2 = H.migrate(JSON.parse(JSON.stringify(mig)), ids);
expect(mig2.sessions.length === 2, 'migrating twice does not duplicate');
expect(H.migrate(null, ids).sessions.length === 0 && H.migrate('junk', ids).version === 2, 'bad data gives a blank store');
expect(H.migrate({ version: 2, sessions: [{ start: 'x' }, { start: T(17, 1, 1), section: 'nope' }, null] }, ids).sessions.length === 0, 'invalid sessions are dropped');

// cap
let big = H.blankStore();
for (let i = 0; i < H.MAX_SESSIONS + 25; i++) { const x = H.newSession({ mode: 'practice', section: 'mixed', planned: 1, now: T(1, 0, 0) + i * 60000 }); H.syncSession(big, x, [{ q: qA, given: 'a', correct: false }], { now: T(1, 0, 0) + i * 60000 + 1000, complete: true }); }
expect(big.sessions.length === H.MAX_SESSIONS && big.sessions[0].start === T(1, 0, 0) + 25 * 60000, 'keeps the newest ' + H.MAX_SESSIONS + ' sessions');
expect(JSON.stringify(big).length < 200000, 'storage stays small: ' + JSON.stringify(big).length + ' bytes for ' + big.sessions.length + ' sessions');

// sections: only 2 units + mixed, built from the unit field
const L = globalThis.MathsLab;
expect(L.poolForSection('u3').every(q => q.unit === 3) && L.poolForSection('u4').every(q => q.unit === 4), 'section pools by unit');
expect(L.poolForSection('u3').length + L.poolForSection('u4').length === L.poolForSection('mixed').length && L.poolForSection('mixed').length === 269, 'mixed = both units (269 practice questions)');
expect(H.SECTIONS.u3.title === 'Unit 3: Working with powers' && H.SECTIONS.u4.title === 'Unit 4: 2D shapes and 3D solids', 'real unit titles');

console.log(failures.join('\n'));
console.log(`\n${pass} checks passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
