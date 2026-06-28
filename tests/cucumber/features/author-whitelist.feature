Feature: author-whitelist

  @wip
  Scenario: Whitelisted author bypasses AI slop detection
    When a post is detected as AI-generated slop
    And the post author's vanity name is in the whitelist
    Then the post is not collapsed and no banner is rendered

  @wip
  Scenario: Whitelisted author bypasses semantic match
    When a post scores above the semantic match threshold
    And the post author's vanity name is in the whitelist
    Then the post is not collapsed and no banner is rendered

  @wip
  Scenario: Whitelisted author bypasses pattern match
    When a post scores above the pattern match threshold
    And the post author's vanity name is in the whitelist
    Then the post is not collapsed and no banner is rendered

  @wip
  Scenario: Non-whitelisted author is still collapsed
    When a post triggers any detection path
    And the post author's vanity name is not in the whitelist
    Then the post is collapsed as normal

  @wip
  Scenario: Default whitelist is empty
    When no whitelist has been saved
    Then `chrome.storage.local.get({ 'author-whitelist': [] })` returns an empty array

  @wip
  Scenario: Entry contains vanity and name
    When an author is added to the whitelist
    Then the stored entry contains `vanity` (the profile slug) and `name` (the display name)

  @wip
  Scenario: Whitelist entries shown as tags on popup open
    When the Authors tab is opened
    And the whitelist contains entries
    Then each author is shown as a removable tag displaying their name

  @wip
  Scenario: Removing a tag persists the change
    When the user removes an author tag in the Authors tab
    Then the entry is removed from `author-whitelist` in storage

  @wip
  Scenario: Popup has two tabs
    When the popup is opened
    Then two tab buttons are visible: "Filters" (existing settings) and "Authors" (whitelist management)

  @wip
  Scenario: Tab switching shows correct panel
    When the user clicks the "Authors" tab
    And the user clicks the "Filters" tab
    Then the authors panel is shown and the filters panel is hidden
    And the filters panel is shown and the authors panel is hidden
