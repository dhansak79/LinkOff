## Context

The codebase has two disconnected systems: `openspec/specs/` documents behavior in WHEN/THEN scenarios, and `tests/` verifies implementation via unit tests. Neither references the other. Gaps are invisible, and tests break when implementation changes because they're coupled to function signatures rather than observable behavior.

The `src/features/feed.js` default export is the natural boundary — it takes a plain config object (mirroring `chrome.storage`) and mutates the DOM. Tests that drive through this boundary survive internal rewrites.

## Goals / Non-Goals

**Goals:**
- A `scripts/spec-coverage.js` CLI with two modes: global (all specs, informational) and change-scoped (`--change <name>`, gates archive)
- Boundary tests in `tests/spec/` named after spec scenarios, driving `feed.js` and asserting DOM outcomes
- A naming convention (`it('Scenario: <name>')`) that ties tests to spec scenarios by string match
- A hard gate in the archive workflow: change-scoped coverage must be clean before a change can be archived

**Non-Goals:**
- Replacing or modifying existing unit tests in `tests/features/`
- Enforcing coverage in CI (the archive gate is the enforcement point, not a CI check)
- Gherkin/Cucumber toolchain or step definitions
- Testing popup UI interactions (those are jsdom-hostile; document as out of scope)

## Decisions

### Decision 1: Name-matching convention over annotation tags

Tests declare coverage by naming the `it()` block `'Scenario: <name>'` where `<name>` matches the spec heading exactly. The parser greps for this string.

**Alternatives considered:**
- `// @scenario: <name>` comment tag — decouples display name from spec name, but adds a second string to keep in sync
- Custom `describe.scenario()` helper — requires a Vitest plugin, not worth the infrastructure
- UUID tags in spec and test — machine-precise but hostile to reading

Name-matching wins because test output already names the scenario for humans, and the parser needs no tooling beyond `String.includes`.

### Decision 2: `feed.js` default export as the test boundary

All boundary tests import and call:
```js
import doFeed from '../../src/features/feed.js'
doFeed({ 'main-toggle': true, 'tone-filter': true, ... })
```

DOM is set up before the call; assertions run on DOM state after.

**Why not individual feature modules?** `toneCheck()` returning `{ label, score }` is an implementation detail — if the model or scoring logic changes, the test breaks. `doFeed()` with a config object is the stable contract the extension has always exposed.

**Why not the service worker boundary?** Service worker processes happen across `chrome.runtime` message passing, which requires two-sided mocking. `feed.js` is synchronous for keyword/slop paths and uses direct callbacks for async paths, making it far simpler to drive in jsdom.

### Decision 3: Mock only at true system boundaries

Two boundaries are mocked:
1. **ML pipeline** — `vi.mock('../../src/lib/transformers.min.js', ...)` — the transformer model is an external system
2. **Chrome APIs** — `vi.stubGlobal('chrome', { runtime: { sendMessage: vi.fn() }, storage: { ... } })` — browser APIs not available in jsdom

Everything between the config object and the DOM mutation is tested as-is.

### Decision 4: Async ML scenarios use sendMessage callback injection

For tone-filter and semantic-filter scenarios, the content script sends a `chrome.runtime.sendMessage` to the service worker and processes the result via callback. In tests, we intercept `sendMessage` and invoke the callback immediately:

```js
chrome.runtime.sendMessage.mockImplementation((msg, cb) => {
  if (msg.type === 'TONE_CHECK') cb({ label: 'NEGATIVE', score: 0.82 })
})
```

This means the test exercises the full content-script processing path including the callback handler, without needing a real service worker.

### Decision 5: Parser uses Node.js built-ins only

`scripts/spec-coverage.js` uses `fs.readdirSync`, `fs.readFileSync`, and recursive directory walking — no `glob`, no `fast-glob`, no external dependencies. The spec dir structure is shallow and predictable.

### Decision 6: `--change` flag scopes to delta specs with section filtering

In change-scoped mode (`--change <name>`), the parser reads from `openspec/changes/<name>/specs/` instead of `openspec/specs/`. It also filters by section header: only scenarios under `## ADDED Requirements` and `## MODIFIED Requirements` are included in the coverage check. Scenarios under `## REMOVED Requirements` are excluded — they're being deleted, so requiring tests for them would be counterproductive.

**Why delta specs, not main specs for touched capabilities?** The author is only responsible for what they introduced. Requiring coverage of all pre-existing scenarios for a capability they've touched would force them to write tests for work they didn't do. The gate is scoped to the author's accountability.

**Parsing logic:** The parser tracks the current section heading as it reads each file. Scenario lines encountered while the active section is `ADDED` or `MODIFIED` are added to the coverage check; others are skipped.

### Decision 7: Archive gate is a hard block, not warn-and-confirm

In the archive workflow, the spec coverage check (new step 3.5) blocks archive with no confirm option when exit code is 1. This is intentionally stricter than the existing task/artifact completion checks (which warn and ask for confirmation). 

**Why harder?** Task and artifact incompleteness can be legitimately accepted — you might archive a change that's partially documented. But a scenario without a boundary test means you've defined expected behavior and written no verification for it. That's not a trade-off worth accepting, it's an oversight. The gate makes this visible at the moment it matters most: before the work is sealed.

**Output on block:**
```
Spec coverage gate failed — archive blocked.

These scenarios have no boundary tests:
  ✗ openspec/changes/<name>/specs/spec-coverage/spec.md
      Boundary tests are named after spec scenarios
        ✗ Boundary test name matches spec scenario exactly
        ✗ Boundary tests drive through feed.js default export

Write boundary tests in tests/spec/ named it('Scenario: <name>'),
then re-run /opsx:archive.
```

## Risks / Trade-offs

- **DOM simulation fidelity** → The `buildFeedDOM` helper in tests approximates LinkedIn's DOM structure but won't catch issues that depend on exact CSS or LinkedIn-specific attributes. Mitigation: copy the helper pattern from `feed.dom.test.js` which already covers both legacy and current DOM shapes.

- **Scenario name drift** → If a spec scenario is renamed, the corresponding test silently loses coverage tracking. Mitigation: the coverage script will flag it as missing (the old test name won't match), making the drift visible.

- **Async ordering in jsdom** → Some banner interaction scenarios (Show anyway, Trust author click) require simulating DOM events after the initial collapse. These need `fireEvent` or manual `.click()` calls and may expose jsdom limitations. Mitigation: scope first pass to collapse assertion scenarios only; mark interaction scenarios as `it.todo` with a comment.

- **Popup scenarios out of scope** → Several scenarios in `author-whitelist` and `banner-author-display` describe popup tab switching and tag rendering. These require a popup HTML context that jsdom doesn't provide cleanly. Mitigation: document as out of scope in the test file; they remain as `it.todo`.
