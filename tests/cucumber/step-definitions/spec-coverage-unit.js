import { When, Then } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { findFiles, parseScenarios, isCovered } from '../../../scripts/spec-coverage.js'

When(/`parseScenarios\(filePath, false\)` is called on a spec file containing `#### Scenario:` headings/, async function () {
  const tmp = join(tmpdir(), `cucumber-spec-cov-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })
  this.tmpDir = tmp

  const specContent = [
    '### Requirement: Auth',
    '',
    '#### Scenario: Login succeeds',
    '- **WHEN** user logs in',
    '- **THEN** session created',
    '',
    '#### Scenario: Login fails',
    '- **WHEN** wrong password',
    '- **THEN** error shown',
  ].join('\n')

  const specPath = join(tmp, 'spec.md')
  writeFileSync(specPath, specContent)
  this.result = parseScenarios(specPath, false)
})

Then(/it returns an array of `\{ requirement, scenario \}` objects matching those headings/, function () {
  assert.ok(Array.isArray(this.result), 'result should be an array')
  assert.ok(this.result.length > 0, 'result should not be empty')
  assert.ok('requirement' in this.result[0], 'entry should have requirement')
  assert.ok('scenario' in this.result[0], 'entry should have scenario')
  assert.equal(this.result.length, 2)
  if (this.tmpDir) rmSync(this.tmpDir, { recursive: true, force: true })
})

When(/`parseScenarios\(filePath, true\)` is called on a spec file with ADDED, MODIFIED, and REMOVED sections/, function () {
  const tmp = join(tmpdir(), `cucumber-spec-cov-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })
  this.tmpDir = tmp

  const specContent = [
    '## ADDED Requirements',
    '',
    '### Requirement: New',
    '',
    '#### Scenario: Added scenario',
    '- **WHEN** ...',
    '- **THEN** ...',
    '',
    '## REMOVED Requirements',
    '',
    '### Requirement: Old',
    '',
    '#### Scenario: Removed scenario',
    '- **WHEN** ...',
    '- **THEN** ...',
    '',
    '## MODIFIED Requirements',
    '',
    '### Requirement: Changed',
    '',
    '#### Scenario: Modified scenario',
    '- **WHEN** ...',
    '- **THEN** ...',
  ].join('\n')

  const specPath = join(tmp, 'spec.md')
  writeFileSync(specPath, specContent)
  this.result = parseScenarios(specPath, true)
})

Then(/only entries under `## ADDED Requirements` and `## MODIFIED Requirements` are returned/, function () {
  const names = this.result.map((r) => r.scenario)
  assert.ok(names.includes('Added scenario'), 'should include ADDED scenario')
  assert.ok(names.includes('Modified scenario'), 'should include MODIFIED scenario')
  assert.ok(!names.includes('Removed scenario'), 'should exclude REMOVED scenario')
  if (this.tmpDir) rmSync(this.tmpDir, { recursive: true, force: true })
})

When(/a test file contains `it\('Scenario: <name>'`/, function () {
  this.scenarioName = 'My test scenario'
  this.testContents = `it('Scenario: ${this.scenarioName}', () => {})`
})

Then(/`isCovered\(name\)` returns true/, function () {
  assert.ok(isCovered(this.scenarioName, this.testContents))
})

When(/no test file contains `it\('Scenario: <name>'`/, function () {
  this.scenarioName = 'My test scenario'
  this.testContents = "it('Scenario: Something completely different', () => {})"
})

Then(/`isCovered\(name\)` returns false/, function () {
  assert.ok(!isCovered(this.scenarioName, this.testContents))
})

When(/`findFiles\(dir, predicate\)` is called on a directory tree/, function () {
  const tmp = join(tmpdir(), `cucumber-find-${Date.now()}`)
  mkdirSync(join(tmp, 'sub'), { recursive: true })
  writeFileSync(join(tmp, 'a.md'), '')
  writeFileSync(join(tmp, 'sub', 'b.md'), '')
  writeFileSync(join(tmp, 'c.txt'), '')
  this.tmpDir = tmp
  this.result = findFiles(tmp, (n) => n.endsWith('.md'))
})

Then(/it returns all files matching the predicate, including files in subdirectories/, function () {
  assert.equal(this.result.length, 2)
  assert.ok(this.result.some((f) => f.endsWith('a.md')))
  assert.ok(this.result.some((f) => f.endsWith('b.md')))
  if (this.tmpDir) rmSync(this.tmpDir, { recursive: true, force: true })
})
