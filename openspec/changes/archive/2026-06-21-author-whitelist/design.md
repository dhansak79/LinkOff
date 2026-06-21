## Context

The popup currently presents all settings in a single scrolling panel. Adding a whitelist requires a place to manage a list of authors — an input that doesn't fit naturally alongside the existing filter toggles without crowding the UI. The existing Tagify library (already bundled) handles tag-based inputs and is used for both keyword and semantic topic management, making it the obvious choice for whitelist entry as well.

Feed filtering in `feed.js` receives settings via a `config` object built in `content.js` from `chrome.storage.local`. Any new storage keys need to be included in that read and forwarded as config properties.

## Goals / Non-Goals

**Goals:**
- Posts by whitelisted authors are never collapsed by any detection path (keyword slop, pattern match, semantic match)
- One-click "Whitelist" button on collapse banners adds the author immediately and reveals the post
- Authors tab in popup for viewing and removing whitelist entries
- Changes made from banners take effect immediately on the current page; changes in the popup take effect on next page load

**Non-Goals:**
- Fuzzy display-name matching — matching is by vanity name only, which is unambiguous
- Retroactively un-collapsing already-collapsed posts when the popup whitelist is edited (too complex; banner-based whitelist covers the in-session case)
- Whitelisting authors without an extractable vanity name (no reliable identifier available)

## Decisions

**Storage format — native array of objects**
Store `author-whitelist` directly as an array of `{ vanity, name }` objects in `chrome.storage.local`. Chrome storage handles native JS values without serialisation. This avoids the comma-splitting pattern used for simple strings and makes adding/removing entries and rendering in Tagify straightforward. Default value: `[]`.

**Matching — vanity name only**
Match whitelisted authors by vanity name extracted at banner time. Display name matching is unreliable (non-unique, formatting differences). The Whitelist banner button shares the same precondition as Unfollow: only rendered when `extractAuthorVanityName` returns non-null.

**Whitelist check placement — inside banner guard functions**
Check happens at the top of `addRevealBanner` and inside `makeSemanticApplier` before `buildSemanticCollapseBanner` is called. This keeps the guard close to the rendering decision and avoids extracting vanity name twice in the main post processing loop.

**Banner Whitelist button behaviour — immediate reveal**
Clicking Whitelist saves the author to storage, then reveals the current post (removes `focusedin-slop-soft-hide`, removes the banner from the DOM) and shows a brief "Whitelisted ✓" confirmation before the banner disappears. This mirrors clicking "Show anyway" but persists.

**Popup tab navigation — CSS class toggle, no framework**
Two tab buttons ("Filters" / "Authors") switch a CSS `.active` class. The existing `#settings-panel` div becomes the Filters tab content. A new `#authors-panel` div holds the Authors tab. Plain JS event listeners; no router or component library.

**Authors tab input — Tagify with object values**
Configure Tagify with `{ value: vanityName, label: displayName }` objects. The `originalInputValueFormat` callback serialises back to the array-of-objects format for storage. The input is free-entry (no preset whitelist); users type a vanity name (or the banner populates it automatically).

## Risks / Trade-offs

- [Vanity name not extractable] → Whitelist button absent from banner; user must add the vanity name manually in popup. Mitigation: display a tooltip or placeholder explaining the format (`/in/username/`).
- [Storage format mismatch] → If `author-whitelist` is already set as a non-array value (from a future bug), the load code must guard with `Array.isArray`. Default via `chrome.storage.local.get({ 'author-whitelist': [] })`.
- [Popup-vs-page sync] → Whitelist edits in popup don't un-collapse already-collapsed banners. Acceptable trade-off; the banner button covers in-session whitelisting.
- [Tagify object mode complexity] → More configuration than string-mode Tagify. Mitigation: existing codebase already uses customised Tagify config; the pattern is established.

## Open Questions

1. Should the Authors tab show a count badge on the tab button (e.g. "Authors (3)")? Lean no for now — keeps the tab bar simple.
2. Keyboard shortcut / quick-add from banner vs. requiring the click? Out of scope for now.
