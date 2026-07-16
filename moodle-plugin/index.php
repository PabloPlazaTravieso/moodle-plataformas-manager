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
 * Platform manager dashboard: activity log and per-course notes.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/adminlib.php');

use local_miplugin\form\note_form;
use local_miplugin\local\notes_manager;

/** Number of activity log entries shown per page. */
const MIPLUGIN_LOG_PAGE_SIZE = 10;

$courseid = optional_param('courseid', 0, PARAM_INT);
$editnoteid = optional_param('editnote', 0, PARAM_INT);
$page = optional_param('page', 0, PARAM_INT);
$export = optional_param('export', '', PARAM_ALPHA);

require_login();

$context = context_system::instance();
require_capability('local/miplugin:viewlog', $context);

// Handle CSV export before any output is sent.
if ($export === 'log') {
    require_capability('local/miplugin:viewlog', $context);
    \core\dataformat::download_data(
        'activity_log',
        'csv',
        ['action', 'details', 'userid', 'timecreated'],
        notes_manager::get_recent_log(PHP_INT_MAX),
        fn($row) => [$row->action, $row->details, $row->userid, userdate($row->timecreated)]
    );
    exit;
} else if ($export === 'notes' && $courseid) {
    require_capability('local/miplugin:managenotes', $context);
    \core\dataformat::download_data(
        'course_notes',
        'csv',
        ['content', 'userfullname', 'timecreated'],
        notes_manager::get_notes_with_details($courseid),
        fn($row) => [$row->content, $row->userfullname, userdate($row->timecreated)]
    );
    exit;
}

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/miplugin/index.php', ['courseid' => $courseid]));
$PAGE->set_title(get_string('pluginname', 'local_miplugin'));
$PAGE->set_heading(get_string('pluginname', 'local_miplugin'));
$PAGE->set_pagelayout('admin');

/** @var \local_miplugin\output\renderer $renderer */
$renderer = $PAGE->get_renderer('local_miplugin');

$course = null;
$noteform = null;

if ($courseid) {
    $course = get_course($courseid);
    require_capability('local/miplugin:managenotes', $context);

    $editingnote = null;
    if ($editnoteid) {
        $editingnote = notes_manager::get_note($editnoteid);
        if (!$editingnote || (int) $editingnote->courseid !== $courseid) {
            $editingnote = null;
            $editnoteid = 0;
        }
    }

    $noteform = new note_form(null, ['noteid' => $editnoteid], 'post', '', null, true, [
        'courseid' => $courseid,
        'noteid' => $editnoteid,
    ]);
    $noteform->set_data([
        'courseid' => $courseid,
        'noteid' => $editnoteid,
        'content' => $editingnote->content ?? '',
    ]);

    if ($data = $noteform->get_data()) {
        if (!empty($data->noteid)) {
            notes_manager::update_note($data->noteid, $data->content);
            notes_manager::add_log($USER->id, 'note_edited', get_string('lognoteedited', 'local_miplugin', $course->fullname));
        } else {
            notes_manager::add_note_with_log(
                $courseid,
                $USER->id,
                $data->content,
                'note_added',
                get_string('lognoteadded', 'local_miplugin', $course->fullname)
            );
        }
        redirect(new moodle_url('/local/miplugin/index.php', ['courseid' => $courseid]));
    }
}

echo $OUTPUT->header();

if ($course) {
    echo $OUTPUT->heading(get_string('notesforcourse', 'local_miplugin', $course->fullname));
    echo html_writer::div(
        html_writer::link(
            new moodle_url('/local/miplugin/index.php', ['courseid' => $courseid, 'export' => 'notes']),
            get_string('exportcsv', 'local_miplugin')
        ),
        'mb-2'
    );
    echo html_writer::start_div('', ['data-region' => 'miplugin-notes-list']);
    echo $renderer->render_notes(notes_manager::get_notes_with_details($courseid), $courseid);
    echo html_writer::end_div();
    $noteform->display();
    echo html_writer::div(
        html_writer::link(new moodle_url('/local/miplugin/index.php'), get_string('backtolog', 'local_miplugin')),
        'mt-3'
    );
    $PAGE->requires->js_call_amd('local_miplugin/notes', 'init', [$context->id, $courseid]);
} else {
    echo $OUTPUT->heading(get_string('activitylog', 'local_miplugin'));
    echo html_writer::div(
        html_writer::link(
            new moodle_url('/local/miplugin/index.php', ['export' => 'log']),
            get_string('exportcsv', 'local_miplugin')
        ),
        'mb-2'
    );

    $total = notes_manager::count_log();
    echo $renderer->render_log(notes_manager::get_recent_log(MIPLUGIN_LOG_PAGE_SIZE, $page * MIPLUGIN_LOG_PAGE_SIZE));
    echo $OUTPUT->paging_bar($total, $page, MIPLUGIN_LOG_PAGE_SIZE, new moodle_url('/local/miplugin/index.php'));
}

echo $OUTPUT->footer();
