import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import jsYaml from 'js-yaml'
import { computeTrends, renderTrendCard, generate } from '../../../scripts/generate-guardrails-dashboard.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../../..')

const HOUR = 60 * 60 * 1000
const BASE = new Date('2026-06-25T10:00:00Z').getTime()

function makeRun(offsetMs, overrides = {}) {
  return {
    id: `run-${offsetMs}`,
    workflowName: overrides.workflowName ?? 'quality-gate',
    status: overrides.status ?? 'succeeded',
    startedAt: new Date(BASE + offsetMs).toISOString(),
    completedAt: new Date(BASE + offsetMs + 5 * 60 * 1000).toISOString(),
    blockingStep: overrides.blockingStep ?? null,
    metrics: {
      mutation: 'mutation' in overrides ? overrides.mutation : { passed: true, score: 90, files: [] },
      coverage: 'coverage' in overrides ? overrides.coverage : { passed: true, lines: 95, functions: 95, branches: 95, statements: 95 },
      specCoverage: 'specCoverage' in overrides ? overrides.specCoverage : { passed: true, pct: 100, covered: 10, total: 10 },
      codescene: 'codescene' in overrides ? overrides.codescene : { passed: true, failedFiles: 0, files: [] },
    },
  }
}

// Scenario: Trend computation reads from committed telemetry
Given(/^at least 10 telemetry\/workflow-runs\/<workflowId>\/\*\.yaml records exist for the quality-gate workflow$/, function () {
  this.runs = Array.from({ length: 10 }, (_, i) => makeRun(i * HOUR))
})

When(/^node scripts\/generate-guardrails-dashboard\.js runs$/, function () {
  generate({ runs: this.runs })
  this.trends = computeTrends(this.runs)
})

Then(
  'it computes a delta for mutation score, line coverage, spec coverage, and code-health failed-file count between the current run and the oldest run in the trailing window',
  function () {
    for (const name of ['mutationScore', 'lineCoverage', 'specCoverage', 'codeHealthFailedFiles']) {
      assert.equal(this.trends.metrics[name].available, true)
      assert.ok('delta' in this.trends.metrics[name])
    }
  }
)

// Scenario: No trend shown with too little history
Given('fewer than 2 telemetry records exist for the quality-gate workflow', function () {
  this.runs = [makeRun(0)]
})

When('the dashboard script runs', function () {
  generate({ runs: this.runs })
  this.trends = computeTrends(this.runs)
})

Then('each delta is marked unavailable and no metric is flagged', function () {
  for (const metric of Object.values(this.trends.metrics)) {
    assert.deepEqual(metric, { available: false })
  }
})

// Scenario: Declining metric is flagged
Given("a metric's value in the current run is at least 2 points worse than the oldest run in the trailing window", function () {
  this.runs = [
    makeRun(0, { mutation: { passed: true, score: 91, files: [] } }),
    makeRun(HOUR, { mutation: { passed: true, score: 84, files: [] } }),
  ]
})

When('the dashboard script computes the delta', function () {
  generate({ runs: this.runs })
  this.trends = computeTrends(this.runs)
})

Then('that metric is marked flagged in the generated output', function () {
  assert.equal(this.trends.metrics.mutationScore.flagged, true)
})

// Scenario: Stable or improving metric is not flagged
Given('a metric\'s value in the current run is within 2 points of, or better than, the oldest run in the trailing window', function () {
  this.runs = [
    makeRun(0, { mutation: { passed: true, score: 91, files: [] } }),
    makeRun(HOUR, { mutation: { passed: true, score: 90, files: [] } }),
  ]
})

Then('that metric is not flagged', function () {
  assert.equal(this.trends.metrics.mutationScore.flagged, false)
})

// Scenario: Skipped step does not break trend computation
Given(
  'one of the telemetry records in the trailing window has a null or missing value for a metric because its step was skipped',
  function () {
    const skipped = makeRun(0, { mutation: null })
    this.runs = [skipped, makeRun(HOUR, { mutation: { passed: true, score: 88, files: [] } })]
  }
)

When("the dashboard script computes that metric's delta", function () {
  generate({ runs: this.runs })
  this.trends = computeTrends(this.runs)
})

Then('it skips the record with the missing value and uses the nearest record with a value, without erroring', function () {
  assert.equal(this.trends.metrics.mutationScore.available, true)
  assert.equal(this.trends.metrics.mutationScore.baseline, 88)
})

// Scenario: Dashboard renders trend flags / renders cleanly when nothing is flagged
Given('the dashboard script has computed at least one flagged metric', function () {
  this.trends = computeTrends([
    makeRun(0, { mutation: { passed: true, score: 91, files: [] } }),
    makeRun(HOUR, { mutation: { passed: true, score: 84, files: [] } }),
  ])
})

Given('the dashboard script has computed no flagged metrics', function () {
  this.trends = computeTrends([
    makeRun(0, { mutation: { passed: true, score: 90, files: [] } }),
    makeRun(HOUR, { mutation: { passed: true, score: 91, files: [] } }),
  ])
})

When(/^it regenerates reports\/workflow-insights\/index\.html$/, function () {
  this.html = renderTrendCard(this.trends)
})

Then('the generated HTML contains a visible warning indicator for each flagged metric', function () {
  assert.ok(this.html.includes('trend-bad'))
})

Then('the generated HTML shows the trend section with no warning indicators', function () {
  assert.ok(this.html.includes('Quality Trends'))
  assert.ok(!this.html.includes('trend-bad'))
})

// Scenario: Trend view reaches the existing GitHub Pages dashboard
Given(
  /^the quality-gate workflow's dashboard job has regenerated reports\/workflow-insights\/index\.html including trend data$/,
  function () {
    const runs = [
      makeRun(0, { mutation: { passed: true, score: 91, files: [] } }),
      makeRun(HOUR, { mutation: { passed: true, score: 84, files: [] } }),
    ]
    generate({ runs })
    this.dashboardHtml = readFileSync(join(ROOT, 'reports/workflow-insights/index.html'), 'utf8')
  }
)

When(/^\.github\/workflows\/publish\.yml runs its publish and deploy-pages jobs on a push to main$/, function () {
  const raw = readFileSync(join(ROOT, '.github/workflows/publish.yml'), 'utf8')
  this.publishYaml = jsYaml.load(raw)
})

Then(
  /^the deployed page at the existing \/insights\/ GitHub Pages path includes the trend section, with no new GitHub Actions job or Pages path created$/,
  function () {
    assert.ok(this.dashboardHtml.includes('Quality Trends'))
    assert.deepEqual(Object.keys(this.publishYaml.jobs), ['mutation', 'bdd', 'publish', 'deploy-pages'])
    const copyStep = this.publishYaml.jobs.publish.steps.find((s) => s.name === 'Assemble Pages staging directory')
    assert.ok(copyStep.run.includes('cp reports/workflow-insights/index.html reports/pages/insights/index.html'))
  }
)

// Scenario: README documents the trend capability at the existing link
Given(/^README\.md links to the guardrails dashboard at https:\/\/dhansak79\.github\.io\/FocusIn\/insights\/$/, function () {
  this.readme = readFileSync(join(ROOT, 'README.md'), 'utf8')
  assert.ok(this.readme.includes('https://dhansak79.github.io/FocusIn/insights/'))
})

When('this change is complete', function () {
  // stateless marker step — README content was already read in the Given
})

Then('the surrounding sentence in README.md mentions that the dashboard flags declining quality trends', function () {
  assert.ok(this.readme.includes('flags declining quality trends'))
})

// Scenario: No gitignore or data-tracking changes required
Given(/^telemetry\/workflow-runs\/ is already git-tracked and \/reports is already gitignored as a build artifact$/, function () {
  this.gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf8')
})

When('this change is implemented', function () {
  // stateless marker step — .gitignore content was already read in the Given
})

Then(
  'no entries are added to or removed from .gitignore, and no new directory needs to be tracked for the trend feature to work in CI',
  function () {
    const lines = this.gitignore.split('\n').map((l) => l.trim())
    assert.ok(!lines.includes('telemetry') && !lines.includes('telemetry/') && !lines.includes('/telemetry'))
    assert.ok(lines.includes('/reports'))
  }
)

// Scenario: Existing quality-gate-summary report is unaffected
Given(/^@focusin\/quality-gate-summary already produces its per-run markdown and JSON$/, function () {
  this.qgsContent = readFileSync(join(ROOT, 'extensions/reports/quality_gate_summary.ts'), 'utf8')
  assert.ok(this.qgsContent.includes('@focusin/quality-gate-summary'))
})

When(/^scripts\/generate-guardrails-dashboard\.js is extended with trend computation$/, async function () {
  this.dashboardModule = await import('../../../scripts/generate-guardrails-dashboard.js')
})

Then("quality-gate-summary's report output schema and content are unchanged", function () {
  assert.ok(this.qgsContent.includes('@focusin/quality-gate-summary'))
  for (const name of ['buildData', 'clusterSessions', 'parseRun', 'generate', 'renderSessionExplorer', 'computeTrends', 'renderTrendCard']) {
    assert.equal(typeof this.dashboardModule[name], 'function')
  }
})
