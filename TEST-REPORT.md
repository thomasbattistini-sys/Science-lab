# Science Lab — test report

Checked 08 November 2026, 19:19 Europe/Lisbon. Nothing published.

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
