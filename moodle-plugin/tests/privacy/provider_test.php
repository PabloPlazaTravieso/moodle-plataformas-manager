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

namespace local_miplugin\privacy;

use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;
use core_privacy\tests\provider_testcase;

/**
 * Unit tests for local_miplugin's privacy provider.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \local_miplugin\privacy\provider
 */
final class provider_test extends provider_testcase {
    /**
     * Basic setup for these tests.
     */
    public function setUp(): void {
        parent::setUp();
        $this->resetAfterTest(true);
    }

    /**
     * The user's own context is returned when they have notes or log entries.
     */
    public function test_get_contexts_for_userid(): void {
        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();
        $context = \context_user::instance($user->id);

        \local_miplugin\local\notes_manager::add_note($course->id, $user->id, 'A note');

        $contextlist = provider::get_contexts_for_userid($user->id);

        $this->assertEquals($context, $contextlist->current());
    }

    /**
     * Both notes and log entries are exported for the user's context.
     */
    public function test_export_user_data(): void {
        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();
        $context = \context_user::instance($user->id);

        \local_miplugin\local\notes_manager::add_note($course->id, $user->id, 'Exported note');
        \local_miplugin\local\notes_manager::add_log($user->id, 'export_test', 'Exported log entry');

        $writer = writer::with_context($context);
        $this->assertFalse($writer->has_any_data());

        $this->export_context_data_for_user($user->id, $context, 'local_miplugin');

        $notesdata = $writer->get_data([get_string('pluginname', 'local_miplugin'), get_string('notecontent', 'local_miplugin')]);
        $this->assertCount(1, $notesdata->notes);
        $this->assertSame('Exported note', reset($notesdata->notes)->content);

        $logdata = $writer->get_data([get_string('pluginname', 'local_miplugin'), get_string('activitylog', 'local_miplugin')]);
        $this->assertCount(1, $logdata->log);
        $this->assertSame('export_test', reset($logdata->log)->action);
    }

    /**
     * Only users with notes/log entries appear in get_users_in_context().
     */
    public function test_get_users_in_context(): void {
        $component = 'local_miplugin';
        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();
        $usercontext = \context_user::instance($user->id);

        $userlist = new userlist($usercontext, $component);
        provider::get_users_in_context($userlist);
        $this->assertCount(0, $userlist);

        \local_miplugin\local\notes_manager::add_note($course->id, $user->id, 'A note');

        provider::get_users_in_context($userlist);
        $this->assertCount(1, $userlist);
        $this->assertEquals([$user->id], $userlist->get_userids());
    }

    /**
     * delete_data_for_user() removes both notes and log entries for that user only.
     */
    public function test_delete_data_for_user(): void {
        $course = $this->getDataGenerator()->create_course();
        $user1 = $this->getDataGenerator()->create_user();
        $user2 = $this->getDataGenerator()->create_user();
        $context1 = \context_user::instance($user1->id);

        \local_miplugin\local\notes_manager::add_note($course->id, $user1->id, 'User 1 note');
        \local_miplugin\local\notes_manager::add_log($user1->id, 'action', 'User 1 log');
        \local_miplugin\local\notes_manager::add_note($course->id, $user2->id, 'User 2 note');

        $approvedlist = new approved_contextlist($user1, 'local_miplugin', [$context1->id]);
        provider::delete_data_for_user($approvedlist);

        $remaining = \local_miplugin\local\notes_manager::get_notes_for_course($course->id);
        $this->assertCount(1, $remaining);
        $this->assertSame('User 2 note', reset($remaining)->content);

        // The course_created entry (logged under a different user by creating $course above) may remain;
        // only user1's own log entries must be gone.
        $user1log = array_filter(
            \local_miplugin\local\notes_manager::get_recent_log(),
            fn($entry) => (int) $entry->userid === $user1->id
        );
        $this->assertCount(0, $user1log);
    }
}
