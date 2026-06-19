## Context

`feed.js` has two banner construction paths:

1. `addRevealBanner` — used for keyword-matched AI posts. Already calls `extractAuthorName` and appends a `focusedin-slop-author` div.
2. `buildSemanticCollapseBanner` — used for both semantic match and structural slop (pattern match) results. Does **not** call `extractAuthorName` and has no author row.

`extractAuthorName` is already defined in the same file and works across both feed types. The rename from "structural slop" / "Structural slop" touches two string literals in `makeSemanticApplier` call sites.

## Goals / Non-Goals

**Goals:**
- Add author display to `buildSemanticCollapseBanner` using the existing `extractAuthorName` helper
- Rename user-visible label "Structural slop" → "Pattern match" and signal text "structural slop" → "pattern match"

**Non-Goals:**
- Changing how author extraction works
- Renaming internal JS identifiers (e.g. `applySemanticSlopResult`, `trackSlopCollapsed`) — these are not user-visible and renaming adds churn with no user benefit
- Any change to the AI-generated post (`addRevealBanner`) path

## Decisions

**Author row placement:** Append the author element after the score/signal row, before the "Show anyway" button — consistent with `addRevealBanner` layout. Only rendered when `extractAuthorName` returns a non-null value.

**Rename scope:** Only user-visible strings change. The two affected literals are:
- `feed.js:242` headline arg: `'🎯 Structural slop'` → `'🎯 Pattern match'`
- `feed.js:243` signal fn: `` `structural slop · ${pct}%` `` → `` `pattern match · ${pct}%` ``

No CSS class renames, no stat-tracking label changes (those are internal/storage keys).

**Author passed via closure vs re-extracted:** `buildSemanticCollapseBanner` is called with `post` in scope. Call `extractAuthorName(post)` inside the function, same pattern as `addRevealBanner`. No need to thread it through `makeSemanticApplier`.

## Risks / Trade-offs

- Author extraction can return `null` for some post types → already guarded with a conditional render, same as existing path.
- The rename is purely cosmetic; existing stored data (e.g. stats keys) are unaffected.
