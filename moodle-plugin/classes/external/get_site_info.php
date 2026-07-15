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

/**
 * External function to retrieve basic platform information.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_site_info extends external_api {

    /**
     * Describes the parameters for execute.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([]);
    }

    /**
     * Returns basic information about this Moodle platform.
     *
     * @return array
     */
    public static function execute(): array {
        global $CFG, $DB, $SITE;

        self::validate_parameters(self::execute_parameters(), []);

        $context = context_system::instance();
        self::validate_context($context);
        require_capability('local/miplugin:viewsiteinfo', $context);

        return [
            'fullname' => format_string($SITE->fullname),
            'shortname' => format_string($SITE->shortname),
            'release' => $CFG->release,
            'version' => $CFG->version,
            'usercount' => $DB->count_records('user', ['deleted' => 0, 'confirmed' => 1]) - 1,
            'coursecount' => $DB->count_records('course') - 1,
        ];
    }

    /**
     * Describes the return value for execute.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'fullname' => new external_value(PARAM_TEXT, 'Site full name'),
            'shortname' => new external_value(PARAM_TEXT, 'Site short name'),
            'release' => new external_value(PARAM_TEXT, 'Moodle release'),
            'version' => new external_value(PARAM_TEXT, 'Moodle version'),
            'usercount' => new external_value(PARAM_INT, 'Number of confirmed, non-deleted users (excluding guest)'),
            'coursecount' => new external_value(PARAM_INT, 'Number of courses (excluding site course)'),
        ]);
    }
}
