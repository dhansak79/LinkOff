## 1. Coverage Parser Script

- [x] 1.1 Create `scripts/spec-coverage.js` — walk `openspec/specs/*/spec.md`, extract `#### Scenario:` headings with their parent `### Requirement:` names
- [x] 1.2 Implement test-file search — recursively read `tests/**/*.test.js`, detect `it('Scenario: <name>')` and `it("Scenario: <name>")` patterns
- [x] 1.3 Implement report output — print grouped sections (spec file → requirement → ✓/✗ scenario), then summary line `Summary: N / T scenarios covered`
- [x] 1.4 Set exit code 0 when fully covered, 1 when any scenario is missing
- [x] 1.5 Add `"spec:coverage": "node scripts/spec-coverage.js"` to `package.json`
- [x] 1.6 Implement `--change <name>` flag — when present, read from `openspec/changes/<name>/specs/` instead of `openspec/specs/`; track the current `## ...` section heading while parsing and only include scenarios found under `## ADDED Requirements` or `## MODIFIED Requirements` sections

## 2. Shared Boundary Test Infrastructure

- [x] 2.1 Create `tests/spec/_helpers.js` — export `buildFeedDOM(posts)` helper that sets up the LinkedIn main-feed DOM structure (copy pattern from `feed.dom.test.js`), and `baseConfig` object with minimal config for an enabled extension
- [x] 2.2 Document the `chrome.runtime.sendMessage` callback-injection pattern for ML async scenarios in `_helpers.js` comments

## 3. Tone Filter Boundary Tests

- [x] 3.1 Create `tests/spec/tone-filter.spec.test.js` with `// @vitest-environment jsdom`
- [x] 3.2 Mock `transformers.min.js` pipeline and `chrome` global (sendMessage callback injection for TONE_CHECK)
- [x] 3.3 Implement `it('Scenario: Tone filter toggle is off by default', ...)` — assert no tone processing when config has `tone-filter: false`
- [x] 3.4 Implement `it('Scenario: Negative post is collapsed', ...)` — stub sendMessage to return NEGATIVE 0.82, assert post gets collapsed class and banner is present
- [x] 3.5 Implement `it('Scenario: Positive or neutral post is not collapsed', ...)` — stub NEGATIVE score below threshold, assert post is not hidden
- [x] 3.6 Implement `it('Scenario: Already-collapsed posts are not re-checked', ...)` — assert sendMessage is not called for a pre-collapsed post
- [x] 3.7 Implement `it('Scenario: Banner shows confidence percentage', ...)` — assert banner signal text contains the rounded percentage
- [x] 3.8 Mark remaining interaction scenarios as `it.todo` with reason comment: `it.todo('Scenario: Show anyway reveals the post')`, `it.todo('Scenario: Trust author prevents future collapse for that author')`, `it.todo('Scenario: User enables tone filter')`, `it.todo('Scenario: Sensitivity slider is visible when tone filter is enabled')`

## 4. Semantic Filter Boundary Tests

- [x] 4.1 Create `tests/spec/semantic-filter.spec.test.js` with `// @vitest-environment jsdom`
- [x] 4.2 Mock `transformers.min.js` pipeline and `chrome` global (sendMessage callback injection for SEMANTIC_CHECK)
- [x] 4.3 Implement `it('Scenario: Political content checkbox exists and is off by default', ...)` — this is a popup scenario; mark `it.todo` with out-of-scope comment
- [x] 4.4 Implement `it('Scenario: Political content checkbox is persisted when enabled', ...)` — popup scenario; mark `it.todo`
- [x] 4.5 Implement `it('Scenario: War and conflict checkbox exists and is off by default', ...)` — popup scenario; mark `it.todo`
- [x] 4.6 Implement `it('Scenario: War and conflict checkbox is persisted when enabled', ...)` — popup scenario; mark `it.todo`

## 5. Author Whitelist Boundary Tests

- [x] 5.1 Create `tests/spec/author-whitelist.spec.test.js` with `// @vitest-environment jsdom`
- [x] 5.2 Implement `it('Scenario: Whitelisted author bypasses AI slop detection', ...)` — configure storage with whitelist containing post author's vanity, assert slop post is not collapsed
- [x] 5.3 Implement `it('Scenario: Whitelisted author bypasses semantic match', ...)` — stub semantic check above threshold, whitelist the author, assert not collapsed
- [x] 5.4 Implement `it('Scenario: Non-whitelisted author is still collapsed', ...)` — same slop post, no whitelist entry, assert collapsed
- [x] 5.5 Implement `it('Scenario: Default whitelist is empty', ...)` — storage returns `{ 'author-whitelist': [] }`, assert no whitelist bypass occurs
- [x] 5.6 Mark popup scenarios as `it.todo`: whitelist entries shown as tags, removing a tag persists change, popup has two tabs, tab switching shows correct panel

## 6. Author Unfollow Boundary Tests

- [x] 6.1 Create `tests/spec/author-unfollow.spec.test.js` with `// @vitest-environment jsdom`
- [x] 6.2 Mock `unfollow.js` (`vi.mock`) and `chrome` global
- [x] 6.3 Implement `it('Scenario: Unfollow button present when vanity name available', ...)` — build post DOM with profile `/in/username/` href, collapse post, assert Unfollow button is in banner
- [x] 6.4 Implement `it('Scenario: Unfollow button absent when vanity name unavailable', ...)` — post DOM without profile href, assert no Unfollow button
- [x] 6.5 Mark interaction scenarios as `it.todo`: Unfollow request sent on click, Button shows loading state, Success state after unfollow, Error state after failed unfollow

## 7. Banner Author Display Boundary Tests

- [x] 7.1 Create `tests/spec/banner-author-display.spec.test.js` with `// @vitest-environment jsdom`
- [x] 7.2 Implement `it('Scenario: Author available on semantic match banner', ...)` — post DOM with extractable author name, semantic collapse, assert `focusedin-slop-author` element present
- [x] 7.3 Implement `it('Scenario: No author available on semantic match banner', ...)` — post without author name, assert no author element
- [x] 7.4 Implement `it('Scenario: Author available on pattern match banner', ...)` — structural slop post with author, assert `focusedin-slop-author` present
- [x] 7.5 Implement `it('Scenario: Pattern match headline', ...)` — structural slop post, assert banner headline reads "🎯 Pattern match"
- [x] 7.6 Implement `it('Scenario: Vanity name extracted when profile link present', ...)` — post with `/in/username/` href, assert Unfollow button present (vanity was extracted)
- [x] 7.7 Implement `it('Scenario: Vanity name absent when no profile link in DOM', ...)` — post without profile href, assert no Unfollow button
- [x] 7.8 Mark remaining interaction scenarios as `it.todo`: Whitelist button present/absent, Post revealed immediately on whitelist, Whitelist button shows confirmation

## 8. Spec Coverage Skill

- [x] 8.1 Create `.claude/skills/spec-coverage/SKILL.md` with frontmatter (`name`, `description`)
- [x] 8.2 Document when to use: before archiving any change; also on-demand to audit gaps across all specs
- [x] 8.3 Document how to run: global mode (`npm run spec:coverage`) vs change-scoped mode (`node scripts/spec-coverage.js --change <name>`)
- [x] 8.4 Document how to interpret output: ✓/✗ per scenario, summary count, what to do with missing scenarios (write boundary test or mark `it.todo` with reason if genuinely untestable)
- [x] 8.5 Document the definition of done for the gate: all ADDED/MODIFIED scenarios in the change covered before archive is permitted

## 9. Archive Gate

- [x] 9.1 In `.claude/commands/opsx/archive.md`, add step 3.5 between task-completion check and delta-spec sync: run `node scripts/spec-coverage.js --change <name>`; if exit code 1, print the missing scenario list and stop with no confirm prompt
- [x] 9.2 Apply the same change to `.claude/skills/openspec-archive-change/SKILL.md` — identical step 3.5 wording

## 10. Verify

- [x] 10.1 Run `npm run spec:coverage` (global) — confirm report shows all implemented scenarios as ✓ and all `it.todo` as ✗
- [x] 10.2 Run `node scripts/spec-coverage.js --change spec-coverage-parser` — confirm it reads from the change's delta specs, counts only ADDED scenarios, and exits 1 for uncovered ones
- [x] 10.3 Run `npm test` — confirm all new boundary tests pass and no existing tests regressed
- [x] 10.4 Run `npm run coverage` — confirm patch coverage meets threshold
