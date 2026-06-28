Feature: spec-coverage-unit

  Scenario: parseScenarios returns entries from a spec file
    When `parseScenarios(filePath, false)` is called on a spec file containing `#### Scenario:` headings
    Then it returns an array of `{ requirement, scenario }` objects matching those headings

  Scenario: parseScenarios in change mode only returns ADDED and MODIFIED entries
    When `parseScenarios(filePath, true)` is called on a spec file with ADDED, MODIFIED, and REMOVED sections
    Then only entries under `## ADDED Requirements` and `## MODIFIED Requirements` are returned

  Scenario: isCovered returns true for a matching test
    When a test file contains `it('Scenario: <name>'`
    Then `isCovered(name)` returns true

  Scenario: isCovered returns false when no test matches
    When no test file contains `it('Scenario: <name>'`
    Then `isCovered(name)` returns false

  Scenario: findFiles recursively collects matching files
    When `findFiles(dir, predicate)` is called on a directory tree
    Then it returns all files matching the predicate, including files in subdirectories
