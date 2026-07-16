"use client";

import { useEffect, useMemo, useState } from "react";
import type { MoodleUser } from "@/lib/moodle";
import { PasswordInput } from "../password-input";

const PAGE_SIZE = 8;

function UserRow({ user, onChanged }: { user: MoodleUser; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [firstname, setFirstname] = useState(user.firstname);
  const [lastname, setLastname] = useState(user.lastname);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstname, lastname, email }),
    });
    const data = await response.json();

    setSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Error al actualizar el usuario");
      return;
    }

    setEditing(false);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar el usuario "${user.username}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      alert(data.error ?? "Error al borrar el usuario");
      return;
    }

    onChanged();
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-3">
          <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              placeholder="Nombre"
              required
            />
            <input
              className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              placeholder="Apellidos"
              required
            />
            <input
              type="email"
              className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm dark:border-slate-700"
            >
              Cancelar
            </button>
            {error && <p className="w-full text-sm text-red-600">{error}</p>}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-4 py-2">{user.username}</td>
      <td className="px-4 py-2">
        {user.firstname} {user.lastname}
      </td>
      <td className="px-4 py-2">{user.email}</td>
      <td className="px-4 py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            user.confirmed
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          {user.confirmed ? "Sí" : "No"}
        </span>
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Editar
          </button>
          <button onClick={handleDelete} className="text-sm text-red-600 hover:text-red-800">
            Borrar
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<MoodleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/users");
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Error al cargar los usuarios");
    } else {
      setUsers(data.users);
    }

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        `${u.firstname} ${u.lastname}`.toLowerCase().includes(term),
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setCreating(true);

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, firstname, lastname, email }),
    });
    const data = await response.json();

    setCreating(false);

    if (!response.ok) {
      setFormError(data.error ?? "Error al crear el usuario");
      return;
    }

    setUsername("");
    setPassword("");
    setFirstname("");
    setLastname("");
    setEmail("");
    setShowForm(false);
    await loadUsers();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Usuarios</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
        >
          {showForm ? "Cancelar" : "+ Nuevo usuario"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="mb-4 text-sm font-medium text-slate-900 dark:text-slate-100">Crear usuario</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <PasswordInput value={password} onChange={setPassword} placeholder="Contraseña" required />
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              placeholder="Nombre"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              required
            />
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              placeholder="Apellidos"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              required
            />
            <input
              type="email"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 sm:col-span-2"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={creating}
            className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            {creating ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      )}

      <input
        className="mb-6 w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        placeholder="Buscar por nombre, usuario o email..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {loading && <p className="text-sm text-slate-500">Cargando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <table className="w-full overflow-hidden rounded-lg border border-slate-200 text-left text-sm dark:border-slate-800">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2">Usuario</th>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Confirmado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {pageUsers.map((user) => (
                <UserRow key={user.id} user={user} onChanged={loadUsers} />
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    {search ? "Ningún usuario coincide con la búsqueda." : "No hay usuarios todavía."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700"
              >
                Anterior
              </button>
              <span className="text-slate-500">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
