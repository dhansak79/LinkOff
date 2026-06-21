## Context

The semantic topic filter uses a fixed list of `<li><label><input class="semantic-topic">` checkboxes in `popup.html`. Each checkbox has a `value` attribute that becomes a semantic query string sent to the MiniLM embedder. The stored value (`semantic-filter` in `chrome.storage.local`) is a comma-separated string of the currently active topic values.

On popup open, `popup.js` reads the stored string, splits it, and checks any checkbox whose value appears in the set. Unchecked topics are simply absent from the stored string. There is no hardcoded allowlist — any `value` added to the HTML is automatically picked up by the existing save/load logic.

This change is a pure HTML addition. No JS, CSS, or storage schema changes are needed.

## Goals / Non-Goals

**Goals:**
- Add `political content` and `war and conflict` as selectable preset topics
- New presets are off by default for all users (new installs and existing)

**Non-Goals:**
- Changing default install values in `service_worker.js`
- Custom topic free-text entry (already supported via the existing custom topics input)
- Sub-category checkboxes (e.g., specific conflicts or parties)

## Decisions

### Two topics, not more

`political content` covers broad partisan/electoral content; `war and conflict` covers military and crisis coverage. A single `politics and war` checkbox was considered but rejected — some users may want to filter one and not the other.

### Off by default for existing users

The stored `semantic-filter` string for existing users will not contain the new values, so their checkboxes render unchecked on next popup open. No migration needed.

### No install-default change

The `onInstalled` handler seeds `semantic-filter` with the original 8 topics. New installs get the new checkboxes unchecked (not in the seed string). If/when the defaults are revisited, these can be added then.

## Risks / Trade-offs

- **False positives**: `political content` is a broad query and may catch factual policy news as well as opinion. The semantic threshold (35%) mitigates this but users should be aware. Mitigated by being opt-in.
- **Ordering**: New items appear below the existing 8 presets. This is the lowest-friction placement and consistent with recency of addition.
