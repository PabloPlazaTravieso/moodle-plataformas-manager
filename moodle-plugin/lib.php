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

/**
 * Library callbacks for local_miplugin.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

use local_miplugin\local\notes_manager;

/**
 * Fragment callback that re-renders the notes list for a course, optionally
 * deleting a note first. Called from JS via core/fragment (see amd/src/notes.js).
 *
 * @param array $args ['courseid' => int, 'context' => context, 'action' => string, 'noteid' => int]
 * @return string rendered HTML
 */
function local_miplugin_output_fragment_notes_list(array $args): string {
    global $PAGE, $USER;

    $courseid = (int) ($args['courseid'] ?? 0);
    $context = $args['context'];

    require_capability('local/miplugin:managenotes', $context);

    if (($args['action'] ?? '') === 'delete' && !empty($args['noteid'])) {
        $noteid = (int) $args['noteid'];
        $note = notes_manager::get_note($noteid);

        if ($note && (int) $note->courseid === $courseid) {
            notes_manager::delete_note($noteid);
            notes_manager::add_log($USER->id, 'note_deleted', get_string('lognotedeleted', 'local_miplugin'));
        }
    }

    $renderer = $PAGE->get_renderer('local_miplugin');

    return $renderer->render_notes(notes_manager::get_notes_with_details($courseid));
}
