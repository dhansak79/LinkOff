Feature: mutation-coverage-95

  Scenario: Mutation gate threshold raised to 95%
    Given stryker.config.json is inspected
    When thresholds.break is read
    Then it equals 95
