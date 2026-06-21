## Why

LinkedIn regularly surfaces partisan political debate, war/conflict commentary, and election coverage that many users find draining or off-topic for a professional network. The existing semantic filter already handles topics like hustle culture with preset checkboxes; political and conflict topics are a natural and high-demand addition to that same list.

## What Changes

- Add four new preset checkboxes to the semantic topic list in the Filters panel:
  - `political content` — partisan debate, election coverage, political opinion pieces
  - `war and conflict` — military operations, conflict zones, weapons, geopolitical crises
  - `cryptocurrency` is already present — these new additions follow the same pattern
- New presets are **unchecked by default** for both new installs and existing users (opt-in)

## Capabilities

### New Capabilities

### Modified Capabilities
- `semantic-filter`: Two new preset values (`political content`, `war and conflict`) are added to the topic checkbox list in the popup. This is a requirement change because the set of available presets is part of the filter's user-facing contract.

## Impact

- `src/popup/popup.html`: two new `<li>` entries in `.semantic-topic-list`
- No changes to `src/service_worker.js` install defaults (new presets off by default)
- `tests/popup/popup.test.js`: test DOM needs the new checkboxes; existing coverage tests may need updating
