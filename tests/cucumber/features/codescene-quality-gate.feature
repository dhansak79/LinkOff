Feature: codescene-quality-gate

  @wip
  Scenario: No degradations introduced on branch
    When the `quality-gate` workflow runs and no changed files on the branch have introduced new health findings
    Then the `codescene-health` step SHALL pass and SHALL write a `healthResult` resource with `passed: true` and `failedFiles: 0`

  @wip
  Scenario: At least one file introduces a health degradation
    When the `quality-gate` workflow runs and at least one changed file has introduced new health findings vs. `main`
    Then the `codescene-health` step SHALL fail and SHALL write a `healthResult` resource with `passed: false`, `failedFiles > 0`, and the failing file(s) listed with their `newScore` and `findings`

  @wip
  Scenario: No files degraded on branch
    When the `quality-gate` workflow runs and `cs delta main` returns an empty array (no degradations)
    Then the `codescene-health` step SHALL pass and SHALL write a `healthResult` resource with `failedFiles: 0` and `passed: true`

  @wip
  Scenario: `cs` CLI not installed
    When the `quality-gate` workflow runs and the `cs` binary is not available on PATH
    Then the `codescene-health` step SHALL fail with a human-readable error message indicating that the CodeScene CLI must be installed

  @wip
  Scenario: Degraded file stored with findings
    When a file has introduced new health findings during the check
    Then the stored `healthResult` SHALL include that file's `name`, `newScore`, and a non-empty `findings` array containing at least one entry with a `category` field

  @wip
  Scenario: Result is stored even when nothing degraded
    When `cs delta main` returns an empty array
    Then the stored `healthResult` SHALL still be written with `passed: true`, `failedFiles: 0`, and an empty `files` array

  @wip
  Scenario: Pre-commit no longer runs CodeScene check (post-graduation)
    When a developer runs `git commit` after Phase 3 cleanup
    Then the pre-commit hook SHALL NOT invoke `check-codescene-health.js` or any equivalent CodeScene CLI call

  @wip
  Scenario: Pre-push enforces health gate
    When a developer runs `git push`
    Then the pre-push hook SHALL trigger the `quality-gate` workflow which SHALL include the `codescene-health` step
