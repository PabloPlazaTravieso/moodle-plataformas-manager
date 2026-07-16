<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_miplugin;

use local_miplugin\local\notes_manager;

/**
 * Unit tests for the event observers.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \local_miplugin\observer
 */
final class observer_test extends \advanced_testcase {
    /**
     * Creating a course through core Moodle (not our app) logs it automatically.
     */
    public function test_course_created_is_logged(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $this->assertSame(0, notes_manager::count_log());

        $course = $this->getDataGenerator()->create_course(['fullname' => 'Observer test course']);

        $log = array_values(notes_manager::get_recent_log());

        $this->assertCount(1, $log);
        $this->assertSame('course_created', $log[0]->action);
        $this->assertStringContainsString('Observer test course', $log[0]->details);
    }

    /**
     * Enrolling a user through core Moodle (not our app) logs it automatically.
     */
    public function test_user_enrolment_created_is_logged(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user(['firstname' => 'Grace', 'lastname' => 'Hopper']);

        $this->getDataGenerator()->enrol_user($user->id, $course->id, 'student');

        // Two entries: one from creating the course above, one from this enrolment.
        $log = array_values(notes_manager::get_recent_log());

        $this->assertCount(2, $log);
        $this->assertSame('user_enrolled', $log[0]->action);
        $this->assertStringContainsString('Grace Hopper', $log[0]->details);
    }
}
