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
 * Handles deleting a course note without a full page reload, using the
 * Fragment API to re-render the notes list server-side.
 *
 * @module     local_miplugin/notes
 * @copyright  2026 Pablo Plaza
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'core/str', 'core/notification', 'core/fragment', 'core/templates'],
function($, Str, Notification, Fragment, Templates) {

    const SELECTORS = {
        CONTAINER: '[data-region="miplugin-notes-list"]',
        DELETE_BUTTON: '[data-action="delete-note"]',
    };

    /**
     * Reloads the notes list fragment for a course, optionally deleting a note first.
     *
     * @param {jQuery} container
     * @param {Number} contextId
     * @param {Number} courseId
     * @param {Object} args extra fragment arguments (e.g. {action, noteid})
     */
    const reload = (container, contextId, courseId, args = {}) => {
        Fragment.loadFragment('local_miplugin', 'notes_list', contextId, Object.assign({courseid: courseId}, args))
            .then((html, js) => {
                Templates.replaceNodeContents(container, html, js);
                return null;
            })
            .catch(Notification.exception);
    };

    /**
     * Initialises the notes list: wires up delete buttons to confirm + delete + reload.
     *
     * @param {Number} contextId
     * @param {Number} courseId
     */
    const init = (contextId, courseId) => {
        const container = $(SELECTORS.CONTAINER);

        container.on('click', SELECTORS.DELETE_BUTTON, (e) => {
            const button = $(e.currentTarget);
            const noteId = button.attr('data-note-id');

            Notification.deleteCancelPromise(
                Str.get_string('deletenote', 'local_miplugin'),
                Str.get_string('confirmdeletenote', 'local_miplugin'),
                Str.get_string('delete', 'core')
            ).then(() => {
                reload(container, contextId, courseId, {action: 'delete', noteid: noteId});
                return null;
            }).catch(() => {
                // User cancelled, nothing to do.
            });
        });
    };

    return {init};
});
