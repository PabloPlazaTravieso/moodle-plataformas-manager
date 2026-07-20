"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MoodleUser } from "@/lib/moodle";
import { PasswordInput } from "../password-input";
import { useToast } from "../components/toast";

const PAGE_SIZE = 8;

function UserRow({ user, onChanged }: { user: MoodleUser; onChanged: () => void }) {
  const { notify } = useToast();
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
    notify(`Usuario "${user.username}" actualizado`);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar el usuario "${user.username}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      notify(data.error ?? "Error al borrar el usuario", "error");
      return;
    }

    notify(`Usuario "${user.username}" borrado`);
    onChanged();
  }

  async function handleToggleSuspended() {
    const response = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: !user.suspended }),
    });
    const data = await response.json();

    if (!response.ok) {
      notify(data.error ?? "Error al cambiar el estado del usuario", "error");
      return;
    }

    onChanged();
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={7} className="px-4 py-3">
          <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-md border border-brand-blue-100 px-2 py-1 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              placeholder="Nombre"
              required
            />
            <input
              className="rounded-md border border-brand-blue-100 px-2 py-1 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              placeholder="Apellidos"
              required
            />
            <input
              type="email"
              className="rounded-md border border-brand-blue-100 px-2 py-1 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand-blue-900 px-3 py-1 text-sm font-medium text-white hover:bg-brand-blue-800 disabled:opacity-50 dark:bg-brand-cyan-600 dark:text-brand-blue-999 dark:hover:bg-brand-cyan-500"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md border border-brand-blue-100 px-3 py-1 text-sm dark:border-brand-blue-700"
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
      <td className="px-4 py-2">
        <Link href={`/users/${user.id}`} className="text-brand-blue-975 hover:underline dark:text-brand-blue-50">
          {user.username}
        </Link>
      </td>
      <td className="px-4 py-2">
        {user.firstname} {user.lastname}
      </td>
      <td className="px-4 py-2">{user.email}</td>
      <td className="px-4 py-2">
        {user.roles.length > 0 ? (
          <span className="rounded-full bg-brand-cyan-50 px-2 py-0.5 text-xs font-medium text-brand-blue-800 dark:bg-brand-blue-900/40 dark:text-brand-cyan-300">
            {user.roles.join(", ")}
          </span>
        ) : (
          <span className="text-xs text-brand-blue-400 dark:text-brand-blue-400">—</span>
        )}
      </td>
      <td className="px-4 py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            user.confirmed
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-brand-blue-100 text-brand-blue-600 dark:bg-brand-blue-800 dark:text-brand-blue-300"
          }`}
        >
          {user.confirmed ? "Sí" : "No"}
        </span>
      </td>
      <td className="px-4 py-2">
        <button
          onClick={handleToggleSuspended}
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            user.suspended
              ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
          }`}
        >
          {user.suspended ? "Suspendido" : "Activo"}
        </button>
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-brand-blue-500 hover:text-brand-blue-900 dark:text-brand-blue-300 dark:hover:text-brand-cyan-400"
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
  const { notify } = useToast();
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

    notify(`Usuario "${username}" creado`);
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
        <h1 className="text-2xl font-semibold text-brand-blue-975 dark:text-brand-blue-50">Usuarios</h1>
        <div className="flex gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not page navigation */}
          <a
            href="/api/users?export=csv"
            className="rounded-md border border-brand-blue-100 px-4 py-2 text-sm font-medium text-brand-blue-700 hover:bg-brand-blue-50 dark:border-brand-blue-700 dark:text-brand-blue-200 dark:hover:bg-brand-blue-900/40"
          >
            Exportar CSV
          </a>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-brand-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-800 dark:bg-brand-cyan-600 dark:text-brand-blue-999 dark:hover:bg-brand-cyan-500"
          >
            {showForm ? "Cancelar" : "+ Nuevo usuario"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-xl border border-brand-blue-100 bg-white p-6 shadow-sm dark:border-brand-blue-800 dark:bg-brand-blue-975"
        >
          <h2 className="mb-4 text-sm font-medium text-brand-blue-975 dark:text-brand-blue-50">Crear usuario</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <PasswordInput value={password} onChange={setPassword} placeholder="Contraseña" required />
            <input
              className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              placeholder="Nombre"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              required
            />
            <input
              className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              placeholder="Apellidos"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              required
            />
            <input
              type="email"
              className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950 sm:col-span-2"
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
            className="mt-4 rounded-md bg-brand-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-800 disabled:opacity-50 dark:bg-brand-cyan-600 dark:text-brand-blue-999 dark:hover:bg-brand-cyan-500"
          >
            {creating ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      )}

      <input
        className="mb-6 w-full max-w-sm rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
        placeholder="Buscar por nombre, usuario o email..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {loading && <p className="text-sm text-brand-blue-400">Cargando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <table className="w-full overflow-hidden rounded-xl border border-brand-blue-100 text-left text-sm dark:border-brand-blue-800">
            <thead className="bg-brand-blue-50 dark:bg-brand-blue-900/40">
              <tr>
                <th className="px-4 py-2">Usuario</th>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Rol</th>
                <th className="px-4 py-2">Confirmado</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-blue-100 bg-white dark:divide-brand-blue-800 dark:bg-brand-blue-975">
              {pageUsers.map((user) => (
                <UserRow key={user.id} user={user} onChanged={loadUsers} />
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-brand-blue-400">
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
                className="rounded-md border border-brand-blue-100 px-3 py-1.5 disabled:opacity-40 dark:border-brand-blue-700"
              >
                Anterior
              </button>
              <span className="text-brand-blue-400">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-brand-blue-100 px-3 py-1.5 disabled:opacity-40 dark:border-brand-blue-700"
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
