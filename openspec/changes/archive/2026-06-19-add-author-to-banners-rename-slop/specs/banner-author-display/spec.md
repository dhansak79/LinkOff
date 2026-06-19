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
