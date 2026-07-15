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
 * Data access layer for course notes and the platform manager activity log.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class notes_manager {

    /**
     * Adds a note to a course.
     *
     * @param int $courseid
     * @param int $userid
     * @param string $content
     * @return int the id of the new note
     */
    public static function add_note(int $courseid, int $userid, string $content): int {
        global $DB;

        return $DB->insert_record('local_miplugin_notes', (object) [
            'courseid' => $courseid,
            'userid' => $userid,
            'content' => $content,
            'timecreated' => time(),
        ]);
    }

    /**
     * Returns a single note by id, or false if it does not exist.
     *
     * @param int $noteid
     * @return \stdClass|false
     */
    public static function get_note(int $noteid) {
        global $DB;

        return $DB->get_record('local_miplugin_notes', ['id' => $noteid]);
    }

    /**
     * Deletes a note by id.
     *
     * @param int $noteid
     * @return void
     */
    public static function delete_note(int $noteid): void {
        global $DB;

        $DB->delete_records('local_miplugin_notes', ['id' => $noteid]);
    }

    /**
     * Returns the notes attached to a course, most recent first.
     *
     * @param int $courseid
     * @return array
     */
    public static function get_notes_for_course(int $courseid): array {
        global $DB;

        return $DB->get_records('local_miplugin_notes', ['courseid' => $courseid], 'timecreated DESC, id DESC');
    }

    /**
     * Adds an entry to the platform manager activity log.
     *
     * @param int $userid
     * @param string $action short machine-readable action name
     * @param string $details human-readable details
     * @return int the id of the new log entry
     */
    public static function add_log(int $userid, string $action, string $details): int {
        global $DB;

        return $DB->insert_record('local_miplugin_log', (object) [
            'userid' => $userid,
            'action' => $action,
            'details' => $details,
            'timecreated' => time(),
        ]);
    }

    /**
     * Returns the most recent activity log entries.
     *
     * @param int $limit
     * @return array
     */
    public static function get_recent_log(int $limit = 20): array {
        global $DB;

        return $DB->get_records('local_miplugin_log', null, 'timecreated DESC, id DESC', '*', 0, $limit);
    }

    /**
     * Adds a note and a matching log entry as a single atomic operation.
     *
     * If add_log() throws (e.g. a DB error), the note insert is rolled back too,
     * since both run inside the same delegated transaction.
     *
     * @param int $courseid
     * @param int $userid
     * @param string $content
     * @param string $action
     * @param string $details
     * @return int the id of the new note
     */
    public static function add_note_with_log(int $courseid, int $userid, string $content, string $action, string $details): int {
        global $DB;

        $transaction = $DB->start_delegated_transaction();

        $noteid = self::add_note($courseid, $userid, $content);
        self::add_log($userid, $action, $details);

        $transaction->allow_commit();

        return $noteid;
    }

    /**
     * Returns the notes for a course joined with the author's name and the course full name,
     * avoiding a separate query per row (N+1) like the renderer used to do.
     *
     * @param int $courseid
     * @return array
     */
    public static function get_notes_with_details(int $courseid): array {
        global $DB;

        $userfullname = $DB->sql_fullname('u.firstname', 'u.lastname');

        $sql = "SELECT n.id, n.content, n.timecreated, n.userid, n.courseid,
                       {$userfullname} AS userfullname, c.fullname AS coursefullname
                  FROM {local_miplugin_notes} n
                  JOIN {user} u ON u.id = n.userid
                  JOIN {course} c ON c.id = n.courseid
                 WHERE n.courseid = :courseid
              ORDER BY n.timecreated DESC, n.id DESC";

        return $DB->get_records_sql($sql, ['courseid' => $courseid]);
    }

    /**
     * Searches notes by content, case-insensitively and portably across DB engines.
     *
     * @param string $term
     * @return array
     */
    public static function search_notes(string $term): array {
        global $DB;

        $select = $DB->sql_like('content', ':term', false);

        return $DB->get_records_select(
            'local_miplugin_notes',
            $select,
            ['term' => '%' . $DB->sql_like_escape($term) . '%'],
            'timecreated DESC, id DESC'
        );
    }

    /**
     * Counts how many notes each user has written, across all courses.
     *
     * Uses a recordset instead of get_records() because this could scan a large
     * table: recordsets stream results row by row instead of loading them all
     * into memory at once, but MUST be closed when done.
     *
     * @return array userid => count
     */
    public static function count_notes_per_user(): array {
        global $DB;

        $counts = [];
        $recordset = $DB->get_recordset('local_miplugin_notes', null, '', 'id, userid');

        foreach ($recordset as $note) {
            $counts[$note->userid] = ($counts[$note->userid] ?? 0) + 1;
        }

        $recordset->close();

        return $counts;
    }
}
