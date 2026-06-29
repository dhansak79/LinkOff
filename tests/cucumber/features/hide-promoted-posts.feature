Feature: hide-promoted-posts

  @wip
  Scenario: Toggle exists and is off by default
    When the popup opens for a user who has never enabled `hide-promoted`
    Then a checkbox with id `hide-promoted` is present and unchecked

  @wip
  Scenario: Toggle state is persisted
    When the user checks the `hide-promoted` checkbox
    Then `chrome.storage.local` contains `{ "hide-promoted": true }`

  @wip
  Scenario: Toggle state is restored on popup reopen
    When the user has previously enabled `hide-promoted` and reopens the popup
    Then the `hide-promoted` checkbox is checked

  @wip
  Scenario: Promoted post is hidden immediately
    When `hide-promoted` is `true` and a feed post contains a `<span>` or `<p>` whose trimmed `textContent` equals `"Promoted"` before the post body
    Then the post is hidden with the same CSS class used for keyword-matched posts

  @wip
  Scenario: Image-only promoted post is hidden
    When `hide-promoted` is `true` and a feed post contains a `<span>` or `<p>` with trimmed text `"Promoted"` but has no `data-testid="expandable-text-box"` element
    Then the post is identified as promoted and hidden

  @wip
  Scenario: Non-promoted post is not affected
    When `hide-promoted` is `true` and a feed post does not contain a standalone "Promoted" label
    Then the post is not hidden by the promoted-post filter (other filters may still apply)

  @wip
  Scenario: Promoted posts reappear when toggle is turned off
    When the user unchecks the `hide-promoted` toggle
    Then the feed processor resets hidden posts and re-processes the feed without the promoted filter active

  @wip
  Scenario: Promoted hide increments filtered counter
    When `hide-promoted` is `true` and a post is hidden by the promoted-post filter
    Then the daily `postsFiltered` count increments by 1

  @wip
  Scenario: Promoted hide records author in blocked-authors map
    When a post is hidden by the promoted-post filter
    And the author's vanity name is extractable from the post DOM
    Then the author's count in the daily `authors` map increments by 1

  @wip
  Scenario: Promoted slop post is not soft-hidden when hide-promoted is off
    When `hide-promoted` is `false`
    And a feed post is identified as promoted
    And the post text would trigger slop detection
    Then the post does not receive a `focusedin-slop-soft-hide` class
    And no slop-collapse banner is inserted before the post

  @wip
  Scenario: Promoted slop post is hard-hidden when hide-promoted is on
    When `hide-promoted` is `true`
    And a feed post is identified as promoted
    And the post text would trigger slop detection
    Then the post is hard-hidden by the promoted filter (not soft-hidden by slop detection)
    And no slop-collapse banner or "Show anyway" button is inserted

  @wip
  Scenario: Promoted post does not enter keyword filter
    When a feed post is identified as promoted
    And the post text contains a configured keyword
    Then the keyword filter does not run on the post
    And the promoted post is either hard-hidden (if `hide-promoted` is on) or left visible (if off)

  @wip
  Scenario: Non-promoted slop post is unaffected
    When a feed post is NOT promoted
    And the post text triggers slop detection
    Then the post is soft-hidden by slop detection with a "Show anyway" banner (existing behaviour unchanged)
