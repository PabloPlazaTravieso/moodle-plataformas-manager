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
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use local_miplugin\local\notes_manager;

/**
 * External function to retrieve the notes attached to a course, so the
 * external app can show/manage them alongside the course itself.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_course_notes extends external_api {
    /**
     * Describes the parameters for execute.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course id'),
        ]);
    }

    /**
     * Returns the notes for a course, most recent first.
     *
     * @param int $courseid
     * @return array
     */
    public static function execute(int $courseid): array {
        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);

        $context = context_system::instance();
        self::validate_context($context);
        require_capability('local/miplugin:managenotes', $context);

        $notes = notes_manager::get_notes_with_details($params['courseid']);

        $result = [];
        foreach ($notes as $note) {
            $result[] = [
                'id' => (int) $note->id,
                'content' => $note->content,
                'userfullname' => $note->userfullname,
                'timecreated' => (int) $note->timecreated,
            ];
        }

        return ['notes' => $result];
    }

    /**
     * Describes the return value for execute.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'notes' => new external_multiple_structure(
                new external_single_structure([
                    'id' => new external_value(PARAM_INT, 'Note id'),
                    'content' => new external_value(PARAM_RAW, 'Note content'),
                    'userfullname' => new external_value(PARAM_TEXT, "Author's full name"),
                    'timecreated' => new external_value(PARAM_INT, 'Timestamp'),
                ])
            ),
        ]);
    }
}
