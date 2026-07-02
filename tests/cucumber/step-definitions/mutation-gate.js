import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STRYKER_CONFIG_PATH = join(__dirname, '../../../stryker.config.json')

Given('stryker.config.json is inspected', function () {
  // No setup needed — the config is read directly in the When step.
})

When('thresholds.break is read', function () {
  const config = JSON.parse(readFileSync(STRYKER_CONFIG_PATH, 'utf-8'))
  this.strykerBreakThreshold = config.thresholds.break
})

Then('it equals 95', function () {
  assert.strictEqual(this.strykerBreakThreshold, 95)
})
