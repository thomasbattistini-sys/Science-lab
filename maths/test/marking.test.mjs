// Run: node test/marking.test.mjs
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const M = require('../marking.js');
const src = fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8');
const data = JSON.parse(src.replace(/^window\.MATHS_DATA=/, '').replace(/;\s*$/, ''));
let pass = 0, fail = 0; const failures = [];
function expect(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }
const qs = data.questions;
for (const q of qs) {
  // 1. stored answer and every accepted alternative must be marked correct
  for (const a of [q.a, ...q.alt]) {
    const r = M.grade(q, a);
    expect(r.correct, `${q.id} [${q.form}] should ACCEPT ${JSON.stringify(a)} -> ${JSON.stringify(r)}`);
  }
  // 2. wrong answers must be rejected
  const wrong = [];
  if (q.form === 'mcq') wrong.push(...q.choices.filter(c => c !== q.a));
  if (q.form === 'num') { const n = Number(q.a); wrong.push(String(n + 1), String(n * 10 + 3), n !== 0 ? String(-n) : '7', 'banana'); }
  if (q.form === 'index') { const [b, e] = q.a.split('^'); if (e) { wrong.push(`${b}^${Number(e) + 1}`, String(Math.pow(Number(b), Number(e))), `${b}${e}`); } else wrong.push('0', '2'); }
  if (q.form === 'expr' || q.form === 'factor') {
    wrong.push(q.a + ' + 1');
    wrong.push(q.a.replace(/\d+/, d => String(Number(d) + 1)));
    if (/[+-]/.test(q.a.slice(1))) wrong.push(q.a.replace(/ \+ /, ' - ').replace(/^(.*?) - /, (m, p) => m));
    // copying the question back must not score
    const m = q.q.match(/^(?:\d+\.\s*)?(?:\([a-c]\)\s*)?(?:Simplify|Expand and simplify|Expand|Factorise fully|Factorise)\s+(.+)$/);
    if (m && !/=/.test(m[1])) wrong.push(m[1]);
  }
  for (const w of wrong) {
    if ([q.a, ...q.alt].includes(w)) continue;
    const r = M.grade(q, w);
    expect(!r.correct, `${q.id} [${q.form}] should REJECT ${JSON.stringify(w)} (q: ${q.q})`);
  }
}
// 3. targeted cases from the brief
const cases = [
  [{ form: 'num', a: '24', units: 'cm²' }, ['24', '24.0', '24 cm2', '24 cm²', '24cm^2', 'x = 24'], ['25', '2.4']],
  [{ form: 'expr', a: '3x + 12' }, ['3x+12', '12 + 3x', '3*x+12', '3 × x + 12'], ['3(x + 4)', '3x+4', 'x+x+x+12']],
  [{ form: 'expr', a: '2x^2 + 6x' }, ['2x²+6x', '6x+2x^2', '2*x^2+6*x', '2x2+6x'], ['2x(x+3)', '2x^3+6x']],
  [{ form: 'factor', a: '4(3x + 2)' }, ['4(3x+2)', '4(2+3x)', '(3x+2)4'], ['2(6x+4)', '12x+8', '4(3x+3)']],
  [{ form: 'factor', a: '5x^2(x - 2)' }, ['5x²(x-2)', '5x^2(x-2)'], ['5x(x^2-2x)', 'x(5x^2-10x)', '5(x^3-2x^2)', '5x^3-10x^2']],
  [{ form: 'index', a: '5^7' }, ['5^7', '5⁷'], ['78125', '5^12', '35']],
];
for (const [q, ok, bad] of cases) {
  for (const a of ok) { const r = M.grade(q, a); expect(r.correct, `case ${q.a}: accept ${a} -> ${JSON.stringify(r)}`); }
  for (const a of bad) { const r = M.grade(q, a); expect(!r.correct, `case ${q.a}: reject ${a}`); }
}
// partial factorisation must say "not fully factorised"
const pr = M.grade({ form: 'factor', a: '4(3x + 2)' }, '2(6x+4)');
expect(/not fully factorised/.test(pr.message || ''), 'partial factorisation feedback');
// every referenced diagram exists
for (const q of qs) if (q.fig) expect(fs.existsSync(new URL('../fig/' + q.fig, import.meta.url)), 'missing diagram ' + q.fig);
expect(qs.length === 287, 'expected 287 questions, got ' + qs.length);
const mock = qs.filter(q => q.day === 6);
expect(mock.reduce((s, q) => s + (q.marks || 0), 0) === 30, 'mock should total 30 marks');
console.log(failures.slice(0, 40).join('\n'));
console.log(`\n${pass} checks passed, ${fail} failed (${qs.length} questions)`);
process.exit(fail ? 1 : 0);
