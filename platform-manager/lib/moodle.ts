const MOODLE_URL = process.env.MOODLE_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

export class MoodleError extends Error {
  constructor(
    message: string,
    public errorcode?: string,
  ) {
    super(message);
    this.name = "MoodleError";
  }
}

export type MoodleParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | MoodleParamValue[]
  | { [key: string]: MoodleParamValue };

export function appendParam(form: URLSearchParams, key: string, value: MoodleParamValue) {
  if (value === null || value === undefined) {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => appendParam(form, `${key}[${index}]`, item));
    return;
  }
  if (typeof value === "object") {
    Object.entries(value).forEach(([subKey, subValue]) => appendParam(form, `${key}[${subKey}]`, subValue));
    return;
  }
  // Moodle's external API validation for PARAM_BOOL only accepts 0/1, not the strings
  // "true"/"false" that String(value) would produce.
  if (typeof value === "boolean") {
    form.append(key, value ? "1" : "0");
    return;
  }
  form.append(key, String(value));
}

/**
 * Calls a Moodle web service function via the REST protocol.
 * Runs server-side only: MOODLE_TOKEN never reaches the browser.
 */
export async function callMoodle<T = unknown>(
  wsfunction: string,
  params: Record<string, MoodleParamValue> = {},
): Promise<T> {
  if (!MOODLE_URL || !MOODLE_TOKEN) {
    throw new MoodleError("MOODLE_URL or MOODLE_TOKEN is not configured");
  }

  const form = new URLSearchParams();
  form.append("wstoken", MOODLE_TOKEN);
  form.append("wsfunction", wsfunction);
  form.append("moodlewsrestformat", "json");
  Object.entries(params).forEach(([key, value]) => appendParam(form, key, value));

  const response = await fetch(`${MOODLE_URL}/webservice/rest/server.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new MoodleError(`Moodle REST request failed with HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data && typeof data === "object" && !Array.isArray(data) && "exception" in data) {
    throw new MoodleError(data.message ?? "Unknown Moodle error", data.errorcode);
  }

  return data as T;
}

export interface SiteInfo {
  fullname: string;
  shortname: string;
  release: string;
  version: string;
  usercount: number;
  coursecount: number;
}

export interface Course {
  id: number;
  shortname: string;
  fullname: string;
  summary: string;
  categoryid: number;
  visible: boolean;
  startdate: number;
  enddate: number;
  imageurl: string | null;
}

export interface MoodleUser {
  id: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  suspended: boolean;
  confirmed: boolean;
  lastaccess: number;
  roles: string[];
}

export interface LogEntry {
  action: string;
  details: string;
  timecreated: number;
}

export interface CourseCategory {
  id: number;
  name: string;
  parent: number;
}

export interface EnrolledUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  roles: { roleid: number; name: string; shortname: string }[];
}

export interface UserCourse {
  id: number;
  shortname: string;
  fullname: string;
  visible: boolean;
}

export function getUserCourses(userId: number) {
  return callMoodle<
    { id: number; shortname: string; fullname: string; visible: number }[]
  >("core_enrol_get_users_courses", { userid: userId }).then((courses) =>
    courses.map((c) => ({ id: c.id, shortname: c.shortname, fullname: c.fullname, visible: Boolean(c.visible) })),
  );
}

export function createCategory(category: { name: string; parent?: number }) {
  return callMoodle<{ id: number; name: string }[]>("core_course_create_categories", {
    categories: [{ name: category.name, parent: category.parent ?? 0 }],
  });
}

export function deleteCategory(categoryId: number, options: { newParentId?: number; recursive?: boolean } = {}) {
  return callMoodle<null>("core_course_delete_categories", {
    categories: [
      {
        id: categoryId,
        newparent: options.newParentId,
        recursive: options.recursive ?? false,
      },
    ],
  });
}

export function getSiteInfo() {
  return callMoodle<SiteInfo>("local_miplugin_get_site_info");
}

export function getCourses() {
  return callMoodle<{ courses: Course[] }>("local_miplugin_get_courses").then((r) => r.courses);
}

export function getUsers() {
  return callMoodle<{ users: MoodleUser[] }>("local_miplugin_get_users").then((r) => r.users);
}

export function getCategories() {
  return callMoodle<CourseCategory[]>("core_course_get_categories");
}

export function createCourse(course: {
  fullname: string;
  shortname: string;
  categoryid: number;
  summary?: string;
  startdate?: number;
  enddate?: number;
}) {
  return callMoodle<{ id: number; shortname: string }[]>("core_course_create_courses", {
    courses: [course],
  });
}

export function updateCourse(course: {
  id: number;
  fullname?: string;
  shortname?: string;
  categoryid?: number;
  summary?: string;
  visible?: boolean;
  startdate?: number;
  enddate?: number;
}) {
  return callMoodle<null>("core_course_update_courses", {
    courses: [course],
  });
}

export function deleteCourse(courseId: number) {
  return callMoodle<{ id: number; status: boolean }[]>("core_course_delete_courses", {
    courseids: [courseId],
  });
}

export function createUser(user: {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
}) {
  return callMoodle<{ id: number; username: string }[]>("core_user_create_users", {
    users: [user],
  });
}

export function updateUser(user: {
  id: number;
  username?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  suspended?: boolean;
}) {
  return callMoodle<null>("core_user_update_users", {
    users: [user],
  });
}

export function deleteUser(userId: number) {
  return callMoodle<null>("core_user_delete_users", {
    userids: [userId],
  });
}

export function getEnrolledUsers(courseId: number) {
  return callMoodle<EnrolledUser[]>("core_enrol_get_enrolled_users", { courseid: courseId });
}

export function enrolUser(courseId: number, userId: number, roleId?: number) {
  const resolvedRoleId = roleId ?? Number(process.env.MOODLE_STUDENT_ROLE_ID ?? 5);
  return callMoodle<null>("enrol_manual_enrol_users", {
    enrolments: [{ roleid: resolvedRoleId, userid: userId, courseid: courseId }],
  });
}

export interface AssignableRole {
  id: number;
  shortname: string;
  name: string;
}

export function getAssignableRoles() {
  return callMoodle<{ roles: AssignableRole[] }>("local_miplugin_get_assignable_roles").then((r) => r.roles);
}

export function unenrolUser(courseId: number, userId: number) {
  return callMoodle<null>("enrol_manual_unenrol_users", {
    enrolments: [{ userid: userId, courseid: courseId }],
  });
}

export function getActivityLog(limit = 500) {
  return callMoodle<{ entries: LogEntry[] }>("local_miplugin_get_activity_log", { limit }).then((r) => r.entries);
}

/**
 * Uploads a file to the user's Moodle draft area (webservice/upload.php) and
 * returns the draft item id, which can then be attached to a course via
 * setCourseImage(). This endpoint uses multipart/form-data, unlike the JSON REST API.
 */
async function uploadDraftFile(file: File): Promise<number> {
  if (!MOODLE_URL || !MOODLE_TOKEN) {
    throw new MoodleError("MOODLE_URL or MOODLE_TOKEN is not configured");
  }

  const form = new FormData();
  form.append("token", MOODLE_TOKEN);
  form.append("file_1", file, file.name);

  const response = await fetch(`${MOODLE_URL}/webservice/upload.php`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new MoodleError(`Moodle file upload failed with HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0 || data[0].error) {
    throw new MoodleError(data?.[0]?.error ?? "Error al subir el archivo a Moodle");
  }

  return data[0].itemid;
}

export function setCourseImage(courseId: number, draftItemId: number) {
  return callMoodle<{ success: boolean }>("local_miplugin_set_course_image", {
    courseid: courseId,
    draftitemid: draftItemId,
  });
}

export async function uploadCourseImage(courseId: number, file: File) {
  const draftItemId = await uploadDraftFile(file);
  return setCourseImage(courseId, draftItemId);
}

/**
 * Fetches a Moodle pluginfile image server-side (with the token) so it can be
 * streamed back to the browser without ever exposing MOODLE_TOKEN client-side.
 */
export async function fetchCourseImage(imageUrl: string) {
  if (!MOODLE_TOKEN) {
    throw new MoodleError("MOODLE_TOKEN is not configured");
  }

  const separator = imageUrl.includes("?") ? "&" : "?";
  const response = await fetch(`${imageUrl}${separator}token=${MOODLE_TOKEN}`, { cache: "no-store" });

  if (!response.ok) {
    throw new MoodleError(`Failed to fetch course image (HTTP ${response.status})`);
  }

  return response;
}

export interface CourseNote {
  id: number;
  content: string;
  userfullname: string;
  timecreated: number;
}

export function getCourseNotes(courseId: number) {
  return callMoodle<{ notes: CourseNote[] }>("local_miplugin_get_course_notes", {
    courseid: courseId,
  }).then((r) => r.notes);
}

export function addCourseNote(courseId: number, content: string) {
  return callMoodle<{ id: number }>("local_miplugin_add_course_note", {
    courseid: courseId,
    content,
  });
}

export function deleteCourseNote(noteId: number) {
  return callMoodle<{ success: boolean }>("local_miplugin_delete_course_note", {
    noteid: noteId,
  });
}
