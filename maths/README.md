# Melchior's Maths Lab

Year 8 Maths Cycle Test 2 (Tuesday 24 November 2026) revision app for iPad. Lives in `/maths/` of the Science-lab GitHub Pages site and is fully separate from the science app (own manifest, service worker scope `./`, cache prefix `maths-lab-`, localStorage key `melchior-maths-lab-v1`).

- 287 questions: 269 practice questions and an 18-question, 30-mark mock with a 30-minute timer.
- Practise by section: **Unit 3: Working with powers** (170), **Unit 4: 2D shapes and 3D solids** (99) or **both units mixed** (10, 20 or all questions). Topic tags are kept internally to balance rounds and to explain mistakes.
- Wrong answer → (1) why it is wrong: diagnosis of the likely slip (sign error when expanding, only the first term multiplied, powers multiplied instead of added, not fully factorised, forgot the ½, perimeter instead of area, surface area vs volume, unit conversion, inverse operation, …) with the key rule; (2) the method for this question step by step; (3) another worked example of the same skill.
- **My history**: every session saved with date and time, section, score, duration and the questions missed (also sessions stopped half-way); best/last score per section; "Copy history as text" / Share for a parent.
- Files: `marking.js` (answer checking), `skills.js` (44 skills: rule, common mistakes, 123 worked examples), `explain.js` (skill of each question, diagnosis, example choice), `history.js` (sessions, migration from v1, export), `app.js` (UI).
- Tests: `node test/marking.test.mjs`, `node test/explain.test.mjs` (every worked example's arithmetic and algebra is checked by computer; diagnosis cases), `node test/history.test.mjs`.
