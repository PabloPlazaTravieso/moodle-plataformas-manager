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
 * External function to list the courses of this platform.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_courses extends external_api {
    /**
     * Describes the parameters for execute.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([]);
    }

    /**
     * Returns the list of courses in this platform, excluding the site course.
     *
     * @return array
     */
    public static function execute(): array {
        global $DB;

        self::validate_parameters(self::execute_parameters(), []);

        $context = context_system::instance();
        self::validate_context($context);
        require_capability('local/miplugin:viewcourses', $context);

        $courses = $DB->get_records_select(
            'course',
            'id <> :siteid',
            ['siteid' => SITEID],
            'fullname ASC',
            'id, shortname, fullname, category, visible, startdate, enddate'
        );

        $fs = get_file_storage();
        $result = [];
        foreach ($courses as $course) {
            $coursecontext = \context_course::instance($course->id);
            $imageurl = null;
            $files = $fs->get_area_files($coursecontext->id, 'course', 'overviewfiles', 0, 'sortorder', false);
            foreach ($files as $file) {
                if (str_starts_with($file->get_mimetype() ?? '', 'image/')) {
                    $imageurl = \moodle_url::make_webservice_pluginfile_url(
                        $file->get_contextid(),
                        $file->get_component(),
                        $file->get_filearea(),
                        null,
                        $file->get_filepath(),
                        $file->get_filename()
                    )->out(false);
                    break;
                }
            }

            $result[] = [
                'id' => (int) $course->id,
                'shortname' => format_string($course->shortname),
                'fullname' => format_string($course->fullname),
                'categoryid' => (int) $course->category,
                'visible' => (bool) $course->visible,
                'startdate' => (int) $course->startdate,
                'enddate' => (int) $course->enddate,
                'imageurl' => $imageurl,
            ];
        }

        return ['courses' => $result];
    }

    /**
     * Describes the return value for execute.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'courses' => new external_multiple_structure(
                new external_single_structure([
                    'id' => new external_value(PARAM_INT, 'Course id'),
                    'shortname' => new external_value(PARAM_TEXT, 'Course short name'),
                    'fullname' => new external_value(PARAM_TEXT, 'Course full name'),
                    'categoryid' => new external_value(PARAM_INT, 'Course category id'),
                    'visible' => new external_value(PARAM_BOOL, 'Whether the course is visible'),
                    'startdate' => new external_value(PARAM_INT, 'Course start date (timestamp)'),
                    'enddate' => new external_value(PARAM_INT, 'Course end date (timestamp), 0 if not set'),
                    'imageurl' => new external_value(PARAM_URL, 'Course image URL, null if none set'),
                ])
            ),
        ]);
    }
}
