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

namespace local_miplugin\external;

use context_system;
use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use local_miplugin\local\notes_manager;

/**
 * External function to add a note to a course from the external app.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class add_course_note extends external_api {
    /**
     * Describes the parameters for execute.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course id'),
            'content' => new external_value(PARAM_TEXT, 'Note content'),
        ]);
    }

    /**
     * Adds a note to a course, logging the action.
     *
     * @param int $courseid
     * @param string $content
     * @return array
     */
    public static function execute(int $courseid, string $content): array {
        global $USER, $DB;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'content' => $content,
        ]);

        $context = context_system::instance();
        self::validate_context($context);
        require_capability('local/miplugin:managenotes', $context);

        $course = $DB->get_record('course', ['id' => $params['courseid']], '*', MUST_EXIST);

        $noteid = notes_manager::add_note_with_log(
            $params['courseid'],
            $USER->id,
            $params['content'],
            'note_added',
            get_string('lognoteadded', 'local_miplugin', $course->fullname)
        );

        return ['id' => $noteid];
    }

    /**
     * Describes the return value for execute.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'id' => new external_value(PARAM_INT, 'The id of the new note'),
        ]);
    }
}
