## ADDED Requirements

### Requirement: Semantic match banner shows author name
When a post is hidden by semantic match, the collapse banner SHALL display the post author's name when it can be extracted from the DOM.

#### Scenario: Author available on semantic match banner
- **WHEN** a post is collapsed with a semantic match banner
- **AND** the post DOM contains an extractable author name
- **THEN** the banner displays the author name in a `focusedin-slop-author` element below the signal row

#### Scenario: No author available on semantic match banner
- **WHEN** a post is collapsed with a semantic match banner
- **AND** the post DOM does not contain an extractable author name
- **THEN** the banner renders without an author element

### Requirement: Pattern match banner shows author name
When a post is hidden by pattern match (formerly structural slop), the collapse banner SHALL display the post author's name when it can be extracted from the DOM.

#### Scenario: Author available on pattern match banner
- **WHEN** a post is collapsed with a pattern match banner
- **AND** the post DOM contains an extractable author name
- **THEN** the banner displays the author name in a `focusedin-slop-author` element below the signal row

#### Scenario: No author available on pattern match banner
- **WHEN** a post is collapsed with a pattern match banner
- **AND** the post DOM does not contain an extractable author name
- **THEN** the banner renders without an author element

### Requirement: Pattern match label replaces structural slop label
The user-visible label for the structural slop detection type SHALL be "Pattern match" (headline) and "pattern match" (signal text).

#### Scenario: Pattern match headline
- **WHEN** a post is collapsed due to structural slop detection
- **THEN** the banner headline reads "🎯 Pattern match"

#### Scenario: Pattern match signal text
- **WHEN** a post is collapsed due to structural slop detection
- **THEN** the signal row reads "pattern match · N%" where N is the similarity percentage

### Requirement: Author vanity name extracted alongside display name
The banner construction logic SHALL extract the author's LinkedIn vanity name (profile slug) from the `/in/username/` href in the post DOM alongside the display name, making it available for the Unfollow button.

#### Scenario: Vanity name extracted when profile link present
- **WHEN** a post is collapsed into any banner type
- **AND** the post DOM contains a profile href in the form `/in/username/`
- **THEN** the extracted vanity name is available to the banner for constructing the Unfollow request

#### Scenario: Vanity name absent when no profile link in DOM
- **WHEN** a post is collapsed into any banner type
- **AND** the post DOM does not contain an extractable `/in/username/` href
- **THEN** vanity name extraction returns null and no Unfollow button is rendered

### Requirement: Whitelist button appears on banners alongside Unfollow
Collapse banners SHALL display a "Whitelist" button when the author's vanity name is extractable, placed after the Unfollow button and before "Show anyway".

#### Scenario: Whitelist button present when vanity name available
- **WHEN** a post is collapsed into a banner
- **AND** the post DOM contains an extractable author vanity name
- **THEN** the banner displays a "Whitelist" button after the Unfollow button

#### Scenario: Whitelist button absent when vanity name unavailable
- **WHEN** a post is collapsed into a banner
- **AND** the post DOM does not contain an extractable vanity name
- **THEN** the banner renders without a Whitelist button

### Requirement: Clicking Whitelist saves the author and reveals the post
When the Whitelist button is clicked, the extension SHALL add the author to the whitelist in storage and immediately reveal the currently collapsed post.

#### Scenario: Post revealed immediately on whitelist
- **WHEN** the user clicks the Whitelist button on a banner
- **THEN** the author is added to `author-whitelist` in storage
- **AND** the collapsed post is revealed (soft-hide class removed)
- **AND** the banner is removed from the DOM

#### Scenario: Whitelist button shows confirmation before removal
- **WHEN** the Whitelist button is clicked
- **THEN** the button briefly shows "Whitelisted ✓" before the banner is removed
