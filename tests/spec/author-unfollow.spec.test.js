// @vitest-environment jsdom
import { vi, beforeEach, afterEach, it, expect } from 'vitest'
import { buildFeedDOM, baseConfig, SLOP_WITH_ACTOR, SLOP_POST, makeChromeStub } from './_helpers.js'

vi.mock('../../src/lib/transformers.min.js', () => ({
  pipeline: vi.fn(),
  env: { backends: { onnx: { wasm: {} } } },
}))

vi.mock('../../src/features/unfollow.js', () => ({
  unfollowAuthor: vi.fn().mockResolvedValue({}),
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
// Requirement: Unfollow button appears on banners with a known author vanity name
// ---------------------------------------------------------------------------

it('Scenario: Unfollow button present when vanity name available', () => {
  vi.stubGlobal('chrome', makeChromeStub())
  // SLOP_WITH_ACTOR contains <a href="/in/john-doe/"> — vanity extractable
  const posts = buildFeedDOM([SLOP_WITH_ACTOR, SLOP_POST, SLOP_POST, SLOP_POST, SLOP_POST, SLOP_POST])
  doFeed({ ...baseConfig, 'detect-slop': true })
  vi.advanceTimersByTime(350)
  const banner = posts[0].previousElementSibling
  expect(banner?.classList.contains('focusedin-slop-collapsed')).toBe(true)
  expect(banner?.querySelector('.focusedin-unfollow-btn')).not.toBeNull()
})

it('Scenario: Unfollow button absent when vanity name unavailable', () => {
  vi.stubGlobal('chrome', makeChromeStub())
  // SLOP_POST has no profile link — no vanity extractable
  const posts = buildFeedDOM([SLOP_POST, SLOP_POST, SLOP_POST, SLOP_POST, SLOP_POST, SLOP_POST])
  doFeed({ ...baseConfig, 'detect-slop': true })
  vi.advanceTimersByTime(350)
  const banner = posts[0].previousElementSibling
  expect(banner?.classList.contains('focusedin-slop-collapsed')).toBe(true)
  expect(banner?.querySelector('.focusedin-unfollow-btn')).toBeNull()
})

// ---------------------------------------------------------------------------
