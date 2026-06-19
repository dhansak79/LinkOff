## Why

Semantic match and structural slop banners currently hide the post author, making it hard to learn which accounts to unfollow. The term "structural slop" is also unnecessarily jargony — a clearer label improves user comprehension.

## What Changes

- Author name is extracted and displayed on **semantic match** banners (same row style as AI-generated post banners)
- Author name is extracted and displayed on **structural slop** banners
- The label "Structural slop" (headline and signal text) is renamed to "Pattern match" across all UI and internal references

## Capabilities

### New Capabilities
- `banner-author-display`: Shows the post author's name on semantic match and structural slop banners, consistent with the existing AI-generated post banner behaviour

### Modified Capabilities
- (none — no existing spec files to delta)

## Impact

- `src/features/feed.js`: `buildSemanticCollapseBanner` needs author extraction and an author row; headline/signal strings for structural slop need renaming
- String "structural slop" (user-visible) renamed to "Pattern match" / "pattern match"
- Internal function/variable names referencing `slopArchetype` or similar may be renamed for clarity (non-breaking, same file)
