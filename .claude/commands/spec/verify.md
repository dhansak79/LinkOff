---
name: "Spec: Verify"
description: Run the spec-gate workflow (generate features, run cucumber, record results), then present a pass/fail summary.
category: Spec-Gate
tags: [spec-gate, verify, bdd, cucumber]
---

Verify sub-flow for the spec-gate methodology. Handles `implementing` and `verifying` phases.

**Input**: Change name (required — resolved by the router).

## Steps

1. **Verify phase**

   Read `.swamp/spec-change-{name}.json`. Phase must be `implementing` or `verifying`.

2. **Generate feature files**

   Run:
   ```
   swamp model method run spec-change generate-features --name {name}
   ```
   This writes `@wip`-tagged Gherkin to `tests/cucumber/features/`.

3. **Run spec-gate workflow**

   Run:
   ```
   swamp workflow run spec-gate --name {name}
   ```
   This runs the runner and calls `record-results`. Wait for completion.

   If the workflow step is not yet available, run the runner directly:
   ```
   swamp model method run focusin-spec-runner run
   swamp model method run spec-change record-results --name {name} --reportPath {projectDir}/cucumber-report.json
   ```

4. **Read results and present summary**

   Read `.swamp/spec-change-{name}.json` after recording. Display:

   ```
   ## Verify results: {name}

   ✓ Passing ({N}): {scenario names}
   ✗ Failing ({N}): {scenario names}
   ⏭ Skipped (@wip) ({N}): {scenario names}
   ```

5. **Route based on results**

   **All non-@wip scenarios pass:**
   - "All scenarios passing. You can archive with `swamp model method run spec-change archive --name {name}` once all @wip scenarios are implemented."

   **Some scenarios fail:**
   - For each failing scenario, determine if the failure is:
     - **Code issue** (step definition throws, assertion fails) → suggest fixing the implementation
     - **Spec issue** (scenario is wrong or ambiguous) → suggest revising via `/spec:scenarios`
   - Show the failing step and error message for each failure
   - Recommend next action

   **All scenarios @wip:**
   - Remind the user to implement step definitions and remove `@wip` tags

## Guardrails
- Do not auto-archive — archive requires an explicit human decision
- Distinguish code-fix vs spec-revision paths clearly — they require different responses
- If a scenario's step definitions are missing entirely, it's a code issue (steps need authoring), not a spec issue
- Feature files are committed deliverables — after verify, `git add tests/cucumber/features/` if there are changes
