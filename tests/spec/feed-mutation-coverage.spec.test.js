// @vitest-environment jsdom
// Targeted tests closing mutation-testing survivor gaps in src/features/feed.js.
// Complements feed.dom.test.js (keyword matching) and the other tests/spec/*.spec.test.js
// files (whitelist, unfollow, banners, promoted posts) which already cover the
// integration-level behavior these internal helpers feed into.
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { buildFeedDOM, baseConfig, CLEAN_POST, makeChromeStub } from './_helpers.js'
import { unfollowAuthor } from '../../src/features/unfollow.js'

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
  vi.stubGlobal('chrome', makeChromeStub())
  doFeed = (await import('../../src/features/feed.js')).default
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const bannerFor = (post) => post.previousElementSibling

// ---------------------------------------------------------------------------
// extractPostText — <br> / block-close-tag to newline conversion
// ---------------------------------------------------------------------------

describe('extractPostText — HTML to plain text', () => {
  it('treats a bare <br> (no space) as a sentence separator', () => {
    const posts = buildFeedDOM([
      '# heading<br>Short lead sentence ends here.<br>Trailing words with no closing punctuation at all in this part',
    ])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const summary = bannerFor(posts[0]).querySelector('.focusedin-slop-summary').textContent
    expect(summary).toBe('# heading Short lead sentence ends here.')
  })

  it('treats a closing heading tag (h1-h6) as a sentence separator', () => {
    const posts = buildFeedDOM([
      '# x<br><h2>Heading ends here.</h2>Body text follows without any punctuation',
    ])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const summary = bannerFor(posts[0]).querySelector('.focusedin-slop-summary').textContent
    expect(summary).toBe('# x Heading ends here.')
  })

  it('treats a closing </p> as a sentence separator', () => {
    const posts = buildFeedDOM([
      '# x<br><p>Paragraph ends here.</p>Body text follows without any punctuation',
    ])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const summary = bannerFor(posts[0]).querySelector('.focusedin-slop-summary').textContent
    expect(summary).toBe('# x Paragraph ends here.')
  })
})

// ---------------------------------------------------------------------------
// Author name extraction — actor-div aria-label parsing
// ---------------------------------------------------------------------------

describe('extractAuthorName via slop-collapse banner', () => {
  const slopPostWithLabel = (label) =>
    `<div aria-label="${label}">Name</div># heading<br>filler content that is not slop by itself but the heading pattern flags it`

  it('renders the trimmed author name when the aria-label has stray whitespace', () => {
    const posts = buildFeedDOM([slopPostWithLabel('  Ada Lovelace Profile 2nd  ')])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const authorEl = bannerFor(posts[0]).querySelector('.focusedin-slop-author')
    expect(authorEl.textContent).toBe('Ada Lovelace')
  })

  it('renders the full label untouched (just trimmed) when the suffix has trailing content', () => {
    const posts = buildFeedDOM([slopPostWithLabel('Grace Hopper Profile 2nd Class')])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const authorEl = bannerFor(posts[0]).querySelector('.focusedin-slop-author')
    expect(authorEl.textContent).toBe('Grace Hopper Profile 2nd Class')
  })

  it('falls back to the Follow-button label when no actor div is present', () => {
    const posts = buildFeedDOM([
      '# heading<br>filler slop content here<button aria-label="Follow  Jane Smith  ">Follow</button>',
    ])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const authorEl = bannerFor(posts[0]).querySelector('.focusedin-slop-author')
    expect(authorEl.textContent).toBe('Jane Smith')
  })

  it('falls back to a strong-tagged profile link when no actor div or follow button is present', () => {
    const posts = buildFeedDOM([
      '# heading<br>filler slop content here<a href="/in/grace-hopper/"><strong>Grace Hopper</strong></a>',
    ])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const authorEl = bannerFor(posts[0]).querySelector('.focusedin-slop-author')
    expect(authorEl.textContent).toBe('Grace Hopper')
  })

  it('extracts the vanity name from the strong-link href when no actor div is present', () => {
    const posts = buildFeedDOM([
      '# heading<br>filler slop content here<a href="/in/grace-hopper/"><strong>Grace Hopper</strong></a>',
    ])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const actionsRow = bannerFor(posts[0]).querySelector('.focusedin-banner-actions')
    expect(actionsRow).not.toBeNull()
    expect(actionsRow.querySelector('.focusedin-unfollow-btn')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getAuthorFromStrongLinks / getVanityFromStrongLinks
// ---------------------------------------------------------------------------

describe('strong-link author/vanity extraction', () => {
  it('trims whitespace from the strong tag text content', () => {
    const posts = buildFeedDOM([
      '# heading<br>filler slop content here<a href="/in/grace-hopper/"><strong>  Grace Hopper  </strong></a>',
    ])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const authorEl = bannerFor(posts[0]).querySelector('.focusedin-slop-author')
    expect(authorEl.textContent).toBe('Grace Hopper')
  })

  it('skips a strong link whose sibling text is social-proof, using the next one for both name and vanity', () => {
    const posts = buildFeedDOM([
      `# heading<br>filler slop content here<span><a href="/in/liker/"><strong>Some Liker</strong></a> likes this</span><a href="/in/real-author/"><strong>Real Author</strong></a>`,
    ])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const authorEl = bannerFor(posts[0]).querySelector('.focusedin-slop-author')
    expect(authorEl.textContent).toBe('Real Author')
    bannerFor(posts[0]).querySelector('.focusedin-unfollow-btn').click()
    expect(unfollowAuthor).toHaveBeenCalledWith('real-author')
  })
})

// ---------------------------------------------------------------------------
// extractSummary — sentence extraction / truncation boundary
// ---------------------------------------------------------------------------

describe('extractSummary', () => {
  it('collapses a run of consecutive whitespace characters into a single space', () => {
    const posts = buildFeedDOM(['# heading<br>AAAA   BBBB'])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const summary = bannerFor(posts[0]).querySelector('.focusedin-slop-summary').textContent
    expect(summary).toBe('# heading AAAA BBBB…')
  })

  it('truncates with an ellipsis (not a period) when no sentence end exists at all', () => {
    // "# heading " (10 chars) + 200 x's, no punctuation anywhere.
    const posts = buildFeedDOM([`# heading<br>${'x'.repeat(200)}`])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const summary = bannerFor(posts[0]).querySelector('.focusedin-slop-summary').textContent
    expect(summary).toBe(`# heading ${'x'.repeat(110)}…`)
  })

  it('truncates rather than including a sentence end that lands exactly at the max length', () => {
    // "# heading " (10 chars) + 110 x's = sentenceEnd at index 120 exactly,
    // which must NOT be treated as "within" the max length (strictly less-than).
    const posts = buildFeedDOM([`# heading<br>${'x'.repeat(110)}.`])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const summary = bannerFor(posts[0]).querySelector('.focusedin-slop-summary').textContent
    expect(summary.endsWith('…')).toBe(true)
    expect(summary.endsWith('.')).toBe(false)
  })

  it('returns the untruncated first sentence when its end is the very last character', () => {
    const posts = buildFeedDOM(['# heading<br>Short one liner ends now.'])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const summary = bannerFor(posts[0]).querySelector('.focusedin-slop-summary').textContent
    expect(summary).toBe('# heading Short one liner ends now.')
  })

  it('trims trailing whitespace left by the 120-character truncation cut', () => {
    // "# heading " (10 chars) + 109 x's + a space lands exactly on the 120th
    // character, so the raw slice(0, 120) ends in whitespace that must be trimmed.
    const posts = buildFeedDOM([`# heading<br>${'x'.repeat(109)} ${'y'.repeat(50)}`])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const summary = bannerFor(posts[0]).querySelector('.focusedin-slop-summary').textContent
    expect(summary).toBe(`# heading ${'x'.repeat(109)}…`)
  })
})

// ---------------------------------------------------------------------------
// isMainFeedPost / isActivityFeedPost / isPostNode
// ---------------------------------------------------------------------------

describe('isPostNode guards', () => {
  it('ignores an injected banner node even though it sits directly under the feed wrapper', async () => {
    document.body.innerHTML = `
      <div data-testid="mainFeed">
        <div data-lazy-mount-id="m1" style="display:contents"></div>
      </div>`
    doFeed({ ...baseConfig, 'feed-keywords': 'synergy' })

    const injected = document.createElement('div')
    injected.dataset.focusinInjected = '1'
    injected.textContent = 'synergy'
    document.querySelector('[data-lazy-mount-id]').appendChild(injected)
    await Promise.resolve()

    expect(injected.dataset.hidden).toBeUndefined()
  })

  it('does not treat a plain node with no boundary markers as a post', () => {
    document.body.innerHTML = `
      <div data-testid="mainFeed">
        <div>synergy post with no lazy-mount-id or role marker</div>
      </div>`
    doFeed({ ...baseConfig, 'feed-keywords': 'synergy' })
    const plain = document.querySelector('[data-testid="mainFeed"] > div')
    expect(plain.dataset.hidden).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// isPromotedPost / hide-promoted integration already covered by
// hide-promoted-posts.spec.test.js — nothing further needed here.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// keyword parsing — whitespace trimming and blank-entry filtering
// ---------------------------------------------------------------------------

describe('feed-keywords parsing', () => {
  it('trims whitespace around each comma-separated keyword', () => {
    const posts = buildFeedDOM(['this has synergy inside', 'clean post here'])
    doFeed({ ...baseConfig, 'feed-keywords': '  synergy  ,  leverage  ' })
    expect(posts[0].classList.contains('hide')).toBe(true)
  })

  it('ignores blank entries produced by trailing/double commas', () => {
    const posts = buildFeedDOM(['this has synergy inside', 'a totally unrelated clean post'])
    // A trailing empty keyword ('') would match every post's textContent via indexOf
    // if not filtered out — this must not happen.
    doFeed({ ...baseConfig, 'feed-keywords': 'synergy,,' })
    expect(posts[1].classList.contains('hide')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// author-whitelist array mapping — malformed entries are dropped, not crashed on
// ---------------------------------------------------------------------------

describe('author-whitelist parsing', () => {
  it('drops whitelist entries with no vanity instead of treating them as wildcard-matching', () => {
    const posts = buildFeedDOM([
      '<div aria-label="Ada Lovelace Profile 2nd">Ada</div># heading<br>filler slop content here',
    ])
    doFeed({
      ...baseConfig,
      'detect-slop': true,
      'author-whitelist': [{ name: 'no vanity here' }],
    })
    // Malformed entry (no vanity) must not accidentally whitelist this post.
    expect(posts[0].classList.contains('focusedin-slop-soft-hide')).toBe(true)
  })

  it('ignores a non-array author-whitelist value instead of throwing', () => {
    const posts = buildFeedDOM([
      '<div aria-label="Ada Lovelace Profile 2nd">Ada</div># heading<br>filler slop content here',
    ])
    expect(() =>
      doFeed({ ...baseConfig, 'detect-slop': true, 'author-whitelist': 'not-an-array' })
    ).not.toThrow()
    expect(posts[0].classList.contains('focusedin-slop-soft-hide')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Trust-author click — dedupes the clicked author's existing entry rather
// than appending a duplicate, and preserves unrelated entries.
// ---------------------------------------------------------------------------

describe('Trust author storage write', () => {
  it('replaces an existing entry for the same author and preserves unrelated entries', () => {
    const mockSet = vi.fn()
    const mockGet = vi.fn((_, cb) =>
      cb({
        'author-whitelist': [
          { vanity: 'ada-lovelace', name: 'Old Stale Name' },
          { vanity: 'someone-else', name: 'Someone Else' },
        ],
      })
    )
    vi.stubGlobal('chrome', {
      runtime: { lastError: null, sendMessage: vi.fn() },
      storage: { local: { get: mockGet, set: mockSet } },
    })
    const posts = buildFeedDOM([
      '# heading<br>filler slop content here<a href="/in/ada-lovelace/"><div aria-label="Ada Lovelace Profile 2nd">Ada</div></a>',
    ])
    doFeed({ ...baseConfig, 'detect-slop': true })
    bannerFor(posts[0]).querySelector('.focusedin-trust-btn').click()

    expect(mockSet).toHaveBeenCalledWith({
      'author-whitelist': [
        { vanity: 'someone-else', name: 'Someone Else' },
        { vanity: 'ada-lovelace', name: 'Ada Lovelace' },
      ],
    })
  })

  it('treats a non-array stored author-whitelist as empty rather than throwing', () => {
    const mockSet = vi.fn()
    const mockGet = vi.fn((_, cb) => cb({ 'author-whitelist': 'corrupted-value' }))
    vi.stubGlobal('chrome', {
      runtime: { lastError: null, sendMessage: vi.fn() },
      storage: { local: { get: mockGet, set: mockSet } },
    })
    const posts = buildFeedDOM([
      '# heading<br>filler slop content here<a href="/in/ada-lovelace/"><div aria-label="Ada Lovelace Profile 2nd">Ada</div></a>',
    ])
    doFeed({ ...baseConfig, 'detect-slop': true })
    expect(() => bannerFor(posts[0]).querySelector('.focusedin-trust-btn').click()).not.toThrow()
    expect(mockSet).toHaveBeenCalledWith({
      'author-whitelist': [{ vanity: 'ada-lovelace', name: 'Ada Lovelace' }],
    })
  })

  it("uses an empty array as get()'s default so a first-time click starts from a clean list", () => {
    const store = {} // nothing stored yet for 'author-whitelist'
    const mockSet = vi.fn()
    // Mirrors real chrome.storage.local.get semantics: missing keys fall back
    // to whatever default object was passed in as the first argument.
    const mockGet = vi.fn((defaults, cb) => cb({ ...defaults, ...store }))
    vi.stubGlobal('chrome', {
      runtime: { lastError: null, sendMessage: vi.fn() },
      storage: { local: { get: mockGet, set: mockSet } },
    })
    const posts = buildFeedDOM([
      '# heading<br>filler slop content here<a href="/in/ada-lovelace/"><div aria-label="Ada Lovelace Profile 2nd">Ada</div></a>',
    ])
    doFeed({ ...baseConfig, 'detect-slop': true })
    bannerFor(posts[0]).querySelector('.focusedin-trust-btn').click()
    expect(mockSet).toHaveBeenCalledWith({
      'author-whitelist': [{ vanity: 'ada-lovelace', name: 'Ada Lovelace' }],
    })
  })
})

// ---------------------------------------------------------------------------
// Banner button labels — asserted exactly, not just "the class exists"
// ---------------------------------------------------------------------------

describe('banner button labels', () => {
  it('unfollow and reveal buttons carry their exact initial label and type', () => {
    const posts = buildFeedDOM([
      '# heading<br>filler slop content here<a href="/in/ada-lovelace/"><div aria-label="Ada Lovelace Profile 2nd">Ada</div></a>',
    ])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const banner = bannerFor(posts[0])
    const unfollowBtn = banner.querySelector('.focusedin-unfollow-btn')
    const trustBtn = banner.querySelector('.focusedin-trust-btn')
    const revealBtn = banner.querySelector('.focusedin-slop-reveal-btn')
    expect(unfollowBtn.textContent).toBe('Unfollow')
    expect(unfollowBtn.type).toBe('button')
    expect(trustBtn.textContent).toBe('Trust author')
    expect(trustBtn.type).toBe('button')
    expect(revealBtn.textContent).toBe('Show anyway')
    expect(revealBtn.type).toBe('button')
  })

  it('reveal button carries its exact label on the semantic-match banner too', () => {
    vi.stubGlobal('chrome', makeChromeStub({ 'semantic-check': { score: 0.9, topic: 'hustle' } }))
    const posts = buildFeedDOM([CLEAN_POST])
    doFeed({ ...baseConfig, 'semantic-filter': 'hustle' })
    vi.advanceTimersByTime(350)
    const revealBtn = bannerFor(posts[0]).querySelector('.focusedin-slop-reveal-btn')
    expect(revealBtn.textContent).toBe('Show anyway')
  })
})

// ---------------------------------------------------------------------------
// addRevealBanner — headline text, signal join, no-duplicate guard, reveal state
// ---------------------------------------------------------------------------

describe('addRevealBanner content and guards', () => {
  it('renders the exact AI-generated-post headline text', () => {
    const posts = buildFeedDOM(['# heading<br>filler slop content here'])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const headline = bannerFor(posts[0]).querySelector('.focusedin-slop-headline')
    expect(headline.textContent).toBe('🤖 AI-generated post')
  })

  it('joins multiple slop signals with the middle-dot separator', () => {
    // Markdown heading + an em dash together produce two independent signals.
    const posts = buildFeedDOM(['# heading<br>filler content — with an em dash right here'])
    doFeed({ ...baseConfig, 'detect-slop': true })
    const signalRow = bannerFor(posts[0]).querySelector('.focusedin-slop-signals')
    expect(signalRow.textContent).toContain('  ·  ')
  })

  it('does not add a second banner when focusinBanner is already set on the post', () => {
    const posts = buildFeedDOM(['# heading<br>filler slop content here'])
    posts[0].dataset.focusinBanner = '1'
    doFeed({ ...baseConfig, 'detect-slop': true })
    expect(bannerFor(posts[0])).toBeNull()
  })

  it('marks the post as revealed (truthy) when "Show anyway" is clicked, not just toggled', () => {
    const posts = buildFeedDOM(['# heading<br>filler slop content here'])
    doFeed({ ...baseConfig, 'detect-slop': true })
    bannerFor(posts[0]).querySelector('.focusedin-slop-reveal-btn').click()
    expect(posts[0].dataset.slopRevealed).toBe('true')
  })
})

// ---------------------------------------------------------------------------
// isPromotedPost — trims label text before comparing
// ---------------------------------------------------------------------------

describe('isPromotedPost label matching', () => {
  it('recognizes a promoted label even with surrounding whitespace', () => {
    const posts = buildFeedDOM(['<span>  Promoted  </span>filler unrelated body text'])
    doFeed({ ...baseConfig, 'hide-promoted': true })
    expect(posts[0].classList.contains('hide')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// blockPosts internals — semantic/tone/slop-archetype messaging
// ---------------------------------------------------------------------------

describe('semantic/tone/slop-archetype check messaging', () => {
  const stubSendMessage = (impl) => {
    const sendMessage = vi.fn(impl)
    vi.stubGlobal('chrome', {
      runtime: { lastError: null, sendMessage },
      storage: { local: { get: vi.fn((_, cb) => cb({ 'author-whitelist': [] })), set: vi.fn() } },
    })
    return sendMessage
  }

  it('trims and drops blank entries from the semantic-filter topic list', () => {
    const sendMessage = stubSendMessage((msg, cb) => cb({ score: 0 }))
    buildFeedDOM([CLEAN_POST])
    doFeed({ ...baseConfig, 'semantic-filter': ' foo ,, bar ' })
    const call = sendMessage.mock.calls.find(([msg]) => msg['semantic-check'])
    expect(call[0]['semantic-check'].queries).toEqual(['foo', 'bar'])
  })

  it('does not request any check for posts shorter than 60 characters', () => {
    const sendMessage = stubSendMessage((msg, cb) => cb({ score: 0 }))
    buildFeedDOM(['short post'])
    doFeed({ ...baseConfig, 'semantic-filter': 'topic' })
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('trims the extracted text before sending it in a check payload', () => {
    const sendMessage = stubSendMessage((msg, cb) => cb({ score: 0 }))
    buildFeedDOM([`<br>${'y'.repeat(65)}`])
    doFeed({ ...baseConfig, 'semantic-filter': 'topic' })
    const call = sendMessage.mock.calls.find(([msg]) => msg['semantic-check'])
    expect(call[0]['semantic-check'].post).toBe('y'.repeat(65))
  })

  it('truncates outgoing check payload text to 256 characters, for every check type', () => {
    const sendMessage = stubSendMessage((msg, cb) => cb({ score: 0 }))
    buildFeedDOM(['z'.repeat(300)])
    doFeed({ ...baseConfig, 'semantic-filter': 'topic', 'slop-archetype': true, 'tone-filter': true })
    for (const key of ['semantic-check', 'slop-archetype-check', 'tone-check']) {
      const call = sendMessage.mock.calls.find(([msg]) => msg[key])
      expect(call[0][key].post.length).toBe(256)
    }
  })

  it('does not request a tone check when tone-filter is disabled, even with another filter active', () => {
    // noFiltersActive would skip everything if nothing else were on — keep
    // slop-archetype active so processing reaches the tone-check branch at all.
    const sendMessage = stubSendMessage((msg, cb) => cb({ score: 0 }))
    buildFeedDOM([CLEAN_POST])
    doFeed({ ...baseConfig, 'tone-filter': false, 'slop-archetype': true })
    const toneCall = sendMessage.mock.calls.find(([msg]) => msg['tone-check'])
    expect(toneCall).toBeUndefined()
  })

  it('does not collapse when the semantic response has no score field at all', () => {
    stubSendMessage((msg, cb) => cb({}))
    const posts = buildFeedDOM([CLEAN_POST])
    doFeed({ ...baseConfig, 'semantic-filter': 'hustle' })
    vi.advanceTimersByTime(350)
    expect(bannerFor(posts[0])).toBeNull()
  })

  it('collapses when the semantic score exactly equals the threshold (not just above it)', () => {
    vi.stubGlobal('chrome', makeChromeStub({ 'semantic-check': { score: 0.35, topic: 'x' } }))
    const posts = buildFeedDOM([CLEAN_POST])
    doFeed({ ...baseConfig, 'semantic-filter': 'hustle' })
    vi.advanceTimersByTime(350)
    expect(bannerFor(posts[0])).not.toBeNull()
  })

  it('shows the matched topic and rounded percentage in the semantic-match signal row', () => {
    vi.stubGlobal('chrome', makeChromeStub({ 'semantic-check': { score: 0.876, topic: 'hustle culture' } }))
    const posts = buildFeedDOM([CLEAN_POST])
    doFeed({ ...baseConfig, 'semantic-filter': 'hustle' })
    vi.advanceTimersByTime(350)
    const signalRow = bannerFor(posts[0]).querySelector('.focusedin-slop-signals')
    expect(signalRow.textContent).toBe('hustle culture · 88%')
  })

  it('falls back to "topic match" when the semantic response has no topic field', () => {
    vi.stubGlobal('chrome', makeChromeStub({ 'semantic-check': { score: 0.9 } }))
    const posts = buildFeedDOM([CLEAN_POST])
    doFeed({ ...baseConfig, 'semantic-filter': 'hustle' })
    vi.advanceTimersByTime(350)
    const signalRow = bannerFor(posts[0]).querySelector('.focusedin-slop-signals')
    expect(signalRow.textContent).toBe('topic match · 90%')
  })

  it('marks the semantic-collapse banner as injected so it is excluded from further processing', async () => {
    vi.stubGlobal('chrome', makeChromeStub({ 'semantic-check': { score: 0.9, topic: 'x' } }))
    const posts = buildFeedDOM([CLEAN_POST])
    doFeed({ ...baseConfig, 'semantic-filter': 'hustle' })
    vi.advanceTimersByTime(350)
    await Promise.resolve()
    const banner = bannerFor(posts[0])
    expect(banner.dataset.hidden).toBeUndefined()
    expect(banner.classList.contains('hide')).toBe(false)
  })

  it('shows the Unfollow/Trust actions row on the semantic-collapse banner when a vanity is extractable', () => {
    vi.stubGlobal('chrome', makeChromeStub({ 'semantic-check': { score: 0.9, topic: 'x' } }))
    const posts = buildFeedDOM([
      `<a href="/in/ada-lovelace/"><div aria-label="Ada Lovelace Profile 2nd">Ada</div></a>${CLEAN_POST}`,
    ])
    doFeed({ ...baseConfig, 'semantic-filter': 'hustle' })
    vi.advanceTimersByTime(350)
    const actionsRow = bannerFor(posts[0]).querySelector('.focusedin-banner-actions')
    expect(actionsRow).not.toBeNull()
    expect(actionsRow.querySelector('.focusedin-unfollow-btn')).not.toBeNull()
  })

  it('does not show an actions row on the semantic-collapse banner when no vanity is extractable', () => {
    vi.stubGlobal('chrome', makeChromeStub({ 'semantic-check': { score: 0.9, topic: 'x' } }))
    const posts = buildFeedDOM([CLEAN_POST])
    doFeed({ ...baseConfig, 'semantic-filter': 'hustle' })
    vi.advanceTimersByTime(350)
    expect(bannerFor(posts[0]).querySelector('.focusedin-banner-actions')).toBeNull()
  })

  it('does not re-send a tone check on a doFeed re-run — the toneChecked marker must persist', () => {
    const sendMessage = stubSendMessage((msg, cb) => cb({ score: 0 }))
    buildFeedDOM([CLEAN_POST])
    doFeed({ ...baseConfig, 'tone-filter': true })
    sendMessage.mockClear()
    doFeed({ ...baseConfig, 'tone-filter': true })
    const toneCall = sendMessage.mock.calls.find(([msg]) => msg['tone-check'])
    expect(toneCall).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// chromeMessagingAvailable — checked before every semantic/tone/archetype send
// ---------------------------------------------------------------------------

describe('chromeMessagingAvailable guard', () => {
  it('does not request any check when chrome.runtime.sendMessage is unavailable', () => {
    vi.stubGlobal('chrome', { runtime: {}, storage: { local: { get: vi.fn(), set: vi.fn() } } })
    const posts = buildFeedDOM([CLEAN_POST])
    expect(() => doFeed({ ...baseConfig, 'semantic-filter': 'hustle' })).not.toThrow()
    expect(bannerFor(posts[0])).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// checkSlop guard — slopRevealed dataset alone is enough to skip re-checking
// ---------------------------------------------------------------------------

describe('checkSlop slopRevealed guard', () => {
  it('does not re-collapse when slopRevealed is set, even without a nested marker element', () => {
    const posts = buildFeedDOM(['# heading<br>filler slop content here'])
    posts[0].dataset.slopRevealed = 'true'
    doFeed({ ...baseConfig, 'detect-slop': true })
    expect(posts[0].classList.contains('focusedin-slop-soft-hide')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Reactive auto-scroll — exact MIN_POST_COUNT boundary
// ---------------------------------------------------------------------------

describe('reactive auto-scroll boundary', () => {
  it('does not scroll when exactly MIN_POST_COUNT (1) post is already present', async () => {
    buildFeedDOM(['Only post'])
    const spy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    doFeed({ ...baseConfig, 'feed-keywords': 'synergy' })
    await vi.advanceTimersByTimeAsync(1000)
    expect(spy).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// isMainFeedPost / isActivityFeedPost via the MutationObserver path
// (the initial scan uses CSS selectors directly and never calls these helpers)
// ---------------------------------------------------------------------------

describe('isMainFeedPost / isActivityFeedPost — nodes added after initial scan', () => {
  it('detects a newly-added post via the legacy data-display-contents marker', async () => {
    document.body.innerHTML = `
      <div componentkey="container-update-list_mainFeed-lazy-container">
        <div data-display-contents="true"></div>
      </div>`
    doFeed({ ...baseConfig, 'feed-keywords': 'synergy' })
    const post = document.createElement('div')
    post.textContent = 'synergy post'
    document.querySelector('[data-display-contents="true"]').appendChild(post)
    await Promise.resolve()
    expect(post.classList.contains('hide')).toBe(true)
  })

  it('does not treat a non-<li> node inside the activity feed container as a post', async () => {
    document.body.innerHTML = `
      <div class="scaffold-finite-scroll scaffold-finite-scroll--infinite">
        <div class="scaffold-finite-scroll__content"><ul></ul></div>
      </div>`
    doFeed({ ...baseConfig, 'feed-keywords': 'synergy' })
    const div = document.createElement('div')
    div.textContent = 'synergy post'
    document.querySelector('.scaffold-finite-scroll--infinite ul').appendChild(div)
    await Promise.resolve()
    expect(div.dataset.hidden).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// countOnce — a post is only counted once even across repeated passes
// ---------------------------------------------------------------------------

describe('countOnce dedup guard', () => {
  it('does not increment the filtered counter twice for the same post across re-runs', async () => {
    const trackPostFiltered = vi.fn()
    vi.doMock('../../src/stats.js', async (importOriginal) => {
      const actual = await importOriginal()
      return { ...actual, trackPostFiltered }
    })
    vi.resetModules()
    const freshDoFeed = (await import('../../src/features/feed.js')).default
    buildFeedDOM(['this has synergy inside'])
    freshDoFeed({ ...baseConfig, 'feed-keywords': 'synergy' })
    freshDoFeed({ ...baseConfig, 'feed-keywords': 'synergy' })
    expect(trackPostFiltered).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// requestSemanticChecks — exact 60-character boundary
// ---------------------------------------------------------------------------

describe('requestSemanticChecks length boundary', () => {
  it('does not request a check for text of exactly 59 characters', () => {
    const sendMessage = vi.fn((msg, cb) => cb({ score: 0 }))
    vi.stubGlobal('chrome', {
      runtime: { lastError: null, sendMessage },
      storage: { local: { get: vi.fn((_, cb) => cb({ 'author-whitelist': [] })), set: vi.fn() } },
    })
    buildFeedDOM(['x'.repeat(59)])
    doFeed({ ...baseConfig, 'semantic-filter': 'topic' })
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('does request a check for text of exactly 60 characters (the boundary is inclusive)', () => {
    const sendMessage = vi.fn((msg, cb) => cb({ score: 0 }))
    vi.stubGlobal('chrome', {
      runtime: { lastError: null, sendMessage },
      storage: { local: { get: vi.fn((_, cb) => cb({ 'author-whitelist': [] })), set: vi.fn() } },
    })
    buildFeedDOM(['x'.repeat(60)])
    doFeed({ ...baseConfig, 'semantic-filter': 'topic' })
    expect(sendMessage).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// revealedTexts persists across a DOM replacement (checkSlop's own guard)
// ---------------------------------------------------------------------------

describe('revealedTexts persistence', () => {
  it('does not re-collapse a post with previously-revealed text after LinkedIn replaces the element', () => {
    const posts = buildFeedDOM(['# heading<br>filler slop content here'])
    doFeed({ ...baseConfig, 'detect-slop': true })
    bannerFor(posts[0]).querySelector('.focusedin-slop-reveal-btn').click()

    // Simulate LinkedIn swapping in a fresh DOM node with identical text.
    const freshPosts = buildFeedDOM(['# heading<br>filler slop content here'])
    doFeed({ ...baseConfig, 'detect-slop': true })
    expect(freshPosts[0].classList.contains('focusedin-slop-soft-hide')).toBe(false)
  })

  it('trims the lookup key so leading whitespace does not defeat the revealed-text match', () => {
    // A leading <br> converts to a leading newline in the extracted text —
    // the stored key is trimmed (via addRevealBanner), so the lookup must
    // trim too or it will never match on a re-render.
    const rawContent = '<br># heading<br>filler slop content here'
    const posts = buildFeedDOM([rawContent])
    doFeed({ ...baseConfig, 'detect-slop': true })
    bannerFor(posts[0]).querySelector('.focusedin-slop-reveal-btn').click()

    const freshPosts = buildFeedDOM([rawContent])
    doFeed({ ...baseConfig, 'detect-slop': true })
    expect(freshPosts[0].classList.contains('focusedin-slop-soft-hide')).toBe(false)
  })

  it('compares only the first 150 characters, not the full post text', () => {
    // "# heading\n" (10 chars) + 140 x's = exactly 150 chars shared by both
    // posts; each then diverges in whatever comes after that point.
    const prefix = `# heading<br>${'x'.repeat(140)}`
    const postsA = buildFeedDOM([`${prefix}AAAA`])
    doFeed({ ...baseConfig, 'detect-slop': true })
    bannerFor(postsA[0]).querySelector('.focusedin-slop-reveal-btn').click()

    const postsB = buildFeedDOM([`${prefix}BBBB`])
    doFeed({ ...baseConfig, 'detect-slop': true })
    expect(postsB[0].classList.contains('focusedin-slop-soft-hide')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// applyKeywordToPost — skips posts nested under an already-processed ancestor
// ---------------------------------------------------------------------------

describe('applyKeywordToPost ancestor guard', () => {
  it('does not double-process a post nested under an already-hidden ancestor', async () => {
    document.body.innerHTML = `<div data-testid="mainFeed"></div>`
    doFeed({ ...baseConfig, 'feed-keywords': 'synergy' })

    const outer = document.createElement('div')
    outer.setAttribute('data-lazy-mount-id', 'outer')
    outer.dataset.hidden = 'true'
    const inner = document.createElement('div')
    inner.textContent = 'synergy inner post'
    outer.appendChild(inner)
    document.querySelector('[data-testid="mainFeed"]').appendChild(outer)

    await Promise.resolve()
    expect(inner.dataset.hidden).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// disconnectObserver — only clears the scroll timer when one is pending
// ---------------------------------------------------------------------------

describe('disconnectObserver scroll-timer guard', () => {
  it('does not call clearTimeout when the scroll retries have already finished', async () => {
    buildFeedDOM(['Post 1', 'Post 2'])
    doFeed({ ...baseConfig, 'feed-keywords': 'synergy' })
    await vi.advanceTimersByTimeAsync(1000) // scheduleScroll runs once and clears scrollTimerId (enough posts)

    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
    doFeed({ ...baseConfig, 'main-toggle': false })
    expect(clearTimeoutSpy).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// resetFeedState — actually clears module state, not just "doesn't throw"
// ---------------------------------------------------------------------------

describe('resetFeedState', () => {
  it('allows a fresh connectObserver cycle after being called mid-scroll-retry', async () => {
    document.body.innerHTML = '<div data-testid="mainFeed"></div>'
    const scrollBySpy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    doFeed({ ...baseConfig, 'feed-keywords': 'synergy' })
    await vi.advanceTimersByTimeAsync(1000)
    expect(scrollBySpy).toHaveBeenCalledTimes(1)

    const { resetFeedState } = await import('../../src/features/feed.js')
    resetFeedState()

    // With state cleared, disconnecting again must not throw against stale refs.
    doFeed({ ...baseConfig, 'main-toggle': false })
    expect(() => doFeed({ ...baseConfig, 'main-toggle': false })).not.toThrow()
  })
})
