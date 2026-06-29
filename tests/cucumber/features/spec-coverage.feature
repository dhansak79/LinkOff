Feature: spec-coverage

  @wip
  Scenario: Scenarios extracted from a spec file
    When the parser runs against a spec file containing `#### Scenario:` headings
    Then each scenario name is extracted and associated with its parent requirement heading and spec file path

  @wip
  Scenario: Missing spec directory is handled gracefully
    When no `openspec/specs/` directory exists
    Then the parser exits with a clear error message and a non-zero exit code

  @wip
  Scenario: Covered scenario is marked ✓
    When a test file contains `it('Scenario: Negative post is collapsed', ...)`
    And the spec contains `#### Scenario: Negative post is collapsed`
    Then the parser reports that scenario as covered (✓)

  @wip
  Scenario: Uncovered scenario is marked ✗
    When no test file contains `it('Scenario: <name>', ...)`
    And the spec contains `#### Scenario: <name>`
    Then the parser reports that scenario as missing (✗)

  @wip
  Scenario: Partial name match does not count as covered
    When a test file contains `it('Scenario: Negative post', ...)`
    And the spec contains `#### Scenario: Negative post is collapsed`
    Then the scenario is reported as missing (✗)

  @wip
  Scenario: Report groups scenarios under requirements
    When the parser completes
    Then each spec file is listed as a section header
    And scenarios appear under their parent requirement name
    And each scenario line is prefixed with ✓ (covered) or ✗ (missing)

  @wip
  Scenario: Summary line shows overall counts
    When the parser completes
    Then the final line reads `Summary: N / T scenarios covered` where N is covered count and T is total

  @wip
  Scenario: Exit code 0 when all scenarios covered
    When every extracted scenario has a matching test
    Then the parser exits with code 0

  @wip
  Scenario: Exit code 1 when any scenario is uncovered
    When at least one scenario has no matching test
    Then the parser exits with code 1

  @wip
  Scenario: npm script invokes the parser
    When the developer runs `npm run spec:coverage`
    Then the parser executes and prints the coverage report to stdout

  @wip
  Scenario: Core functions importable as ES module exports
    When another module imports from `scripts/spec-coverage.js`
    Then `parseScenarios`, `isCovered`, and `findFiles` are available as named exports

  @wip
  Scenario: Boundary test name matches spec scenario exactly
    When a spec file contains `#### Scenario: Negative post is collapsed`
    And a boundary test file contains `it('Scenario: Negative post is collapsed', ...)`
    Then the parser reports that scenario as covered

  @wip
  Scenario: Boundary tests drive through feed.js default export
    When a boundary test exercises a collapse behavior
    Then it calls `doFeed(config)` with a config object matching the scenario's preconditions
    And it asserts on DOM state (element classes, banner presence) rather than function return values

  @wip
  Scenario: Boundary tests mock only at system boundaries
    When a boundary test runs
    Then only the ML pipeline (`transformers.min.js`) and `chrome.*` APIs are mocked
    And all internal extension code between `feed.js` and those boundaries runs un-mocked
