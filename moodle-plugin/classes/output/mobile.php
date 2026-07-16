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

namespace local_miplugin\output;

use local_miplugin\local\notes_manager;

/**
 * Mobile app output handlers for local_miplugin (CoreCourseOptionsDelegate).
 *
 * NOTE: written to the documented contract but not verified against a running
 * instance of the Moodle App — see db/mobile.php.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mobile {
    /**
     * Returns the "Platform manager notes" course view for the Moodle App.
     *
     * @param array $args ['courseid' => int, ...]
     * @return array
     */
    public static function mobile_course_view(array $args): array {
        global $OUTPUT;

        $courseid = (int) $args['courseid'];
        $context = \context_course::instance($courseid);
        require_capability('local/miplugin:managenotes', $context);

        $notes = notes_manager::get_notes_with_details($courseid);

        $data = [
            'notes' => array_map(fn($note) => [
                'content' => format_text($note->content, FORMAT_PLAIN),
                'userfullname' => $note->userfullname,
                'timecreated' => userdate($note->timecreated),
            ], array_values($notes)),
        ];

        return [
            'templates' => [
                [
                    'id' => 'main',
                    'html' => $OUTPUT->render_from_template('local_miplugin/mobile_notes_list', $data),
                ],
            ],
            'javascript' => '',
            'otherdata' => [],
            'files' => [],
        ];
    }
}
