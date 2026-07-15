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
 * Registers a "Platform manager notes" option in a course's menu inside the Moodle App.
 *
 * NOTE: unlike the rest of this plugin, this integration has not been tested against a
 * running instance of the Moodle App (none is set up in this dev environment) — it follows
 * the documented CoreCourseOptionsDelegate contract but should be verified before relying on it.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$addons = [
    'local_miplugin' => [
        'handlers' => [
            'coursenotes' => [
                'displaydata' => [
                    'title' => 'pluginname',
                    'icon' => $CFG->wwwroot . '/local/miplugin/pix/icon.svg',
                ],
                'delegate' => 'CoreCourseOptionsDelegate',
                'method' => 'mobile_course_view',
            ],
        ],
        'lang' => [
            ['pluginname', 'local_miplugin'],
            ['notesforcourse', 'local_miplugin'],
            ['nonotes', 'local_miplugin'],
        ],
    ],
];
