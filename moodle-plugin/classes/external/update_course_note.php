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
 * External function to edit the content of an existing course note.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class update_course_note extends external_api {
    /**
     * Describes the parameters for execute.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'noteid' => new external_value(PARAM_INT, 'Note id'),
            'content' => new external_value(PARAM_TEXT, 'New note content'),
        ]);
    }

    /**
     * Updates a note's content and logs the action.
     *
     * @param int $noteid
     * @param string $content
     * @return array
     */
    public static function execute(int $noteid, string $content): array {
        global $USER, $DB;

        $params = self::validate_parameters(self::execute_parameters(), [
            'noteid' => $noteid,
            'content' => $content,
        ]);

        $context = context_system::instance();
        self::validate_context($context);
        require_capability('local/miplugin:managenotes', $context);

        $note = notes_manager::get_note($params['noteid']);
        if (!$note) {
            return ['success' => false];
        }

        notes_manager::update_note($params['noteid'], $params['content']);

        $course = $DB->get_record('course', ['id' => $note->courseid]);
        if ($course) {
            notes_manager::add_log(
                $USER->id,
                'note_edited',
                get_string('lognoteedited', 'local_miplugin', $course->fullname)
            );
        }

        return ['success' => true];
    }

    /**
     * Describes the return value for execute.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Whether the note was updated'),
        ]);
    }
}
