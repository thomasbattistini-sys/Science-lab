// Run: node test/explain.test.mjs — checks skills, worked examples (computationally) and mistake diagnosis.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
const M = require('../marking.js');
const { SKILLS, METHODS } = require('../skills.js');
const X = require('../explain.js');
X.strict = true;
const src = fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8');
const data = JSON.parse(src.replace(/^window\.MATHS_DATA=/, '').replace(/;\s*$/, ''));
const qs = data.questions;
let pass = 0, fail = 0; const failures = [];
function expect(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }
const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9^+\-×÷()=]/g, '');

// 1. every question has a skill, a method and a different worked example
const used = new Set();
for (const q of qs) {
  const sk = X.skillOf(q); used.add(sk);
  expect(!!SKILLS[sk], `${q.id}: unknown skill ${sk}`);
  expect(X.methodSteps(q).length > 0, `${q.id}: no method steps`);
  const ex = X.exampleFor(q);
  expect(ex && ex.steps && ex.steps.length > 0, `${q.id}: no example`);
  expect(norm(ex.q) !== norm(q.q), `${q.id}: example repeats the question`);
  const d = X.diagnose(q, '', null);
  expect(d.rule && d.rule.length > 20 && d.mistakes.length >= 1, `${q.id}: rule/mistakes missing`);
}
const byIdQ = id => qs.find(q => q.id === id);
for (const [id, sk] of [['m021', 'expandNeg'], ['m018', 'expand'], ['m027', 'expandTwo'], ['m277', 'saCuboid'], ['m191', 'saCube'], ['m131', 'shapeEq'], ['m128', 'angleEq'], ['m062', 'fullyCheck'], ['m229', 'factorAlg'], ['m061', 'factorPow'], ['m096', 'idxPow'], ['m102', 'idxFindN'], ['m112', 'algPow'], ['m180', 'areaTrap'], ['m211', 'convert'], ['m242', 'capacity']])
  expect(X.skillOf(byIdQ(id)) === sk, `${id} should be skill ${sk}, got ${X.skillOf(byIdQ(id))}`);
for (const k of Object.keys(SKILLS)) expect(used.has(k), `skill ${k} is never used by a question`);
for (const k of used) expect(SKILLS[k].ex.length >= 2, `skill ${k} needs at least 2 examples`);
for (const id of Object.keys(METHODS)) expect(qs.some(q => q.id === id), `METHODS override for unknown question ${id}`);

// 2. every worked example is verified by computer
const UNITS = /\s+(cm²|cm³|m²|m³|mm²|cm|mm|m|litres|litre|ml|times|cubes)\s*$/;
function seg(s) { return s.trim().replace(UNITS, '').trim(); }
function value(tree, env) { return M.evalNode(tree, env || {}); }
let chains = 0, links = 0, examples = 0;
for (const [key, skill] of Object.entries(SKILLS)) {
  for (const ex of skill.ex) {
    examples++;
    const tag = `${key}: "${ex.q}"`;
    expect(!qs.some(q => norm(q.q) === norm(ex.q)), `${tag} is identical to a real question`);
    // each maths chain a = b = c ...
    for (const st of ex.steps) {
      if (!st.m) continue;
      for (const chain of st.m.split(';')) {
        const parts = chain.split('=').map(seg);
        chains++;
        const trees = parts.map(p => { const t = X.parse(p); expect(!!t, `${tag}: cannot read "${p}" in "${chain}"`); return t; });
        for (let i = 0; i + 1 < trees.length; i++) {
          const a = trees[i], b = trees[i + 1]; if (!a || !b) continue;
          links++;
          const va = JSON.stringify(a).includes('"var"'), vb = JSON.stringify(b).includes('"var"');
          let ok = false;
          if (!va && !vb) ok = near(value(a), value(b));
          else if (M.equivalent(a, b)) ok = true;
          if (!ok && ex.sol) ok = near(value(a, ex.sol), value(b, ex.sol));
          expect(ok, `${tag}: "${parts[i]}" ≠ "${parts[i + 1]}" (step "${st.m}")`);
        }
      }
    }
    // final answer
    if (ex.form === 'expr' || ex.form === 'factor' || ex.form === 'index') {
      const s = X.parse(ex.src), a = X.parse(ex.a);
      expect(s && a && M.equivalent(s, a), `${tag}: answer ${ex.a} is not equal to ${ex.src}`);
      expect(M.grade({ form: ex.form, a: ex.a }, ex.a).correct, `${tag}: answer ${ex.a} is not in final form`);
      if (ex.form === 'factor') expect(M.factorStructure(a).ok, `${tag}: ${ex.a} is not fully factorised`);
    } else if (ex.form === 'num') {
      if (ex.calc) { const v = Function('return ' + ex.calc.replace(/\^/g, '**'))(); expect(near(v, Number(ex.a)), `${tag}: calc ${ex.calc} = ${v}, answer says ${ex.a}`); }
      if (ex.sol) { const v = Object.values(ex.sol)[0]; expect(near(v, Number(ex.a)), `${tag}: solution ${v} ≠ answer ${ex.a}`); expect(ex.steps.some(s => s.m && /=/.test(s.m)), `${tag}: no equation steps`); }
      expect(ex.calc || ex.sol, `${tag}: numeric example without calc or sol`);
      expect(ex.steps.some(s => s.m && s.m.replace(/\s/g, '').includes(String(ex.a))) || ex.steps.some(s => s.t.includes(ex.a)), `${tag}: answer ${ex.a} never appears in the steps`);
    } else if (ex.form === 'mcq') {
      const st = M.factorStructure(X.parse(ex.src));
      expect((ex.a === 'Yes') === st.ok, `${tag}: Yes/No answer is wrong`);
      if (ex.full) { const f = X.parse(ex.full); expect(M.equivalent(f, X.parse(ex.src)) && M.factorStructure(f).ok, `${tag}: full factorisation ${ex.full} wrong`); }
    }
  }
}
// numbers in the rewritten mock methods: every chain of plain-number expressions joined by "=" must be true
for (const [id, txt] of Object.entries(METHODS)) {
  for (const clause of txt.split(/(?<!\d)[.,;:](?!\d)|\s(?:so|and|then|Then|or)\s/)) {
    const parts = clause.split('=');
    if (parts.length < 2) continue;
    const mathOnly = /^[\d\s.()½^×÷+\-]+$/;
    const segs = parts.map((p, i) => {
      let t = p.replace(/\s*(cm²|cm³|m²|m³|cm|m|litres)\b.*$/, '').trim();
      if (i === 0) { const m = t.match(/[\d(½][\d\s.()½^×÷+\-]*$/); t = m ? m[0].trim() : ''; }
      return mathOnly.test(t) && /\d/.test(t) ? t : null;
    });
    for (let i = 0; i + 1 < segs.length; i++) {
      if (!segs[i] || !segs[i + 1]) continue;
      const a = X.parse(segs[i]), b = X.parse(segs[i + 1]); if (!a || !b) continue;
      links++;
      expect(near(value(a), value(b)), `${id}: ${segs[i]} = ${segs[i + 1]} is false`);
    }
  }
}
// 3. mistake diagnosis on typical slips
const byId = id => qs.find(q => q.id === id);
const cases = [
  ['m018', '3x + 4', 'firstOnly'],          // only first term multiplied
  ['m021', '-4x - 24', 'signSlip'],         // -4 × -6 written as -24
  ['m027', '8y + 4 - 3y - 6', 'signSlip'],  // minus before bracket
  ['m228', '-x + 7', 'signSlip'],
  ['m044', '-2y - 10', 'repeatClaim'],
  ['m010', '7x', 'addInsteadOfMultiply'],
  ['m009', '7ab', 'coefAdd'],
  ['m013', '-15x^2y', 'sign'],
  ['m001', '9ab', 'unlike'],
  ['m105', 'x^15', 'expMul'],
  ['m108', '4x^11', 'divAdd'],
  ['m108', '15x^5', 'coefSub'],
  ['m111', 'y^7', 'powAdd'],
  ['m112', '2x^12', 'coefNoPow'],
  ['m137', 'x^12', 'repeatClaim'],
  ['m094', '5^12', 'expMul'],
  ['m094', '25^7', 'baseMul'],
  ['m095', '7^13', 'divAdd'],
  ['m096', '3^7', 'powAdd'],
  ['m099', '10^5', 'bare'],
  ['m046', '3(2x + 9)', 'notDivided'],
  ['m046', '3(2x - 3)', 'sign'],
  ['m047', '5(2y + 3)', 'sign'],
  ['m063', '4(2x + 6)', 'marking'],         // partial factorisation (equivalent) → marking engine message
  ['m056', 'a(6a + 9)', 'marking'],
  ['m062', 'Yes', 'notFully'],
  ['m064', 'No', 'isFully'],
  ['m033', '5', 'powerAsTimes'],            // a^2 read as 2a
  ['m034', '11', 'negIgnored'],             // 5c - 4b with b = -1 → 15 - 4
  ['m234', '-22', 'negSquare'],              // 3 × (-2)^2 done as -12
  ['m073', '29/3', 'inverse'],              // 3x = 22 + 7
  ['m073', '15', 'noDivide'],
  ['m081', '18', 'noDivide'],
  ['m128', '15', 'angleTotal'],             // 6x + 90 = 180 instead of 360
  ['m125', '40.0001', 'subBack'],
  ['m075', '7.5', 'firstOnly'],             // 2(x + 3) = 18 → 2x + 3 = 18
  ['m143', '20', 'extraHalf'],
  ['m150', '24', 'forgotHalf'],
  ['m157', '36', 'forgotHalf'],
  ['m180', '13', 'order'],
  ['m178', '70', 'wrongHeight'],
  ['m152', '90', 'wrongHeight'],            // 12 × 15 / 2 (slanted side)
  ['m181', '82', 'saNotVol'],
  ['m181', '12', 'added'],
  ['m189', '24', 'volNotSa'],
  ['m189', '26', 'halfSa'],
  ['m184', '36', 'squared'],
  ['m191', '64', 'volNotSa'],
  ['m201', '25', 'oneFace'],
  ['m211', '3500000', 'direction'],
  ['m212', '24', 'factor100'],
  ['m217', '500', 'm3cm3'],
  ['m213', '0.75', 'mlcm3'],
  ['m220', '60000', 'noConvert'],
  ['m225', '500', 'noConvert'],
  ['m035', '1', 'sign'],
];
for (const [id, given, kind] of cases) {
  const q = byId(id), res = M.grade(q, given);
  expect(!res.correct, `${id}: "${given}" should be wrong`);
  const d = X.diagnose(q, given, res);
  expect(d.why.some(w => w.kind === kind), `${id} "${given}": expected diagnosis ${kind}, got ${JSON.stringify(d.why.map(w => w.kind))} (${q.q})`);
}
// 4. robustness: diagnosis never crashes and always gives something useful for wrong answers
let specific = 0, total = 0;
for (const q of qs) {
  const wrong = [];
  if (q.form === 'mcq') wrong.push(...q.choices.filter(c => c !== q.a));
  if (q.form === 'num') { const n = Number(q.a); wrong.push(String(n + 1), String(n * 2), String(n / 2), String(-n), String(n * 1000), 'banana'); }
  if (q.form === 'index') { const [b, e] = q.a.split('^'); wrong.push(`${b}^${Number(e || 1) + 1}`, `${b}${e || ''}`, '0'); }
  if (q.form === 'expr' || q.form === 'factor') { wrong.push(q.a + ' + 1', q.a.replace(/\d+/, d => String(Number(d) + 1)), q.a.replace(/ \+ /, ' - '), 'x', '(('); }
  for (const w of wrong) {
    const res = M.grade(q, w); if (res.correct) continue;
    let d; try { d = X.diagnose(q, w, res); } catch (e) { expect(false, `${q.id} "${w}": diagnosis crashed: ${e.message}`); continue; }
    total++; if (d.specific) specific++;
    expect(d.rule && Array.isArray(d.why), `${q.id}: bad diagnosis object`);
    for (const x of d.why) expect(typeof x.text === 'string' && x.text.length > 10 && !/undefined|NaN/.test(x.text), `${q.id} "${w}": odd text ${x.text}`);
  }
}
console.log(failures.slice(0, 60).join('\n'));
console.log(`\n${pass} checks passed, ${fail} failed · ${examples} worked examples in ${Object.keys(SKILLS).length} skills, ${chains} maths chains / ${links} equalities verified · specific diagnosis for ${specific}/${total} generated wrong answers`);
process.exit(fail ? 1 : 0);
