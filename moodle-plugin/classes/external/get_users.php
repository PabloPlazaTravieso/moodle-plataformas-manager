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

/**
 * External function to list the users of this platform.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_users extends external_api {
    /**
     * Describes the parameters for execute.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([]);
    }

    /**
     * Returns the list of users in this platform, excluding the guest user.
     *
     * @return array
     */
    public static function execute(): array {
        global $CFG, $DB;

        self::validate_parameters(self::execute_parameters(), []);

        $context = context_system::instance();
        self::validate_context($context);
        require_capability('local/miplugin:viewusers', $context);

        $users = $DB->get_records_select(
            'user',
            'id <> :guestid AND deleted = 0',
            ['guestid' => $CFG->siteguest],
            'lastname ASC, firstname ASC',
            'id, username, email, firstname, lastname, suspended, confirmed, lastaccess'
        );

        // Fetch every system- and course-level role assignment in a single query (avoids one
        // query per user). Admin status isn't a role assignment at all in Moodle (it lives in
        // $CFG->siteadmins), so it's added separately below.
        $rolesbyuser = [];
        $roleassignments = $DB->get_records_sql(
            "SELECT ra.id, ra.userid, r.shortname
               FROM {role_assignments} ra
               JOIN {role} r ON r.id = ra.roleid
               JOIN {context} ctx ON ctx.id = ra.contextid
              WHERE ctx.contextlevel IN (:syslevel, :courselevel)",
            ['syslevel' => CONTEXT_SYSTEM, 'courselevel' => CONTEXT_COURSE]
        );
        foreach ($roleassignments as $ra) {
            $rolesbyuser[$ra->userid][$ra->shortname] = true;
        }

        $adminids = array_flip(explode(',', $CFG->siteadmins));

        $result = [];
        foreach ($users as $user) {
            $roles = array_keys($rolesbyuser[$user->id] ?? []);
            if (isset($adminids[$user->id])) {
                array_unshift($roles, 'admin');
            }

            $result[] = [
                'id' => (int) $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'suspended' => (bool) $user->suspended,
                'confirmed' => (bool) $user->confirmed,
                'lastaccess' => (int) $user->lastaccess,
                'roles' => $roles,
            ];
        }

        return ['users' => $result];
    }

    /**
     * Describes the return value for execute.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'users' => new external_multiple_structure(
                new external_single_structure([
                    'id' => new external_value(PARAM_INT, 'User id'),
                    'username' => new external_value(PARAM_RAW, 'Username'),
                    'email' => new external_value(PARAM_RAW, 'Email address'),
                    'firstname' => new external_value(PARAM_TEXT, 'First name'),
                    'lastname' => new external_value(PARAM_TEXT, 'Last name'),
                    'suspended' => new external_value(PARAM_BOOL, 'Whether the account is suspended'),
                    'confirmed' => new external_value(PARAM_BOOL, 'Whether the account is confirmed'),
                    'lastaccess' => new external_value(PARAM_INT, 'Last access to the site (timestamp), 0 if never'),
                    'roles' => new external_multiple_structure(
                        new external_value(PARAM_ALPHANUMEXT, 'Role shortname'),
                        '"admin" if a site administrator, plus any system- or course-level role shortnames'
                    ),
                ])
            ),
        ]);
    }
}
