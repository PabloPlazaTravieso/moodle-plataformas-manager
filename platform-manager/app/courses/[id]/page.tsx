"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { AssignableRole, CourseNote, EnrolledUser, MoodleUser } from "@/lib/moodle";
import { useToast } from "../../components/toast";

function NoteItem({
  note,
  onSave,
  onDelete,
}: {
  note: CourseNote;
  onSave: (noteId: number, content: string) => Promise<string | null>;
  onDelete: (noteId: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const errorMessage = await onSave(note.id, content);

    setSaving(false);

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    setEditing(false);
  }

  if (editing) {
    return (
      <li className="rounded-lg border border-brand-blue-100 bg-white p-4 dark:border-brand-blue-800 dark:bg-brand-blue-975">
        <textarea
          className="w-full rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-brand-blue-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-blue-800 disabled:opacity-50 dark:bg-brand-cyan-600 dark:text-brand-blue-999 dark:hover:bg-brand-cyan-500"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-brand-blue-100 px-3 py-1.5 text-sm dark:border-brand-blue-700"
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-brand-blue-100 bg-white p-4 dark:border-brand-blue-800 dark:bg-brand-blue-975">
      <div>
        <p className="text-sm text-brand-blue-800 dark:text-brand-blue-200">{note.content}</p>
        <p className="mt-1 text-xs text-brand-blue-400 dark:text-brand-blue-400">
          {note.userfullname} · {new Date(note.timecreated * 1000).toLocaleString()}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button onClick={() => setEditing(true)} className="text-sm text-brand-blue-500 hover:text-brand-blue-900 dark:text-brand-blue-300 dark:hover:text-brand-cyan-400">
          Editar
        </button>
        <button onClick={() => onDelete(note.id)} className="text-sm text-red-600 hover:text-red-800">
          Borrar
        </button>
      </div>
    </li>
  );
}

export default function CourseDetailPage() {
  const { notify } = useToast();
  const params = useParams<{ id: string }>();
  const courseId = params.id;

  const [enrolled, setEnrolled] = useState<EnrolledUser[]>([]);
  const [allUsers, setAllUsers] = useState<MoodleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [roles, setRoles] = useState<AssignableRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [imageVersion, setImageVersion] = useState(0);
  const [hasImage, setHasImage] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    const [enrolledRes, usersRes, rolesRes, notesRes] = await Promise.all([
      fetch(`/api/courses/${courseId}/enrollments`),
      fetch("/api/users"),
      fetch("/api/roles"),
      fetch(`/api/courses/${courseId}/notes`),
    ]);
    const enrolledData = await enrolledRes.json();
    const usersData = await usersRes.json();
    const rolesData = await rolesRes.json();
    const notesData = await notesRes.json();

    if (notesRes.ok) {
      setNotes(notesData.notes);
    }

    if (!enrolledRes.ok) {
      setError(enrolledData.error ?? "Error al cargar los matriculados");
    } else {
      setEnrolled(enrolledData.users);
    }

    if (usersRes.ok) {
      setAllUsers(usersData.users);
      if (usersData.users.length > 0) {
        setSelectedUserId(String(usersData.users[0].id));
      }
    }

    if (rolesRes.ok) {
      setRoles(rolesData.roles);
      const studentRole = rolesData.roles.find((r: AssignableRole) => r.shortname === "student");
      setSelectedRoleId(String(studentRole?.id ?? rolesData.roles[0]?.id ?? ""));
    }

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function handleEnrol(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setEnrolling(true);

    const response = await fetch(`/api/courses/${courseId}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userid: effectiveSelectedUserId, roleid: selectedRoleId }),
    });
    const data = await response.json();

    setEnrolling(false);

    if (!response.ok) {
      setFormError(data.error ?? "Error al matricular al alumno");
      return;
    }

    notify(`Alumno matriculado correctamente`);
    setUserSearch("");
    await loadData();
  }

  async function handleUnenrol(userId: number, name: string) {
    if (!confirm(`¿Desmatricular a ${name} de este curso?`)) {
      return;
    }

    const response = await fetch(`/api/courses/${courseId}/enrollments?userid=${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      notify(data.error ?? "Error al desmatricular al alumno", "error");
      return;
    }

    notify(`${name} desmatriculado`);
    await loadData();
  }

  async function handleAddNote(event: React.FormEvent) {
    event.preventDefault();
    setNoteError(null);
    setAddingNote(true);

    const response = await fetch(`/api/courses/${courseId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote }),
    });
    const data = await response.json();

    setAddingNote(false);

    if (!response.ok) {
      setNoteError(data.error ?? "Error al añadir la nota");
      return;
    }

    setNewNote("");
    await loadData();
  }

  async function handleDeleteNote(noteId: number) {
    if (!confirm("¿Borrar esta nota?")) {
      return;
    }

    const response = await fetch(`/api/courses/${courseId}/notes/${noteId}`, { method: "DELETE" });

    if (!response.ok) {
      const data = await response.json();
      notify(data.error ?? "Error al borrar la nota", "error");
      return;
    }

    notify("Nota borrada");
    await loadData();
  }

  async function handleSaveNote(noteId: number, content: string): Promise<string | null> {
    const response = await fetch(`/api/courses/${courseId}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await response.json();

    if (!response.ok) {
      return data.error ?? "Error al actualizar la nota";
    }

    await loadData();
    return null;
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setUploadingImage(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/courses/${courseId}/image`, {
      method: "POST",
      body: formData,
    });

    setUploadingImage(false);
    event.target.value = "";

    if (!response.ok) {
      const data = await response.json();
      setImageError(data.error ?? "Error al subir la imagen");
      return;
    }

    setHasImage(true);
    setImageVersion((v) => v + 1);
  }

  const notEnrolledUsers = allUsers.filter((user) => !enrolled.some((e) => e.id === user.id));

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return notEnrolledUsers;
    return notEnrolledUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        `${user.firstname} ${user.lastname}`.toLowerCase().includes(term),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notEnrolledUsers is derived fresh each render
  }, [allUsers, enrolled, userSearch]);

  // Derived at render time (not via effect+setState) to avoid cascading renders:
  // falls back to the first filtered user whenever the current selection isn't
  // (or is no longer) part of the filtered list.
  const effectiveSelectedUserId = filteredUsers.some((u) => String(u.id) === selectedUserId)
    ? selectedUserId
    : String(filteredUsers[0]?.id ?? "");

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-brand-blue-975 dark:text-brand-blue-50">
        Curso #{courseId}
      </h1>

      <div className="mb-8 rounded-xl border border-brand-blue-100 bg-white p-6 shadow-sm dark:border-brand-blue-800 dark:bg-brand-blue-975">
        <h2 className="mb-4 text-sm font-medium text-brand-blue-975 dark:text-brand-blue-50">Imagen del curso</h2>
        <div className="flex items-center gap-6">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Moodle image proxied through our own API
            <img
              src={`/api/courses/${courseId}/image?v=${imageVersion}`}
              alt=""
              onError={() => setHasImage(false)}
              className="h-24 w-40 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-24 w-40 items-center justify-center rounded-md bg-brand-blue-50 text-xs text-brand-blue-400 dark:bg-brand-blue-900/40">
              Sin imagen
            </div>
          )}
          <div>
            <label className="inline-block cursor-pointer rounded-md border border-brand-blue-100 px-4 py-2 text-sm font-medium text-brand-blue-700 hover:bg-brand-blue-50 dark:border-brand-blue-700 dark:text-brand-blue-200 dark:hover:bg-brand-blue-900/40">
              {uploadingImage ? "Subiendo..." : "Subir imagen"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
            {imageError && <p className="mt-2 text-sm text-red-600">{imageError}</p>}
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-medium text-brand-blue-975 dark:text-brand-blue-50">Matriculados</h2>

      <form
        onSubmit={handleEnrol}
        className="mb-8 rounded-xl border border-brand-blue-100 bg-white p-6 shadow-sm dark:border-brand-blue-800 dark:bg-brand-blue-975"
      >
        <h2 className="mb-4 text-sm font-medium text-brand-blue-975 dark:text-brand-blue-50">Matricular alumno</h2>
        <input
          className="mb-3 w-full rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
          placeholder="Buscar usuario por nombre, usuario o email..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />
        <div className="flex gap-4">
          <select
            className="flex-1 rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
            value={effectiveSelectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            {filteredUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstname} {user.lastname} ({user.username})
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={enrolling || filteredUsers.length === 0}
            className="rounded-md bg-brand-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-800 disabled:opacity-50 dark:bg-brand-cyan-600 dark:text-brand-blue-999 dark:hover:bg-brand-cyan-500"
          >
            {enrolling ? "Matriculando..." : "Matricular"}
          </button>
        </div>
        {notEnrolledUsers.length === 0 && !loading && (
          <p className="mt-3 text-sm text-brand-blue-400">Todos los usuarios ya están matriculados en este curso.</p>
        )}
        {notEnrolledUsers.length > 0 && filteredUsers.length === 0 && (
          <p className="mt-3 text-sm text-brand-blue-400">Ningún usuario coincide con la búsqueda.</p>
        )}
        {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
      </form>

      {loading && <p className="text-sm text-brand-blue-400">Cargando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <table className="w-full overflow-hidden rounded-xl border border-brand-blue-100 text-left text-sm dark:border-brand-blue-800">
          <thead className="bg-brand-blue-50 dark:bg-brand-blue-900/40">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-blue-100 bg-white dark:divide-brand-blue-800 dark:bg-brand-blue-975">
            {enrolled.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-2">
                  {user.firstname} {user.lastname}
                </td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.roles.map((r) => r.shortname).join(", ")}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleUnenrol(user.id, `${user.firstname} ${user.lastname}`)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Desmatricular
                  </button>
                </td>
              </tr>
            ))}
            {enrolled.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-brand-blue-400">
                  Nadie matriculado todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <h2 className="mt-10 mb-4 text-lg font-medium text-brand-blue-975 dark:text-brand-blue-50">Notas del curso</h2>

      <form
        onSubmit={handleAddNote}
        className="mb-6 rounded-xl border border-brand-blue-100 bg-white p-6 shadow-sm dark:border-brand-blue-800 dark:bg-brand-blue-975"
      >
        <textarea
          className="w-full rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
          placeholder="Añadir una nota sobre este curso..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
          required
        />
        {noteError && <p className="mt-2 text-sm text-red-600">{noteError}</p>}
        <button
          type="submit"
          disabled={addingNote}
          className="mt-3 rounded-md bg-brand-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-800 disabled:opacity-50 dark:bg-brand-cyan-600 dark:text-brand-blue-999 dark:hover:bg-brand-cyan-500"
        >
          {addingNote ? "Guardando..." : "Añadir nota"}
        </button>
      </form>

      <ul className="space-y-2">
        {notes.map((note) => (
          <NoteItem key={note.id} note={note} onSave={handleSaveNote} onDelete={handleDeleteNote} />
        ))}
        {notes.length === 0 && <p className="text-sm text-brand-blue-400">No hay notas todavía.</p>}
      </ul>
    </div>
  );
}
