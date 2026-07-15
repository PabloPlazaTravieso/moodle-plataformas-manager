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

defined('MOODLE_INTERNAL') || die();

/**
 * Renderer for local_miplugin.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class renderer extends \plugin_renderer_base {

    /**
     * Renders the activity log table.
     *
     * Fetches all involved users in a single query instead of one query per
     * row, to avoid the classic N+1 problem.
     *
     * @param array $entries records from local_miplugin_log
     * @return string
     */
    public function render_log(array $entries): string {
        global $DB;

        $userids = array_unique(array_map(fn($entry) => $entry->userid, $entries));
        $users = $userids ? $DB->get_records_list('user', 'id', $userids) : [];

        $context = ['entries' => []];
        foreach ($entries as $entry) {
            $user = $users[$entry->userid] ?? null;
            $context['entries'][] = [
                'action' => $entry->action,
                'details' => $entry->details,
                'userfullname' => $user ? fullname($user) : '',
                'timecreated' => userdate($entry->timecreated),
            ];
        }

        return $this->render_from_template('local_miplugin/log_table', $context);
    }

    /**
     * Renders the list of notes for a course.
     *
     * Expects rows already joined with author/course details, e.g. from
     * notes_manager::get_notes_with_details(), so no per-row queries are needed here.
     *
     * @param array $notes records with userfullname/coursefullname already joined in
     * @return string
     */
    public function render_notes(array $notes): string {
        $context = ['notes' => []];
        foreach ($notes as $note) {
            $context['notes'][] = [
                'id' => $note->id,
                'content' => format_text($note->content, FORMAT_PLAIN),
                'userfullname' => $note->userfullname,
                'timecreated' => userdate($note->timecreated),
            ];
        }

        return $this->render_from_template('local_miplugin/notes_list', $context);
    }
}
