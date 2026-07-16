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
 * External function to retrieve the platform manager activity log,
 * used to power charts in the external app's dashboard.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_activity_log extends external_api {
    /**
     * Describes the parameters for execute.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'limit' => new external_value(PARAM_INT, 'Maximum number of entries to return', VALUE_DEFAULT, 500),
        ]);
    }

    /**
     * Returns the most recent activity log entries.
     *
     * @param int $limit
     * @return array
     */
    public static function execute(int $limit = 500): array {
        self::validate_parameters(self::execute_parameters(), ['limit' => $limit]);

        $context = context_system::instance();
        self::validate_context($context);
        require_capability('local/miplugin:viewlog', $context);

        $entries = notes_manager::get_recent_log($limit);

        $result = [];
        foreach ($entries as $entry) {
            $result[] = [
                'action' => $entry->action,
                'details' => $entry->details,
                'timecreated' => (int) $entry->timecreated,
            ];
        }

        return ['entries' => $result];
    }

    /**
     * Describes the return value for execute.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'entries' => new external_multiple_structure(
                new external_single_structure([
                    'action' => new external_value(PARAM_ALPHANUMEXT, 'Action name'),
                    'details' => new external_value(PARAM_TEXT, 'Action details'),
                    'timecreated' => new external_value(PARAM_INT, 'Timestamp'),
                ])
            ),
        ]);
    }
}
