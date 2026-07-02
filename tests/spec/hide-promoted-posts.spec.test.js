// @vitest-environment jsdom
import { vi, beforeEach, afterEach, it, expect } from 'vitest'
import { buildFeedDOM, baseConfig, CLEAN_POST, SLOP_POST } from './_helpers.js'

vi.mock('../../src/lib/transformers.min.js', () => ({
  pipeline: vi.fn(),
  env: { backends: { onnx: { wasm: {} } } },
}))

vi.mock('../../src/features/unfollow.js', () => ({
  unfollowAuthor: vi.fn().mockResolvedValue({}),
}))

const mockTrackPostFiltered = vi.fn()
const mockTrackAuthorBlocked = vi.fn()
vi.mock('../../src/stats.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, trackPostFiltered: mockTrackPostFiltered, trackAuthorBlocked: mockTrackAuthorBlocked }
})

let doFeed

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  mockTrackPostFiltered.mockReset()
  mockTrackAuthorBlocked.mockReset()
  doFeed = (await import('../../src/features/feed.js')).default
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// A promoted post: "Promoted" appears in a standalone <p> before the text box.
const PROMOTED_POST = `
  <p><span>Promoted</span></p>
  <p data-testid="expandable-text-box">Buy our amazing product now!</p>
`

// A promoted post with no expandable-text-box (image-only / video ad).
const PROMOTED_POST_NO_TEXTBOX = `
  <p><span>Promoted</span></p>
  <img src="ad.jpg" alt="Advertisement">
`

// A promoted post with an extractable author (vanity: grace-hopper).
const PROMOTED_POST_WITH_AUTHOR = `
  <a href="/in/grace-hopper/"><div aria-label="Grace Hopper Profile 1st">Grace Hopper</div></a>
  <p><span>Promoted</span></p>
  <p data-testid="expandable-text-box">Buy our amazing product now!</p>
`

// "Promoted" only appears inside the expandable text box (post body) — not a sponsored post.
const POST_WITH_PROMOTED_IN_BODY = `
  <p data-testid="expandable-text-box">Our campaign was Promoted across all channels this quarter.</p>
`

// A "Promoted by <Page>" post: sponsored via a company Page rather than a plain "Promoted" ad.
const PROMOTED_BY_PAGE_POST = `
  <p><span>Promoted by <a href="/company/pymc-labs/"><strong>PyMC Labs</strong></a></span></p>
  <p data-testid="expandable-text-box">Buy our amazing product now!</p>
`

// A "Promoted by <Page>" post with no expandable-text-box (image-only / video ad).
const PROMOTED_BY_PAGE_POST_NO_TEXTBOX = `
  <p><span>Promoted by <a href="/company/pymc-labs/"><strong>PyMC Labs</strong></a></span></p>
  <img src="ad.jpg" alt="Advertisement">
`

// A "Promoted by <Page>" post with an extractable author (vanity: grace-hopper).
const PROMOTED_BY_PAGE_POST_WITH_AUTHOR = `
  <a href="/in/grace-hopper/"><div aria-label="Grace Hopper Profile 1st">Grace Hopper</div></a>
  <p><span>Promoted by <a href="/company/pymc-labs/"><strong>PyMC Labs</strong></a></span></p>
  <p data-testid="expandable-text-box">Buy our amazing product now!</p>
`

// "Promoted by" only appears inside the expandable text box (post body) — not a sponsored post.
const POST_WITH_PROMOTED_BY_IN_BODY = `
  <p data-testid="expandable-text-box">Promoted by our own marketing team, this newsletter grew fast.</p>
`

// ---------------------------------------------------------------------------
// Requirement: Promoted posts are hidden when toggle is on
// ---------------------------------------------------------------------------

it('Scenario: Promoted post is hidden immediately when toggle is on', () => {
  const posts = buildFeedDOM([PROMOTED_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'hide-promoted': true })

  expect(posts[0].classList.contains('hide')).toBe(true)
})

it('Scenario: Non-promoted post is not affected by promoted filter', () => {
  const posts = buildFeedDOM([CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'hide-promoted': true })

  posts.forEach((p) => expect(p.classList.contains('hide')).toBe(false))
})

it('Scenario: Post with "Promoted" only in body text is not hidden', () => {
  const posts = buildFeedDOM([
    POST_WITH_PROMOTED_IN_BODY,
    CLEAN_POST,
    CLEAN_POST,
    CLEAN_POST,
    CLEAN_POST,
    CLEAN_POST,
  ])

  doFeed({ ...baseConfig, 'hide-promoted': true })

  expect(posts[0].classList.contains('hide')).toBe(false)
})

it('Scenario: Promoted post is not hidden when toggle is off', () => {
  const posts = buildFeedDOM([PROMOTED_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'hide-promoted': false })

  expect(posts[0].classList.contains('hide')).toBe(false)
})

// ---------------------------------------------------------------------------
// Requirement: Promoted posts reappear when toggle is turned off
// ---------------------------------------------------------------------------

it('Scenario: Promoted posts reappear when toggle is turned off', () => {
  const posts = buildFeedDOM([PROMOTED_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'hide-promoted': true })
  expect(posts[0].classList.contains('hide')).toBe(true)

  doFeed({ ...baseConfig, 'hide-promoted': false })
  expect(posts[0].classList.contains('hide')).toBe(false)
})

// ---------------------------------------------------------------------------
// Requirement: Image-only promoted post is hidden
// ---------------------------------------------------------------------------

it('Scenario: Image-only promoted post is hidden (no expandable-text-box)', () => {
  const posts = buildFeedDOM([PROMOTED_POST_NO_TEXTBOX, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'hide-promoted': true })

  expect(posts[0].classList.contains('hide')).toBe(true)
})

// ---------------------------------------------------------------------------
// Requirement: Hidden promoted posts are counted in daily stats
// ---------------------------------------------------------------------------

it('Scenario: Promoted hide increments filtered counter', () => {
  buildFeedDOM([PROMOTED_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'hide-promoted': true })

  expect(mockTrackPostFiltered).toHaveBeenCalledTimes(1)
})

it('Scenario: Promoted hide records author in blocked-authors map', () => {
  buildFeedDOM([PROMOTED_POST_WITH_AUTHOR, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'hide-promoted': true })

  expect(mockTrackAuthorBlocked).toHaveBeenCalledWith('grace-hopper', 'Grace Hopper')
})

// ---------------------------------------------------------------------------
// Requirement: Promoted posts are excluded from all other filters
// ---------------------------------------------------------------------------

const PROMOTED_SLOP_POST = `
  <p><span>Promoted</span></p>
  <p data-testid="expandable-text-box">${SLOP_POST}</p>
`

const PROMOTED_KEYWORD_POST = `
  <p><span>Promoted</span></p>
  <p data-testid="expandable-text-box">Buy our amazing sponsored product now!</p>
`

it('Scenario: Promoted slop post is not soft-hidden when hide-promoted is off', () => {
  const posts = buildFeedDOM([PROMOTED_SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'detect-slop': true, 'hide-promoted': false })

  expect(posts[0].classList.contains('focusedin-slop-soft-hide')).toBe(false)
  expect(document.querySelector('.focusedin-slop-collapsed')).toBeNull()
})

it('Scenario: Promoted slop post is hard-hidden (not soft-hidden) when hide-promoted is on', () => {
  const posts = buildFeedDOM([PROMOTED_SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'detect-slop': true, 'hide-promoted': true })

  expect(posts[0].classList.contains('hide')).toBe(true)
  expect(posts[0].classList.contains('focusedin-slop-soft-hide')).toBe(false)
  expect(document.querySelector('.focusedin-slop-collapsed')).toBeNull()
})

it('Scenario: Promoted post that matches a keyword is not keyword-filtered', () => {
  const posts = buildFeedDOM([PROMOTED_KEYWORD_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'feed-keywords': 'Buy', 'hide-promoted': false })

  expect(posts[0].classList.contains('hide')).toBe(false)
})

// ---------------------------------------------------------------------------
// Requirement: "Promoted by <Page>" label variant is detected as promoted
// ---------------------------------------------------------------------------

it('Scenario: "Promoted by <Page>" post is hidden immediately when toggle is on', () => {
  const posts = buildFeedDOM([PROMOTED_BY_PAGE_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'hide-promoted': true })

  expect(posts[0].classList.contains('hide')).toBe(true)
})

it('Scenario: Image-only "Promoted by <Page>" post is hidden (no expandable-text-box)', () => {
  const posts = buildFeedDOM([PROMOTED_BY_PAGE_POST_NO_TEXTBOX, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'hide-promoted': true })

  expect(posts[0].classList.contains('hide')).toBe(true)
})

it('Scenario: "Promoted by <Page>" post is not hidden when toggle is off', () => {
  const posts = buildFeedDOM([PROMOTED_BY_PAGE_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'hide-promoted': false })

  expect(posts[0].classList.contains('hide')).toBe(false)
})

it('Scenario: Post with "Promoted by" only in body text is not hidden', () => {
  const posts = buildFeedDOM([
    POST_WITH_PROMOTED_BY_IN_BODY,
    CLEAN_POST,
    CLEAN_POST,
    CLEAN_POST,
    CLEAN_POST,
    CLEAN_POST,
  ])

  doFeed({ ...baseConfig, 'hide-promoted': true })

  expect(posts[0].classList.contains('hide')).toBe(false)
})

it('Scenario: "Promoted by <Page>" hide is counted in daily stats', () => {
  buildFeedDOM([PROMOTED_BY_PAGE_POST_WITH_AUTHOR, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'hide-promoted': true })

  expect(mockTrackPostFiltered).toHaveBeenCalledTimes(1)
  expect(mockTrackAuthorBlocked).toHaveBeenCalledWith('grace-hopper', 'Grace Hopper')
})

const PROMOTED_BY_PAGE_SLOP_POST = `
  <p><span>Promoted by <a href="/company/pymc-labs/"><strong>PyMC Labs</strong></a></span></p>
  <p data-testid="expandable-text-box">${SLOP_POST}</p>
`

it('Scenario: "Promoted by <Page>" post is excluded from slop and keyword filters', () => {
  const posts = buildFeedDOM([PROMOTED_BY_PAGE_SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'detect-slop': true, 'feed-keywords': 'Game-changer', 'hide-promoted': true })
  expect(posts[0].classList.contains('hide')).toBe(true)
  expect(posts[0].classList.contains('focusedin-slop-soft-hide')).toBe(false)
  expect(document.querySelector('.focusedin-slop-collapsed')).toBeNull()

  doFeed({ ...baseConfig, 'detect-slop': true, 'feed-keywords': 'Game-changer', 'hide-promoted': false })
  expect(posts[0].classList.contains('hide')).toBe(false)
  expect(posts[0].classList.contains('focusedin-slop-soft-hide')).toBe(false)
  expect(document.querySelector('.focusedin-slop-collapsed')).toBeNull()
})

it('Scenario: Both a standalone "Promoted" post and a "Promoted by <Page>" post are hidden in the same feed pass', () => {
  const posts = buildFeedDOM([PROMOTED_POST, PROMOTED_BY_PAGE_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

  doFeed({ ...baseConfig, 'hide-promoted': true })

  expect(posts[0].classList.contains('hide')).toBe(true)
  expect(posts[1].classList.contains('hide')).toBe(true)
  for (const clean of Array.from(posts).slice(2)) {
    expect(clean.classList.contains('hide')).toBe(false)
  }
})
