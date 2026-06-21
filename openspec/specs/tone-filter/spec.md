## Purpose

Defines the tone filter: an on-device sentiment classifier (DistilBERT SST-2) that soft-hides LinkedIn posts whose negative-tone confidence score meets or exceeds a user-configured threshold.

## Requirements

### Requirement: Tone filter setting is available in the Filters panel
The extension SHALL expose a "Tone filter" toggle and a sensitivity slider in the Filters settings panel. The toggle SHALL default to off. The sensitivity slider SHALL range from 0 to 100 and default to 70.

#### Scenario: Tone filter toggle is off by default
- **WHEN** a user installs the extension for the first time
- **THEN** the `tone-filter` setting is `false` and no tone checking is performed

#### Scenario: User enables tone filter
- **WHEN** the user switches the tone filter toggle on
- **THEN** `tone-filter` is saved as `true` in storage and tone checking begins on the next feed scan

#### Scenario: Sensitivity slider is visible when tone filter is enabled
- **WHEN** the tone filter toggle is on
- **THEN** a sensitivity slider (0–100) is visible and its value is persisted to `tone-threshold` in storage

### Requirement: Posts with negative or hostile tone are collapsed when tone filter is enabled
When tone filter is active, the extension SHALL send each uncollapsed post to the tone classifier and collapse posts whose NEGATIVE confidence score meets or exceeds the configured threshold.

#### Scenario: Negative post is collapsed
- **WHEN** the tone filter is enabled
- **AND** a feed post returns a NEGATIVE confidence score ≥ threshold / 100
- **THEN** the post is soft-hidden and a "🌩 Negative tone" collapse banner is inserted before it

#### Scenario: Positive or neutral post is not collapsed
- **WHEN** the tone filter is enabled
- **AND** a feed post returns a NEGATIVE confidence score < threshold / 100
- **THEN** the post is not hidden and no banner is inserted

#### Scenario: Already-collapsed posts are not re-checked
- **WHEN** the tone filter is enabled
- **AND** a post has already been collapsed by the slop, archetype, or semantic detector
- **THEN** no tone-check message is sent for that post

### Requirement: Negative tone collapse banner matches the existing banner structure
The "🌩 Negative tone" collapse banner SHALL follow the same visual and functional structure as other collapse banners: headline, signal line with confidence percentage, optional author, action buttons (Unfollow + Trust author when a vanity name is available), and a full-width "Show anyway" button.

#### Scenario: Banner shows confidence percentage
- **WHEN** a post is collapsed by the tone filter
- **THEN** the banner signal line reads `"negative tone · NN%"` where NN is the classifier's NEGATIVE confidence rounded to the nearest integer

#### Scenario: Show anyway reveals the post
- **WHEN** the user clicks "Show anyway" on a negative tone banner
- **THEN** the post is revealed and the banner is replaced with a small tag

#### Scenario: Trust author prevents future collapse for that author
- **WHEN** the user clicks "Trust author" on a negative tone banner
- **THEN** the author is added to the author whitelist and the post is immediately revealed
