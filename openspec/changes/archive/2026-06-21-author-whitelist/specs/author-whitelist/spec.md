## ADDED Requirements

### Requirement: Whitelisted authors' posts are never collapsed
When an author's vanity name appears in the whitelist, the extension SHALL pass through their posts without collapsing them, regardless of which detection path fires (keyword/pattern slop, model-based slop, semantic match, pattern match).

#### Scenario: Whitelisted author bypasses AI slop detection
- **WHEN** a post is detected as AI-generated slop
- **AND** the post author's vanity name is in the whitelist
- **THEN** the post is not collapsed and no banner is rendered

#### Scenario: Whitelisted author bypasses semantic match
- **WHEN** a post scores above the semantic match threshold
- **AND** the post author's vanity name is in the whitelist
- **THEN** the post is not collapsed and no banner is rendered

#### Scenario: Whitelisted author bypasses pattern match
- **WHEN** a post scores above the pattern match threshold
- **AND** the post author's vanity name is in the whitelist
- **THEN** the post is not collapsed and no banner is rendered

#### Scenario: Non-whitelisted author is still collapsed
- **WHEN** a post triggers any detection path
- **AND** the post author's vanity name is not in the whitelist
- **THEN** the post is collapsed as normal

### Requirement: Whitelist stored as array of objects in chrome.storage.local
The whitelist SHALL be persisted under the key `author-whitelist` as an array of `{ vanity, name }` objects. The default value is an empty array.

#### Scenario: Default whitelist is empty
- **WHEN** no whitelist has been saved
- **THEN** `chrome.storage.local.get({ 'author-whitelist': [] })` returns an empty array

#### Scenario: Entry contains vanity and name
- **WHEN** an author is added to the whitelist
- **THEN** the stored entry contains `vanity` (the profile slug) and `name` (the display name)

### Requirement: Authors tab in popup displays and manages whitelist
The popup SHALL include an Authors tab with a Tagify input showing whitelisted authors. Users can remove entries by clicking the tag remove button.

#### Scenario: Whitelist entries shown as tags on popup open
- **WHEN** the Authors tab is opened
- **AND** the whitelist contains entries
- **THEN** each author is shown as a removable tag displaying their name

#### Scenario: Removing a tag persists the change
- **WHEN** the user removes an author tag in the Authors tab
- **THEN** the entry is removed from `author-whitelist` in storage

#### Scenario: Popup has two tabs
- **WHEN** the popup is opened
- **THEN** two tab buttons are visible: "Filters" (existing settings) and "Authors" (whitelist management)

#### Scenario: Tab switching shows correct panel
- **WHEN** the user clicks the "Authors" tab
- **THEN** the authors panel is shown and the filters panel is hidden
- **WHEN** the user clicks the "Filters" tab
- **THEN** the filters panel is shown and the authors panel is hidden
