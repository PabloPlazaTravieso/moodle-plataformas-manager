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
 * Event observers that keep the platform manager activity log up to date
 * with actions performed directly in Moodle, not just through our app.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class observer {
    /**
     * Logs when a course is created, from anywhere in Moodle.
     *
     * @param \core\event\course_created $event
     * @return void
     */
    public static function course_created(\core\event\course_created $event): void {
        $course = get_course($event->objectid);

        notes_manager::add_log(
            $event->userid,
            'course_created',
            get_string('logcoursecreated', 'local_miplugin', $course->fullname)
        );
    }

    /**
     * Logs when a user is enrolled in a course, from anywhere in Moodle.
     *
     * @param \core\event\user_enrolment_created $event
     * @return void
     */
    public static function user_enrolment_created(\core\event\user_enrolment_created $event): void {
        global $DB;

        $course = get_course($event->courseid);
        $user = $DB->get_record('user', ['id' => $event->relateduserid]);
        $username = $user ? fullname($user) : "user #{$event->relateduserid}";

        notes_manager::add_log(
            $event->userid,
            'user_enrolled',
            "{$username} enrolled in course \"{$course->fullname}\""
        );
    }
}
