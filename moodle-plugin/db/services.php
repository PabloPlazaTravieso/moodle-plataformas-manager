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
 * Web service function and service definitions.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_miplugin_get_site_info' => [
        'classname'     => 'local_miplugin\external\get_site_info',
        'methodname'    => 'execute',
        'description'   => 'Returns basic information about this Moodle platform (name, release, users, courses).',
        'type'          => 'read',
        'ajax'          => false,
        'capabilities'  => 'local/miplugin:viewsiteinfo',
    ],
    'local_miplugin_get_courses' => [
        'classname'     => 'local_miplugin\external\get_courses',
        'methodname'    => 'execute',
        'description'   => 'Returns the list of courses in this platform.',
        'type'          => 'read',
        'ajax'          => false,
        'capabilities'  => 'local/miplugin:viewcourses',
    ],
    'local_miplugin_get_users' => [
        'classname'     => 'local_miplugin\external\get_users',
        'methodname'    => 'execute',
        'description'   => 'Returns the list of users in this platform.',
        'type'          => 'read',
        'ajax'          => false,
        'capabilities'  => 'local/miplugin:viewusers',
    ],
    'local_miplugin_set_course_image' => [
        'classname'     => 'local_miplugin\external\set_course_image',
        'methodname'    => 'execute',
        'description'   => 'Sets a course overview image from a previously uploaded draft file.',
        'type'          => 'write',
        'ajax'          => false,
        'capabilities'  => 'moodle/course:update',
    ],
    'local_miplugin_get_activity_log' => [
        'classname'     => 'local_miplugin\external\get_activity_log',
        'methodname'    => 'execute',
        'description'   => 'Returns the platform manager activity log entries.',
        'type'          => 'read',
        'ajax'          => false,
        'capabilities'  => 'local/miplugin:viewlog',
    ],
    'local_miplugin_get_assignable_roles' => [
        'classname'     => 'local_miplugin\external\get_assignable_roles',
        'methodname'    => 'execute',
        'description'   => 'Returns the roles available for enrolling users in a course.',
        'type'          => 'read',
        'ajax'          => false,
        'capabilities'  => 'local/miplugin:viewusers',
    ],
];

$services = [
    'Gestor de plataformas Moodle' => [
        'functions'       => [
            'local_miplugin_get_site_info',
            'local_miplugin_get_courses',
            'local_miplugin_get_users',
            'core_course_get_categories',
            'core_course_create_categories',
            'core_course_delete_categories',
            'core_course_create_courses',
            'core_course_update_courses',
            'core_course_delete_courses',
            'core_user_create_users',
            'core_user_update_users',
            'core_user_delete_users',
            'core_enrol_get_enrolled_users',
            'core_enrol_get_users_courses',
            'enrol_manual_enrol_users',
            'enrol_manual_unenrol_users',
            'local_miplugin_set_course_image',
            'local_miplugin_get_activity_log',
            'local_miplugin_get_assignable_roles',
        ],
        'restrictedusers' => 0,
        'enabled'         => 1,
        'shortname'       => 'local_miplugin_platform_manager',
        'downloadfiles'   => 1,
        'uploadfiles'     => 1,
    ],
];
