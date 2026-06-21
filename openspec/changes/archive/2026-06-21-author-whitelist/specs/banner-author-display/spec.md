## ADDED Requirements

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
