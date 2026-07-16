@local @local_miplugin
Feature: Platform manager activity log
  In order to keep track of what happens through the platform manager
  As an admin
  I need to be able to reach the activity log page from Site administration,
  and have it record actions performed directly in Moodle

  Scenario: Admin can reach the activity log from Site administration
    Given I log in as "admin"
    And I navigate to "Mi Plugin" in site administration
    Then I should see "Activity log"
    And I should see "Export to CSV"
    And I should see "No activity yet."

  Scenario: Creating a course through the Moodle UI logs it automatically
    Given I log in as "admin"
    And I navigate to "Courses > Add a new course" in site administration
    And I set the following fields to these values:
      | Course full name  | Behat observer course |
      | Course short name | behatobservercourse   |
    And I press "Save and display"
    When I navigate to "Mi Plugin" in site administration
    Then I should see "course_created"
    And I should see "Behat observer course"
