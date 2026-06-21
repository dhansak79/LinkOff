## 1. New classifier module — `src/features/tone-filter.js`

- [x] 1.1 Create `src/features/tone-filter.js` with a lazy-loading `text-classification` pipeline using `Xenova/distilbert-base-uncased-finetuned-sst-2-english` (quantized), mirroring the pattern in `semantic-filter.js`
- [x] 1.2 Export `toneCheck(postText)` that returns `{ score, label }` where `score` is the NEGATIVE class confidence (0–1) and `label` is `'NEGATIVE'` or `'POSITIVE'`
- [x] 1.3 Truncate post text to 256 chars before classifying (same cap as `embed()` in `semantic-filter.js`)

## 2. Service worker — `src/service_worker.js`

- [x] 2.1 Import `toneCheck` from `./features/tone-filter.js`
- [x] 2.2 Add a `tone-check` message handler: call `toneCheck(post)` and respond with `{ score, label }`; on error respond with `{ score: 0, label: 'POSITIVE' }`
- [x] 2.3 In the `onInstalled` handler, add default storage values: `'tone-filter': false`, `'tone-threshold': 70`

## 3. Feed integration — `src/features/feed.js`

- [x] 3.1 In `handleFilterFeed`, read `tone-filter` (bool) and `tone-threshold` (number) from config and pass them into `blockPosts`
- [x] 3.2 In `blockPosts`, after the archetype check and before the semantic check, add a `tone-check` message send for posts not already collapsed
- [x] 3.3 If the response has `label === 'NEGATIVE'` and `score >= toneThreshold / 100`, mark the post as hidden and call `buildSemanticCollapseBanner` with headline `'🌩 Negative tone'` and signals `\`negative tone · ${Math.round(score * 100)}%\``
- [x] 3.4 Skip tone-check for posts already collapsed (same `data-hidden` guard used by the existing semantic check)

## 4. Popup UI — settings panel

- [x] 4.1 In `src/popup/popup.html`: add a new `<div class="divider">Filter by tone</div>` section and a toggle field for `tone-filter` (same switch markup as `detect-slop`)
- [x] 4.2 In `src/popup/popup.html`: add a `tone-threshold` slider field (`<input type="range" min="0" max="100">`) with a label showing the current value (e.g. "Sensitivity: 70%")
- [x] 4.3 In `src/popup/popup.js`: load `tone-filter` (bool, default `false`) and `tone-threshold` (number, default `70`) from storage on popup open and set the toggle/slider values
- [x] 4.4 In `src/popup/popup.js`: add change listeners for the toggle and slider that save the new values to `chrome.storage.local`
- [x] 4.5 In `src/popup/popup.css`: add slider styles so the range input matches the popup's visual theme

## 5. Tests

- [x] 5.1 In `tests/features/slop.dom.test.js`: add a `tone-filter` describe block — mock the `tone-check` chrome message to return `{ score: 0.85, label: 'NEGATIVE' }` and assert a post is soft-hidden with a `'🌩 Negative tone'` banner
- [x] 5.2 Add a test: when `tone-filter` is `false`, no `tone-check` message is sent
- [x] 5.3 Add a test: when score is below threshold (`toneThreshold / 100`), post is not collapsed
- [x] 5.4 Add a test: already-collapsed posts are not sent a `tone-check` message
- [x] 5.5 In `tests/popup/popup.test.js`: add tests covering tone-filter toggle load/save and tone-threshold slider load/save

## 6. Quality gates

- [x] 6.1 Run `npm test && npm run coverage` — both must exit 0
- [x] 6.2 Run `pre_commit_code_health_safeguard` — resolve any regressions before committing
