// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { unfollowAll } from '../../src/features/misc.js'
import doMisc from '../../src/features/misc.js'
import {
  hideBySelector,
  hideParentBySelector,
  showBySelector,
  showParentBySelector,
  showAncestorIndexBySelector,
  hideAncestorIndexBySelector,
} from '../../src/utils.js'

vi.mock('../../src/utils.js', () => ({
  hideBySelector: vi.fn(),
  hideParentBySelector: vi.fn(),
  showBySelector: vi.fn(),
  showParentBySelector: vi.fn(),
  showAncestorIndexBySelector: vi.fn(),
  hideAncestorIndexBySelector: vi.fn(),
}))

const UNFOLLOW_BTN = 'button[aria-label^="Click to stop"]'

// Base config: enabled, hide mode, no specific flags
const baseConfig = { 'main-toggle': true, 'gentle-mode': false }

// ---------------------------------------------------------------------------
// unfollowAll
// ---------------------------------------------------------------------------

describe('unfollowAll', () => {
  let logSpy

  beforeEach(() => {
    vi.useFakeTimers()
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('logs success immediately when no buttons are present', async () => {
    await unfollowAll()
    expect(logSpy).toHaveBeenCalledWith('FocusedIn: Successfully unfollowed all')
  })

  it('clicks all buttons and logs success after they disappear', async () => {
    document.body.innerHTML = `
      <button aria-label="Click to stop following Alice"></button>
      <button aria-label="Click to stop following Bob"></button>
    `
    const buttons = [...document.querySelectorAll(UNFOLLOW_BTN)]
    const clickSpies = buttons.map((b) => vi.spyOn(b, 'click'))

    // Remove buttons after first click so round 2 finds none
    buttons[0].addEventListener('click', () => {
      document.body.innerHTML = ''
    })

    const promise = unfollowAll()
    await vi.advanceTimersByTimeAsync(200)  // 2 buttons × 100ms
    await vi.advanceTimersByTimeAsync(1000) // round-end wait
    await promise

    clickSpies.forEach((spy) => expect(spy).toHaveBeenCalled())
    expect(logSpy).toHaveBeenCalledWith('FocusedIn: Successfully unfollowed all')
  })

  it('terminates after 10 rounds when buttons never disappear', async () => {
    document.body.innerHTML = `<button aria-label="Click to stop following Alice"></button>`

    const promise = unfollowAll()
    // 10 rounds × (100ms per button + 1000ms wait)
    await vi.advanceTimersByTimeAsync(11000)
    await promise

    // Terminated without logging success (buttons never cleared)
    expect(logSpy).not.toHaveBeenCalledWith('FocusedIn: Successfully unfollowed all')
  })
})

// ---------------------------------------------------------------------------
// doMisc (default export)
// ---------------------------------------------------------------------------

describe('doMisc', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls showAll when main-toggle is off', () => {
    doMisc({ ...baseConfig, 'main-toggle': false })
    expect(showParentBySelector).toHaveBeenCalled()
    expect(showBySelector).toHaveBeenCalled()
    expect(showAncestorIndexBySelector).toHaveBeenCalled()
  })

  it('does not call hide functions when main-toggle is off', () => {
    doMisc({ ...baseConfig, 'main-toggle': false })
    expect(hideBySelector).not.toHaveBeenCalled()
    expect(hideParentBySelector).not.toHaveBeenCalled()
    expect(hideAncestorIndexBySelector).not.toHaveBeenCalled()
  })

  it('hides advertisements when hide-advertisements is true', () => {
    doMisc({ ...baseConfig, 'hide-advertisements': true })
    expect(hideParentBySelector).toHaveBeenCalled()
  })

  it('shows advertisement when hide-advertisements is false', () => {
    doMisc({ ...baseConfig, 'hide-advertisements': false })
    expect(showParentBySelector).toHaveBeenCalled()
  })

  it('hides notification count when hide-notification-count is true', () => {
    doMisc({ ...baseConfig, 'hide-notification-count': true })
    expect(hideBySelector).toHaveBeenCalled()
  })

  it('shows notification count when hide-notification-count is false', () => {
    doMisc({ ...baseConfig, 'hide-notification-count': false })
    expect(showBySelector).toHaveBeenCalled()
  })

  it('hides news when hide-news is true', () => {
    doMisc({ ...baseConfig, 'hide-news': true })
    expect(hideBySelector).toHaveBeenCalled()
  })

  it('shows news when hide-news is false', () => {
    doMisc({ ...baseConfig, 'hide-news': false })
    expect(showBySelector).toHaveBeenCalled()
  })

  it('hides premium elements when hide-premium is true', () => {
    doMisc({ ...baseConfig, 'hide-premium': true })
    expect(hideBySelector).toHaveBeenCalled()
    expect(hideAncestorIndexBySelector).toHaveBeenCalled()
  })

  it('shows premium when hide-premium is false', () => {
    doMisc({ ...baseConfig, 'hide-premium': false })
    expect(showBySelector).toHaveBeenCalled()
    expect(showAncestorIndexBySelector).toHaveBeenCalled()
  })

  it('hides follow recommendations when hide-follow-recommendations is true', () => {
    doMisc({ ...baseConfig, 'hide-follow-recommendations': true })
    expect(hideAncestorIndexBySelector).toHaveBeenCalled()
  })

  it('shows follow recommendations when hide-follow-recommendations is false', () => {
    doMisc({ ...baseConfig, 'hide-follow-recommendations': false })
    expect(showAncestorIndexBySelector).toHaveBeenCalled()
  })
})
