# Science Lab — test report

Checked 08 November 2026, 19:19 Europe/Lisbon. Nothing published.

## Spelling tolerance (08 November 2026)

Open short and fill-in answers still match exact text, synonyms, UK/US spellings, formulas and number words first. A second pass accepts a small typo in ordinary words and shows `Correct! Watch the spelling:` plus the right spelling, with full credit. Round history is unchanged (`date`, `label`, `score`, `total`, `topics`). Progress stays in `melchior-science-lab-v2`. The service worker cache id is `a91c4e7b2d05`, so an installed iPad app can pick up the new page and keep local progress.

`node test/spelling.test.mjs` passed: 121 open questions, 203 exact aliases, 35,979 cross-checks against every other question answer, and 133/133 adjacent letter-swaps on words of 5+ letters.

Accepted typos (representative): `elemnt` → element; `magnezium oxide`, `magnseium oxide`, `magnesiumoxide` → magnesium oxide; `iron sulfde` → iron sulfide; `copper sulfae` → copper sulfate; `carbon dioxde`, `carbondioxide`, `carbon dioxyde` → carbon dioxide; `exotermic` → exothermic; `reactnts` → reactants; `produts` → products; `incomplet combustion` → incomplete combustion; `climat change` → climate change; `thermal decompositon` → thermal decomposition; `withot water` → without water; `soild` → solid; `pnik` → pink; `bleu` → blue; `watr vapour` → water vapour; `metane` → methane.

Still incorrect (representative): magnesium dioxide / monoxide / dioxde; iron sulfate / sulphite; copper sulfide; sodium nitrite; zinc chlorate; carbon monoxide / carbon oxide / CO3; endothermic / endothermc; products on a reactants question and the reverse; ethane / propane / methene for methane; O3, N2, or the bare symbol `o` for oxygen; `iron`, `F`, or `fee` for Fe; 4, threee, or tree for 3; 81 or eightty for 80; melting for freezing; oil for boiling; vapour, steam, ice, or h20 for water; not / isn't / no oxygen; complete combustion for incomplete combustion; conversation of mass; empty, `???`, `xxxxxx`, `qwerty`. Ambiguous slips that are as close to a different idea as to the answer are rejected too (`methne`, `copper sulfete`, `calcium carbonte`). Multiple-choice and true/false choices stay exact.

| Topic | Total | MCQ | True/false | Short answer | Fill-in |
|---|---:|---:|---:|---:|---:|
| Substances & formulas | 60 | 17 | 1 | 41 | 1 |
| Solids, liquids & gases | 60 | 33 | 8 | 14 | 5 |
| Burning | 60 | 30 | 6 | 20 | 4 |
| Oxidation, mass & pollution | 60 | 34 | 5 | 18 | 3 |
| Global warming & footprints | 60 | 39 | 6 | 13 | 2 |
| **Total** | **300** | **153** | **26** | **106** | **15** |

## Passed
- Node syntax checks for the embedded app engine and service worker.
- 3,340 bank/engine/local HTTP/DOM assertions: 300 unique IDs and prompts; 60 questions per topic; all accepted answers/aliases; every MCQ distractor rejected; UK/US spellings, formula subscripts, digits/word numbers and units; case/articles/spaces; scores; retry-missed; no repeat during ten 30-question mixed rounds before the bank is exhausted; unseen-first ordering; missed-question preference; least-recently-seen fallback; topic caps and balanced mixed rounds; data sanitisation.
- HTTP loaded successfully under the project subpath `/science-lab/`. All HTML, manifest, SW and PNG requests returned 200. JSDOM loaded the actual served page without script/DOM errors. Completed a 10-question round, retried its missed question, restored saved progress on a fresh load, inspected input attributes, checked early-ending a round, and verified operation when localStorage is blocked. Wrong typed HTML is escaped.
- 13 additional service-worker lifecycle/cache tests: precache all six entry assets, install/activate, scoped cache cleanup, preserve unrelated app caches, cached assets offline, network navigation and offline fallback, ready-status message, ignore out-of-scope and non-GET requests.
- Valid PNG icons at 180×180, 192×192 and 512×512. Manifest uses standalone mode and relative paths.

## Limits of this verification
No physical iPad, Safari rendering/keyboard test or actual installed-PWA offline test was performed. JSDOM is a Node DOM integration harness, not a real browser. Service-worker tests used simulated cache/network APIs. Verify Add to Home Screen, offline launch and portrait/landscape layout on the real iPad after HTTPS hosting.

## Content scope
The PDF was read in full. Page references are embedded in all feedback. New compound names apply its explicit naming rules. Atom-counting stays within its six taught formulas rather than inventing additional chemistry. Related concepts intentionally recur in different question formats/applications; there are no identical prompts. The separate school practice paper was not supplied.

## Persistence caveats
Progress remains local to the chosen Safari/home-screen app context. It is not synced to a parent's phone. Private browsing, clearing website data or storage eviction may erase it. Download progress from the Progress screen to keep a copy. The former Canvas remains the original 118-question version; this independent app contains the enlarged 300-question bank.
