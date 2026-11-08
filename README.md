# Science Lab — static iPad app

No build step, dependencies, account or backend is required. Nothing has been published.

## Hosting
Upload **all files** in this folder to the chosen GitHub Pages folder. Keep index.html, manifest.webmanifest, sw.js and the icons together. `.nojekyll` is included. All app paths are relative and work under a project subpath. Serve through HTTPS (or localhost for development); opening index.html with file:// is only a preview, not a PWA installation.

## iPad
Open the hosted HTTPS URL in Safari. Wait for **Ready for offline use**. Use Safari's **Share → Add to Home Screen** (and Open as Web App if shown). Launch from the new icon. First online load is required for offline use. Confirm offline mode on the actual iPad before relying on it for travel.

## Question bank
300 questions: 60 per topic. Includes multiple choice, true/false, short typed answers and fill-in-the-blank; some MCQs are odd-one-out, sequencing or explanation questions. Sources are the supplied 16-page Science Cycle Test 2 revision PDF. Explanations cite PDF page numbers. New naming tasks apply its stated rules; atom tasks deliberately stay within its six taught formulas. No separate school practice paper was available.

## Selection and progress
New/unseen questions are always drawn first. When those run out, unresolved mistakes take priority (weighted by past errors), then least-recently seen questions. Mixed rounds balance the topics available within each tier. Question order and MCQ choices are shuffled; no question repeats within a round. Retry-missed deliberately repeats the questions just missed.

Seen state is recorded when a question is actually displayed, not when it is merely selected for a round. Answers are saved immediately. Completed or explicitly ended rounds are added to history; leaving/reloading an unfinished round keeps question-level progress but not a round-history entry. Up to 200 rounds are retained. Progress shows coverage, latest-answer accuracy and secure questions (correct at least twice, latest answer correct). Download progress exports local JSON for a parent.

Everything stays in localStorage on that browser/device. Safari private browsing, clearing website data, storage eviction or a changed hosting origin can remove progress. Home-screen web apps and Safari may have separate storage depending on iPadOS; use the same installed app consistently. No cross-device parent dashboard or syncing. If storage is blocked, a warning appears and the quiz still works in memory. Dates display Europe/Lisbon.

## Updates
Changing files on the host can trigger an app update. Close and reopen the installed app if the update message appears. Cache names are scoped to this application's path. Existing question IDs are stable across this bank upgrade.

## Educational limits
Feedback accepts case/spacing/articles, listed synonyms, British/US spellings, formulas and number words. It deliberately does not guess arbitrary misspellings or mark free-form explanations using loose keyword matching; explanations are tested with MCQ choices. All tests are un-timed, one point per question. Progress measures practice performance, not an exam prediction. Fire questions are recall of the worksheet, not instructions to practise fire experiments.
