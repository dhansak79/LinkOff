Feature: fix-promoted-by-page-detection

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
    Then the daily postsFiltered count increments by 1
    And the author's vanity name is recorded in the daily blocked-authors map

  Scenario: "Promoted by <Page>" post is excluded from slop and keyword filters
    Given a feed post contains a "Promoted by <Page>" label and post text that would otherwise trigger slop detection or a keyword match
    When `hide-promoted` is `true`
    And `hide-promoted` is `false`
    Then when hide-promoted is true, the post is hard-hidden by the promoted filter and receives no slop-collapse banner
    And when hide-promoted is false, the post is left visible and does not receive a slop-collapse banner

  Scenario: Both a standalone "Promoted" post and a "Promoted by <Page>" post are hidden in the same feed pass
    Given a feed contains one post with a standalone "Promoted" label and another post with a "Promoted by <Page>" label, alongside clean posts
    And `hide-promoted` is `true`
    When the feed processor runs
    Then both promoted posts are hidden and the clean posts remain visible
