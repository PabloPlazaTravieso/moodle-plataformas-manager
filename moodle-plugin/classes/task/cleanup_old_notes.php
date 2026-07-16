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

namespace local_miplugin\task;

use local_miplugin\local\notes_manager;

/**
 * Scheduled task that deletes course notes older than 365 days.
 *
 * @package    local_miplugin
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class cleanup_old_notes extends \core\task\scheduled_task {
    /** @var int number of days after which a note is considered old */
    const MAX_AGE_DAYS = 365;

    /**
     * Returns the task name shown in the scheduled tasks admin page.
     *
     * @return string
     */
    public function get_name(): string {
        return get_string('task_cleanup_old_notes', 'local_miplugin');
    }

    /**
     * Deletes old notes and logs how many were removed.
     */
    public function execute(): void {
        $deleted = notes_manager::delete_notes_older_than(self::MAX_AGE_DAYS);

        if ($deleted > 0) {
            notes_manager::add_log(
                get_admin()->id,
                'notes_cleaned_up',
                "Deleted {$deleted} note(s) older than " . self::MAX_AGE_DAYS . ' days'
            );
            mtrace("local_miplugin: deleted {$deleted} old note(s).");
        } else {
            mtrace('local_miplugin: no old notes to delete.');
        }
    }
}
