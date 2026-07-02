Feature: hide-promoted-posts

  Scenario: Toggle exists and is off by default
    When the popup opens for a user who has never enabled `hide-promoted`
    Then a checkbox with id `hide-promoted` is present and unchecked

  Scenario: Toggle state is persisted
    When the user checks the `hide-promoted` checkbox
    Then `chrome.storage.local` contains `{ "hide-promoted": true }`

  Scenario: Toggle state is restored on popup reopen
    When the user has previously enabled `hide-promoted` and reopens the popup
    Then the `hide-promoted` checkbox is checked

  Scenario: Promoted post is hidden immediately
    When `hide-promoted` is `true` and a feed post contains a `<span>` or `<p>` whose trimmed `textContent` equals `"Promoted"` before the post body
    Then the post is hidden with the same CSS class used for keyword-matched posts

  Scenario: Image-only promoted post is hidden
    When `hide-promoted` is `true` and a feed post contains a `<span>` or `<p>` with trimmed text `"Promoted"` but has no `data-testid="expandable-text-box"` element
    Then the post is identified as promoted and hidden

  Scenario: Non-promoted post is not affected
    When `hide-promoted` is `true` and a feed post does not contain a standalone "Promoted" label
    Then the post is not hidden by the promoted-post filter (other filters may still apply)

  Scenario: Promoted posts reappear when toggle is turned off
    When the user unchecks the `hide-promoted` toggle
    Then the feed processor resets hidden posts and re-processes the feed without the promoted filter active

  Scenario: Promoted hide increments filtered counter
    When `hide-promoted` is `true` and a post is hidden by the promoted-post filter
    Then the daily `postsFiltered` count increments by 1

  Scenario: Promoted hide records author in blocked-authors map
    When a post is hidden by the promoted-post filter
    And the author's vanity name is extractable from the post DOM
    Then the author's count in the daily `authors` map increments by 1

  Scenario: Promoted slop post is not soft-hidden when hide-promoted is off
    When `hide-promoted` is `false`
    And a feed post is identified as promoted
    And the post text would trigger slop detection
    Then the post does not receive a `focusedin-slop-soft-hide` class
    Then no slop-collapse banner is inserted before the post

  Scenario: Promoted slop post is hard-hidden when hide-promoted is on
    When `hide-promoted` is `true`
    And a feed post is identified as promoted
    And the post text would trigger slop detection
    Then the post is hard-hidden by the promoted filter (not soft-hidden by slop detection)
    Then no slop-collapse banner or "Show anyway" button is inserted

  Scenario: Promoted post does not enter keyword filter
    When a feed post is identified as promoted
    And the post text contains a configured keyword
    Then the keyword filter does not run on the post
    And the promoted post is either hard-hidden (if `hide-promoted` is on) or left visible (if off)

  Scenario: Non-promoted slop post is unaffected
    When a feed post is NOT promoted
    And the post text triggers slop detection
    Then the post is soft-hidden by slop detection with a "Show anyway" banner (existing behaviour unchanged)

  Scenario: Standalone "Promoted" post is still hidden when toggle is on
    Given a feed post contains a label element (outside the post body) whose trimmed text is exactly "Promoted"
    And `hide-promoted` is `true`
    When the feed processor runs
    Then the post is hidden with the same CSS class used for keyword-matched posts

  Scenario: Image-only standalone "Promoted" post is still hidden
    Given a feed post contains a standalone "Promoted" label but has no `data-testid="expandable-text-box"` element
    And `hide-promoted` is `true`
    When the feed processor runs
    Then the post is identified as promoted and hidden

  Scenario: Standalone "Promoted" post is not hidden when toggle is off
    Given a feed post contains a standalone "Promoted" label
    And `hide-promoted` is `false`
    When the feed processor runs
    Then the post is left visible and unmodified

  Scenario: "Promoted by <Page>" post is hidden immediately when toggle is on
    Given a feed post contains a label element (outside the post body) whose text begins with "Promoted by" followed by a linked company Page name (e.g. "Promoted by PyMC Labs")
    And `hide-promoted` is `true`
    When the feed processor runs
    Then the post is hidden with the same CSS class used for keyword-matched posts

  Scenario: Image-only "Promoted by <Page>" post is hidden (no expandable-text-box)
    Given a feed post contains a "Promoted by <Page>" label but has no `data-testid="expandable-text-box"` element
    And `hide-promoted` is `true`
    When the feed processor runs
    Then the post is identified as promoted and hidden

  Scenario: "Promoted by <Page>" post is not hidden when toggle is off
    Given a feed post contains a "Promoted by <Page>" label
    And `hide-promoted` is `false`
    When the feed processor runs
    Then the post is left visible and unmodified

  Scenario: Post with "Promoted by" only in body text is not hidden
    Given a feed post's body text contains the phrase "Promoted by" as ordinary prose (not a sponsor label outside the body)
    And `hide-promoted` is `true`
    When the feed processor runs
    Then the post is not hidden by the promoted-post filter

  Scenario: "Promoted by <Page>" hide is counted in daily stats
    Given a feed post contains a "Promoted by <Page>" label with an extractable author
    And `hide-promoted` is `true`
    When the feed processor runs
    Then the daily `postsFiltered` count increments by 1
    And the author's vanity name is recorded in the daily blocked-authors map

  Scenario: "Promoted by <Page>" post is excluded from slop and keyword filters
    Given a feed post contains a "Promoted by <Page>" label and post text that would otherwise trigger slop detection or a keyword match
    When `hide-promoted` is `true`
    Then the post is hard-hidden by the promoted filter and receives no slop-collapse banner
    When `hide-promoted` is `false`
    Then the post is left visible and does not receive a slop-collapse banner

  Scenario: Both a standalone "Promoted" post and a "Promoted by <Page>" post are hidden in the same feed pass
    Given a feed contains one post with a standalone "Promoted" label and another post with a "Promoted by <Page>" label, alongside clean posts
    And `hide-promoted` is `true`
    When the feed processor runs
    Then both promoted posts are hidden and the clean posts remain visible
