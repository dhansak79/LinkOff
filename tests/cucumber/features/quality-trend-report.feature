Feature: quality-trend-report

  Scenario: Trend computation reads from committed telemetry
    Given at least 10 telemetry/workflow-runs/<workflowId>/*.yaml records exist for the quality-gate workflow
    When node scripts/generate-guardrails-dashboard.js runs
    Then it computes a delta for mutation score, line coverage, spec coverage, and code-health failed-file count between the current run and the oldest run in the trailing window

  Scenario: No trend shown with too little history
    Given fewer than 2 telemetry records exist for the quality-gate workflow
    When the dashboard script runs
    Then each delta is marked unavailable and no metric is flagged

  Scenario: Declining metric is flagged
    Given a metric's value in the current run is at least 2 points worse than the oldest run in the trailing window
    When the dashboard script computes the delta
    Then that metric is marked flagged in the generated output

  Scenario: Stable or improving metric is not flagged
    Given a metric's value in the current run is within 2 points of, or better than, the oldest run in the trailing window
    When the dashboard script computes the delta
    Then that metric is not flagged

  Scenario: Skipped step does not break trend computation
    Given one of the telemetry records in the trailing window has a null or missing value for a metric because its step was skipped
    When the dashboard script computes that metric's delta
    Then it skips the record with the missing value and uses the nearest record with a value, without erroring

  Scenario: Dashboard renders trend flags
    Given the dashboard script has computed at least one flagged metric
    When it regenerates reports/workflow-insights/index.html
    Then the generated HTML contains a visible warning indicator for each flagged metric

  Scenario: Dashboard renders cleanly when nothing is flagged
    Given the dashboard script has computed no flagged metrics
    When it regenerates reports/workflow-insights/index.html
    Then the generated HTML shows the trend section with no warning indicators

  Scenario: Trend view reaches the existing GitHub Pages dashboard
    Given the quality-gate workflow's dashboard job has regenerated reports/workflow-insights/index.html including trend data
    When .github/workflows/publish.yml runs its publish and deploy-pages jobs on a push to main
    Then the deployed page at the existing /insights/ GitHub Pages path includes the trend section, with no new GitHub Actions job or Pages path created

  Scenario: README documents the trend capability at the existing link
    Given README.md links to the guardrails dashboard at https://dhansak79.github.io/FocusIn/insights/
    When this change is complete
    Then the surrounding sentence in README.md mentions that the dashboard flags declining quality trends

  Scenario: No gitignore or data-tracking changes required
    Given telemetry/workflow-runs/ is already git-tracked and /reports is already gitignored as a build artifact
    When this change is implemented
    Then no entries are added to or removed from .gitignore, and no new directory needs to be tracked for the trend feature to work in CI

  Scenario: Existing quality-gate-summary report is unaffected
    Given @focusin/quality-gate-summary already produces its per-run markdown and JSON
    When scripts/generate-guardrails-dashboard.js is extended with trend computation
    Then quality-gate-summary's report output schema and content are unchanged
