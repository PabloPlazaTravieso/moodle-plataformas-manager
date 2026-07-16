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
 * Privacy class for requesting user data.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_miplugin\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;

/**
 * Privacy provider for local_miplugin: notes and activity log entries are
 * personal data (tied to a userid), stored under the user's own context.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\core_userlist_provider,
    \core_privacy\local\request\plugin\provider {
    /**
     * Returns meta data about this system.
     *
     * @param collection $collection The initialised collection to add items to.
     * @return collection
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table('local_miplugin_notes', [
            'courseid' => 'privacy:metadata:local_miplugin_notes:courseid',
            'userid' => 'privacy:metadata:local_miplugin_notes:userid',
            'content' => 'privacy:metadata:local_miplugin_notes:content',
            'timecreated' => 'privacy:metadata:local_miplugin_notes:timecreated',
        ], 'privacy:metadata:local_miplugin_notes');

        $collection->add_database_table('local_miplugin_log', [
            'userid' => 'privacy:metadata:local_miplugin_log:userid',
            'action' => 'privacy:metadata:local_miplugin_log:action',
            'details' => 'privacy:metadata:local_miplugin_log:details',
            'timecreated' => 'privacy:metadata:local_miplugin_log:timecreated',
        ], 'privacy:metadata:local_miplugin_log');

        return $collection;
    }

    /**
     * Get the list of contexts that contain user information for the specified user.
     *
     * @param int $userid The user to search.
     * @return contextlist
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        $sql = "SELECT ctx.id
                  FROM {user} u
                  JOIN {context} ctx ON ctx.instanceid = u.id AND ctx.contextlevel = :contextlevel
                 WHERE u.id = :userid
                   AND (
                       EXISTS (SELECT 1 FROM {local_miplugin_notes} n WHERE n.userid = u.id)
                    OR EXISTS (SELECT 1 FROM {local_miplugin_log} l WHERE l.userid = u.id)
                   )";

        $contextlist = new contextlist();
        $contextlist->add_from_sql($sql, ['userid' => $userid, 'contextlevel' => CONTEXT_USER]);

        return $contextlist;
    }

    /**
     * Get the list of users within a specific context.
     *
     * @param userlist $userlist
     */
    public static function get_users_in_context(userlist $userlist) {
        $context = $userlist->get_context();

        if (!$context instanceof \context_user) {
            return;
        }

        $userlist->add_from_sql(
            'userid',
            'SELECT userid FROM {local_miplugin_notes} WHERE userid = ?',
            [$context->instanceid]
        );
        $userlist->add_from_sql(
            'userid',
            'SELECT userid FROM {local_miplugin_log} WHERE userid = ?',
            [$context->instanceid]
        );
    }

    /**
     * Export all user data for the specified user, in the specified contexts.
     *
     * @param approved_contextlist $contextlist
     */
    public static function export_user_data(approved_contextlist $contextlist) {
        global $DB;

        $userid = $contextlist->get_user()->id;

        $notes = $DB->get_records('local_miplugin_notes', ['userid' => $userid]);
        $notesdata = array_map(fn($note) => (object) [
            'courseid' => $note->courseid,
            'content' => $note->content,
            'timecreated' => \core_privacy\local\request\transform::datetime($note->timecreated),
        ], array_values($notes));

        $log = $DB->get_records('local_miplugin_log', ['userid' => $userid]);
        $logdata = array_map(fn($entry) => (object) [
            'action' => $entry->action,
            'details' => $entry->details,
            'timecreated' => \core_privacy\local\request\transform::datetime($entry->timecreated),
        ], array_values($log));

        foreach ($contextlist->get_contexts() as $context) {
            if (!$context instanceof \context_user) {
                continue;
            }

            if (!empty($notesdata)) {
                writer::with_context($context)->export_data(
                    [get_string('pluginname', 'local_miplugin'), get_string('notecontent', 'local_miplugin')],
                    (object) ['notes' => $notesdata]
                );
            }

            if (!empty($logdata)) {
                writer::with_context($context)->export_data(
                    [get_string('pluginname', 'local_miplugin'), get_string('activitylog', 'local_miplugin')],
                    (object) ['log' => $logdata]
                );
            }
        }
    }

    /**
     * Delete all user data which matches the specified context.
     *
     * @param \context $context
     */
    public static function delete_data_for_all_users_in_context(\context $context) {
        if ($context instanceof \context_user) {
            self::delete_data($context->instanceid);
        }
    }

    /**
     * Delete multiple users within a single context.
     *
     * @param approved_userlist $userlist
     */
    public static function delete_data_for_users(approved_userlist $userlist) {
        $context = $userlist->get_context();

        if ($context instanceof \context_user) {
            self::delete_data($context->instanceid);
        }
    }

    /**
     * Delete all user data for the specified user, in the specified contexts.
     *
     * @param approved_contextlist $contextlist
     */
    public static function delete_data_for_user(approved_contextlist $contextlist) {
        self::delete_data($contextlist->get_user()->id);
    }

    /**
     * Delete notes and log entries for a userid.
     *
     * @param int $userid
     */
    protected static function delete_data(int $userid): void {
        global $DB;

        $DB->delete_records('local_miplugin_notes', ['userid' => $userid]);
        $DB->delete_records('local_miplugin_log', ['userid' => $userid]);
    }
}
