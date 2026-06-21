## Why

The AI detection and semantic filters are deliberately aggressive — but some trusted authors regularly produce content that trips the detectors. There is currently no way to exempt a specific author, so users must choose between disabling detection globally or accepting false positives for people they actually want to read.

## What Changes

- Add an **author whitelist**: posts by whitelisted authors are never collapsed by any banner type (AI detection, semantic match, pattern match)
- Add a **"Whitelist author" button** on collapse banners — one-click exemption directly from the banner, alongside the existing Unfollow button
- Add an **Authors tab** in the popup for managing the whitelist (add by display name or vanity name, remove entries)
- Whitelist entries are stored in `chrome.storage.local` under key `author-whitelist` as a comma-separated string of vanity names (with display names as labels where available)

## Capabilities

### New Capabilities

- `author-whitelist`: Author whitelist — storing, managing, and applying a per-author exemption list that prevents collapse banners for whitelisted authors

### Modified Capabilities

- `banner-author-display`: Banners gain a "Whitelist" button alongside Unfollow; the button is gated on vanity name availability (same condition as Unfollow)

## Impact

- `src/features/feed.js` — whitelist check added early in `applyKeywordToPost` / `addRevealBanner` / `buildSemanticCollapseBanner`; "Whitelist author" button added to banners
- `src/popup/popup.html` — new Authors tab with Tagify-based input
- `src/popup/popup.js` — whitelist load/save logic, tab switching
- `src/popup/popup.css` — tab navigation styles
- `src/content/content.js` — whitelist key added to storage read so it is passed into `feed.js` config
- No new dependencies (Tagify already bundled)
