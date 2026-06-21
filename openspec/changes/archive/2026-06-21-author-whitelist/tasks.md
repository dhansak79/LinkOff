## 1. Storage and config wiring

- [x] 1.1 Add `author-whitelist` key to the `chrome.storage.local.get` call in `src/content/content.js` so it is passed into the feed config
- [x] 1.2 Update `handleFilterFeed` in `src/features/feed.js` to extract `config['author-whitelist']` and pass it as a `Set` of vanity names into `blockPosts`

## 2. Whitelist check in feed filtering

- [x] 2.1 Add whitelist guard at the top of `addRevealBanner`: extract `extractAuthorVanityName(post)` and return early (no banner) if the vanity name is in the whitelist Set
- [x] 2.2 Add whitelist guard inside `makeSemanticApplier` callback before calling `buildSemanticCollapseBanner`: same vanity-name check, return early if whitelisted

## 3. Whitelist button on banners

- [x] 3.1 Add `makeWhitelistButton(vanityName, authorName, post, banner)` helper in `src/features/feed.js` — on click: saves `{ vanity, name }` to `author-whitelist` in storage, shows "Whitelisted ✓" on the button, then removes soft-hide from post and removes banner from DOM
- [x] 3.2 Render the Whitelist button after the Unfollow button in `addRevealBanner` when `vanityName` is non-null
- [x] 3.3 Render the Whitelist button after the Unfollow button in `buildSemanticCollapseBanner` when `vanityName` is non-null

## 4. Popup tab navigation

- [x] 4.1 Add two tab buttons ("Filters" / "Authors") above `#settings-panel` in `src/popup/popup.html`
- [x] 4.2 Wrap existing `#settings-panel` content to become the Filters tab content; add `#authors-panel` div as the Authors tab content
- [x] 4.3 Add tab switching JS in `src/popup/popup.js`: clicking a tab button toggles `.active` class on buttons and shows/hides the corresponding panel
- [x] 4.4 Add tab and panel styles in `src/popup/popup.css` (tab bar, active tab indicator, panel visibility)

## 5. Authors tab — whitelist management

- [x] 5.1 Add Tagify input `#author-whitelist` in `#authors-panel` with `originalInputValueFormat` serialising to the `{ vanity, name }` array format
- [x] 5.2 On popup load, read `author-whitelist` from storage and populate Tagify with the stored entries (display `name`, value `vanity`)
- [x] 5.3 On Tagify change event, write the updated array back to `author-whitelist` in storage

## 6. Tests and safeguard

- [x] 6.1 Unit tests for whitelist guard in `addRevealBanner`: banner suppressed when author is whitelisted, banner rendered when not whitelisted
- [x] 6.2 Unit tests for whitelist guard in semantic/pattern match path: same coverage
- [x] 6.3 DOM tests for Whitelist button: present when vanity name extractable, absent when not; click saves to storage and reveals post
- [x] 6.4 Run `npm test && npm run coverage` — both must exit 0
- [x] 6.5 Run `pre_commit_code_health_safeguard` — resolve any regressions before committing
