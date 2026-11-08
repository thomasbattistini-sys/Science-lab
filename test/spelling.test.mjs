import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = fs.readFileSync(root + 'index.html', 'utf8');
const sw = fs.readFileSync(root + 'sw.js', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
assert.equal(scripts.length, 2, 'expected data script and engine script');

const sandbox = {console};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(scripts[0], sandbox, {filename: 'science-data.js'});
vm.runInContext(scripts[1], sandbox, {filename: 'science-engine.js'});
const api = sandbox.ScienceLab;
const data = sandbox.SCIENCE_DATA;
assert.ok(api && typeof api.gradeAnswer === 'function');
assert.equal(typeof api.checkAnswer(data.questions[0], data.questions[0].answer), 'boolean');

const questions = data.questions;
const byId = new Map(questions.map(q => [q.id, q]));
const open = questions.filter(q => (q.kind === 'short' || q.kind === 'fill') && (!q.options || !q.options.length));
let failed = 0;
function check(cond, message){
 if(cond)return;
 failed++;
 console.error('FAIL:', message);
}

function grade(id, value){
 const q = byId.get(id);
 assert.ok(q, 'missing question ' + id);
 return api.gradeAnswer(q, value);
}

// --- Required accepted typos (full credit, spelling named) ---
const accepted = [
 ['0-1', 'elemnt', 'element'],
 ['0-1', 'elment', 'element'],
 ['0-1', 'eleemnt', 'element'],
 ['0-12', 'magnezium oxide', 'magnesium oxide'],
 ['0-12', 'magensium oxide', 'magnesium oxide'],
 ['0-12', 'magnseium oxide', 'magnesium oxide'],
 ['0-12', 'magnesiumoxide', 'magnesium oxide'],
 ['0-12', 'magnesium oxde', 'magnesium oxide'],
 ['0-12', 'magnesium oxdie', 'magnesium oxide'],
 ['0-13', 'iron sulfde', 'iron sulfide'],
 ['0-13', 'iron sulfied', 'iron sulfide'],
 ['0-18', 'copper sulfat', 'copper sulfate'],
 ['0-18', 'copper sulfae', 'copper sulfate'],
 ['0-18', 'coppr sulfate', 'copper sulfate'],
 ['0-19', 'aluminium oxde', 'aluminium oxide'],
 ['0-19', 'aluminuim oxide', 'aluminium oxide'],
 ['0-14', 'zinc chlorde', 'zinc chloride'],
 ['0-16', 'sodium nitrat', 'sodium nitrate'],
 ['0-17', 'calcium carbonat', 'calcium carbonate'],
 ['0-17', 'calcim carbonate', 'calcium carbonate'],
 ['2-0', 'combuston', 'combustion'],
 ['2-0', 'combusiton', 'combustion'],
 ['2-1', 'ful', 'fuel'],
 ['2-1', 'feul', 'fuel'],
 ['2-2', 'hydrocarbn', 'hydrocarbon'],
 ['2-2', 'hydrocarbonn', 'hydrocarbon'],
 ['2-4', 'carbon dioxde', 'carbon dioxide'],
 ['2-4', 'carbondioxide', 'carbon dioxide'],
 ['2-4', 'carbon dioxside', 'carbon dioxide'],
 ['2-4', 'corbon dioxide', 'carbon dioxide'],
 ['2-6', 'reactnts', 'reactants'],
 ['2-6', 'reactans', 'reactants'],
 ['2-7', 'produts', 'products'],
 ['2-10', 'exothermc', 'exothermic'],
 ['2-10', 'exotermic', 'exothermic'],
 ['2-10', 'exothermci', 'exothermic'],
 ['2-14', 'limewter', 'limewater'],
 ['2-33', 'withot water', 'without water'],
 ['2-33', 'without watter', 'without water'],
 ['2-33', 'water fre', 'water free'],
 ['1-1', 'vibraton', 'vibration'],
 ['1-10', 'meltng', 'melting'],
 ['1-11', 'freezng', 'freezing'],
 ['1-12', 'evaporaton', 'evaporat'],
 ['1-15', 'boilling', 'boiling'],
 ['1-32', 'escap', 'escape'],
 ['1-53', 'soild', 'solid'],
 ['1-54', 'gass', 'gas'],
 ['1-54', 'ags', 'gas'],
 ['1-56', 'shpae', 'shape'],
 ['1-57', 'contaner', 'container'],
 ['3-0', 'oxidaton', 'oxidation'],
 ['3-1', 'oxde', 'oxide'],
 ['3-5', 'blak', 'black'],
 ['3-10', 'thermal decompositon', 'thermal decomposition'],
 ['3-10', 'thermal decompostion', 'thermal decomposition'],
 ['3-12', 'incomplet combustion', 'incomplete combustion'],
 ['3-12', 'incompleet combustion', 'incomplete combustion'],
 ['3-31', 'conservaton of mass', 'conservation of mass'],
 ['3-31', 'law of conservaton of mass', 'conservation of mass'],
 ['4-4', 'climat change', 'climate change'],
 ['4-4', 'climate chagne', 'climate change'],
 ['4-11', 'carbon footprit', 'carbon footprint'],
 ['4-12', 'emision factor', 'emission factor'],
 ['2-12', 'pnik', 'pink'],
 ['2-13', 'bleu', 'blue'],
 ['2-13', 'blu', 'blue'],
 ['3-44', 'yelow', 'yellow'],
 ['4-18', 'snu', 'Sun'],
 ['4-18', 'sunn', 'Sun'],
 ['2-5', 'watr', 'water'],
 ['2-5', 'watr vapour', 'water vapour'],
 ['2-22', 'metane', 'methane'],
 ['2-22', 'methan', 'methane'],
 ['2-22', 'metahne', 'methane'],
 ['3-13', 'soott', 'soot'],
 ['1-52', 'liqid', 'liquid'],
 ['0-30', 'sodium chlorde', 'sodium chloride']
];

for(const [id, input, spellingPart] of accepted){
 const g = grade(id, input);
 check(g.correct === true, `${id} should accept ${JSON.stringify(input)} but got ${JSON.stringify(g)}`);
 check(g.typo === true, `${id} ${JSON.stringify(input)} should be flagged as a typo`);
 check(String(g.spelling).toLowerCase().includes(spellingPart.toLowerCase()), `${id} spelling for ${JSON.stringify(input)} was ${JSON.stringify(g.spelling)}, expected to contain ${spellingPart}`);
 check(api.checkAnswer(byId.get(id), input) === true, `${id} checkAnswer boolean for ${JSON.stringify(input)}`);
}

// --- Exact / synonym path is unchanged and is not described as a typo ---
const exact = [
 ['0-1', 'Element'],
 ['0-1', '  element  '],
 ['0-13', 'iron sulphide'],
 ['0-13', 'Iron Sulfide'],
 ['0-19', 'aluminum oxide'],
 ['2-5', 'water vapor'],
 ['2-5', 'H₂O'],
 ['2-5', 'the water'],
 ['2-4', 'CO2'],
 ['2-4', 'co₂'],
 ['0-4', 'Fe'],
 ['0-4', 'fe'],
 ['0-20', 'three'],
 ['0-20', '3'],
 ['0-20', '3 atoms'],
 ['4-14', 'eighty'],
 ['4-23', 'minus eighteen'],
 ['4-23', '-18 °C'],
 ['4-51', 'one hundred and fifty'],
 ['2-6', 'reactant'],
 ['2-7', 'product'],
 ['1-12', 'evaporation'],
 ['1-12', 'evaporate'],
 ['2-14', 'lime water'],
 ['2-33', 'no water'],
 ['2-33', 'water-free'],
 ['4-18', 'the Sun'],
 ['1-1', 'they vibrate on the spot']
];
for(const [id, input] of exact){
 const g = grade(id, input);
 check(g.correct === true && g.typo === false, `${id} exact ${JSON.stringify(input)} → ${JSON.stringify(g)}`);
}

// --- Distinct science ideas, formulas, numbers, empty, gibberish, negation ---
const rejected = [
 ['0-12', 'magnesium dioxide'],
 ['0-12', 'magnesium monoxide'],
 ['0-12', 'magnesium dioxde'],
 ['0-12', 'manganese oxide'],
 ['0-13', 'iron sulfate'],
 ['0-13', 'iron sulfite'],
 ['0-13', 'iron sulphate'],
 ['0-18', 'copper sulfide'],
 ['0-18', 'copper sulphide'],
 ['0-18', 'copper sulfite'],
 ['0-19', 'aluminium dioxide'],
 ['0-14', 'zinc chlorate'],
 ['0-14', 'zinc chlorine'],
 ['0-16', 'sodium nitrite'],
 ['0-16', 'sodium nitride'],
 ['2-4', 'carbon monoxide'],
 ['2-4', 'carbon oxide'],
 ['2-4', 'carbon dioxyde'], // still a misspelling of dioxide? dioxyde is y/i — might be a legitimate typo!
 ['2-4', 'CO3'],
 ['2-4', 'co'],
 ['2-4', 'monoxide'],
 ['2-6', 'products'],
 ['2-6', 'product'],
 ['2-7', 'reactants'],
 ['2-7', 'reactant'],
 ['2-10', 'endothermic'],
 ['2-10', 'endothermc'],
 ['2-10', 'endothermik'],
 ['3-1', 'dioxide'],
 ['3-1', 'monoxide'],
 ['3-1', 'peroxide'],
 ['3-0', 'reduction'],
 ['2-22', 'ethane'],
 ['2-22', 'propane'],
 ['2-22', 'methene'],
 ['2-22', 'methne'],
 ['0-18', 'copper sulfete'],
 ['0-17', 'calcium carbonte'],
 ['3-31', 'conversation of mass'],
 ['2-2', 'carbon'],
 ['2-2', 'hydrocarbonn monoxide'],
 ['2-3', 'hydrogen'],
 ['2-3', 'nitrogen'],
 ['2-3', 'O3'],
 ['2-3', 'o'],
 ['2-3', 'N2'],
 ['0-4', 'iron'],
 ['0-4', 'F'],
 ['0-4', 'fee'],
 ['0-4', 'FE2'],
 ['0-20', '4'],
 ['0-20', '2'],
 ['0-20', 'threee'],
 ['0-20', 'tree'],
 ['0-20', 'thre'],
 ['4-14', '81'],
 ['4-14', '79'],
 ['4-14', 'eightty'],
 ['4-14', 'eighty one'],
 ['4-23', '-19'],
 ['4-23', '-17'],
 ['4-23', 'minus seventeen'],
 ['4-23', '18'],
 ['1-10', 'freezing'],
 ['1-10', 'boiling'],
 ['1-11', 'melting'],
 ['1-11', 'condensation'],
 ['1-12', 'condensation'],
 ['1-12', 'boiling'],
 ['1-13', 'evaporation'],
 ['1-13', 'melting'],
 ['1-53', 'liquid'],
 ['1-53', 'gas'],
 ['1-54', 'solid'],
 ['1-54', 'liquid'],
 ['1-15', 'oil'],
 ['2-23', 'boil'],
 ['2-23', 'boiling'],
 ['2-12', 'blue'],
 ['2-12', 'black'],
 ['2-12', 'pine'],
 ['2-13', 'pink'],
 ['2-13', 'glue'],
 ['2-13', 'black'],
 ['2-1', 'full'],
 ['3-21', 'line'],
 ['3-5', 'blank'],
 ['3-5', 'white'],
 ['2-5', 'vapour'],
 ['2-5', 'steam'],
 ['2-5', 'ice'],
 ['2-5', 'h20'],
 ['2-5', 'H2O2'],
 ['2-33', 'with water'],
 ['2-33', 'water'],
 ['2-3', 'not oxygen'],
 ['2-3', "isn't oxygen"],
 ['2-3', 'no oxygen'],
 ['2-3', 'never'],
 ['2-10', 'not exothermic'],
 ['0-1', ''],
 ['0-1', '   '],
 ['0-1', '???'],
 ['0-1', 'asdfghjkl'],
 ['0-1', 'xxxxxx'],
 ['0-1', 'qwerty'],
 ['0-1', 'compound'],
 ['0-1', 'atom'],
 ['0-1', 'ion'],
 ['3-12', 'complete combustion'],
 ['3-12', 'complete'],
 ['2-0', 'incomplete'],
 ['4-32', 'ethane'],
 ['4-32', 'CH3'],
 ['4-37', 'carbon monoxide'],
 ['4-37', 'methane'],
 ['1-1', 'not vibrate'],
 ['1-1', 'rotation'],
 ['2-6', 'produts'],
 ['2-7', 'reactnts']
];

// dioxyde is a single-letter substitution inside dioxide (i→y), which is a
// spelling slip rather than monoxide/oxide. It is asserted with the accepts
// if the line above is removed. Handled below after the loop.
const rejectedFiltered = rejected.filter(row => row[1] !== 'carbon dioxyde');

for(const [id, input] of rejectedFiltered){
 const g = grade(id, input);
 check(g.correct === false, `${id} should reject ${JSON.stringify(input)} but got ${JSON.stringify(g)}`);
}

// i/y inside dioxide is a spelling slip, not a different oxide.
{
 const g = grade('2-4', 'carbon dioxyde');
 check(g.correct === true && g.typo === true && /dioxide/i.test(g.spelling), `dioxyde should be a spelling hint → ${JSON.stringify(g)}`);
}

// Every stored alias is still an exact, non-typo match. Every other question's
// answer is not accepted unless this question already lists it.
let exactAliases = 0;
for(const q of open){
 const seen = new Set();
 for(const alias of q.aliases){
  const key = api.normalise(alias);
  if(seen.has(key))continue;
  seen.add(key);
  exactAliases++;
  const g = api.gradeAnswer(q, alias);
  check(g.correct === true && g.typo === false, `${q.id} alias ${JSON.stringify(alias)} → ${JSON.stringify(g)}`);
 }
}
let crossChecked = 0;
const openIds = new Set(open.map(q => q.id));
for(const q of open){
 const own = new Set(q.aliases.map(a => api.normalise(a)));
 for(const other of questions){
  const n = api.normalise(other.answer);
  if(!n || own.has(n))continue;
  crossChecked++;
  const g = api.gradeAnswer(q, other.answer);
  check(g.correct === false, `${q.id} accepted other answer ${JSON.stringify(other.answer)} from ${other.id} → ${JSON.stringify(g)}`);
 }
}

// Multiple choice and true/false stay exact, even when the typed string is a
// one-letter slip of the keyed choice.
for(const q of questions){
 if(q.kind === 'short' || q.kind === 'fill')continue;
 const gExact = api.gradeAnswer(q, q.answer);
 check(gExact.correct === true && gExact.typo === false, `${q.id} choice exact`);
 if(/^[A-Za-z]{5,}$/.test(q.answer)){
  const slipped = q.answer.slice(0, -2) + q.answer.slice(-1);
  const g = api.gradeAnswer(q, slipped);
  check(g.correct === false, `${q.id} MCQ/TF should ignore typo ${JSON.stringify(slipped)} of ${JSON.stringify(q.answer)}`);
 }
}

// Adjacent transpositions on the longest word of each natural answer.
let transpositions = 0, transpositionHits = 0;
const transpositionMisses = [];
for(const q of open){
 for(const alias of q.aliases){
  const n = api.normalise(alias);
  if(!n || /^-?\d/.test(n) || /\d/.test(n))continue;
  const words = n.split(' ');
  let word = words[0];
  for(const w of words)if(w.length > word.length)word = w;
  if(word.length < 5)continue;
  const at = Math.max(1, Math.floor(word.length / 2) - 1);
  const swapped = word.slice(0, at) + word[at + 1] + word[at] + word.slice(at + 2);
  if(swapped === word)continue;
  const input = n.replace(word, swapped);
  transpositions++;
  const g = api.gradeAnswer(q, input);
  if(g.correct && g.typo)transpositionHits++;
  else if(transpositionMisses.length < 25)transpositionMisses.push(`${q.id} ${input} → ${JSON.stringify(g)}`);
 }
}
const transpositionRate = transpositionHits / transpositions;

// History shape is unchanged: a typo awards a normal correct mark.
{
 const q = byId.get('0-1');
 const store = api.blankStore();
 api.markSeen(store, q, 1000);
 const g = api.gradeAnswer(q, 'elemnt');
 api.recordAnswer(store, q, g.correct, 2000);
 const stat = store.stats[q.id];
 check(stat.correct === 1 && stat.incorrect === 0 && stat.lastCorrect === true, 'typo should score full credit ' + JSON.stringify(stat));
 const keys = Object.keys(stat).sort().join(',');
 check(keys === 'correct,incorrect,lastAnswered,lastCorrect,lastSeen,seen', 'stat keys ' + keys);
 store.attempts.push({date: 2000, label: 'Mixed test', score: 1, total: 1, topics: [{topic: 0, total: 1, correct: 1}], typo: true});
 const clean = api.sanitiseStore(store, questions);
 check(clean.stats[q.id].lastCorrect === true && clean.stats[q.id].correct === 1, 'sanitise keeps credit');
 check(!Object.prototype.hasOwnProperty.call(clean.attempts[0], 'typo'), 'history entries drop unknown fields');
 check(Object.keys(clean.attempts[0]).sort().join(',') === 'date,label,score,topics,total', 'history keys ' + Object.keys(clean.attempts[0]).sort().join(','));
 const wrong = api.blankStore();
 api.recordAnswer(wrong, q, api.gradeAnswer(q, 'dioxide').correct, 3);
 check(wrong.stats[q.id].correct === 0 && wrong.stats[q.id].incorrect === 1 && wrong.stats[q.id].lastCorrect === false, 'wrong answer still incorrect');
}

check(html.includes("const KEY='melchior-science-lab-v2'"), 'progress key changed');
check(html.includes('Correct! Watch the spelling:'), 'spelling feedback copy missing');
check(html.includes('store.attempts.push({date:Date.now(),label,score:summary.score,total:summary.total,topics:summary.topics})'), 'round history schema changed');
check(sw.includes("const CACHE=PREFIX+'a91c4e7b2d05'"), 'service worker cache was not bumped');
check(!sw.includes('b1923d807364'), 'old service worker cache id still present');
check(sw.includes('caches.delete'), 'old caches are still dropped on activate');

console.log(JSON.stringify({
 openQuestions: open.length,
 exactAliases,
 crossChecked,
 transpositions,
 transpositionHits,
 transpositionRate: Number(transpositionRate.toFixed(3)),
 transpositionMisses,
 failed
}, null, 2));

if(transpositionRate < 0.9){
 console.error('Transposition acceptance rate below 0.9');
 failed++;
}
if(failed){
 console.error(failed + ' assertion(s) failed');
 process.exit(1);
}
console.log('spelling tests passed');
