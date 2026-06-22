---
name: spec-coverage
description: Check which spec scenarios have boundary tests. Use before archiving a change to verify all new scenarios are covered, or on-demand to audit coverage across all specs.
---

# Spec Coverage

## When to Use

- **Before archiving a change** — the archive gate runs this automatically in change-scoped mode; use it manually to check before you get there
- **On demand** — to see the full picture of which scenarios across all specs have boundary tests and which don't

## How to Run

**Global mode** — all specs, informational only:
```bash
npm run spec:coverage
```

**Change-scoped mode** — scenarios added or modified in a specific change:
```bash
node scripts/spec-coverage.js --change <change-name>
```

Change-scoped mode only counts scenarios under `## ADDED Requirements` and `## MODIFIED Requirements` in the change's delta specs. `## REMOVED` scenarios are excluded.

## Interpreting Output

```
Spec Coverage Report
────────────────────────────────────────────────────────────

openspec/specs/tone-filter/spec.md
  Tone filter setting is available in the Filters panel
    ✓ Tone filter toggle is off by default
    ✗ User enables tone filter

Summary: 1 / 2 scenarios covered
```

- **✓** — a test file contains `it('Scenario: <name>', ...)` matching this scenario exactly
- **✗** — no test contains that exact string; the scenario is uncovered
- **Exit code 0** — all scenarios covered
- **Exit code 1** — at least one uncovered

## What To Do With Missing Scenarios

For each ✗:

1. **Can it be tested through `feed.js`?** If the scenario describes a DOM mutation (post collapsed, banner present, button visible), write a boundary test in `tests/spec/<capability>.spec.test.js`:
   ```js
   it('Scenario: <exact name from spec>', () => {
     // setup DOM + config
     doFeed({ ...baseConfig, ... })
     vi.advanceTimersByTime(350)
     // assert DOM outcome
   })
   ```

2. **Is it a popup UI scenario?** If the scenario requires popup HTML context (tab switching, Tagify inputs, settings panels), mark it as todo with a reason:
   ```js
   it.todo('Scenario: <exact name from spec>') // popup UI — requires popup HTML context
   ```
   `it.todo` is still detected as "covered" by the parser.

3. **Is it genuinely not testable** via jsdom (e.g., browser API with no mock path)? Mark `it.todo` with a reason comment explaining why.

## Definition of Done (Archive Gate)

The archive workflow runs change-scoped spec coverage as a **hard gate** — it cannot be bypassed with a confirm prompt. Before a change can be archived:

- Every scenario under `## ADDED Requirements` and `## MODIFIED Requirements` in the change's delta specs must appear as `it('Scenario: <name>')` or `it.todo('Scenario: <name>')` in a test file.
- Exit code must be 0.

If the gate fails, write the missing boundary tests (or mark untestable ones `it.todo`), then re-run `/opsx:archive`.
