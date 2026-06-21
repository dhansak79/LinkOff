## Purpose

Defines the semantic topic filter: a set of preset and custom topic checkboxes in the popup UI that cause LinkedIn posts to be soft-hidden when their content is semantically similar to the selected topics.

## Requirements

### Requirement: Political content preset topic
The semantic topic filter SHALL include a `political content` preset checkbox in the popup UI. The preset SHALL be unchecked by default for both new installs and existing users. When checked, it SHALL cause posts semantically similar to partisan debate, election coverage, and political opinion content to be collapsed.

#### Scenario: Political content checkbox exists and is off by default
- **WHEN** the popup opens for a user who has never enabled `political content`
- **THEN** a checkbox with value `political content` is present and unchecked

#### Scenario: Political content checkbox is persisted when enabled
- **WHEN** the user checks the `political content` checkbox
- **THEN** `political content` is saved to `semantic-filter` storage and used in subsequent semantic checks

### Requirement: War and conflict preset topic
The semantic topic filter SHALL include a `war and conflict` preset checkbox in the popup UI. The preset SHALL be unchecked by default for both new installs and existing users. When checked, it SHALL cause posts semantically similar to military operations, conflict zones, and geopolitical crises to be collapsed.

#### Scenario: War and conflict checkbox exists and is off by default
- **WHEN** the popup opens for a user who has never enabled `war and conflict`
- **THEN** a checkbox with value `war and conflict` is present and unchecked

#### Scenario: War and conflict checkbox is persisted when enabled
- **WHEN** the user checks the `war and conflict` checkbox
- **THEN** `war and conflict` is saved to `semantic-filter` storage and used in subsequent semantic checks
