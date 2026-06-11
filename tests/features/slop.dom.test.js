// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const buildFeedDOM = (postContents) => {
  const postDivs = postContents.map((c) => `<div>${c}</div>`).join('')
  document.body.innerHTML = `
    <div data-testid="mainFeed" componentkey="container-update-list_mainFeed-lazy-container">
      <div data-lazy-mount-id="test-mount" style="display:contents">
        ${postDivs}
      </div>
    </div>`
  return document.querySelectorAll('[data-testid="mainFeed"] > div[data-lazy-mount-id] > div')
}

// Two slop signals: phrases + emoji density.
// Uses <br> for line breaks to match how LinkedIn renders post text in the DOM.
const SLOP_POST = [
  "In today's fast-paced world, thought leadership matters.",
  'Let that sink in.',
  'Game-changer.',
  'Leverage your potential.',
  'Key takeaways below.',
  '🚀 💡 🔥 💪 ⚡ 🎯',
].join('<br>')

const CLEAN_POST = 'We shipped a new feature today. The team is proud of the work done.'

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

const neverTrigger = () => false
const baseConfig = { 'feed-keywords': '', 'hide-by-age': 'disabled' }

// ---------------------------------------------------------------------------
// detect-slop: collapse post with a reveal banner (soft mode)
// ---------------------------------------------------------------------------

describe('detect-slop - collapse with reveal banner', () => {
  it('collapses a sloppy post when detect-slop is enabled', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'detect-slop': true })
    vi.advanceTimersByTime(350)

    expect(posts[0].classList.contains('linkoff-slop-soft-hide')).toBe(true)
  })

  it('injects a sibling reveal banner for the collapsed post', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'detect-slop': true })
    vi.advanceTimersByTime(350)

    expect(posts[0].previousElementSibling?.classList.contains('linkoff-slop-collapsed')).toBe(true)
  })

  it('reveal banner contains a reveal button', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'detect-slop': true })
    vi.advanceTimersByTime(350)

    expect(posts[0].previousElementSibling?.querySelector('.linkoff-slop-reveal')).not.toBeNull()
  })

  it('clicking reveal makes the post visible and removes the banner', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'detect-slop': true })
    vi.advanceTimersByTime(350)

    posts[0].previousElementSibling.querySelector('.linkoff-slop-reveal').click()

    expect(posts[0].classList.contains('linkoff-slop-soft-hide')).toBe(false)
    expect(posts[0].classList.contains('hide')).toBe(false)
    expect(posts[0].previousElementSibling?.classList.contains('linkoff-slop-collapsed')).toBeFalsy()
  })

  it('does not re-collapse the post after the user reveals it', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'detect-slop': true })
    vi.advanceTimersByTime(350)
    posts[0].previousElementSibling.querySelector('.linkoff-slop-reveal').click()

    vi.advanceTimersByTime(350)
    vi.advanceTimersByTime(350)

    expect(posts[0].classList.contains('linkoff-slop-soft-hide')).toBe(false)
    expect(posts[0].classList.contains('hide')).toBe(false)
  })

  it('does not collapse a clean post', () => {
    const posts = buildFeedDOM([CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'detect-slop': true })
    vi.advanceTimersByTime(350)

    posts.forEach((post) => {
      expect(post.classList.contains('linkoff-slop-soft-hide')).toBe(false)
      expect(post.classList.contains('hide')).toBe(false)
    })
  })

  it('does not collapse posts when detect-slop is disabled', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'detect-slop': false })
    vi.advanceTimersByTime(350)

    expect(posts[0].classList.contains('linkoff-slop-soft-hide')).toBe(false)
    expect(posts[0].classList.contains('hide')).toBe(false)
  })

  it('injects exactly one reveal banner even when the interval fires multiple times', () => {
    buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'detect-slop': true })
    vi.advanceTimersByTime(350)
    vi.advanceTimersByTime(350)
    vi.advanceTimersByTime(350)

    expect(document.querySelectorAll('.linkoff-slop-collapsed').length).toBe(1)
  })

  it('runs without any keyword filters active', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'detect-slop': true })
    vi.advanceTimersByTime(350)

    expect(posts[0].classList.contains('linkoff-slop-soft-hide')).toBe(true)
  })

  it('includes the author name in the banner when an author link is present', () => {
    const slopWithAuthor = `<a href="/in/test-user"><strong>Test Author</strong></a><br>${SLOP_POST}`
    const posts = buildFeedDOM([slopWithAuthor, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'detect-slop': true })
    vi.advanceTimersByTime(350)

    expect(posts[0].previousElementSibling?.textContent).toContain('Test Author')
  })

  it('shows the banner without author info when no author link is present', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'detect-slop': true })
    vi.advanceTimersByTime(350)

    expect(posts[0].previousElementSibling?.classList.contains('linkoff-slop-collapsed')).toBe(true)
  })

  it('does not show the scroll-down alert when only detect-slop is active', () => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    buildFeedDOM([SLOP_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'detect-slop': true })
    vi.advanceTimersByTime(350)

    expect(window.alert).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// hide-slop: completely hidden, no reveal banner (hard mode)
// ---------------------------------------------------------------------------

describe('hide-slop - completely hidden', () => {
  it('hides a sloppy post when hide-slop is enabled', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'hide-slop': true })
    vi.advanceTimersByTime(350)

    expect(posts[0].classList.contains('hide')).toBe(true)
  })

  it('does not inject a reveal banner — post is completely gone', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'hide-slop': true })
    vi.advanceTimersByTime(350)

    expect(posts[0].previousElementSibling?.classList.contains('linkoff-slop-collapsed')).toBeFalsy()
  })

  it('does not hide a clean post', () => {
    const posts = buildFeedDOM([CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'hide-slop': true })
    vi.advanceTimersByTime(350)

    posts.forEach((post) => expect(post.classList.contains('hide')).toBe(false))
  })

  it('does not hide posts when hide-slop is disabled', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'hide-slop': false })
    vi.advanceTimersByTime(350)

    expect(posts[0].classList.contains('hide')).toBe(false)
  })

  it('dims a sloppy post when mode is dim', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'dim', { ...baseConfig, 'hide-slop': true })
    vi.advanceTimersByTime(350)

    expect(posts[0].classList.contains('dim')).toBe(true)
    expect(posts[0].classList.contains('hide')).toBe(false)
  })

  it('runs without any keyword filters active', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'hide-slop': true })
    vi.advanceTimersByTime(350)

    expect(posts[0].classList.contains('hide')).toBe(true)
  })

  it('does not show the scroll-down alert when only hide-slop is active', () => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    buildFeedDOM([SLOP_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'hide-slop': true })
    vi.advanceTimersByTime(350)

    expect(window.alert).not.toHaveBeenCalled()
  })

  it('when both toggles active, hide-slop wins — post hidden with no reveal banner', () => {
    const posts = buildFeedDOM([SLOP_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST, CLEAN_POST])

    doFeed(neverTrigger, true, 'hide', { ...baseConfig, 'hide-slop': true, 'detect-slop': true })
    vi.advanceTimersByTime(350)

    expect(posts[0].classList.contains('hide')).toBe(true)
    expect(posts[0].previousElementSibling?.classList.contains('linkoff-slop-collapsed')).toBeFalsy()
  })
})
