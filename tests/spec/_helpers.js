import { vi } from 'vitest'

// Builds the LinkedIn main-feed DOM structure used by feed.js post detection.
// Returns the NodeList of direct post elements.
export const buildFeedDOM = (postContents) => {
  const postDivs = postContents.map((c) => `<div>${c}</div>`).join('')
  document.body.innerHTML = `
    <div data-testid="mainFeed" data-component-type="LazyColumn" componentkey="container-update-list_mainFeed-lazy-container">
      <div data-lazy-mount-id="test-mount" style="display:contents">
        ${postDivs}
      </div>
    </div>`
  return document.querySelectorAll('[data-testid="mainFeed"] > div[data-lazy-mount-id] > div')
}

// Minimal config for an enabled extension with no filters active.
// Spread and override specific keys for each scenario.
export const baseConfig = {
  'main-toggle': true,
  'feed-keywords': '',
  'detect-slop': false,
  'slop-archetype': false,
  'semantic-filter': '',
  'tone-filter': false,
  'tone-threshold': 70,
  'author-whitelist': [],
}

// Posts that trigger slop detection. Use in tests that need a collapsible post.
export const SLOP_POST = [
  "In today's fast-paced world, thought leadership matters.",
  'Let that sink in.',
  'Game-changer.',
  'Leverage your potential.',
  'Key takeaways below.',
  '🚀 💡 🔥 💪 ⚡ 🎯',
].join('<br>')

// Clean post that does not trigger slop detection.
export const CLEAN_POST = 'We shipped a new feature today. The team is proud of the work done.'

// Slop post with an extractable author profile link (vanity: john-doe).
export const SLOP_WITH_ACTOR = `<a href="/in/john-doe/"><div aria-label="John Doe Profile 2nd">John Doe</div></a><br>${SLOP_POST}`

// Clean post with an extractable author profile link (vanity: jane-smith).
export const CLEAN_WITH_ACTOR = `<a href="/in/jane-smith/"><div aria-label="Jane Smith Profile 1st">Jane Smith</div></a>${CLEAN_POST}`

// Stub chrome.runtime.sendMessage so that async ML checks (tone, semantic)
// complete synchronously via the callback.
//
// Usage:
//   vi.stubGlobal('chrome', makeChromeStub({
//     'tone-check': { score: 0.85, label: 'NEGATIVE' },
//     'semantic-check': { score: 0.8, topic: 'hustle culture' },
//   }))
//
// Any message type not in the map gets cb({ score: 0 }) — treated as no match.
export const makeChromeStub = (responses = {}) => ({
  runtime: {
    lastError: null,
    sendMessage: vi.fn((msg, cb) => {
      for (const [key, value] of Object.entries(responses)) {
        if (msg[key]) return cb(value)
      }
      cb({ score: 0 })
    }),
  },
  storage: {
    local: {
      get: vi.fn((_, cb) => cb({ 'author-whitelist': [] })),
      set: vi.fn(),
    },
  },
})
