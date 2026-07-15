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

namespace local_miplugin\local;

/**
 * Unit tests for notes_manager.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \local_miplugin\local\notes_manager
 */
final class notes_manager_test extends \advanced_testcase {

    /**
     * A note can be added to a course and retrieved afterwards.
     */
    public function test_add_and_get_notes_for_course(): void {
        $this->resetAfterTest();

        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();

        notes_manager::add_note($course->id, $user->id, 'First note');
        notes_manager::add_note($course->id, $user->id, 'Second note');

        $notes = notes_manager::get_notes_for_course($course->id);

        $this->assertCount(2, $notes);
        $contents = array_map(fn($note) => $note->content, array_values($notes));
        $this->assertEqualsCanonicalizing(['First note', 'Second note'], $contents);
    }

    /**
     * Notes from other courses are not returned.
     */
    public function test_get_notes_for_course_is_scoped(): void {
        $this->resetAfterTest();

        $course1 = $this->getDataGenerator()->create_course();
        $course2 = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();

        notes_manager::add_note($course1->id, $user->id, 'Note for course 1');
        notes_manager::add_note($course2->id, $user->id, 'Note for course 2');

        $notes = notes_manager::get_notes_for_course($course1->id);

        $this->assertCount(1, $notes);
        $this->assertSame('Note for course 1', reset($notes)->content);
    }

    /**
     * Log entries can be added and are returned most recent first.
     */
    public function test_add_and_get_recent_log(): void {
        $this->resetAfterTest();

        $user = $this->getDataGenerator()->create_user();

        notes_manager::add_log($user->id, 'action_one', 'First action');
        notes_manager::add_log($user->id, 'action_two', 'Second action');

        $log = array_values(notes_manager::get_recent_log());

        $this->assertCount(2, $log);
        $this->assertSame('action_two', $log[0]->action);
        $this->assertSame('action_one', $log[1]->action);
    }

    /**
     * add_note_with_log() writes both a note and a log entry together.
     */
    public function test_add_note_with_log_writes_both(): void {
        $this->resetAfterTest();

        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();

        notes_manager::add_note_with_log($course->id, $user->id, 'Some content', 'note_added', 'Some details');

        $this->assertCount(1, notes_manager::get_notes_for_course($course->id));
        $this->assertCount(1, notes_manager::get_recent_log());
    }

    /**
     * get_notes_with_details() joins in the author's name and the course full name.
     */
    public function test_get_notes_with_details_joins_user_and_course(): void {
        $this->resetAfterTest();

        $course = $this->getDataGenerator()->create_course(['fullname' => 'Joined course']);
        $user = $this->getDataGenerator()->create_user(['firstname' => 'Ada', 'lastname' => 'Lovelace']);

        notes_manager::add_note($course->id, $user->id, 'Note content');

        $notes = array_values(notes_manager::get_notes_with_details($course->id));

        $this->assertCount(1, $notes);
        $this->assertSame('Ada Lovelace', $notes[0]->userfullname);
        $this->assertSame('Joined course', $notes[0]->coursefullname);
    }

    /**
     * search_notes() finds notes case-insensitively by a partial match.
     */
    public function test_search_notes_finds_partial_case_insensitive_match(): void {
        $this->resetAfterTest();

        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();

        notes_manager::add_note($course->id, $user->id, 'Remember to check the syllabus');
        notes_manager::add_note($course->id, $user->id, 'Unrelated note');

        $results = notes_manager::search_notes('SYLLABUS');

        $this->assertCount(1, $results);
        $this->assertSame('Remember to check the syllabus', reset($results)->content);
    }

    /**
     * count_notes_per_user() tallies notes correctly across courses.
     */
    public function test_count_notes_per_user(): void {
        $this->resetAfterTest();

        $course1 = $this->getDataGenerator()->create_course();
        $course2 = $this->getDataGenerator()->create_course();
        $user1 = $this->getDataGenerator()->create_user();
        $user2 = $this->getDataGenerator()->create_user();

        notes_manager::add_note($course1->id, $user1->id, 'Note 1');
        notes_manager::add_note($course2->id, $user1->id, 'Note 2');
        notes_manager::add_note($course1->id, $user2->id, 'Note 3');

        $counts = notes_manager::count_notes_per_user();

        $this->assertSame(2, $counts[$user1->id]);
        $this->assertSame(1, $counts[$user2->id]);
    }

    /**
     * delete_note() removes the note and leaves others untouched.
     */
    public function test_delete_note(): void {
        $this->resetAfterTest();

        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();

        $keepid = notes_manager::add_note($course->id, $user->id, 'Keep me');
        $deleteid = notes_manager::add_note($course->id, $user->id, 'Delete me');

        notes_manager::delete_note($deleteid);

        $remaining = notes_manager::get_notes_for_course($course->id);

        $this->assertCount(1, $remaining);
        $this->assertSame($keepid, (int) reset($remaining)->id);
        $this->assertFalse(notes_manager::get_note($deleteid));
    }
}
