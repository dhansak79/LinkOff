## 1. Popup HTML — new preset checkboxes

- [x] 1.1 In `src/popup/popup.html`, add `<li><label><input class="semantic-topic" type="checkbox" value="political content" /> political content</label></li>` to `.semantic-topic-list`, after the existing 8 presets
- [x] 1.2 In `src/popup/popup.html`, add `<li><label><input class="semantic-topic" type="checkbox" value="war and conflict" /> war and conflict</label></li>` immediately after the `political content` entry

## 2. Tests

- [x] 2.1 In `tests/popup/popup.test.js`, add both new checkboxes to the test DOM so existing coverage tests still pass
- [x] 2.2 Add a test: `political content` checkbox is present and unchecked when `semantic-filter` storage does not contain it
- [x] 2.3 Add a test: `war and conflict` checkbox is present and unchecked when `semantic-filter` storage does not contain it
- [x] 2.4 Add a test: checking `political content` saves it to `semantic-filter` storage

## 3. Quality gates

- [x] 3.1 Run `npm test && npm run coverage` — both must exit 0
- [x] 3.2 Run `pre_commit_code_health_safeguard` — resolve any regressions before committing
