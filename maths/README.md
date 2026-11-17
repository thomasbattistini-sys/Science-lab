# Melchior's Maths Lab

Year 8 Maths Cycle Test 2 (Tuesday 24 November 2026) revision app for iPad. Lives in `/maths/` of the Science-lab GitHub Pages site and is fully separate from the science app (own manifest, service worker scope `./`, cache prefix `maths-lab-`, localStorage key `melchior-maths-lab-v1`).

- 287 questions: 269 practice (Days 1-5 + extra bank) and an 18-question, 30-mark mock with a 30-minute timer.
- Modes: practise by day or topic (10/20/all), mixed quick quiz (10 or 20), mock (exam style or feedback after each question).
- Marking (`marking.js`): numbers accept equivalent forms and optional units; algebra is checked by random substitution plus form checks (simplified, fully factorised, index form).
- Test: `node test/marking.test.mjs`.
