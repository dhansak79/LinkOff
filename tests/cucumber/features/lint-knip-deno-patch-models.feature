Feature: lint-knip-deno-patch-models

  @wip
  Scenario: lint passes with no issues
    When the `focusin-lint.check` method runs and ESLint finds no issues
    Then the method SHALL write a `lintResult` resource with `passed: true` and `issueCount: 0` and SHALL return successfully

  @wip
  Scenario: lint fails with issues
    When the `focusin-lint.check` method runs and ESLint reports one or more problems
    Then the method SHALL write a `lintResult` resource with `passed: false` and `issueCount > 0` and SHALL throw with the ESLint output

  @wip
  Scenario: lintResult resource is always written before throwing
    When `focusin-lint.check` runs and lint fails
    Then the `lintResult` resource SHALL be written before the error is thrown, so the failure is recorded as swamp data

  @wip
  Scenario: knip passes with no issues
    When the `focusin-knip.check` method runs and knip finds no issues
    Then the method SHALL write a `knipResult` resource with `passed: true` and `issueCount: 0`

  @wip
  Scenario: knip fails with issues
    When the `focusin-knip.check` method runs and knip reports issues
    Then the method SHALL write a `knipResult` resource with `passed: false` and `issueCount > 0` and SHALL throw

  @wip
  Scenario: all deno extension tests pass
    When the `focusin-deno-ext-tests.run` method executes and all tests pass
    Then the method SHALL write a `testResult` resource with `passed: true`, correct `total`/`passing`/`failing` counts, and SHALL append deno lcov data to `coverage/lcov.info`

  @wip
  Scenario: one or more deno tests fail
    When the `focusin-deno-ext-tests.run` method executes and at least one test fails
    Then the method SHALL write a `testResult` resource with `passed: false`, `failing > 0`, and SHALL throw with the failing test output

  @wip
  Scenario: deno coverage appended to lcov.info for patch-coverage
    When `focusin-deno-ext-tests.run` completes successfully
    Then `coverage/lcov.info` SHALL contain the deno extension model coverage entries, enabling `focusin-patch-coverage` to check coverage for `.ts` files in `extensions/models/`

  @wip
  Scenario: all staged lines are covered
    When `focusin-patch-coverage.check` runs and every newly added line in staged JS/TS source files is hit in the coverage report
    Then the method SHALL write a `patchCoverageResult` resource with `passed: true` and `uncoveredLines: 0`

  @wip
  Scenario: one or more staged lines are uncovered
    When `focusin-patch-coverage.check` runs and at least one newly added line in a covered file has zero hits
    Then the method SHALL write a `patchCoverageResult` resource with `passed: false`, `uncoveredLines > 0`, and SHALL throw listing the uncovered file:line pairs

  @wip
  Scenario: no staged changes produces vacuous pass
    When `focusin-patch-coverage.check` runs and `git diff --cached` returns no added lines (e.g. at push time)
    Then the method SHALL write a `patchCoverageResult` resource with `passed: true` and `uncoveredLines: 0`

  @wip
  Scenario: patchCoverageResult written before throwing
    When `focusin-patch-coverage.check` finds uncovered lines
    Then the `patchCoverageResult` resource SHALL be written before the error is thrown
