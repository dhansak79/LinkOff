// @vitest-environment jsdom
import { vi, beforeEach, afterEach, it, expect } from 'vitest'
import { buildFeedDOM, baseConfig, CLEAN_POST, makeChromeStub } from './_helpers.js'

vi.mock('../../src/lib/transformers.min.js', () => ({
  pipeline: vi.fn(),
  env: { backends: { onnx: { wasm: {} } } },
}))

let doFeed

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  doFeed = (await import('../../src/features/feed.js')).default
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// Requirement: Tone filter setting is available in the Filters panel
// ---------------------------------------------------------------------------

it('Scenario: Tone filter toggle is off by default', () => {
  vi.stubGlobal('chrome', makeChromeStub({ 'tone-check': { score: 0.95, label: 'NEGATIVE' } }))
  buildFeedDOM([CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])
  doFeed({ ...baseConfig, 'tone-filter': false })
  vi.advanceTimersByTime(350)
  const toneCalls = chrome.runtime.sendMessage.mock.calls.filter((c) => c[0]['tone-check'])
  expect(toneCalls.length).toBe(0)
})

// Popup-UI scenarios (requires popup HTML context, not testable via jsdom)
it.todo('Scenario: User enables tone filter')
it.todo('Scenario: Sensitivity slider is visible when tone filter is enabled')

// ---------------------------------------------------------------------------
// Requirement: Posts with negative or hostile tone are collapsed
// ---------------------------------------------------------------------------

it('Scenario: Negative post is collapsed', () => {
  vi.stubGlobal('chrome', makeChromeStub({ 'tone-check': { score: 0.82, label: 'NEGATIVE' } }))
  const posts = buildFeedDOM([CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])
  doFeed({ ...baseConfig, 'tone-filter': true, 'tone-threshold': 70 })
  vi.advanceTimersByTime(350)
  expect(posts[0].dataset.hidden).toBe('true')
  expect(posts[0].previousElementSibling?.classList.contains('focusedin-slop-collapsed')).toBe(true)
  expect(posts[0].previousElementSibling?.textContent).toMatch(/🌩 Negative tone/)
})

it('Scenario: Positive or neutral post is not collapsed', () => {
  vi.stubGlobal('chrome', makeChromeStub({ 'tone-check': { score: 0.5, label: 'NEGATIVE' } }))
  const posts = buildFeedDOM([CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])
  doFeed({ ...baseConfig, 'tone-filter': true, 'tone-threshold': 70 })
  vi.advanceTimersByTime(350)
  expect(posts[0].dataset.hidden).not.toBe('true')
  expect(posts[0].previousElementSibling?.classList.contains('focusedin-slop-collapsed')).toBeFalsy()
})

it('Scenario: Already-collapsed posts are not re-checked', () => {
  vi.stubGlobal('chrome', makeChromeStub({ 'tone-check': { score: 0.9, label: 'NEGATIVE' } }))
  const posts = buildFeedDOM([CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])
  posts[0].classList.add('focusedin-slop-soft-hide')
  doFeed({ ...baseConfig, 'detect-slop': false, 'tone-filter': true, 'tone-threshold': 70 })
  vi.advanceTimersByTime(350)
  const toneCalls = chrome.runtime.sendMessage.mock.calls.filter((c) => c[0]['tone-check'])
  expect(toneCalls.every((c) => c[0]['tone-check'].text !== posts[0].textContent)).toBe(true)
})

// ---------------------------------------------------------------------------
// Requirement: Negative tone collapse banner matches existing banner structure
// ---------------------------------------------------------------------------

it('Scenario: Banner shows confidence percentage', () => {
  vi.stubGlobal('chrome', makeChromeStub({ 'tone-check': { score: 0.85, label: 'NEGATIVE' } }))
  const posts = buildFeedDOM([CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])
  doFeed({ ...baseConfig, 'tone-filter': true, 'tone-threshold': 70 })
  vi.advanceTimersByTime(350)
  const signalText = posts[0].previousElementSibling?.querySelector('.focusedin-slop-signals')?.textContent ?? ''
  expect(signalText).toMatch(/negative tone · \d+%/)
})

// Interaction scenarios require DOM event simulation beyond initial collapse
it.todo('Scenario: Show anyway reveals the post')
it.todo('Scenario: Trust author prevents future collapse for that author')
