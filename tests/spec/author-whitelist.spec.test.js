// @vitest-environment jsdom
import { vi, beforeEach, afterEach, it, expect } from 'vitest'
import {
  buildFeedDOM,
  baseConfig,
  CLEAN_POST,
  SLOP_WITH_ACTOR,
  CLEAN_WITH_ACTOR,
  makeChromeStub,
} from './_helpers.js'

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
// Requirement: Whitelisted authors' posts are never collapsed
// ---------------------------------------------------------------------------

it('Scenario: Whitelisted author bypasses AI slop detection', () => {
  vi.stubGlobal('chrome', makeChromeStub())
  const posts = buildFeedDOM([SLOP_WITH_ACTOR, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])
  doFeed({ ...baseConfig, 'detect-slop': true, 'author-whitelist': [{ vanity: 'john-doe', name: 'John Doe' }] })
  vi.advanceTimersByTime(350)
  expect(posts[0].classList.contains('focusedin-slop-soft-hide')).toBe(false)
  expect(posts[0].previousElementSibling?.classList.contains('focusedin-slop-collapsed')).toBeFalsy()
})

it('Scenario: Whitelisted author bypasses semantic match', () => {
  vi.stubGlobal('chrome', makeChromeStub({ 'semantic-check': { score: 0.9, topic: 'hustle culture' } }))
  const posts = buildFeedDOM([CLEAN_WITH_ACTOR])
  doFeed({ ...baseConfig, 'semantic-filter': 'hustle culture', 'author-whitelist': [{ vanity: 'jane-smith', name: 'Jane Smith' }] })
  vi.advanceTimersByTime(350)
  expect(posts[0].classList.contains('focusedin-slop-soft-hide')).toBe(false)
  expect(posts[0].previousElementSibling?.classList.contains('focusedin-slop-collapsed')).toBeFalsy()
})

it('Scenario: Whitelisted author bypasses pattern match', () => {
  vi.stubGlobal('chrome', makeChromeStub({ 'slop-archetype-check': { score: 0.9, topic: 'archetype' } }))
  const posts = buildFeedDOM([CLEAN_WITH_ACTOR])
  doFeed({ ...baseConfig, 'slop-archetype': true, 'author-whitelist': [{ vanity: 'jane-smith', name: 'Jane Smith' }] })
  vi.advanceTimersByTime(350)
  expect(posts[0].classList.contains('focusedin-slop-soft-hide')).toBe(false)
  expect(posts[0].previousElementSibling?.classList.contains('focusedin-slop-collapsed')).toBeFalsy()
})

it('Scenario: Non-whitelisted author is still collapsed', () => {
  vi.stubGlobal('chrome', makeChromeStub())
  const posts = buildFeedDOM([SLOP_WITH_ACTOR, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])
  doFeed({ ...baseConfig, 'detect-slop': true, 'author-whitelist': [{ vanity: 'someone-else', name: 'Someone Else' }] })
  vi.advanceTimersByTime(350)
  expect(posts[0].classList.contains('focusedin-slop-soft-hide')).toBe(true)
})

// ---------------------------------------------------------------------------
// Requirement: Whitelist stored as array of objects in chrome.storage.local
// ---------------------------------------------------------------------------

it('Scenario: Default whitelist is empty', () => {
  vi.stubGlobal('chrome', makeChromeStub())
  const posts = buildFeedDOM([SLOP_WITH_ACTOR, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])
  doFeed({ ...baseConfig, 'detect-slop': true, 'author-whitelist': [] })
  vi.advanceTimersByTime(350)
  // No whitelist bypass — slop post is still collapsed
  expect(posts[0].classList.contains('focusedin-slop-soft-hide')).toBe(true)
})

// Storage-read scenarios verify chrome.storage contract, covered by slop.dom.test.js
it.todo('Scenario: Entry contains vanity and name')

// ---------------------------------------------------------------------------
// Requirement: Authors tab in popup displays and manages whitelist
// Popup-UI scenarios — not testable via jsdom
// ---------------------------------------------------------------------------

it.todo('Scenario: Whitelist entries shown as tags on popup open')
it.todo('Scenario: Removing a tag persists the change')
it.todo('Scenario: Popup has two tabs')
it.todo('Scenario: Tab switching shows correct panel')
