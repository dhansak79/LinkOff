## 1. Rename structural slop labels

- [x] 1.1 In `src/features/feed.js:242`, change headline arg from `'🎯 Structural slop'` to `'🎯 Pattern match'`
- [x] 1.2 In `src/features/feed.js:243`, change signal text from `` `structural slop · ${pct}%` `` to `` `pattern match · ${pct}%` ``

## 2. Add author to semantic collapse banners

- [x] 2.1 In `buildSemanticCollapseBanner` (`feed.js`), call `extractAuthorName(post)` after extracting the summary
- [x] 2.2 Append a `focusedin-slop-author` div with the author name when non-null, placed after the score row and before the button

## 3. Tests and safeguard

- [x] 3.1 Update or add unit tests covering: author row present when author extractable, author row absent when not extractable, headline reads "Pattern match", signal text reads "pattern match · N%"
- [x] 3.2 Run `npm test && npm run coverage` — both must exit 0
- [x] 3.3 Run `pre_commit_code_health_safeguard` — resolve any regressions before committing
